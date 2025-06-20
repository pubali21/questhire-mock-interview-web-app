# questhire-mock-interview-web-app
QuestHire is a full stack mock interview platform designed to simulate real-world interview environment for job seekers.
## 🚀 Features
- Built with modern full-stack capabilities of Next.js and React
- Role, tech-stack and resume-based personalized questions
- Secure user authentication with Clerk
- AI-powered question generation using Gemini API
- Video and audio based interview process 
- Data persistence using PostgreSQL and Drizzle ORM
## How question curation works:
User Upload / Input (Next.js Frontend)
-User submits their resume or fills in experience/skills.
API Integration (FastAPI Backend)
-The input is sent to a FastAPI backend for preprocessing and parsing.
AI-Driven Parsing & Understanding (Gemini API)
-Resume content is analyzed using Gemini’s generative capabilities to:
Extract skills, experience, and project highlights.

