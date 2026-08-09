import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const handleResumeChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      setResume(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be smaller than 5MB.");
      setResume(null);
      return;
    }

    setResume(file);
    setError("");
    setResult(null);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    setError("");
    setResult(null);
    setAnalysis(null);

    if (!resume) {
      setError("Please upload your resume first.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    try {
      setLoading(true);

      // --------------------------------
      // STEP 1: Upload PDF
      // --------------------------------

      const formData = new FormData();

      formData.append("resume", resume);

      const uploadResponse = await axios.post(
        "http://localhost:5000/api/resume/upload",
        formData
      );

      const resumeData = uploadResponse.data;

      console.log("Resume extracted:", resumeData);

      setResult(resumeData);

      // --------------------------------
      // STEP 2: Analyze Resume
      // --------------------------------

      const analysisResponse = await axios.post(
        "http://localhost:5000/api/resume/analyze",
        {
          resumeText: resumeData.resumeText,
          jobDescription: jobDescription,
        }
      );

      console.log("Analysis result:", analysisResponse.data);

      setAnalysis(analysisResponse.data.analysis);

    } catch (err) {
      console.error("Analysis error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(
          "Unable to connect to the backend. Make sure the backend server is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* Navigation */}
      <nav className="navbar">

        <div className="logo">
          Resume<span>AI</span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </div>

        <button
          className="nav-button"
          onClick={() =>
            document
              .getElementById("analyzer")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Analyze Resume
        </button>

      </nav>


      {/* Hero */}
      <section className="hero" id="home">

        <div className="hero-content">

          <div className="badge">
            ✨ AI-Powered Career Assistant
          </div>

          <h1>
            Find out how well your
            <span> resume matches </span>
            your dream job.
          </h1>

          <p>
            Upload your resume, add a job description, and let AI
            analyze your skills, identify gaps, and help you improve
            your chances of getting hired.
          </p>

        </div>

      </section>


      {/* Analyzer */}
      <section className="analyzer" id="analyzer">

        {/* Resume Upload */}
        <div className="analyzer-card">

          <div className="card-header">

            <span className="step">
              STEP 01
            </span>

            <h2>
              Upload your resume
            </h2>

            <p>
              Upload your resume in PDF format.
            </p>

          </div>


          <label className="upload-box">

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeChange}
            />

            <div className="upload-icon">
              ↑
            </div>

            <h3>
              {resume
                ? resume.name
                : "Drop your resume here"}
            </h3>

            <p>
              {resume
                ? "Resume selected successfully"
                : "or click to browse your files"}
            </p>

            {!resume && (
              <span className="file-type">
                PDF only • Max 5MB
              </span>
            )}

          </label>

        </div>


        {/* Job Description */}
        <div className="analyzer-card">

          <div className="card-header">

            <span className="step">
              STEP 02
            </span>

            <h2>
              Paste the job description
            </h2>

            <p>
              Add the job description you're applying for.
            </p>

          </div>


          <textarea
            className="job-input"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(event) =>
              setJobDescription(event.target.value)
            }
          />


          <div className="character-count">
            {jobDescription.length} characters
          </div>

        </div>

      </section>


      {/* Error */}
      {error && (
        <div className="message error-message">
          ⚠️ {error}
        </div>
      )}


      {/* Analyze Button */}
      <section className="action-section">

        <button
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={loading}
        >

          {loading
            ? "Analyzing Resume..."
            : "Analyze My Resume"}

          {!loading && (
            <span>
              →
            </span>
          )}

        </button>

        <p>
          Your resume is processed securely.
        </p>

      </section>


      {/* AI Analysis Results */}
{result && result.analysis && (
  <section className="results-dashboard">

    <div className="results-header">
      <span>AI ANALYSIS COMPLETE</span>
      <h2>Your Resume Analysis</h2>
      <p>
        Here's how your resume compares with the job description.
      </p>
    </div>

    {/* Match Score */}
    <div className="score-card">

      <div
  className="score-circle"
  style={{
    "--score": result.analysis.matchScore,
  }}
>
        <div>
          <strong>{result.analysis.matchScore}%</strong>
          <span>Match</span>
        </div>
      </div>

      <div className="score-content">
        <span className="result-label">
          RESUME MATCH SCORE
        </span>

        <h3>
          Your resume matches approximately{" "}
          {result.analysis.matchScore}% of the job requirements.
        </h3>

        <p>
          Based on the skills and requirements identified
          from your resume and the provided job description.
        </p>
      </div>

    </div>

    {/* Skills */}
    <div className="analysis-grid">

      {/* Matching Skills */}
      <div className="analysis-card">

        <div className="analysis-card-header">
          <span className="analysis-icon success">✓</span>

          <div>
            <h3>Matching Skills</h3>
            <p>Skills found in your resume</p>
          </div>
        </div>

        <div className="skill-list">
          {result.analysis.matchingSkills?.length > 0 ? (
            result.analysis.matchingSkills.map((skill, index) => (
              <span className="skill-tag matched" key={index}>
                ✓ {skill}
              </span>
            ))
          ) : (
            <p>No matching skills found.</p>
          )}
        </div>

      </div>

      {/* Missing Skills */}
      <div className="analysis-card">

        <div className="analysis-card-header">
          <span className="analysis-icon warning">!</span>

          <div>
            <h3>Missing Skills</h3>
            <p>Skills you may need to develop</p>
          </div>
        </div>

        <div className="skill-list">
          {result.analysis.missingSkills?.length > 0 ? (
            result.analysis.missingSkills.map((skill, index) => (
              <span className="skill-tag missing" key={index}>
                + {skill}
              </span>
            ))
          ) : (
            <p>No major missing skills identified.</p>
          )}
        </div>

      </div>

    </div>

    {/* Strengths */}
    <div className="analysis-card full-width">

      <div className="analysis-card-header">
        <span className="analysis-icon purple">✦</span>

        <div>
          <h3>Your Strengths</h3>
          <p>What stands out in your resume</p>
        </div>
      </div>

      <div className="insight-list">
        {result.analysis.strengths?.map((strength, index) => (
          <div className="insight-item" key={index}>
            <span>✓</span>
            <p>{strength}</p>
          </div>
        ))}
      </div>

    </div>

    {/* Suggestions */}
    <div className="analysis-card full-width">

      <div className="analysis-card-header">
        <span className="analysis-icon blue">✦</span>

        <div>
          <h3>AI Improvement Suggestions</h3>
          <p>Personalized recommendations for your resume</p>
        </div>
      </div>

      <div className="insight-list">
        {result.analysis.suggestions?.map((suggestion, index) => (
          <div className="insight-item" key={index}>
            <span>{index + 1}</span>
            <p>{suggestion}</p>
          </div>
        ))}
      </div>

    </div>

    {/* Recommended Roles */}
    <div className="analysis-card full-width">

      <div className="analysis-card-header">
        <span className="analysis-icon green">→</span>

        <div>
          <h3>Recommended Job Roles</h3>
          <p>Roles that align with your current profile</p>
        </div>
      </div>

      <div className="role-list">
        {result.analysis.recommendedRoles?.map((role, index) => (
          <div className="role-card" key={index}>
            <span>{index + 1}</span>
            <strong>{role}</strong>
          </div>
        ))}
      </div>

    </div>

  </section>
)}

       {result && (
  <div className="analyze-again">
    <button
      onClick={() => {
        setResult(null);
        setResume(null);
        setJobDescription("");
        setError("");

        window.scrollTo({
          top: document.getElementById("analyzer")?.offsetTop || 0,
          behavior: "smooth",
        });
      }}
    >
      Analyze Another Resume
      <span>↗</span>
    </button>
  </div>
)}     
          

      {/* Analysis Results */}
      {analysis && (
        <section className="analysis-section">

          <div className="analysis-container">

            <div className="analysis-header">

              <span>
                RESUME ANALYSIS
              </span>

              <h2>
                Your Resume Match Results
              </h2>

              <p>
                We compared your resume against the job description.
              </p>

            </div>


            {/* Match Score */}
            <div className="score-card">

              <div className="score-circle">

                <strong>
                  {analysis.matchScore}%
                </strong>

                <span>
                  Match
                </span>

              </div>


              <div className="score-content">

                <h3>
                  Resume Match Score
                </h3>

                <p>
                  Your resume matches approximately{" "}
                  <strong>
                    {analysis.matchScore}%
                  </strong>{" "}
                  of the skills identified in this job description.
                </p>

              </div>

            </div>


            {/* Skills */}
            <div className="analysis-grid">

              {/* Matching Skills */}
              <div className="analysis-card">

                <div className="analysis-card-title">
                  <span className="success-icon">
                    ✓
                  </span>

                  <div>
                    <h3>
                      Matching Skills
                    </h3>

                    <p>
                      Skills found in your resume
                    </p>
                  </div>
                </div>


                <div className="skill-list">

                  {analysis.matchingSkills.length > 0 ? (

                    analysis.matchingSkills.map(
                      (skill, index) => (
                        <span
                          className="skill success-skill"
                          key={index}
                        >
                          ✓ {skill}
                        </span>
                      )
                    )

                  ) : (

                    <p className="empty-message">
                      No matching skills found.
                    </p>

                  )}

                </div>

              </div>


              {/* Missing Skills */}
              <div className="analysis-card">

                <div className="analysis-card-title">

                  <span className="warning-icon">
                    !
                  </span>

                  <div>
                    <h3>
                      Missing Skills
                    </h3>

                    <p>
                      Skills you may need to improve
                    </p>
                  </div>

                </div>


                <div className="skill-list">

                  {analysis.missingSkills.length > 0 ? (

                    analysis.missingSkills.map(
                      (skill, index) => (
                        <span
                          className="skill missing-skill"
                          key={index}
                        >
                          + {skill}
                        </span>
                      )
                    )

                  ) : (

                    <p className="empty-message">
                      No major missing skills detected.
                    </p>

                  )}

                </div>

              </div>

            </div>


            {/* Strengths */}
<div className="analysis-card strengths-card">

  <div className="analysis-card-title">

    <span className="strength-icon">
      💪
    </span>

    <div>
      <h3>
        Your Strengths
      </h3>

      <p>
        Strong points identified by AI
      </p>
    </div>

  </div>

  <div className="strength-list">

    {analysis.strengths?.map(
      (strength, index) => (

        <div
          className="strength-item"
          key={index}
        >

          <span>
            ✓
          </span>

          <p>
            {strength}
          </p>

        </div>

      )
    )}

  </div>

</div>

            {/* Suggestions */}
            <div className="suggestions-card">

              <div className="analysis-card-title">

                <span className="suggestion-icon">
                  ✦
                </span>

                <div>

                  <h3>
                    Resume Improvement Suggestions
                  </h3>

                  <p>
                    Ways to strengthen your application
                  </p>

                </div>

              </div>


              <div className="suggestion-list">

                {analysis.suggestions.map(
                  (suggestion, index) => (

                    <div
                      className="suggestion"
                      key={index}
                    >

                      <span>
                        {index + 1}
                      </span>

                      <p>
                        {suggestion}
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>
            
            {/* Recommended Roles */}
<div className="roles-card">

  <div className="analysis-card-title">

    <span className="role-icon">
      🎯
    </span>

    <div>
      <h3>
        Recommended Job Roles
      </h3>

      <p>
        Roles that match your current profile
      </p>
    </div>

  </div>

  <div className="role-list">

    {analysis.recommendedRoles?.map(
      (role, index) => (

        <div
          className="role-item"
          key={index}
        >

          <span>
            {index + 1}
          </span>

          <strong>
            {role}
          </strong>

        </div>

      )
    )}

  </div>

</div>

          </div>

        </section>
      )}


      {/* Features */}
      <section
        className="features"
        id="features"
      >

        <div className="section-heading">

          <span>
            WHAT YOU'LL GET
          </span>

          <h2>
            Turn your resume into a career advantage.
          </h2>

        </div>


        <div className="feature-grid">

          <div className="feature-card">

            <div className="feature-icon">
              %
            </div>

            <h3>
              Match Score
            </h3>

            <p>
              See how closely your resume matches the job
              requirements.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              ✓
            </div>

            <h3>
              Skill Analysis
            </h3>

            <p>
              Discover which skills match and which ones
              you're missing.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              ✦
            </div>

            <h3>
              AI Suggestions
            </h3>

            <p>
              Get personalized recommendations to improve
              your resume.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">
              ⌁
            </div>

            <h3>
              Job Recommendations
            </h3>

            <p>
              Discover roles that match your experience and
              skills.
            </p>

          </div>

        </div>

      </section>


      {/* Footer */}
      <footer>

        <div className="logo">
          Resume<span>AI</span>
        </div>

        <p>
          AI-powered resume analysis and job matching.
        </p>

      </footer>

    </div>
  );
}

export default App;