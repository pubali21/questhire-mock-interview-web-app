"use client";

import React, { useEffect, useState } from "react";
import { MockInterview } from "../../../../../utils/schema";
import { db } from "../../../../../utils/db";
import { eq } from "drizzle-orm";
import QuestionSection from "./_components/QuestionSection";
import RecordQuestionSection from "./_components/RecordQuestionSection";
import { Button } from "../../../../../components/ui/button";
import { IoIosArrowBack } from "react-icons/io";
import { MdNavigateNext } from "react-icons/md";
import Link from "next/link";
import { toast } from "sonner"; // Import toast function

function StartInterview({ params }) {
  const [interviewData, setInterviewData] = useState(null);
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false); // Add isAnswered state

  useEffect(() => {
    GetInterviewDetails();
  }, [params.interviewId]);

  // Used to get interview details by MockID/Interview ID
  const GetInterviewDetails = async () => {
    try {
      const result = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.mockId, params.interviewId));

      if (result.length > 0) {
        const jsonMockResp = JSON.parse(result[0].jsonMockResp);
        setMockInterviewQuestion(jsonMockResp);
        setInterviewData(result[0]);
      }
    } catch (error) {
      console.error("Error fetching interview details:", error);
    }
  };

  const handlePreviousQuestionClick = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
      setIsAnswered(false); // Optionally reset isAnswered
    }
  };
  const handleNextQuestionClick = () => {
    //if (!isAnswered) {
    //  toast("Kindly Answer to go to the Next Question!");
    //} else {
    setActiveQuestionIndex(activeQuestionIndex + 1);
    setIsAnswered(false); // Reset isAnswered for the next question
    //}
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Questions */}
        {mockInterviewQuestion && (
          <QuestionSection
            mockInterviewQuestion={mockInterviewQuestion}
            activeQuestionIndex={activeQuestionIndex}
          />
        )}
        {/* Video / Audio Recording */}
        {mockInterviewQuestion && interviewData && (
          <RecordQuestionSection
            mockInterviewQuestion={mockInterviewQuestion}
            activeQuestionIndex={activeQuestionIndex}
            interviewData={interviewData}
            isAnswered={isAnswered} // Pass isAnswered as a prop
            setIsAnswered={setIsAnswered} // Pass setIsAnswered as a prop
          />
        )}
      </div>
      <div className="flex justify-end gap-6">
        {mockInterviewQuestion && activeQuestionIndex > 0 && (
          <Button
            className="gap-1 bg-gray-500 hover:bg-gray-600 text-white"
            onClick={handlePreviousQuestionClick}
          >
            <IoIosArrowBack className="w-5 h-5" />
            Previous Question
          </Button>
        )}
        {mockInterviewQuestion &&
          activeQuestionIndex < mockInterviewQuestion.length - 1 && (
            <Button
              className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleNextQuestionClick}
            >
              Next Question
              <MdNavigateNext className="w-5 h-5" />
            </Button>
          )}
        {mockInterviewQuestion &&
          activeQuestionIndex === mockInterviewQuestion.length - 1 &&
          interviewData && (
            <Link
              href={`/dashboard/interview/${interviewData.mockId}/feedback`}
            >
              <Button>End Interview</Button>
            </Link>
          )}
      </div>
    </div>
  );
}

export default StartInterview;
