import os
import sys
from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import json
from resumeparser import ats_extractor

sys.path.insert(0, os.path.abspath(os.getcwd()))


UPLOAD_PATH = "__DATA__"
os.makedirs(UPLOAD_PATH, exist_ok=True)

app = FastAPI()

class User(BaseModel):
    user_name: dict

origins=["http://localhost:3000"] #cross origin resource sharing

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.get("/")
def index():
    return {"status": "OK"}

class JobDetails(BaseModel):
    jobPosition: str
    jobDesc: str
    jobExperience: str

@app.post("/questions/jobdescription")
async def get_job_details(details: JobDetails):
    print(details.jobPosition)
    print(details.jobDesc)
    print(details.jobExperience)

@app.post("/questions/resume")
async def ats(pdf_doc: UploadFile = File(...)):
    print("Starting the Resume Parsing")
    print(type(pdf_doc))
    # Validate PDF file type
    if not pdf_doc.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    print("Validation Complete")

    # Save uploaded file
    file_location = os.path.join(UPLOAD_PATH, "file.pdf")
    with open(file_location, "wb") as buffer:
        buffer.write(await pdf_doc.read())
        
    print("File uploaded")

    # Extract text from PDF
    data = _read_file_from_path(file_location)
    
    #print("Data extracted")

    # Validate extracted text
    if not data.strip():
        raise HTTPException(status_code=400, detail="Uploaded PDF contains no readable text.")

    print(f"Data received:{type(data)}")
    # Process with ATS Extractor
    extracted_data = await ats_extractor(data)

    # Print extracted data for debugging
    print(type(extracted_data))

    try:
        return json.loads(json.dumps(extracted_data))
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error processing resume data")

def _read_file_from_path(path: str) -> str:
    try:
        reader = PdfReader(path)
        data = "".join(page.extract_text() or "" for page in reader.pages)
        if not data.strip():
            raise ValueError("No text extracted from PDF.")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF Read Error: {str(e)}")
