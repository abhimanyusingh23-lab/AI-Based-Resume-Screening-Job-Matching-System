🤖 **ResumeAI — AI Resume Analyzer**



ResumeAI is an AI-powered resume analysis web application that compares a candidate's resume with a target job description and provides personalized insights.

🌐 Live Demo
Try ResumeAI Live https://ai-resume-analyzer-inky-one.vercel.app/

The application extracts text from uploaded PDF resumes, analyzes the resume using Google Gemini AI, calculates a resume match score, identifies matching and missing skills, and saves analysis results in PostgreSQL.





✨ **Features**



&#x20;📄 Upload PDF resumes

&#x20;📝 Enter a target job description

&#x20;🤖 AI-powered resume analysis using Google Gemini

&#x20;🎯 Resume-to-job match score

&#x20;✅ Matching skills detection

&#x20;⚠️ Missing skills identification

&#x20;💪 Resume strengths analysis

&#x20;💡 Personalized AI improvement suggestions

&#x20;💼 Recommended job roles

&#x20;🗄️ PostgreSQL analysis history

&#x20;🔄 Analyze multiple resumes

&#x20;📱 Responsive UI for desktop and mobile

&#x20;🔒 Environment variables for API credentials







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





**Analysis Results**



ResumeAI provides:



**Match Score**



A percentage showing how closely the resume aligns with the target job description.



**Matching Skills**



Skills that appear in both the resume and job requirements.



**Missing Skills**



Important job requirements that are missing or not clearly demonstrated in the resume.



**Strengths**



AI-generated insights based on the candidate's demonstrated experience and skills.



**AI Suggestions**



Personalized recommendations for improving the resume for the selected job.



**Recommended Roles**



Potential job roles based on the candidate's demonstrated skills and experience.





📁 **Project Structure**



**ai-resume-analyzer/**

│

├── **backend/**

│   ├── server.js

│   ├── package.json

│   ├── .env.example

│   └── ...

│

├── **frontend/**

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   └── ...

│   ├── package.json

│   └── ...

│

├── .gitignore

└── README.md







**⚙️ Installation**



**1. Clone the repository**



git clone YOUR\_GITHUB\_REPOSITORY\_URL

cd ai-resume-analyzer





**🔧 Backend Setup**



Open a terminal inside the backend folder:



cd backend



**Install dependencies:**



npm install



**Create a .env file:**



GEMINI\_API\_KEY=your\_gemini\_api\_key\_here



DB\_HOST=localhost

DB\_PORT=5432

DB\_NAME=resume\_ai

DB\_USER=postgres

DB\_PASSWORD=your\_postgresql\_password\_here



PORT=5000







**Start the backend:**



node server.js



**The backend should run at:**



http://localhost:5000







**🎨 Frontend Setup**



**Open another terminal:**



cd frontend



**Install dependencies:**



npm install



**Start the frontend:**



npm run dev



**Open:**



http://localhost:5173







**🗄️ PostgreSQL Setup**



**Create a PostgreSQL database named:**



resume\_ai



Make sure PostgreSQL is running before starting the backend.



The application stores completed resume analyses in PostgreSQL.



**Example analysis data:**



ID

File Name

Match Score

Created At



**🔐 Environment Variables**



Never upload your real .env file to GitHub.



**The project uses:**



.env



for private credentials.



**A safe template is provided as:**



.env.example





**🚀 Future Improvements**



Resume analysis history dashboard

User authentication

Resume improvement suggestions with rewritten sections

ATS score analysis

Keyword optimization

Resume PDF report generation

Job search integration

Multiple resume comparison

Cloud deployment

Analytics dashboard





**🎯 Project Goal**



ResumeAI was built to demonstrate how modern AI technologies can be combined with a full-stack web application to solve a practical career problem.



The project combines:



Frontend development

Backend API development

AI integration

PDF processing

Database management

Responsive UI design

