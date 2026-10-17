# AI-Based Resume Screening & Job Matching System

A local web application that compares a PDF resume with a job description. It combines NLP relevance signals with Gemini's contextual evaluation to produce role-specific strengths, gaps, suggestions, and a match score.

## What it does

- Uploads a PDF resume and extracts its text.
- Uses NLP tokenization, stemming, term overlap, and cosine similarity as relevance signals.
- Uses Gemini to evaluate the resume in the context of the supplied role.
- Rejects documents that are clearly not resumes instead of scoring arbitrary PDFs as candidates.
- Only shows strengths supported by evidence in the resume and relevant to the job description.
- Saves analyses to PostgreSQL and keeps the original uploaded PDF for new history entries.
- Lets you view, select, and delete saved history records.

The score is an assistive signal, not an automated hiring decision.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Resume parsing | pdf-parse |
| NLP signals | Natural |
| AI evaluation | Google Gemini API |

## Requirements

Install these before starting:

1. Node.js 20 or later
2. PostgreSQL 15 or later, running locally
3. A Gemini API key from Google AI Studio

## Quick start

### 1. Clone the repository

~~~
git clone https://github.com/abhimanyusingh23-lab/AI-Based-Resume-Screening-Job-Matching-System.git
cd AI-Based-Resume-Screening-Job-Matching-System
~~~

### 2. Install dependencies

From the project root, run:

~~~
npm install
npm run install:all
~~~

### 3. Create the PostgreSQL database

Open pgAdmin's Query Tool, or a PostgreSQL terminal, and run:

~~~
CREATE DATABASE resume_ai;
~~~

Connect to the new **resume_ai** database, then run:

~~~
CREATE TABLE analyses (
  id SERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  resume_file_url TEXT,
  job_description TEXT NOT NULL,
  match_score INTEGER,
  matching_skills JSONB NOT NULL DEFAULT '[]',
  missing_skills JSONB NOT NULL DEFAULT '[]',
  strengths JSONB NOT NULL DEFAULT '[]',
  suggestions JSONB NOT NULL DEFAULT '[]',
  recommended_roles JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
~~~

### 4. Add your environment settings

Copy **backend/.env.example** to a new file named **backend/.env**. Then replace the placeholder values:

~~~
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
DATABASE_URL=postgresql://postgres:your_postgres_password@127.0.0.1:5432/resume_ai
DB_SSL=false
PORT=5000
~~~

Notes:

- Use your own PostgreSQL username and password in **DATABASE_URL**.
- Keep **DB_SSL=false** for a normal local PostgreSQL installation.
- Do not commit **backend/.env**. It contains your API key and database password.

### 5. Start the application

Run this single command from the project root:

~~~
npm run dev
~~~

Then open **http://localhost:5173** in your browser.

The frontend runs on port 5173 and the backend runs on port 5000. Vite is configured to use port 5173 strictly, so it will report a port conflict instead of silently opening another frontend on port 5174.

Stop both services with Ctrl+C in the terminal that started them.

## How analysis works

1. The backend extracts text from the uploaded PDF.
2. It creates NLP relevance signals from both the resume and the job description.
3. Gemini determines whether the document is plausibly a resume and evaluates its semantic fit for the requested role.
4. The backend validates and normalizes the AI response. Matching claims must be backed by resume text, and low-fit results do not receive generic strengths.
5. The result and original PDF reference are saved to PostgreSQL.

## Using the app

1. Upload a candidate resume as a PDF.
2. Paste the job description or role requirements.
3. Select **Generate analysis**.
4. Review the score, role-relevant matches, gaps, strengths, and recommended next steps.
5. Open **History** to review the saved PDF and delete one or multiple records.

Older history records created before PDF storage was added may show extracted text only. New analyses store a viewable copy of the uploaded PDF locally.

## Project structure

~~~
AI-Resume-Analyzer/
├── backend/
│   ├── server.js
│   ├── .env.example
│   └── uploads/              # Created locally; ignored by Git
├── frontend/
│   └── src/
├── package.json
└── README.md
~~~

## Useful commands

| Command | Purpose |
| --- | --- |
| npm run dev | Start frontend and backend together |
| npm run install:all | Install frontend and backend dependencies |
| npm --prefix frontend run build | Create a production frontend build |
| npm --prefix frontend run lint | Run frontend lint checks |

## Before pushing to GitHub

Check the files that will be committed:

~~~
git status
~~~

Do not commit:

- **backend/.env** or any API keys/passwords
- **backend/uploads/** because it can contain private resumes
- **node_modules/**

These paths are already covered by the repository's **.gitignore**. Review **git status** before every push, especially after testing with real resumes.

## Privacy and deployment note

Resumes contain personal information. This project is intended for local development and demonstration. Before deploying it publicly, add authentication, access controls, secure file storage, HTTPS, retention/deletion policies, and an appropriate privacy notice.

## License

Add a license before publishing or reusing the project outside your personal work.
