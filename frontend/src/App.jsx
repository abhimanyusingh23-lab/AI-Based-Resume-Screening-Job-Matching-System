import { Component, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const Icon = ({ children, className = "" }) => <span className={`icon ${className}`} aria-hidden="true">{children}</span>;

function Card({ title, subtitle, icon, tone, full, children }) {
  return <article className={`insight-card ${full ? "full" : ""}`}>
    <div className="insight-heading"><Icon className={`tone-${tone}`}>{icon}</Icon><div><h3>{title}</h3><p>{subtitle}</p></div></div>
    {children}
  </article>;
}

function List({ items = [], numbered = false, emptyText = "Nothing to show here yet." }) {
  return <div className="item-list">{items.length ? items.map((item, index) => <div className="item" key={item}><span>{numbered ? String(index + 1).padStart(2, "0") : "✓"}</span><p>{item}</p></div>) : <p className="empty">{emptyText}</p>}</div>;
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <main className="app-fallback"><p className="eyebrow">SOMETHING WENT WRONG</p><h1>We couldn’t render this analysis.</h1><p>Try refreshing the page. Your saved history is not affected.</p><button className="primary-button" onClick={() => window.location.reload()}>Refresh page <span>↻</span></button></main>;
    }
    return this.props.children;
  }
}

function ResumeApp() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [pdfUrl, setPdfUrl] = useState("");
  const [viewer, setViewer] = useState(null);
  const words = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/analyses`);
      setHistory(Array.isArray(response.data.analyses) ? response.data.analyses : []);
      setSelectedHistoryIds([]);
      setHistoryError("");
    } catch {
      setHistoryError("History will appear after the backend is running.");
    }
  };

  useEffect(() => {
    const timerId = window.setTimeout(loadHistory, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  const deleteHistoryItem = async (item) => {
    const confirmed = window.confirm(`Delete the analysis for "${item.file_name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeleteError("");
      await axios.delete(`${API_BASE_URL}/api/analyses/${item.id}`);
      if (viewer?.title === item.file_name) setViewer(null);
      loadHistory();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete this analysis.");
    }
  };

  const deleteSelectedHistory = async () => {
    if (!selectedHistoryIds.length) return;
    const confirmed = window.confirm(`Delete ${selectedHistoryIds.length} selected analysis record(s)? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeleteError("");
      await axios.delete(`${API_BASE_URL}/api/analyses`, { data: { ids: selectedHistoryIds } });
      loadHistory();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete selected analyses.");
    }
  };

  const toggleHistoryItem = (id) => {
    setSelectedHistoryIds((ids) => ids.includes(id) ? ids.filter((itemId) => itemId !== id) : [...ids, id]);
  };

  const toggleAllHistory = () => {
    setSelectedHistoryIds(selectedHistoryIds.length === history.length ? [] : history.map((item) => item.id));
  };

  const selectResume = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") return setError("Please select a PDF resume.");
    if (file.size > 5 * 1024 * 1024) return setError("Your resume must be smaller than 5 MB.");
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(URL.createObjectURL(file));
    setResume(file); setAnalysis(null); setError("");
  };

  const analyze = async () => {
    setError(""); setAnalysis(null);
    if (!resume) return setError("Upload a resume to continue.");
    if (!jobDescription.trim()) return setError("Add the job description to continue.");
    try {
      setLoading(true);
      const formData = new FormData(); formData.append("resume", resume);
      const upload = await axios.post(`${API_BASE_URL}/api/resume/upload`, formData);
      const response = await axios.post(`${API_BASE_URL}/api/resume/analyze`, { resumeText: upload.data.resumeText, resumeFileUrl: upload.data.fileUrl, jobDescription, fileName: resume.name });
      setAnalysis(response.data.analysis);
      loadHistory();
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't complete the analysis. Please try again.");
    } finally { setLoading(false); }
  };

  const reset = () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); setPdfUrl(""); setResume(null); setJobDescription(""); setAnalysis(null); setError(""); document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" }); };

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#home"><span>R</span> ResumeAI</a>
      <nav><a href="#workspace">Analyze</a><a href="#history">History</a><a href="#how-it-works">How it works</a></nav>
      <button className="text-button" onClick={() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })}>Get started <span>→</span></button>
    </header>

    <main>
      <section className="hero" id="home">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> AI-powered resume intelligence</p>
          <h1>Make every application <em>count.</em></h1>
          <p className="hero-description">Get a clear, practical read on how your resume matches a role—before a recruiter does.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" })}>Analyze a resume <span>→</span></button><span className="privacy-note"><Icon>⌁</Icon> Private &amp; secure</span></div>
        </div>
        <div className="hero-card">
          <div className="preview-header"><span className="preview-logo">R</span><span>Candidate fit overview</span><span className="preview-more">•••</span></div>
          <div className="preview-score-row"><div className="mini-score"><strong>82</strong><small>Match score</small></div><div><p className="label">Strong alignment</p><strong className="preview-title">Product Designer</strong><p className="muted">Resume aligns with most core requirements.</p></div></div>
          <div className="preview-metrics"><div><span>Matched skills</span><strong>12</strong><i className="up">+4</i></div><div><span>Focus areas</span><strong>03</strong><i>View</i></div></div>
          <div className="preview-skills"><span>UX research</span><span>Figma</span><span>Prototyping</span></div>
        </div>
      </section>

      <section className="workspace" id="workspace">
        <div className="section-intro"><p className="eyebrow">YOUR WORKSPACE</p><h2>Run a focused resume review</h2><p>Upload a PDF and pair it with the job you’re targeting.</p></div>
        <div className="workspace-grid">
          <article className={`input-card ${resume ? "is-complete" : ""}`}><div className="card-heading"><span className="step-number">01</span><div><h3>Resume</h3><p>PDF, up to 5 MB</p></div>{resume && <span className="complete-badge">Ready</span>}</div><label className="dropzone"><input type="file" accept=".pdf,application/pdf" onChange={selectResume}/><Icon className="upload-icon">↑</Icon><strong>{resume ? resume.name : "Upload your resume"}</strong><span>{resume ? "PDF selected · click to replace" : "Drag and drop, or browse files"}</span></label>{resume && <button className="view-upload" onClick={() => setViewer({ type: "pdf", title: resume.name, content: pdfUrl })}>View uploaded resume <span>↗</span></button>}</article>
          <article className="input-card"><div className="card-heading"><span className="step-number">02</span><div><h3>Target role</h3><p>Paste the job description</p></div><span className="word-count">{words} words</span></div><textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the job description here. Include responsibilities, requirements, and preferred skills for the strongest review."/></article>
        </div>
        {error && <div className="alert"><Icon>!</Icon><span>{error}</span></div>}
        <div className="analyze-row"><button className="primary-button large" onClick={analyze} disabled={loading}>{loading ? <><span className="spinner"/> Reviewing your resume…</> : <>Generate analysis <span>→</span></>}</button><p>It takes about 20 seconds. Your file is not permanently stored.</p></div>
      </section>

      <section className="how-it-works" id="how-it-works"><p className="eyebrow">THE PROCESS</p><div className="process-grid"><div><span>01</span><h3>Upload</h3><p>We extract the relevant text from your PDF.</p></div><div><span>02</span><h3>Compare</h3><p>AI maps your experience to the role requirements.</p></div><div><span>03</span><h3>Improve</h3><p>Use a precise list of strengths and next steps.</p></div></div></section>

      <section className="history" id="history">
        <div className="history-heading"><div><p className="eyebrow">ANALYSIS HISTORY</p><h2>Previously analyzed resumes</h2><p>Recent resume analyses saved to your local workspace.</p></div><div className="history-toolbar"><button className="outline-button" onClick={loadHistory}>Refresh <span>↻</span></button>{selectedHistoryIds.length > 0 && <button className="bulk-delete" onClick={deleteSelectedHistory}>Delete selected ({selectedHistoryIds.length})</button>}</div></div>
        {deleteError && <div className="alert"><Icon>!</Icon><span>{deleteError}</span></div>}
        {historyError ? <p className="history-empty">{historyError}</p> : history.length ? <div className="history-table"><div className="history-table-head"><label className="select-all"><input type="checkbox" checked={selectedHistoryIds.length === history.length} onChange={toggleAllHistory} /> Select all</label><span>Resume file</span><span>Match score</span><span>Analyzed</span><span /></div>{history.map((item) => <div className="history-row" key={item.id}><input className="history-check" type="checkbox" checked={selectedHistoryIds.includes(item.id)} onChange={() => toggleHistoryItem(item.id)} aria-label={`Select ${item.file_name}`} /><div><span className="file-mark">PDF</span><strong>{item.file_name}</strong></div><span className="history-score">{item.match_score ?? "—"}%</span><time>{new Date(item.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</time><div className="history-actions"><button className="row-button" onClick={() => setViewer(item.resume_file_url ? { type: "pdf", title: item.file_name, content: `${API_BASE_URL}${item.resume_file_url}` } : { type: "text", title: `${item.file_name} — extracted text`, content: item.resume_text })}>{item.resume_file_url ? "View PDF" : "View text"}</button><button className="delete-button" onClick={() => deleteHistoryItem(item)} aria-label={`Delete ${item.file_name}`}>Delete</button></div></div>)}</div> : <p className="history-empty">No completed analyses yet. Your first completed report will appear here.</p>}
      </section>

      {analysis && <section className="results" id="results">
        <div className="results-heading"><div><p className="eyebrow"><span className="status-dot" /> ANALYSIS COMPLETE</p><h2>Your role-fit report</h2><p>A clear breakdown of where you stand and what to improve next.</p></div><button className="outline-button" onClick={reset}>Analyze another <span>↗</span></button></div>
        <article className="score-panel"><div className="score-ring" style={{ "--score": analysis.matchScore }}><div><strong>{analysis.matchScore}<small>%</small></strong><span>Match score</span></div></div><div className="score-copy"><p className="eyebrow">OVERALL ALIGNMENT</p><h3>{analysis.matchScore >= 75 ? "You’re a strong fit for this role." : analysis.matchScore >= 50 ? "You have a credible foundation for this role." : "There’s room to strengthen the match."}</h3><p>Your score reflects the overlap between the experience in your resume and this job description.</p></div><div className="score-side"><span>Best next move</span><strong>{analysis.missingSkills?.[0] || "Highlight measurable impact"}</strong></div></article>
        <div className="results-grid">
          <Card title="What already matches" subtitle="Skills evidenced in your resume" icon="✓" tone="green"><div className="tag-list">{analysis.matchingSkills?.length ? analysis.matchingSkills.map((skill) => <span className="tag tag-green" key={skill}>{skill}</span>) : <p className="empty">No matching skills were identified.</p>}</div></Card>
          <Card title="What to address" subtitle="Important gaps for this role" icon="+" tone="amber"><div className="tag-list">{analysis.missingSkills?.length ? analysis.missingSkills.map((skill) => <span className="tag tag-amber" key={skill}>{skill}</span>) : <p className="empty">No key gaps were identified.</p>}</div></Card>
          <Card title="Role-relevant strengths" subtitle="Evidence that supports this target role" icon="✦" tone="purple" full><List items={analysis.strengths} emptyText="No role-relevant strengths were identified for this target role."/></Card>
          <Card title="Recommended next steps" subtitle="Practical improvements before you apply" icon="→" tone="blue" full><List items={analysis.suggestions} numbered/></Card>
          <Card title="Roles to explore" subtitle="Opportunities that align with your profile" icon="⌁" tone="slate" full><div className="roles">{analysis.recommendedRoles?.map((role, index) => <div className="role" key={role}><span>{String(index + 1).padStart(2, "0")}</span><strong>{role}</strong><b>↗</b></div>)}</div></Card>
        </div>
      </section>}
    </main>
    <footer><a className="brand" href="#home"><span>R</span> ResumeAI</a><p>Resume intelligence for more intentional applications.</p><span>© 2026</span></footer>
    {viewer && <div className="viewer-backdrop" onClick={() => setViewer(null)}><section className="viewer" onClick={(event) => event.stopPropagation()}><header><div><p className="eyebrow">RESUME VIEWER</p><h2>{viewer.title}</h2></div><button aria-label="Close resume viewer" onClick={() => setViewer(null)}>×</button></header>{viewer.type === "pdf" ? <iframe title={viewer.title} src={viewer.content} /> : <pre>{viewer.content || "No resume text was saved for this analysis."}</pre>}</section></div>}
    </div>;
}

export default function App() {
  return <AppErrorBoundary><ResumeApp /></AppErrorBoundary>;
}
