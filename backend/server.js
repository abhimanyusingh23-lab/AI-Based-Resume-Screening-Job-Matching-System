const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const { Pool } = require("pg");
const fs = require("fs/promises");
const path = require("path");
const natural = require("natural");

dotenv.config();

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

if (process.env.DB_SSL === "true") {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const app = express();

const PORT = process.env.PORT || 5000;
const uploadsDirectory = path.join(__dirname, "uploads");
const tokenizer = new natural.WordTokenizer();

function createNlpProfile(resumeText, jobDescription) {
  const toTerms = (text) => tokenizer
    .tokenize(text.toLowerCase())
    .filter((token) => token.length > 2 && !natural.stopwords.includes(token))
    .map((token) => ({ original: token, stem: natural.PorterStemmer.stem(token) }));

  const resumeTerms = toTerms(resumeText);
  const jobTerms = toTerms(jobDescription);
  const frequency = (terms) => terms.reduce((map, { stem }) => {
    map.set(stem, (map.get(stem) || 0) + 1);
    return map;
  }, new Map());
  const resumeFrequency = frequency(resumeTerms);
  const jobFrequency = frequency(jobTerms);
  const sharedStems = [...jobFrequency.keys()].filter((stem) => resumeFrequency.has(stem));
  const dotProduct = sharedStems.reduce((total, stem) => total + resumeFrequency.get(stem) * jobFrequency.get(stem), 0);
  const magnitude = (map) => Math.sqrt([...map.values()].reduce((total, value) => total + value ** 2, 0));
  const denominator = magnitude(resumeFrequency) * magnitude(jobFrequency);
  const cosineSimilarity = denominator ? dotProduct / denominator : 0;
  const overlappingTerms = [...new Set(jobTerms
    .filter(({ stem }) => sharedStems.includes(stem))
    .map(({ original }) => original))]
    .slice(0, 20);

  return {
    cosineSimilarity: Math.round(cosineSimilarity * 100),
    overlappingTerms,
    jobTermCount: jobFrequency.size,
  };
}

function stringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];
}

// -----------------------------
// Middleware
// -----------------------------

app.use(cors());

app.use(express.json());
app.use("/uploads", express.static(uploadsDirectory));

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

app.get("/api/analyses", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, file_name, resume_text, resume_file_url, match_score, created_at
      FROM analyses
      ORDER BY created_at DESC
      LIMIT 50;
    `);

    res.json({ success: true, analyses: rows });
  } catch (error) {
    console.error("Analysis history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load analysis history.",
    });
  }
});

app.delete("/api/analyses/:id", async (req, res) => {
  const analysisId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(analysisId) || analysisId < 1) {
    return res.status(400).json({ success: false, message: "Invalid analysis id." });
  }

  try {
    const { rows } = await pool.query(
      "DELETE FROM analyses WHERE id = $1 RETURNING resume_file_url",
      [analysisId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Analysis not found." });
    }

    const fileUrl = rows[0].resume_file_url;
    if (fileUrl?.startsWith("/uploads/")) {
      const storedFileName = path.basename(fileUrl);
      await fs.unlink(path.join(uploadsDirectory, storedFileName)).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }

    res.json({ success: true, message: "Analysis deleted." });
  } catch (error) {
    console.error("Delete analysis error:", error);
    res.status(500).json({ success: false, message: "Failed to delete analysis." });
  }
});

app.delete("/api/analyses", async (req, res) => {
  const ids = [...new Set(req.body?.ids)]
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (!ids.length) {
    return res.status(400).json({ success: false, message: "Select at least one analysis." });
  }

  try {
    const { rows } = await pool.query(
      "DELETE FROM analyses WHERE id = ANY($1::int[]) RETURNING resume_file_url",
      [ids]
    );

    await Promise.all(rows.map(async ({ resume_file_url: fileUrl }) => {
      if (!fileUrl?.startsWith("/uploads/")) return;
      await fs.unlink(path.join(uploadsDirectory, path.basename(fileUrl))).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }));

    res.json({ success: true, deletedCount: rows.length });
  } catch (error) {
    console.error("Bulk delete analyses error:", error);
    res.status(500).json({ success: false, message: "Failed to delete selected analyses." });
  }
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

    await fs.mkdir(uploadsDirectory, { recursive: true });
    const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedFileName = `${Date.now()}-${safeFileName}`;
    await fs.writeFile(path.join(uploadsDirectory, storedFileName), req.file.buffer);

    res.json({
      success: true,
      message: "Resume uploaded and text extracted successfully.",
      fileName: req.file.originalname,
      pages: result.total,
      textLength: resumeText.length,
      resumeText: resumeText,
      fileUrl: `/uploads/${storedFileName}`,
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

    const nlpProfile = createNlpProfile(resumeText, jobDescription);

    console.log("Sending resume to Gemini AI...");

    const prompt = `
You are an expert technical recruiter and resume analyst.

First determine whether the uploaded document is genuinely a candidate resume. Then assess its semantic fit for the target role.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

NLP RELEVANCE SIGNALS:
- Stemmed cosine similarity: ${nlpProfile.cosineSimilarity}%
- Normalized job terms also found in the resume: ${nlpProfile.overlappingTerms.join(", ") || "None"}
- Unique normalized job terms: ${nlpProfile.jobTermCount}

Use these signals as supporting evidence only. They are not the final score and do not replace contextual reasoning.

Return ONLY valid JSON in exactly this structure:

{
  "documentAssessment": {
    "type": "resume",
    "confidence": 0,
    "reason": ""
  },
  "matchScore": 0,
  "matchingSkills": [{ "skill": "", "evidence": "" }],
  "missingSkills": [{ "skill": "", "reason": "" }],
  "strengths": [],
  "suggestions": [],
  "recommendedRoles": []
}

Rules:

1. documentAssessment.type must be "resume" or "other". Default to "resume" when the document plausibly presents one candidate's profile. Student resumes with education, projects, skills, an about-me section, or no formal work history are still resumes.
2. Use "other" only when the document's primary purpose is unequivocally a report, essay, assignment, article, certificate, or standalone project document rather than a candidate profile.
3. If type is "other", set matchScore to 0 and explain why in documentAssessment.reason.
4. Evaluate fit semantically, not by crude keyword counting. A short job title such as "Engineer" is valid context: infer the broad profession from the resume, but do not assume a narrow specialization that was not stated.
5. Score rubric: 0 for a non-resume or no relevant evidence; 1-29 for very limited relevance; 30-59 for partial evidence; 60-79 for strong and supported relevance; 80-100 only for exceptional, directly demonstrated alignment.
6. Every matchingSkills item must include an exact, short quote from the resume in evidence. Do not use a skill as a match unless its evidence supports it.
7. missingSkills must be meaningful gaps for the target role, not generic buzzwords.
8. strengths must be directly relevant to the target role and supported by the resume. If there is no meaningful role-relevant evidence, return an empty strengths array; do not praise unrelated projects or coursework.
9. suggestions must address the role-specific gaps, not generic resume advice. recommendedRoles should contain 3 to 5 roles supported by the resume.
10. Never invent experience, education, certifications, or skills.
`;

    let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`Gemini attempt ${attempt}/3...`);

    response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      contents: prompt,
      config: { responseMimeType: "application/json" },
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
    const assessment = analysis.documentAssessment || {};
    const documentType = String(assessment.type || "resume").toLowerCase();
    const documentConfidence = Number.parseInt(assessment.confidence, 10) || 0;

    if (documentType === "other" && documentConfidence >= 85) {
      return res.status(422).json({
        success: false,
        message: assessment.reason || "This PDF does not appear to be a resume.",
      });
    }

    const resumeLower = resumeText.toLowerCase();
    const verifiedMatches = (analysis.matchingSkills || [])
      .filter((item) => item?.skill && item?.evidence && resumeLower.includes(item.evidence.toLowerCase()))
      .map((item) => item.skill);

    analysis.matchScore = Math.max(0, Math.min(100, Number(analysis.matchScore) || 0));
    if (!verifiedMatches.length) analysis.matchScore = Math.min(analysis.matchScore, 25);
    analysis.matchingSkills = verifiedMatches;
    analysis.missingSkills = (analysis.missingSkills || [])
      .map((item) => typeof item === "string" ? item : item?.skill)
      .filter(Boolean);
    analysis.strengths = stringArray(analysis.strengths);
    analysis.suggestions = stringArray(analysis.suggestions);
    analysis.recommendedRoles = stringArray(analysis.recommendedRoles);
    if (analysis.matchScore < 40) analysis.strengths = [];
    delete analysis.documentAssessment;

console.log("AI analysis completed.");



// -----------------------------
// Save analysis to PostgreSQL
// -----------------------------

const insertQuery = `
  INSERT INTO analyses (
    file_name,
    resume_text,
    resume_file_url,
    job_description,
    match_score,
    matching_skills,
    missing_skills,
    strengths,
    suggestions,
    recommended_roles
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING id, created_at;
`;

const values = [
  req.body.fileName || "resume.pdf",
  resumeText,
  req.body.resumeFileUrl || null,
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
