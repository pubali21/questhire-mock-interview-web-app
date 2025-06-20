from fastapi import FastAPI
import google.generativeai as genai
import os
import json

app = FastAPI()

genai.configure(api_key="AIzaSyCeRAsl9xvPA5dN3-9V-kroneN2CnF52Ak") #api key not to be committed

# Create the model
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
  model_name="gemini-1.5-flash",
  generation_config=generation_config,
)

chat_session = model.start_chat(
  history=[]
)

@app.post("/extract")
async def ats_extractor(resume_data: dict):
    """
    Extract structured information from a resume using Gemini AI.
    """
    prompt = """
    You are an AI bot designed to parse resumes. Extract the following details:
    1. full_name
    2. email_id
    3. education
    4. projects
    5. work_experience
    6. skills

    Return the extracted information strictly in JSON format without additional text.
    """

    # model = genai.GenerativeModel("gemini-1.5-flash")

    response = await model.generate_content_async(f"{prompt}\n\n{resume_data}")
    # print(f"Response is: {response.text}")
    resume_response = response.text.replace('```json', '').replace('```', '').strip()

    try:
        extracted_data = json.loads(resume_response)  # Parse JSON response
        return extracted_data
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON response"}
