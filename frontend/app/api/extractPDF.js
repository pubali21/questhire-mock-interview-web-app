import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false, // Disable built-in body parsing for file uploads
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const form = new formidable.IncomingForm();
    form.uploadDir = "./public/uploads"; // Save files temporarily
    form.keepExtensions = true; // Keep the file extension

    // Parse the uploaded file
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "Error parsing the file" });
      }

      try {
        const filePath = files.file.filepath;
        const fileBuffer = fs.readFileSync(filePath);

        // Extract text from PDF
        const pdfData = await pdfParse(fileBuffer);
        const extractedText = pdfData.text;

        // Process extracted text
        const extractedInfo = extractStructuredData(extractedText);

        res.status(200).json({
          file_name: files.file.originalFilename,
          extracted_text: extractedText,
          ...extractedInfo, // Structured extracted data
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to process the file" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

// 🏆 Function to Extract Structured Data Using Regex
function extractStructuredData(text) {
  return {
    name: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    education: extractEducation(text),
    projects: extractProjects(text),
    skills: extractSkills(text),
  };
}

// 🆔 Extract Name (Assuming "Name: John Doe" format)
function extractName(text) {
  const nameRegex = /(?:Name[:\s]+)([A-Z][a-z]+\s[A-Z][a-z]+)/;
  const match = text.match(nameRegex);
  return match ? match[1] : "Not Found";
}

// 📧 Extract Email
function extractEmail(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : "Not Found";
}

// 📞 Extract Phone Number (Assuming standard formats like "+91 9876543210" or "9876543210")
function extractPhone(text) {
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\d{10}/;
  const match = text.match(phoneRegex);
  return match ? match[0] : "Not Found";
}

// 🎓 Extract Education (Looks for words like "Bachelor", "Master", "B.Tech", "B.Sc", etc.)
function extractEducation(text) {
  const educationRegex = /(Bachelor|Master|B\.?Tech|B\.?Sc|M\.?Sc|M\.?Tech|PhD|Diploma)[^,;\n]*/gi;
  const matches = text.match(educationRegex);
  return matches ? matches.join(", ") : "Not Found";
}

// 💼 Extract Projects (Assuming "Projects: Project A, Project B")
function extractProjects(text) {
  const projectsRegex = /(?:Projects?[:\s]+)(.*?)(?:\n|$)/i;
  const match = text.match(projectsRegex);
  return match ? match[1].split(",").map(p => p.trim()) : ["Not Found"];
}

// 🔥 Extract Skills (Assuming a section like "Skills: Java, React, SQL")
function extractSkills(text) {
  const skillsRegex = /(?:Skills?[:\s]+)(.*?)(?:\n|$)/i;
  const match = text.match(skillsRegex);
  return match ? match[1].split(",").map(skill => skill.trim()) : ["Not Found"];
}
