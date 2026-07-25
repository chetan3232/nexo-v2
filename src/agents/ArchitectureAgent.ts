import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";
import { useGenerationWorkflowStore } from "../stores/generationWorkflowStore";
import { DesignLockService } from "../services/designLockService";

export interface HealthMetric {
  label: string;
  status: "good" | "warning" | "error";
  description: string;
}

export interface ArchitectureReport {
  score: number;
  metrics: HealthMetric[];
}

export class ArchitectureAgent extends BaseAgent {
  async analyze(
    files: Record<string, string>,
    history: Message[],
    options: any,
  ): Promise<string> {
    const systemPrompt = `
You are the NEXO Senior Architecture Auditor. Your job is to scan the project files and provide a technical health report.

CRITERIA:
1. Component Structure: Is it modular and reusable?
2. State Management: Is there excessive prop drilling?
3. Logic Duplication: Are there repeated patterns (e.g. auth, fetch)?
4. Performance: Estimated bundle size and render efficiency.

OUTPUT FORMAT:
Return a JSON block containing:
{
  "score": number (0-100),
  "metrics": [
    { "label": string, "status": "good" | "warning" | "error", "description": string }
  ]
}
Output ONLY the JSON.
        `.trim();

    const analysisPrompt = `
Analyze the following project structure and code quality:

FILES:
${Object.keys(files).join("\n")}

Perform a deep audit.
        `;

    const snapshot = useGenerationWorkflowStore.getState().selectedDesignSnapshot;
    const finalSystemPrompt = DesignLockService.getInstance().injectDesignLockPrompt(systemPrompt, snapshot);

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages(history, analysisPrompt, finalSystemPrompt),
      temperature: 0.1,
      priority: "CRITICAL",
    });
  }

  async repair(
    failure: any,
    options: any
  ): Promise<string> {
    const systemPrompt = `
You are the NEXO Senior Architecture Fixer. Your job is to analyze a TargetedRepairContext for a validation failure and generate clean patch files to fix ONLY the affected files.
You MUST strictly follow these guidelines:
1. Do NOT rewrite the complete application.
2. Only output code blocks for the files that need changes to repair the error.
3. Keep the locked design visual constraints and the approved plan constraints intact.

OUTPUT FORMAT:
Generate code blocks for updated files in the standard format:
---FILE: filename.ext---
[repaired code content]
---END FILE---
`;

    const repairPrompt = `
=========================================
TARGETED REPAIR CONTEXT
=========================================
Error Type: ${failure.errorType}
Error Message: ${failure.errorMessage}
Affected Files: ${failure.affectedFiles.join(", ")}
Expected Behavior: ${failure.expectedBehavior}
Selected Design Constraints: ${failure.selectedDesignConstraints}
Approved Plan Constraints: ${failure.approvedPlanConstraints}

RELEVANT CODE:
${failure.relevantCode}
=========================================

TASK:
Analyze the validation failure and repair ONLY the affected files. Respond with updated code blocks in the standard format.
`;

    const snapshot = useGenerationWorkflowStore.getState().selectedDesignSnapshot;
    const finalSystemPrompt = DesignLockService.getInstance().injectDesignLockPrompt(systemPrompt, snapshot);

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages([], repairPrompt, finalSystemPrompt),
      temperature: 0.1,
      priority: "CRITICAL",
    });
  }
}
