import { invokeAI } from "./geminiService";
import { useAgentStore } from "../stores/agentStore";

export interface ProjectAnalysis {
  projectGoal: string;
  targetAudience: string;
  projectType: string;
  requiredPages: string[];
  requiredFeatures: string[];
  designDirection: string;
  technicalRequirements: string[];
  complexity: "low" | "medium" | "high";
  modeConflicts: string[];
  normalizedRequest: string;
}

export function extractAndParseJSON(text: string): any {
  let cleanText = text.trim();
  // Strip markdown fences
  if (cleanText.includes("```")) {
    const lines = cleanText.split("\n");
    const jsonLines = lines.filter(line => !line.trim().startsWith("```"));
    cleanText = jsonLines.join("\n").trim();
  }

  // Find first { and last }
  const firstBrace = cleanText.indexOf("{");
  const lastBrace = cleanText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleanText);
}

function validateAnalysisResult(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.projectGoal !== "string" || !obj.projectGoal) return false;
  if (typeof obj.targetAudience !== "string") return false;
  if (typeof obj.projectType !== "string" || !obj.projectType) return false;
  if (!Array.isArray(obj.requiredPages) || obj.requiredPages.some((p: any) => typeof p !== "string")) return false;
  if (!Array.isArray(obj.requiredFeatures) || obj.requiredFeatures.some((f: any) => typeof f !== "string")) return false;
  if (typeof obj.designDirection !== "string") return false;
  if (!Array.isArray(obj.technicalRequirements) || obj.technicalRequirements.some((t: any) => typeof t !== "string")) return false;
  if (obj.complexity !== "low" && obj.complexity !== "medium" && obj.complexity !== "high") return false;
  if (!Array.isArray(obj.modeConflicts) || obj.modeConflicts.some((c: any) => typeof c !== "string")) return false;
  if (typeof obj.normalizedRequest !== "string" || !obj.normalizedRequest) return false;
  return true;
}

export class ProjectAnalysisService {
  private static instance: ProjectAnalysisService;

  public static getInstance(): ProjectAnalysisService {
    if (!ProjectAnalysisService.instance) {
      ProjectAnalysisService.instance = new ProjectAnalysisService();
    }
    return ProjectAnalysisService.instance;
  }

  private constructor() {}

  async analyzeProjectRequest(
    prompt: string,
    projectMode: "frontend" | "fullstack",
    maxRetries: number = 3
  ): Promise<ProjectAnalysis> {
    const systemPrompt = `
You are the NEXO Architect. Your job is to analyze a raw user project request and generate a structured JSON analysis document.
You MUST strictly follow these projectMode rules:

PROJECT MODE: ${projectMode.toUpperCase()}

${
  projectMode === "frontend"
    ? `Allowed technologies: HTML, CSS, Vanilla JavaScript.
Allowed project types: Portfolio, Landing Page.
Forbidden technologies: React, TypeScript, Node.js, Express, databases, Python, PHP, Java.
If the user requests forbidden technologies or a complex application, you MUST adapt the request to a static equivalent landing page/portfolio, list the violations in "modeConflicts", and describe the static version in "normalizedRequest".`
    : `Required technologies: React, TypeScript, Node.js.
Forbidden technologies: Plain HTML/CSS/JS files, PHP, Python, Java, Vue, Angular.
If the user requests forbidden technologies or templates, adapt the stack to React + TypeScript + Node.js, list the violations in "modeConflicts", and update the prompt in "normalizedRequest" to use the correct full-stack architecture.`
}

Your output MUST be a JSON object inside a code block:
\`\`\`json
{
  "projectGoal": "string describing the core goal of the project",
  "targetAudience": "string describing the target users",
  "projectType": "string (e.g. portfolio, landing-page, dashboard, saas, blog)",
  "requiredPages": ["page1", "page2"],
  "requiredFeatures": ["feature1", "feature2"],
  "designDirection": "string detailing the aesthetic, styling, color scheme recommendation",
  "technicalRequirements": ["req1", "req2"],
  "complexity": "low" | "medium" | "high",
  "modeConflicts": ["conflict1", "conflict2"],
  "normalizedRequest": "string representing the normalized user prompt aligned with the project mode constraints"
}
\`\`\`
Output ONLY the JSON block. Do not write any other explanation or text.
`;

    const model = useAgentStore.getState().selectedModel;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(`[ProjectAnalysisService] Analyzing request, attempt ${attempt + 1}/${maxRetries}`);
        const responseText = await invokeAI(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: `User Prompt: ${prompt}` }
          ],
          model,
          0.2, // Low temperature for high JSON structure consistency
          1
        );

        let parsed: any;
        try {
          parsed = JSON.parse(responseText.trim());
        } catch (e) {
          // Attempt local safe parsing
          parsed = extractAndParseJSON(responseText);
        }

        if (validateAnalysisResult(parsed)) {
          return parsed as ProjectAnalysis;
        }

        console.warn(`[ProjectAnalysisService] Attempt ${attempt + 1} validation failed for:`, responseText);
      } catch (err) {
        console.error(`[ProjectAnalysisService] Error in attempt ${attempt + 1}:`, err);
      }
      attempt++;
    }

    throw new Error(`Failed to generate a valid project analysis after ${maxRetries} attempts.`);
  }
}
