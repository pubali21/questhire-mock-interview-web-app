"use client";
import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { IoMail } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { chatSession } from "../../../utils/GeminiAIModal";
import { db } from "../../../utils/db";
import { LoaderCircle } from "lucide-react";
import { MockInterview } from "../../../utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment/moment";
import { useRouter } from "next/navigation";

function AddNewInterview() {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [extractedResumeData, setExtractedResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [JsonResponse, setJsonResponse] = useState([]);
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [extractingResume, setExtractingResume] = useState(false);

  // const handleSubmit = async (e) => {
  //   try {
  //     const formData = {
  //       jobPosition: jobPosition,
  //       jobDesc: jobDesc,
  //       jobExperience: jobExperience,
  //     };
  //     console.log("Form Data", formData);
  //     // Send the form data to FastAPI
  //     const response = await fetch(
  //       "http://localhost:8000/questions/jobdescription",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: formData,
  //       }
  //     );

  //     const data = await response.json();
  //     console.log("Job description", data);
  //   } catch (error) {
  //     console.error("Error sending data to FastAPI:", error);
  //   }
  // };

  const handleFileUpload = async (event) => {
    setExtractingResume(true);
    setLoading(true);
    const file = event.target.files[0];

    if (file && file.type === "application/pdf") {
      setResumeFile(file);

      const formData = new FormData();
      formData.append("pdf_doc", file);

      try {
        const response = await fetch("http://127.0.0.1:8000/questions/resume", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          setExtractedResumeData(result);
          console.log("Extracted Resume Data:", result);
          setLoading(false);
          setExtractingResume(false);
        } else {
          console.error("Failed to extract resume details");
        }
      } catch (error) {
        console.error("Error uploading resume:", error);
      }
    } else {
      alert("Please upload a valid PDF resume.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    //await handleSubmit(e);

    // Log the extractedResumeData to check its structure
    // console.log("Extracted Resume Data:", extractedResumeData);

    const resumeDataText = extractedResumeData
      ? `Candidate Details:
      Name: ${extractedResumeData.full_name || "N/A"}
      Email: ${extractedResumeData.email_id || "N/A"}
      Education: ${JSON.stringify(extractedResumeData.education || "N/A")}
      Projects: ${JSON.stringify(extractedResumeData.projects || "N/A")}
      Skills: ${JSON.stringify(extractedResumeData.skills || "N/A")}
      Work: ${JSON.stringify(extractedResumeData.work_experience || "N/A")}`
      : "";
    console.log("Resume Data Text:", resumeDataText);
    const InputPrompt = `Job Position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience}. 
${resumeDataText}
Based on the given information, generate ${
      process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT
    } interview questions from applied Job Position: ${jobPosition} and Job Description: ${jobDesc}  with answers and 5 questions based on Resume details like candidate's skills: ${JSON.stringify(
      extractedResumeData?.skills
    )}, 
his degree: ${JSON.stringify(extractedResumeData?.education)}, 
Projects if any: ${JSON.stringify(extractedResumeData?.projects)}, 
and work experience if any: ${JSON.stringify(
      extractedResumeData?.work_experience
    )} 
with answers in a single array JSON format.`;

    try {
      const result = await chatSession.sendMessage(InputPrompt);
      const rawResponse = await result.response.text();
      console.log("Raw Response:", rawResponse);

      let jsonStart = rawResponse.indexOf("[");
      let jsonEnd = rawResponse.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        let cleanedResponse = rawResponse.substring(jsonStart, jsonEnd + 1);

        try {
          const MockJsonResp = JSON.parse(cleanedResponse);
          console.log("Parsed Response:", MockJsonResp);
          setJsonResponse(MockJsonResp);

          const resp = await db
            .insert(MockInterview)
            .values({
              mockId: uuidv4(),
              jsonMockResp: cleanedResponse,
              jobPosition,
              jobDesc,
              jobExperience,
              createdBy: user?.primaryEmailAddress?.emailAddress,
              createdAt: moment().format("DD-MM-yyyy"),
            })
            .returning({ mockId: MockInterview.mockId });

          console.log("Inserted ID: ", resp);

          if (resp) {
            setOpenDialog(false);
            router.push("/dashboard/interview/" + resp[0]?.mockId);
          }
        } catch (parseError) {
          console.error("JSON Parsing Error:", parseError, cleanedResponse);
        }
      } else {
        console.error("No valid JSON found in response");
      }
    } catch (error) {
      console.error("Error during AI session or DB insertion:", error);
    }

    setLoading(false);
  };

  return (
    <div>
      <div className="p-4 shadow-sm rounded-lg border-2 border-gray-200">
        {isSignedIn && (
          <div className="flex items-center space-x-4 my-5">
            <div>
              <h2 className="flex gap-1 text-slate-800 font-bold text-lg">
                <span className="p-1 rounded-sm">
                  <FaUser />
                </span>
                <span className="font-normal">{user?.fullName}</span>
              </h2>
              <p className="flex gap-1 text-slate-800 font-bold text-lg">
                <span className="p-1 rounded-sm">
                  <IoMail className="w-5 h-5" />
                </span>
                <span className="font-normal">
                  {user?.primaryEmailAddress?.emailAddress}
                </span>
              </p>
            </div>
          </div>
        )}
        <Button
          onClick={() => setOpenDialog(true)}
          className="w-full rounded-md bg-slate-600 hover:bg-slate-700"
        >
          Create New Interview +
        </Button>
      </div>

      <Dialog open={openDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-700 text-2xl">
              Tell us more about your job interview
            </DialogTitle>
            <DialogDescription>
              <form onSubmit={onSubmit}>
                <div>
                  <h2>
                    Add Details about your job position, description, and years
                    of experience
                  </h2>
                  <div className="mt-7 my-3">
                    <label className="text-gray-600 font-bold">
                      Job Role / Position
                    </label>
                    <Input
                      placeholder="Ex. Full Stack Developer"
                      required
                      onChange={(e) => setJobPosition(e.target.value)}
                      className="mt-2 bg-slate-100"
                    />
                  </div>
                  <div className="my-3">
                    <label className="text-gray-600 font-bold">
                      Job Description / Tech Stack
                    </label>
                    <Textarea
                      placeholder="Ex. ReactJS, NextJS, TypeScript, Java, Python etc."
                      required
                      onChange={(e) => setJobDesc(e.target.value)}
                      className="mt-2 bg-slate-100"
                    />
                  </div>
                  <div className="my-3">
                    <label className="text-gray-600 font-bold">
                      Years of Experience
                    </label>
                    <Input
                      type="number"
                      required
                      max="50"
                      onChange={(e) => setJobExperience(e.target.value)}
                      className="mt-2 bg-slate-100 mb-5"
                    />
                  </div>
                  <div className="my-3">
                    <label className="text-gray-600 font-bold">
                      Upload Resume (PDF only)
                    </label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      className="mt-2 bg-slate-100"
                    />
                  </div>
                </div>
                <div className="flex gap-5 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => setOpenDialog(false)}
                    type="button"
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="animate-spin" />
                        {extractingResume
                          ? "Extracting Resume Details"
                          : "Generating from AI"}
                      </>
                    ) : (
                      "Start Interview"
                    )}
                  </Button>
                </div>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;
