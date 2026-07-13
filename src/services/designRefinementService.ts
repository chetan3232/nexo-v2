import { invokeAI } from "./geminiService";
import { useAgentStore } from "../stores/agentStore";
import { DesignConcept } from "../types/designConcept";
import { extractAndParseJSON } from "./projectAnalysisService";

function validateRefinedConcept(concept: any, projectMode: "frontend" | "fullstack"): boolean {
  if (!concept || typeof concept !== "object") return false;
  
  const requiredFields = [
    "id",
    "name",
    "description",
    "designDirection",
    "layoutStructure",
    "colorSystem",
    "typography",
    "componentStyle",
    "animationStyle",
    "pageStructure",
    "previewFiles",
  ];
  
  for (const field of requiredFields) {
    if (!(field in concept)) {
      console.warn(`[DesignRefinementService] Refined concept missing field: ${field}`);
      return false;
    }
  }

  if (typeof concept.previewFiles !== "object" || concept.previewFiles === null) return false;

  // Validate preview file paths and contents
  const filePaths = Object.keys(concept.previewFiles);
  if (filePaths.length === 0) return false;

  for (const [path, content] of Object.entries(concept.previewFiles)) {
    if (typeof content !== "string" || !content) return false;
    
    if (projectMode === "frontend") {
      if (path.endsWith(".tsx") || path.endsWith(".ts")) return false;
      if (content.includes("useState") && content.includes("react")) return false;
    } else {
      const allowedExtensions = [".tsx", ".ts", ".jsx", ".js", ".css", ".json"];
      const ext = path.substring(path.lastIndexOf("."));
      if (!allowedExtensions.includes(ext)) return false;
    }
  }

  return true;
}

export class DesignRefinementService {
  private static instance: DesignRefinementService;

  public static getInstance(): DesignRefinementService {
    if (!DesignRefinementService.instance) {
      DesignRefinementService.instance = new DesignRefinementService();
    }
    return DesignRefinementService.instance;
  }

  private constructor() {}

  async refineDesign(
    concept: DesignConcept,
    feedback: string,
    projectMode: "frontend" | "fullstack",
    projectContext: string,
    maxRetries: number = 3
  ): Promise<DesignConcept> {
    const systemPrompt = `
You are the NEXO Designer. Your job is to refine an existing Design Concept based on direct user feedback.
You MUST follow these strict rules:

PROJECT MODE: ${projectMode.toUpperCase()}

${
  projectMode === "frontend"
    ? `Allowed technologies for previewFiles: HTML, CSS, Vanilla JavaScript.
Design previews MUST NOT contain React, TypeScript, imports from npm packages, or backend structures.`
    : `Required technologies for previewFiles: React (JSX/TSX), TypeScript.
Design previews must be fully compatible with React, TypeScript, and Tailwind CSS.
Do not build full backend files (Express, DB, etc.) in the previewFiles.`
}

You must update the Sibling Design Concept according to the user feedback, while maintaining its unique identity (e.g. keeping its primary theme class light/dark as original, unless explicitly asked to change it).
Do not show any raw chain-of-thought or model reasoning inside the previewFiles.

Your output MUST be a JSON object inside a code block:
\`\`\`json
{
  "id": "${concept.id}",
  "name": "Updated Design Name",
  "description": "Updated short description",
  "designDirection": "Updated visual direction details",
  "layoutStructure": "Updated layout structure description",
  "colorSystem": {
    "primary": "hex/hsl color",
    "secondary": "hex/hsl color",
    "accent": "hex/hsl color",
    "background": "hex/hsl color",
    "surface": "hex/hsl color",
    "text": "hex/hsl color"
  },
  "typography": {
    "fontFamily": "font list",
    "headings": "headings typography style",
    "body": "body typography style"
  },
  "componentStyle": "Updated component styles",
  "animationStyle": "Updated animations",
  "pageStructure": ["page1", "page2"],
  "previewFiles": {
    "path/to/preview/file": "complete source code for previewing this design"
  },
  "generationMetadata": {
    "model": "${useAgentStore.getState().selectedModel}",
    "timestamp": ${Date.now()}
  }
}
\`\`\`
Output ONLY the JSON block. Do not write any other explanation or text.
`;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(`[DesignRefinementService] Refining design ${concept.id}, attempt ${attempt + 1}/${maxRetries}`);
        const responseText = await invokeAI(
          [
            { role: "system", content: systemPrompt },
            { 
              role: "user", 
              content: `Original Design Concept:\n${JSON.stringify(concept, null, 2)}\n\nProject Context:\n${projectContext}\n\nUser Feedback: "${feedback}"` 
            }
          ],
          useAgentStore.getState().selectedModel,
          0.7, // Normal temperature for creative UI edits
          1
        );

        let parsed: any;
        try {
          parsed = JSON.parse(responseText.trim());
        } catch (e) {
          parsed = extractAndParseJSON(responseText);
        }

        if (validateRefinedConcept(parsed, projectMode)) {
          parsed.id = concept.id; // Force correct ID
          return parsed as DesignConcept;
        }

        console.warn(`[DesignRefinementService] Attempt ${attempt + 1} validation failed.`);
      } catch (err) {
        console.error(`[DesignRefinementService] Error in attempt ${attempt + 1}:`, err);
      }
      attempt++;
    }

    throw new Error(`Failed to refine and generate a valid design concept after ${maxRetries} attempts.`);
  }
}
