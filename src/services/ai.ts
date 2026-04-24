
export interface MatchResult {
  overallScore: number;
  sectionScores: {
    skills: number;
    experience: number;
    education: number;
    impact: number;
  };
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  gaps: string[];
  improvementTips: string[];
  resumeSuggestions: string[];
  templateRecommendations: { name: string; reason: string }[];
  checklist: string[];
  summary: string;
}

export interface ImprovementResult {
  improvedSummary: string;
  suggestedSkills: string[];
  wordingTips: string[];
}

export interface RewriteResult {
  professionalSummary: string;
  skills: string[];
  experience: { role: string; company: string; bullets: string[] }[];
  projects: { name: string; description: string; technologies: string[] }[];
  education: string[];
  atsKeywords: string[];
  fullResumeText: string;
}

export class AnalysisError extends Error {
  details?: string;
  constructor(message: string, details?: string) {
    super(message);
    this.name = "AnalysisError";
    this.details = details;
  }
}

export async function analyzeResume(resumeText: string, jobText: string, resumeFile?: File | null, jobFile?: File | null): Promise<MatchResult> {
  const formData = new FormData();
  
  if (resumeFile) {
    formData.append("resumeFile", resumeFile);
  } else {
    formData.append("resumeText", resumeText);
  }

  if (jobFile) {
    formData.append("jobFile", jobFile);
  } else {
    formData.append("jobText", jobText);
  }

  console.log("[AI Service] Sending request to /api/analyze...");
  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error("[AI Service] Analysis API Error:", errorData);
    throw new AnalysisError(
      errorData?.error || "Analysis failed. Please try again.",
      errorData?.details
    );
  }

  const result = await response.json();
  console.log("[AI Service] Analysis success:", result);
  return result;
}

export async function improveResume(resumeText: string, jobText: string): Promise<ImprovementResult> {
  const response = await fetch("/api/improve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new AnalysisError(errorData?.error || "Failed to optimize resume");
  }

  return await response.json();
}

export async function sendContact(name: string, email: string, message: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to send message");
  }

  return await response.json();
}

export async function rewriteResume(resumeText: string, jobText: string): Promise<RewriteResult> {
  const response = await fetch("/api/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobText }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new AnalysisError(errorData?.error || "Failed to rewrite resume");
  }

  return await response.json();
}

// --- Enhanced Rewrite Resume Pro (Isolated Feature) ---

export interface RewriteResultPro {
  professionalSummary: string;
  skills: string[];
  experience: { role: string; company: string; duration: string; bullets: string[] }[];
  projects: { name: string; description: string; technologies: string[]; highlights: string[] }[];
  education: string[];
  educationDetails?: { degree: string; institution: string; year: string; details: string }[];
  atsKeywords: string[];
  skillCategories?: Record<string, string[]>;
  improvements?: string[];
  atsScore?: number;
  fullResumeText: string;
}

export async function rewriteResumePro(
  resumeText: string, 
  jobText: string, 
  resumeFile?: File | null, 
  jobFile?: File | null
): Promise<RewriteResultPro> {
  const formData = new FormData();

  if (resumeFile) {
    formData.append("resumeFile", resumeFile);
  } else {
    formData.append("resumeText", resumeText);
  }

  if (jobFile) {
    formData.append("jobFile", jobFile);
  } else {
    formData.append("jobText", jobText);
  }

  console.log("[AI Service] Sending request to /api/rewrite-resume...");
  const response = await fetch("/api/rewrite-resume", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error("[AI Service] Rewrite Resume Pro Error:", errorData);
    throw new AnalysisError(
      errorData?.error || "Failed to rewrite resume. Please try again.",
      errorData?.details
    );
  }

  const result = await response.json();
  console.log("[AI Service] Rewrite Resume Pro success:", result);
  return result;
}
