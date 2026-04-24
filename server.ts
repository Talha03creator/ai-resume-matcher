import "dotenv/config";
import express from "express";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import { createRequire } from "module";

import { GoogleGenAI } from "@google/genai";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Increase limit to 10MB (many resumes are large)
});

// --- AI Service Setup ---
// Updated 2026-04-23: Migrated to Gemini 2.5 Flash series (2.0 series approaching deprecation June 2026).
// Using 2.5-flash-lite (lightest quota) with 2.5-flash as fallback.
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",  // Primary: lowest quota usage on free tier
  "gemini-2.5-flash",       // Fallback: stable free model
  "gemini-2.0-flash-lite",  // Legacy fallback (deprecated June 2026)
];

// Helper: sleep for ms
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGemini(
  apiKey: string,
  prompt: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Please ensure it is set in your .env file.");
  }

  const genAI = new GoogleGenAI({ apiKey });
  let lastError: Error | null = null;
  const MAX_RETRIES = 2; // retry up to 2 times per model on transient 429s

  for (const modelId of GEMINI_MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = 1000 * Math.pow(2, attempt); // 2s, 4s
        console.log(`[AI Retry] Waiting ${delayMs}ms before retry #${attempt} with ${modelId}...`);
        await sleep(delayMs);
      }

      console.log(`[AI Debug] Attempting analysis with ${modelId} (attempt ${attempt + 1}/${MAX_RETRIES + 1})...`);

      try {
        const response = await genAI.models.generateContent({
          model: modelId,
          contents: prompt,
        });

        if (!response || !response.text) {
          console.error(`[AI Error] Empty response from ${modelId}`);
          lastError = new Error("No response text from AI model");
          break; // Try next model
        }

        console.log(`[AI Success] Response received from ${modelId}`);
        return response.text;
      } catch (err: any) {
        console.error(`[Gemini Error] Model ${modelId} attempt ${attempt + 1} failed:`, err?.message || err);
        lastError = err;
        const errMsg = err.message || JSON.stringify(err);

        // API key errors affect all models — stop immediately
        if (errMsg.includes("API key") || err.status === 401 || err.status === 403) {
          throw new Error("Invalid API key. Please check your GEMINI_API_KEY.");
        }

        // Rate limit (429) — retry with backoff if attempts remain
        if (err.status === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          if (attempt < MAX_RETRIES) {
            continue; // retry same model after delay
          }
          // Exhausted retries for this model, try next model
          console.log(`[AI Info] Exhausted retries for ${modelId}, trying next model...`);
          break;
        }

        // Model not found (404) — skip to next model immediately
        if (err.status === 404 || errMsg.includes("not found")) {
          console.log(`[AI Info] Model ${modelId} not found, skipping...`);
          break;
        }

        // Other transient errors — retry
        if (attempt < MAX_RETRIES) {
          continue;
        }
        break; // move to next model
      }
    }
  }

  // All models exhausted
  const finalMsg = lastError?.message || "";
  if (finalMsg.includes("429") || finalMsg.includes("RESOURCE_EXHAUSTED")) {
    const quotaError: any = new Error(
      "AI usage limit reached. The free tier allows ~15 requests/minute. Please wait 1-2 minutes and try again."
    );
    quotaError.status = 429;
    throw quotaError;
  }

  throw lastError || new Error("All AI models failed. Please try again later.");
}

async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === "application/pdf") {
    try {
      const data = await pdf(file.buffer);
      return data.text;
    } catch (err: any) {
      console.error("PDF parsing error:", err);
      throw new Error("Unable to parse PDF: " + err.message);
    }
  } else if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.mimetype === "application/msword"
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  } else if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf-8");
  }
  throw new Error("Unsupported file type: " + file.mimetype);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => res.json({ status: "alive" }));

  // --- API: Analyze Resume ---
  app.post("/api/analyze", upload.fields([{ name: "resumeFile", maxCount: 1 }, { name: "jobFile", maxCount: 1 }]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let resumeText = req.body.resumeText || "";
      let jobText = req.body.jobText || "";

      if (files?.resumeFile?.[0]) resumeText = await extractText(files.resumeFile[0]);
      if (files?.jobFile?.[0]) jobText = await extractText(files.jobFile[0]);

      if (!resumeText || !jobText) {
        return res.status(400).json({ error: "Both resume and job description are required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      const prompt = `Analyze the following job description and resume.
Understand context and synonyms, not just exact keywords.

Give output in this EXACT JSON format with no extra text:
{
  "overallScore": number (0-100),
  "sectionScores": {
    "skills": number (0-100),
    "experience": number (0-100),
    "education": number (0-100),
    "impact": number (0-100)
  },
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"],
  "improvementTips": ["tip1", "tip2"],
  "resumeSuggestions": ["suggestion1", "suggestion2"],
  "templateRecommendations": [{"name": "template1", "reason": "reason1"}],
  "checklist": ["item1", "item2"],
  "summary": "short summary of the match"
}

Job Description:
${jobText}

Resume:
${resumeText}`;

      const aiText = await callGemini(apiKey, prompt);

      // Robust JSON Extraction: 
      // Extracts JSON even if the AI included conversational text around it.
      let cleaned = aiText.trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      
      try {
        res.json(JSON.parse(cleaned));
      } catch (parseError) {
        console.error("JSON Parse Error. Raw AI Text:", aiText);
        throw new Error("AI returned invalid data format. Please try again.");
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      const status = error.status || 500;
      res.status(status).json({
        error: error.message || "Failed to analyze resume.",
        details: error.stack
      });
    }
  });

  // --- API: Rewrite Resume (KILLER FEATURE) ---
  app.post("/api/rewrite", async (req, res) => {
    try {
      const { resumeText, jobText } = req.body;
      if (!resumeText || !jobText) {
        return res.status(400).json({ error: "Resume and Job Description required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      const prompt = `You are a world-class career coach and ATS (Applicant Tracking System) expert.

Rewrite and optimize the following resume based on the given job description.
Your goal: make the resume HIGHLY OPTIMIZED, ATS-friendly, and perfectly aligned with the job requirements.

STRICT INSTRUCTIONS:
1. Rewrite the Professional Summary — make it strong, modern, tailored to the role. Include relevant keywords naturally.
2. Improve Skills Section — add missing but relevant skills from the job description. Keep only realistic and matching ones.
3. Enhance Experience Section — rewrite bullet points using strong action verbs. Add measurable achievements (e.g., "improved performance by 35%"). Align tightly with job requirements.
4. Add a Projects section if the role benefits from it (especially for tech/AI/cloud roles). Make it relevant.
5. Optimize for ATS — use clean formatting, include keywords naturally, avoid unnecessary complexity.
6. DO NOT invent fake experience. Only enhance and realistically optimize the existing profile.

Job Description:
${jobText}

Resume:
${resumeText}

Return ONLY valid JSON in this EXACT structure (no markdown, no extra text):
{
  "professionalSummary": "The rewritten 2-3 sentence professional summary",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "bullets": ["Achievement bullet 1", "Achievement bullet 2", "Achievement bullet 3"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief impactful description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "education": ["Degree - University - Year"],
  "atsKeywords": ["keyword1", "keyword2"],
  "fullResumeText": "The complete, formatted resume as a single readable string with all sections"
}`;

      const aiText = await callGemini(apiKey, prompt);
      // Robust JSON Extraction
      let cleaned = aiText.trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      
      try {
        res.json(JSON.parse(cleaned));
      } catch (parseError) {
        console.error("JSON Parse Error. Raw AI Text:", aiText);
        throw new Error("AI returned invalid data format for rewrite. Please try again.");
      }
    } catch (error: any) {
      console.error("Rewrite error:", error);
      res.status(error.status || 500).json({ error: error.message || "Failed to rewrite resume." });
    }
  });

  // --- API: Rewrite Resume Pro (UPGRADED - Isolated Feature) ---
  app.post("/api/rewrite-resume", upload.fields([{ name: "resumeFile", maxCount: 1 }, { name: "jobFile", maxCount: 1 }]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let resumeText = req.body.resumeText || "";
      let jobText = req.body.jobText || "";

      // Support file uploads — extract text from uploaded PDFs/DOCX/TXT
      if (files?.resumeFile?.[0]) resumeText = await extractText(files.resumeFile[0]);
      if (files?.jobFile?.[0]) jobText = await extractText(files.jobFile[0]);

      if (!resumeText || !jobText) {
        return res.status(400).json({ error: "Both resume content and job description are required." });
      }

      if (resumeText.trim().length < 50) {
        return res.status(400).json({ error: "Resume content is too short. Please provide a complete resume." });
      }

      if (jobText.trim().length < 30) {
        return res.status(400).json({ error: "Job description is too short. Please provide a detailed job description." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      const prompt = `You are an elite career strategist, certified professional resume writer (CPRW), and ATS optimization expert with 15+ years of experience placing candidates at Fortune 500 companies.

Your task: Completely rewrite and optimize the candidate's resume for the target job description. The result must be a polished, interview-winning, ATS-optimized resume.

═══════════════════════════════════════
CANDIDATE'S ORIGINAL RESUME:
═══════════════════════════════════════
${resumeText}

═══════════════════════════════════════
TARGET JOB DESCRIPTION:
═══════════════════════════════════════
${jobText}

═══════════════════════════════════════
REWRITING INSTRUCTIONS (FOLLOW EXACTLY):
═══════════════════════════════════════

## 1. PROFESSIONAL SUMMARY (3-4 sentences)
- Write a compelling, keyword-rich professional summary
- Include the candidate's actual years of experience (count from their work history — DO NOT use "X years" or any placeholder)
- Mention their strongest relevant skills that match the job description
- Include industry-specific terminology from the job posting
- End with a value proposition showing what they bring to the role
- Make it sound confident, human, and specific — NOT generic

## 2. SKILLS SECTION
- List ALL skills from the candidate's resume that are relevant to the job
- Add skills that can be LOGICALLY INFERRED from their experience (e.g., if they used React, they know JavaScript)
- Include exact keywords from the job description where the candidate genuinely has that skill
- Categorize into groups if there are many skills (e.g., "Programming Languages", "Cloud & DevOps", "Frameworks", etc.)
- Highlight: AI/ML tools, Cloud Platforms (AWS/GCP/Azure), DevOps (Docker, CI/CD, Kubernetes), and modern frameworks
- DO NOT add skills the candidate clearly doesn't have based on their resume

## 3. WORK EXPERIENCE
- Keep the candidate's REAL companies and REAL job titles (do NOT invent companies or roles)
- You may slightly enhance a job title if it's a reasonable equivalent (e.g., "Developer" → "Software Developer")
- Rewrite every bullet point using the STAR method (Situation-Task-Action-Result)
- Start each bullet with a STRONG action verb: Spearheaded, Architected, Engineered, Orchestrated, Streamlined, Optimized, Pioneered, Implemented, Accelerated, Transformed
- Include quantifiable metrics where possible — but ONLY if they can be reasonably inferred (e.g., "team of 5", "reduced load time", "processed 1000+ records")
- If the original has no metrics, you may add reasonable estimates that fit the context (e.g., "managed" → "managed a cross-functional team of 4-6 engineers")
- Align bullet points with the job description's requirements
- Include 3-5 bullets per role, prioritizing impact and relevance
- Add relevant dates/duration if present in the original

## 4. PROJECTS SECTION
- Enhance existing projects from the resume with more impactful descriptions
- Add relevant technology keywords that align with the job description
- If the candidate has personal/open-source projects, highlight them
- Emphasize AI integration, cloud deployment, CI/CD pipelines, and modern architectures where applicable
- Each project should have: name, a compelling 2-sentence description, and technologies used
- DO NOT invent projects that don't exist in the original resume

## 5. EDUCATION
- Keep the candidate's REAL education details
- Include degree, institution, and year/expected year
- Add relevant coursework, honors, or certifications ONLY if mentioned in the original
- If certifications exist in the resume, list them prominently

## 6. ATS KEYWORDS
- Extract the top 15-20 most important keywords from the job description
- Only include ones that the rewritten resume now genuinely contains
- These should be the exact terms ATS systems will scan for

## 7. FULL RESUME TEXT
- Compile everything into one clean, professional, formatted resume text
- Use clear section headers: PROFESSIONAL SUMMARY, SKILLS, EXPERIENCE, PROJECTS, EDUCATION
- Use consistent formatting with bullet points (•)
- Include proper spacing between sections
- This should be ready to copy-paste into a document

═══════════════════════════════════════
STRICT RULES (VIOLATIONS = FAILURE):
═══════════════════════════════════════
❌ NEVER use placeholders like "X years", "[Company Name]", "XX%", "[Your Name]"
❌ NEVER invent fake companies, fake roles, or fake achievements
❌ NEVER add skills the candidate clearly doesn't possess
❌ NEVER over-exaggerate beyond what's reasonable
❌ NEVER use generic filler language — every word must add value
❌ NEVER include personal contact info (email, phone, address) in the output
✅ ALWAYS base everything on the candidate's actual experience
✅ ALWAYS align with the target job description
✅ ALWAYS use professional, human-like language (not robotic)
✅ ALWAYS maintain truthfulness while maximizing impact
✅ ALWAYS inject relevant ATS keywords naturally

═══════════════════════════════════════
OUTPUT FORMAT (RETURN ONLY THIS JSON):
═══════════════════════════════════════
Return ONLY valid JSON with NO markdown formatting, NO backticks, NO extra text before or after:
{
  "professionalSummary": "The complete rewritten professional summary (3-4 sentences, specific, no placeholders)",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "role": "Actual or enhanced job title",
      "company": "Real company name from resume",
      "duration": "Date range from resume (e.g., 'Jan 2023 - Present')",
      "bullets": ["STAR-method bullet 1 with action verb and metrics", "bullet 2", "bullet 3"]
    }
  ],
  "projects": [
    {
      "name": "Real project name from resume",
      "description": "Enhanced 2-sentence impactful description",
      "technologies": ["tech1", "tech2", "tech3"],
      "highlights": ["Key achievement or feature 1", "Key achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "University/School name",
      "year": "Year or expected year",
      "details": "Relevant coursework, honors, or GPA if notable"
    }
  ],
  "atsKeywords": ["keyword1", "keyword2"],
  "skillCategories": {
    "Category Name": ["skill1", "skill2"]
  },
  "improvements": ["What was improved 1", "What was improved 2", "What was improved 3"],
  "atsScore": 85,
  "fullResumeText": "The complete formatted resume as a single readable string with all sections, proper headers, and bullet points"
}`;

      console.log(`[Rewrite-Resume Pro] Processing request (resume: ${resumeText.length} chars, job: ${jobText.length} chars)...`);

      const aiText = await callGemini(apiKey, prompt);
      
      // Robust JSON Extraction
      let cleaned = aiText.trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      
      try {
        const parsed = JSON.parse(cleaned);
        
        // Validate essential fields exist
        if (!parsed.professionalSummary || !parsed.skills || !parsed.experience) {
          throw new Error("AI response missing required resume sections.");
        }

        // Check for placeholder violations
        const placeholderPatterns = /\bX years?\b|\bXX%?\b|\[.*?\]|\{.*?\}/gi;
        const fullText = JSON.stringify(parsed);
        if (placeholderPatterns.test(fullText)) {
          console.warn("[Rewrite-Resume Pro] Warning: Detected potential placeholders in response, proceeding anyway.");
        }

        // Ensure backward compatibility with original RewriteResult interface
        // by normalizing education to string[] if needed (for download function)
        if (parsed.education && Array.isArray(parsed.education)) {
          parsed.educationDetails = parsed.education;
          parsed.education = parsed.education.map((edu: any) => {
            if (typeof edu === 'string') return edu;
            return `${edu.degree || ''} - ${edu.institution || ''} - ${edu.year || ''}${edu.details ? ` (${edu.details})` : ''}`.trim();
          });
        }

        // Ensure projects have highlights array
        if (parsed.projects) {
          parsed.projects = parsed.projects.map((p: any) => ({
            ...p,
            highlights: p.highlights || [],
            technologies: p.technologies || []
          }));
        }

        // Ensure experience has duration
        if (parsed.experience) {
          parsed.experience = parsed.experience.map((e: any) => ({
            ...e,
            duration: e.duration || '',
            bullets: e.bullets || []
          }));
        }

        console.log(`[Rewrite-Resume Pro] Success! Generated resume with ${parsed.skills?.length || 0} skills, ${parsed.experience?.length || 0} roles, ${parsed.projects?.length || 0} projects.`);

        res.json(parsed);
      } catch (parseError) {
        console.error("[Rewrite-Resume Pro] JSON Parse Error. Raw AI Text:", aiText.substring(0, 500));
        throw new Error("AI returned invalid data format for resume rewrite. Please try again.");
      }
    } catch (error: any) {
      console.error("[Rewrite-Resume Pro] Error:", error);
      const status = error.status || 500;
      res.status(status).json({ 
        error: error.message || "Failed to rewrite resume. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // --- API: Contact ---
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields." });
      }

      const contactData = {
        id: Date.now(),
        name,
        email,
        message,
        timestamp: new Date().toISOString(),
      };

      const dataDir = path.join(process.cwd(), "data");
      const filePath = path.join(dataDir, "contacts.json");

      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

      let existingData: any[] = [];
      if (fs.existsSync(filePath)) {
        existingData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }

      existingData.push(contactData);
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

      res.json({ success: true, message: "Feedback received safely." });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to save contact information." });
    }
  });

  // --- API: Improve Resume ---
  app.post("/api/improve", async (req, res) => {
    try {
      const { resumeText, jobText } = req.body;
      if (!resumeText || !jobText) {
        return res.status(400).json({ error: "Resume and Job Description required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      const prompt = `You are a career expert and professional resume writer.
Based on the target job description:
${jobText}

Please provide the following upgrades for their resume:
1. A rewritten, high-impact professional summary (2-3 sentences).
2. Five specific, high-value skills they should learn/highlight to stand out.
3. Three actionable tips to improve the wording of their existing experience to sound more result-oriented.

Format the response as EXACT JSON with no extra text:
{
  "improvedSummary": "...",
  "suggestedSkills": ["...", "..."],
  "wordingTips": ["...", "..."]
}

Original Resume:
${resumeText}`;

      const aiText = await callGemini(apiKey, prompt);
      // Robust JSON Extraction
      let cleaned = aiText.trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      
      try {
        res.json(JSON.parse(cleaned));
      } catch (parseError) {
        console.error("JSON Parse Error. Raw AI Text:", aiText);
        throw new Error("AI returned invalid data format for improvement. Please try again.");
      }
    } catch (error: any) {
      console.error("Improvement error:", error);
      res.status(error.status || 500).json({ error: error.message || "Failed to optimize resume." });
    }
  });

  // --- Vite Dev / Static ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          // Ignore backend files so Vite HMR never tries to reload server.ts
          ignored: [
            '**/server.ts',
            '**/server.js',
            '**/node_modules/**',
            '**/.env',
            '**/data/**',
          ]
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`   Models: ${GEMINI_MODELS.join(" → ")}\n`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please close the other process or try another port.`);
    } else {
      console.error(`❌ Server failed to start:`, err);
    }
    process.exit(1);
  });
}

startServer().catch(err => {
  console.error("🔥 CRITICAL SERVER ERROR:", err);
  process.exit(1);
});
