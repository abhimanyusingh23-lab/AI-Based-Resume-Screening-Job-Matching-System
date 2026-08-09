🤖 **ResumeAI — AI Resume Analyzer**


ResumeAI is an AI-powered resume analysis web application that compares a candidate's resume with a target job description and provides personalized insights.

🌐 Live Demo
Try ResumeAI Live https://ai-resume-analyzer-inky-one.vercel.app/

📸 Screenshots


<img width="1422" height="910" alt="upload-screen" src="https://github.com/user-attachments/assets/c1cd5e07-6a1a-47c8-be63-66d0c2f8adf3" />

<img width="1448" height="900" alt="analysis-screen" src="https://github.com/user-attachments/assets/e5ca6dcc-f871-4fc7-8e37-a069e582221f" />

<img width="1451" height="909" alt="results-screen" src="https://github.com/user-attachments/assets/0d781024-f418-4757-b91a-776e7d666b74" />

<img width="1452" height="900" alt="results-screen1" src="https://github.com/user-attachments/assets/b3f60b57-0269-426f-adca-2420195c7d0d" />

<img width="1453" height="874" alt="results-screen2" src="https://github.com/user-attachments/assets/ce963096-0bd2-47c1-adce-5df3bda6f9db" />

<img width="1446" height="793" alt="dashboard-screen" src="https://github.com/user-attachments/assets/230b479d-7cd1-4666-8f5c-a427053b623f" />


The application extracts text from uploaded PDF resumes, analyzes the resume using Google Gemini AI, calculates a resume match score, identifies matching and missing skills, and saves analysis results in PostgreSQL.



✨ **Features**


&#x20;📄 Upload PDF resumes

&#x20;📝 Enter a target job description

&#x20;🤖 AI-powered resume analysis using Google Gemini

&#x20;🎯 Resume match score

&#x20;✅ Matching skills detection

&#x20;⚠️ Missing skills identification

&#x20;💪 Resume strengths analysis

&#x20;💡 Personalized resume improvement suggestions

&#x20;💼 Recommended job roles

&#x20;🗄️ PostgreSQL analysis history

&#x20;🔄 Analyze multiple resumes

&#x20;📱 Responsive UI for desktop and mobile

&#x20;🔒 Environment variables for API credentials



**Tech Stack**

**Frontend**

* React
* JavaScript
* CSS
* Axios
* Vite

**Backend**

* Node.js
* Express.js
* Multer
* pdf-parse


**AI**

* Google Gemini API
* Gemini 3.6 Flash

**Database**

* PostgreSQL
* Neon

**Deployment**

* Vercel — Frontend
* Render — Backend
* Neon — Database

**How It Works**

1. Upload your resume as a PDF.
2. The application extracts the resume text.
3. Enter the target job description.
4. Gemini AI analyzes the resume against the job requirements.
5. The application generates a resume match score.
6. Matching and missing skills are identified.
7. Resume strengths are analyzed.
8. Personalized suggestions and recommended roles are generated.
9. The analysis results are stored in PostgreSQL.


🖥️ **Application Flow**


&#x20;  Text

Resume PDF

&#x20;   ↓

React Frontend

&#x20;   ↓

Node.js + Express API

&#x20;   ↓

PDF Text Extraction

&#x20;   ↓

Google Gemini AI

&#x20;   ↓

Resume Analysis

&#x20;   ↓

PostgreSQL

&#x20;   ↓

Results Dashboard



**Analysis Results**

ResumeAI provides:


**Match Score**

Percentage showing how closely the resume aligns with the target job description.

**Matching Skills**

Skills found in both the resume and job requirements.

**Missing Skills**

Important job requirements missing or not clearly demonstrated in the resume.

**Strengths**

AI-generated insights based on the candidate's demonstrated skills and experience.

**AI Suggestions**

Personalized recommendations for improving the resume for the selected job.

**Recommended Roles**

Potential job roles based on the candidate's demonstrated skills and experience.


📁 **Project Structure**

**AI-Resume-Analyzer/**


├── backend/

│   ├── server.js

│   ├── package.json

│   └── .env.example

├── frontend/

│   ├── src/

│   ├── public/

│   ├── package.json

│   └── vite.config.js

├── screenshots/

│   ├── upload-screen.png

│   ├── analysis-screen.png

│   ├── results-screen.png

│   └── dashboard-screen.png

├── .gitignore

└── README.md


**⚙️ Installation**

**1. Clone the repository**

git clone https://github.com/priyaskale/AI-Resume-Analyzer.git

cd AI-Resume-Analyzer


**Backend Setup**

cd backend

npm install

**Create a `.env` file inside the `backend` folder:**

GEMINI_API_KEY=your_gemini_api_key

DATABASE_URL=your_postgresql_connection_string

PORT=5000


**Start the backend:**

node server.js


**Backend:**

http://localhost:5000

**Frontend Setup**

**Open another terminal:**

cd frontend

npm install

npm run dev

**Frontend:**

http://localhost:5173


**🔐 Environment Variables**

Sensitive credentials are stored using environment variables.

**Required backend variables:**

GEMINI_API_KEY=your_gemini_api_key

DATABASE_URL=your_postgresql_connection_string

PORT=5000

**A safe environment variable template is provided as:**

backend/.env.example


**🚀 Deployment**

  - **Frontend:** Vercel
    
  - **Backend:** Render
    
  - **Database:** Neon PostgreSQL

The production frontend communicates with the deployed backend through the Render API.


**🎯 Project Goal**

ResumeAI was built to demonstrate how AI, full-stack development, PDF processing, and database technologies can be combined to solve a practical career-related problem.



