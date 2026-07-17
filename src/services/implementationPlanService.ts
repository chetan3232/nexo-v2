import { invokeAI } from "./geminiService";
import { useAgentStore } from "../stores/agentStore";
import { ProjectAnalysis } from "./projectAnalysisService";
import { SelectedDesignSnapshot } from "../types/designConcept";
import { extractAndParseJSON } from "./projectAnalysisService";

export interface ImplementationPlan {
  projectSummary: string;
  selectedDesignSummary: string;
  technologyStack: string[];
  architecture: string;
  pages: string[];
  components: string[];
  features: string[];
  dataFlow: string;
  apiRequirements: string[];
  securityRequirements: string[];
  implementationSteps: string[];
  validationSteps: string[];
  deploymentRequirements: string[];
}

export class ImplementationPlanService {
  private static instance: ImplementationPlanService;

  public static getInstance(): ImplementationPlanService {
    if (!ImplementationPlanService.instance) {
      ImplementationPlanService.instance = new ImplementationPlanService();
    }
    return ImplementationPlanService.instance;
  }

  private constructor() {}

  async generateImplementationPlan(
    normalizedRequest: string,
    projectMode: "frontend" | "fullstack",
    selectedDesign: SelectedDesignSnapshot,
    analysis: ProjectAnalysis,
    requiredFeatures: string[],
    maxRetries: number = 3
  ): Promise<ImplementationPlan> {
    const systemPrompt = `
You are the NEXO Lead Architect. Your task is to generate a comprehensive, structured implementation plan based on the user's request, project mode, design snapshot, requirements analysis, and required features.

PROJECT MODE: ${projectMode.toUpperCase()}

${
  projectMode === "frontend"
    ? `Allowed technologies: HTML, CSS, JavaScript.
Allowed project types: Portfolio, Landing Page.
The plan must only reference plain HTML/CSS/JS without React, TypeScript, or backend server dependencies.`
    : `Required technologies: React, TypeScript, Node.js.
The plan must describe structured components, custom hooks, typings, Express routes, and API endpoints.`
}

You must strictly reference and respect the locked visual design snapshot as the source of truth (colors, typography, page structure).

Your output MUST be a JSON object inside a code block:
\`\`\`json
{
  "projectSummary": "Detailed summary of the project goal and scope",
  "selectedDesignSummary": "Summary of the visual and component style based on the locked design",
  "technologyStack": ["tech1", "tech2"],
  "architecture": "Architecture overview and component tree",
  "pages": ["page1 description", "page2 description"],
  "components": ["component1 details", "component2 details"],
  "features": ["feature1 details", "feature2 details"],
  "dataFlow": "Explanation of state management and data flows",
  "apiRequirements": ["API 1", "API 2"],
  "securityRequirements": ["security check 1", "security check 2"],
  "implementationSteps": ["step 1", "step 2"],
  "validationSteps": ["testing / verification step 1", "testing / verification step 2"],
  "deploymentRequirements": ["deployment guidelines"]
}
\`\`\`
Output ONLY the JSON block. Do not write any other explanation or text.
`;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(`[ImplementationPlanService] Generating plan, attempt ${attempt + 1}/${maxRetries}`);
        const responseText = await invokeAI(
          [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Normalized Request: ${normalizedRequest}
Project Mode: ${projectMode}
Design Snapshot: ${JSON.stringify(selectedDesign, null, 2)}
Project Analysis: ${JSON.stringify(analysis, null, 2)}
Required Features: ${JSON.stringify(requiredFeatures, null, 2)}`
            }
          ],
          useAgentStore.getState().selectedModel,
          0.2, // Low temperature for structured architecture output
          1,
          true,
          "HIGH"
        );

        let parsed: any;
        try {
          parsed = JSON.parse(responseText.trim());
        } catch (e) {
          parsed = extractAndParseJSON(responseText);
        }

        // Validate structure
        const requiredFields = [
          "projectSummary",
          "selectedDesignSummary",
          "technologyStack",
          "architecture",
          "pages",
          "components",
          "features",
          "dataFlow",
          "apiRequirements",
          "securityRequirements",
          "implementationSteps",
          "validationSteps",
          "deploymentRequirements"
        ];

        let isValid = true;
        for (const field of requiredFields) {
          if (!(field in parsed)) {
            console.warn(`[ImplementationPlanService] Missing field: ${field}`);
            isValid = false;
            break;
          }
        }

        if (isValid) {
          return parsed as ImplementationPlan;
        }
      } catch (err) {
        console.error(`[ImplementationPlanService] Error in attempt ${attempt + 1}:`, err);
      }
      attempt++;
    }

    throw new Error(`Failed to generate a valid implementation plan after ${maxRetries} attempts.`);
  }

  async refineImplementationPlan(
    currentPlan: ImplementationPlan,
    feedback: string,
    projectMode: "frontend" | "fullstack",
    maxRetries: number = 3
  ): Promise<ImplementationPlan> {
    const systemPrompt = `
You are the NEXO Lead Architect. Your task is to update and refine the current Implementation Plan according to user feedback.
Do NOT regenerate the plan from scratch. Instead, modify only the relevant parts according to user feedback, while maintaining the rest of the plan's structure and detail intact.

PROJECT MODE: ${projectMode.toUpperCase()}

Your output MUST be a JSON object containing the full updated plan inside a code block:
\`\`\`json
{
  "projectSummary": "...",
  "selectedDesignSummary": "...",
  "technologyStack": [...],
  "architecture": "...",
  "pages": [...],
  "components": [...],
  "features": [...],
  "dataFlow": "...",
  "apiRequirements": [...],
  "securityRequirements": [...],
  "implementationSteps": [...],
  "validationSteps": [...],
  "deploymentRequirements": [...]
}
\`\`\`
Output ONLY the JSON block. Do not write any other explanation or text.
`;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(`[ImplementationPlanService] Refining plan, attempt ${attempt + 1}/${maxRetries}`);
        const responseText = await invokeAI(
          [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Current Implementation Plan:\n${JSON.stringify(currentPlan, null, 2)}\n\nUser Refinement Feedback: "${feedback}"`
            }
          ],
          useAgentStore.getState().selectedModel,
          0.2,
          1,
          true,
          "NORMAL"
        );

        let parsed: any;
        try {
          parsed = JSON.parse(responseText.trim());
        } catch (e) {
          parsed = extractAndParseJSON(responseText);
        }

        const requiredFields = [
          "projectSummary",
          "selectedDesignSummary",
          "technologyStack",
          "architecture",
          "pages",
          "components",
          "features",
          "dataFlow",
          "apiRequirements",
          "securityRequirements",
          "implementationSteps",
          "validationSteps",
          "deploymentRequirements"
        ];

        let isValid = true;
        for (const field of requiredFields) {
          if (!(field in parsed)) {
            console.warn(`[ImplementationPlanService] Refinement missing field: ${field}`);
            isValid = false;
            break;
          }
        }

        if (isValid) {
          return parsed as ImplementationPlan;
        }
      } catch (err) {
        console.error(`[ImplementationPlanService] Error refining plan in attempt ${attempt + 1}:`, err);
      }
      attempt++;
    }

    throw new Error(`Failed to refine implementation plan after ${maxRetries} attempts.`);
  }
}
