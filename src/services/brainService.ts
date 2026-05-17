import { useMemoryStore } from "../stores/memoryStore";
import { WebsiteContent } from "../types";

export class BrainService {
  private static instance: BrainService;

  public static getInstance(): BrainService {
    if (!BrainService.instance) {
      BrainService.instance = new BrainService();
    }
    return BrainService.instance;
  }

  private constructor() {}

  /**
   * Extracts intelligence from the current session and updates the project brain.
   */
  public async learnFromSession(
    prompt: string,
    content: WebsiteContent | null,
    success: boolean,
  ) {
    console.log("Brain is learning from session...");

    // 1. Update User Behavior
    this.updateUserBehavior(prompt);

    // 2. Detect Stack Patterns
    if (content) {
      this.detectStackPatterns(content);
    }

    // 3. Log Decisions
    if (success) {
      this.logDecision(
        `Successfully generated feature: ${prompt.substring(0, 50)}...`,
      );
    } else {
      this.logDecision(
        `Failed to generate feature: ${prompt.substring(0, 50)}... | Attempting self-healing.`,
      );
    }
  }

  private async updateUserBehavior(prompt: string) {
    // Logic to analyze prompt and update user-behavior.json
    // In a real app, this would call an API or write to the virtual FS
    console.log(`Analyzing prompt for behavior: ${prompt}`);
  }

  private async detectStackPatterns(content: WebsiteContent) {
    // Logic to scan files and update stack-patterns.json
    const files = Object.keys(content.files);
    console.log(`Scanning ${files.length} files for stack patterns.`);
  }

  private async logDecision(decision: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Decision Logged: ${decision}`);
  }

  /**
   * Provides the full brain context for the AI agents.
   */
  public getBrainContext(): string {
    return `
PROJECT BRAIN CONTEXT:
- Architecture: Modular, Store-based, WebContainer runtime.
- Coding Style: TypeScript, Tailwind, Functional components.
- Stack Patterns: React Router, Lucide Icons, Zustand stores.
- User Preferences: Minimal UI, Rounded corners (xl), Dark mode.
- Goals: AI-driven autonomous engineering, Phase 4 Visual Builder.
        `.trim();
  }
}
