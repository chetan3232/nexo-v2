import { invokeAI } from "./geminiService";
import { useAgentStore } from "../stores/agentStore";
import { DesignConcept } from "../types/designConcept";
import { ProjectAnalysis } from "./projectAnalysisService";
import { extractAndParseJSON } from "./projectAnalysisService";

function validateDesignConcept(concept: any, projectMode: "frontend" | "fullstack"): boolean {
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
      console.warn(`[DesignGenerationService] Concept missing field: ${field}`);
      return false;
    }
  }

  if (typeof concept.id !== "string" || !concept.id) return false;
  if (typeof concept.name !== "string" || !concept.name) return false;
  if (typeof concept.description !== "string" || !concept.description) return false;
  if (typeof concept.designDirection !== "string" || !concept.designDirection) return false;
  if (typeof concept.layoutStructure !== "string" || !concept.layoutStructure) return false;
  if (typeof concept.componentStyle !== "string" || !concept.componentStyle) return false;
  if (typeof concept.animationStyle !== "string" || !concept.animationStyle) return false;
  
  if (!Array.isArray(concept.pageStructure) || concept.pageStructure.some((p: any) => typeof p !== "string")) return false;
  if (typeof concept.previewFiles !== "object" || concept.previewFiles === null) return false;

  // Validate preview file paths and contents
  const filePaths = Object.keys(concept.previewFiles);
  if (filePaths.length === 0) return false;

  for (const [path, content] of Object.entries(concept.previewFiles)) {
    if (typeof content !== "string" || !content) return false;
    
    if (projectMode === "frontend") {
      // Frontend mode: HTML, CSS, JS only
      if (path.endsWith(".tsx") || path.endsWith(".ts")) {
        console.warn(`[DesignGenerationService] Incompatible file extension for Frontend mode: ${path}`);
        return false;
      }
      // Check for React syntax markers
      if (content.includes("useState") && content.includes("react")) {
        console.warn(`[DesignGenerationService] React code detected in Frontend mode preview: ${path}`);
        return false;
      }
    } else {
      // Fullstack mode: React, TS, CSS allowed
      const allowedExtensions = [".tsx", ".ts", ".jsx", ".js", ".css", ".json"];
      const ext = path.substring(path.lastIndexOf("."));
      if (!allowedExtensions.includes(ext)) {
        console.warn(`[DesignGenerationService] Incompatible file extension for Fullstack mode: ${path}`);
        return false;
      }
    }
  }

  return true;
}

export class DesignGenerationService {
  private static instance: DesignGenerationService;

  public static getInstance(): DesignGenerationService {
    if (!DesignGenerationService.instance) {
      DesignGenerationService.instance = new DesignGenerationService();
    }
    return DesignGenerationService.instance;
  }

  private constructor() {}

  async generateDesigns(
    prompt: string,
    analysis: ProjectAnalysis,
    projectMode: "frontend" | "fullstack",
    maxRetries: number = 3
  ): Promise<[DesignConcept, DesignConcept]> {
    const systemPrompt = `
You are the NEXO Designer. Your job is to create exactly TWO different, highly premium UI design concepts based on the user's prompt and requirements analysis.
You MUST follow these strict rules:

PROJECT MODE: ${projectMode.toUpperCase()}

${
  projectMode === "frontend"
    ? `Allowed technologies for previewFiles: HTML, CSS, Vanilla JavaScript.
Design previews MUST NOT contain React, TypeScript, imports from npm packages, or backend structures.`
    : `Required technologies for previewFiles: React (JSX/TSX), TypeScript.
Design previews must be fully compatible with React, TypeScript, and Tailwind CSS.
Do not build full backend files (Express, DB, etc.) in the previewFiles, just mock frontend components.`
}

The two designs must be MEANINGFULLY DIFFERENT:
- DESIGN_A: Clean, minimal editorial layout, light theme, neutral colors, thin borders, sleek typography, subtle micro-animations.
- DESIGN_B: Bold, immersive, dark theme first, vibrant gradient accents, glassmorphic effects, card layouts, expressive animations.

For each design, you must generate a lightweight preview file structure (usually index.html + style.css for Frontend, or src/App.tsx + src/index.css for Fullstack) in "previewFiles" to show off the visual theme layout. Do not show any raw chain-of-thought or model reasoning inside the previewFiles.

Your output MUST be a JSON object inside a code block:
\`\`\`json
{
  "designs": [
    {
      "id": "design_a",
      "name": "Design A Name",
      "description": "Short description of Design A style",
      "designDirection": "Detailing Design A visual direction",
      "layoutStructure": "Layout grid description",
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
        "headings": "heading font style description",
        "body": "body font style description"
      },
      "componentStyle": "Component border radius, padding style description",
      "animationStyle": "framer-motion or CSS transitions description",
      "pageStructure": ["page1", "page2"],
      "previewFiles": {
        "path/to/preview/file": "complete source code for previewing this design"
      },
      "generationMetadata": {
        "model": "${useAgentStore.getState().selectedModel}",
        "timestamp": ${Date.now()}
      }
    },
    {
      "id": "design_b",
      "name": "Design B Name",
      "description": "Short description of Design B style",
      "designDirection": "Detailing Design B visual direction",
      "layoutStructure": "Layout grid description",
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
        "headings": "heading font style description",
        "body": "body font style description"
      },
      "componentStyle": "Component border radius, padding style description",
      "animationStyle": "framer-motion or CSS transitions description",
      "pageStructure": ["page1", "page2"],
      "previewFiles": {
        "path/to/preview/file": "complete source code for previewing this design"
      },
      "generationMetadata": {
        "model": "${useAgentStore.getState().selectedModel}",
        "timestamp": ${Date.now()}
      }
    }
  ]
}
\`\`\`
Output ONLY the JSON block. Do not write any other explanation or text.
`;

    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        console.log(`[DesignGenerationService] Generating dual UI designs, attempt ${attempt + 1}/${maxRetries}`);
        const responseText = await invokeAI(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: `User Prompt: ${prompt}\n\nProject Analysis:\n${JSON.stringify(analysis, null, 2)}` }
          ],
          useAgentStore.getState().selectedModel,
          0.7, // Normal temperature for creative UI generation
          1
        );

        let parsed: any;
        try {
          parsed = JSON.parse(responseText.trim());
        } catch (e) {
          parsed = extractAndParseJSON(responseText);
        }

        if (parsed && Array.isArray(parsed.designs)) {
          const designs = parsed.designs;
          const isAValid = designs.length > 0 && validateDesignConcept(designs[0], projectMode);
          const isBValid = designs.length > 1 && validateDesignConcept(designs[1], projectMode);

          if (isAValid && isBValid) {
            // Guarantee unique IDs
            designs[0].id = "design_a";
            designs[1].id = "design_b";
            return [designs[0], designs[1]] as [DesignConcept, DesignConcept];
          }

          // Fallback: If only one design is invalid, retry/repair ONLY the invalid design
          if (isAValid && !isBValid) {
            console.warn("[DesignGenerationService] Design B invalid. Regenerating Design B...");
            const designB = await this.repairSingleDesign("design_b", designs[0], prompt, analysis, projectMode);
            return [designs[0], designB];
          }

          if (!isAValid && isBValid) {
            console.warn("[DesignGenerationService] Design A invalid. Regenerating Design A...");
            const designA = await this.repairSingleDesign("design_a", designs[1], prompt, analysis, projectMode);
            return [designA, designs[1]];
          }
        }

        console.warn(`[DesignGenerationService] Attempt ${attempt + 1} validation failed.`);
      } catch (err) {
        console.error(`[DesignGenerationService] Error in attempt ${attempt + 1}:`, err);
      }
      attempt++;
    }

    throw new Error(`Failed to generate valid UI designs after ${maxRetries} attempts.`);
  }

  private async repairSingleDesign(
    targetId: "design_a" | "design_b",
    siblingDesign: DesignConcept,
    prompt: string,
    analysis: ProjectAnalysis,
    projectMode: "frontend" | "fullstack"
  ): Promise<DesignConcept> {
    const isTargetA = targetId === "design_a";
    const systemPrompt = `
You are the NEXO Designer. Your job is to generate exactly ONE UI design concept, named ${isTargetA ? "Design A" : "Design B"}, to complement the existing design concept.
You MUST strictly follow these projectMode rules:

PROJECT MODE: ${projectMode.toUpperCase()}

${
  projectMode === "frontend"
    ? `Allowed technologies for previewFiles: HTML, CSS, Vanilla JavaScript.
Design preview MUST NOT contain React, TypeScript, imports from npm packages, or backend structures.`
    : `Required technologies for previewFiles: React (JSX/TSX), TypeScript.
Design preview must be fully compatible with React, TypeScript, and Tailwind CSS.
Do not build full backend files (Express, DB, etc.) in the previewFiles.`
}

The new design MUST be MEANINGFULLY DIFFERENT from the sibling design provided below:
- Sibling Design: ${siblingDesign.name} (${siblingDesign.description})
- Color scheme of Sibling Design: ${JSON.stringify(siblingDesign.colorSystem)}
- Sibling design direction: ${siblingDesign.designDirection}

${
  isTargetA
    ? `Design A should be: Clean, minimal editorial layout, light theme, neutral colors, thin borders, sleek typography, subtle micro-animations.`
    : `Design B should be: Bold, immersive, dark theme first, vibrant gradient accents, glassmorphic effects, card layouts, expressive animations.`
}

Generate a lightweight preview file structure in "previewFiles" (e.g. index.html + style.css for Frontend, or src/App.tsx + src/index.css for Fullstack) to display this visual theme. Do not write raw chain-of-thought or model reasoning inside the previewFiles.

Your output MUST be a JSON object inside a code block:
\`\`\`json
{
  "id": "${targetId}",
  "name": "Design Name",
  "description": "Short description of style",
  "designDirection": "Visual direction details",
  "layoutStructure": "Layout grid description",
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
    "headings": "heading style",
    "body": "body style"
  },
  "componentStyle": "Component details",
  "animationStyle": "animation details",
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
    while (attempt < 3) {
      try {
        const responseText = await invokeAI(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: `User Prompt: ${prompt}\n\nProject Analysis:\n${JSON.stringify(analysis, null, 2)}` }
          ],
          useAgentStore.getState().selectedModel,
          0.7,
          1
        );

        let parsed: any;
        try {
          parsed = JSON.parse(responseText.trim());
        } catch (e) {
          parsed = extractAndParseJSON(responseText);
        }

        if (validateDesignConcept(parsed, projectMode)) {
          parsed.id = targetId;
          return parsed as DesignConcept;
        }
      } catch (err) {
        console.error(`[DesignGenerationService] Error repairing ${targetId} in attempt ${attempt + 1}:`, err);
      }
      attempt++;
    }

    throw new Error(`Failed to repair and generate a valid design concept for ${targetId}.`);
  }
}
