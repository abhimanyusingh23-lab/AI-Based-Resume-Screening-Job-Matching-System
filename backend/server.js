const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const { Pool } = require("pg");

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const app = express();

const PORT = process.env.PORT || 5000;

// -----------------------------
// Middleware
// -----------------------------

app.use(cors());

app.use(express.json());

// -----------------------------
// File Upload Configuration
// -----------------------------

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed."));
    }
  },
});

// -----------------------------
// Basic Routes
// -----------------------------

app.get("/", (req, res) => {
  res.json({
    message: "AI Resume Analyzer API is running",
    status: "success",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "Backend server is working correctly",
  });
});

// -----------------------------
// Resume Upload & PDF Extraction
// -----------------------------

app.post("/api/resume/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF resume.",
      });
    }

    console.log("Resume received:", req.file.originalname);

    const parser = new PDFParse({
      data: req.file.buffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    const resumeText = result.text.trim();

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message:
          "Could not extract text from this PDF. Please upload a text-based PDF.",
      });
    }

    console.log("Resume text extracted successfully.");

    res.json({
      success: true,
      message: "Resume uploaded and text extracted successfully.",
      fileName: req.file.originalname,
      pages: result.total,
      textLength: resumeText.length,
      resumeText: resumeText,
    });
  } catch (error) {
    console.error("Resume processing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process the resume.",
      error: error.message,
    });
  }
});

// -----------------------------
// Resume & Job Description Analysis
// -----------------------------

// -----------------------------
// AI Resume & Job Description Analysis
// -----------------------------

app.post("/api/resume/analyze", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "Resume text is required.",
      });
    }

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: "Job description is required.",
      });
    }

    console.log("Sending resume to Gemini AI...");

    const prompt = `
You are an expert technical recruiter and resume analyst.

Analyze the following resume against the provided job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return ONLY valid JSON in exactly this structure:

{
  "matchScore": 0,
  "matchingSkills": [],
  "missingSkills": [],
  "strengths": [],
  "suggestions": [],
  "recommendedRoles": []
}

Rules:

1. matchScore must be a realistic number from 0 to 100.
2. matchingSkills should contain skills that are relevant to the job and supported by the resume.
3. missingSkills should contain important job requirements that are missing or not clearly demonstrated in the resume.
4. strengths should contain 3 to 5 specific strengths from the resume.
5. suggestions should contain 3 to 5 practical recommendations for improving the resume for this specific job.
6. recommendedRoles should contain 3 to 5 suitable job roles based on the candidate's demonstrated skills and experience.
7. Do not invent experience, education, certifications, or skills that are not supported by the resume.
8. Focus on the actual requirements of the job description.
`;

    let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`Gemini attempt ${attempt}/3...`);

    response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    break;
  } catch (error) {
    console.log(`Gemini attempt ${attempt} failed.`);

    if (attempt === 3) {
      throw error;
    }

    const waitTime = attempt * 3000;

    console.log(`Retrying in ${waitTime / 1000} seconds...`);

    await new Promise((resolve) =>
      setTimeout(resolve, waitTime)
    );
  }
}
  

    const aiText = response.text;

    console.log("Gemini response received.");

    const cleanedText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const analysis = JSON.parse(cleanedText);

console.log("AI analysis completed.");



// -----------------------------
// Save analysis to PostgreSQL
// -----------------------------

const insertQuery = `
  INSERT INTO analyses (
    file_name,
    resume_text,
    job_description,
    match_score,
    matching_skills,
    missing_skills,
    strengths,
    suggestions,
    recommended_roles
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  RETURNING id, created_at;
`;

const values = [
  req.body.fileName || "resume.pdf",
  resumeText,
  jobDescription,
  analysis.matchScore,
  JSON.stringify(analysis.matchingSkills || []),
  JSON.stringify(analysis.missingSkills || []),
  JSON.stringify(analysis.strengths || []),
  JSON.stringify(analysis.suggestions || []),
  JSON.stringify(analysis.recommendedRoles || []),
];

const dbResult = await pool.query(insertQuery, values);

console.log("Analysis saved to PostgreSQL.");

res.json({
  success: true,
  message: "AI resume analysis completed successfully.",
  analysis,
  analysisId: dbResult.rows[0].id,
  createdAt: dbResult.rows[0].created_at,
});

  } catch (error) {
    console.error("AI analysis error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to analyze resume using AI.",
      error: error.message,
    });
  }
});


// -----------------------------
// Error Handler
// -----------------------------

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large. Maximum size is 5MB.",
      });
    }
  }

  res.status(400).json({
    success: false,
    message: error.message || "Something went wrong.",
  });
});

// -----------------------------
// PostgreSQL Connection Test
// -----------------------------

pool.query("SELECT NOW()", (error, result) => {
  if (error) {
    console.error("PostgreSQL connection failed:", error.message);
  } else {
    console.log(
      "PostgreSQL connected successfully:",
      result.rows[0]
    );
  }
});

// -----------------------------
// Start Server
// -----------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});