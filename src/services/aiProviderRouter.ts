export type TaskType = "FAST" | "STRONG";

export interface ProviderStats {
  model: string;
  provider: string;
  consecutiveFailures: number;
  lastFailureTime: number;
  cooldownUntil: number;
  latencies: number[];
  rateLimitedUntil: number;
}

export class AIProviderRouter {
  private static instance: AIProviderRouter;

  private stats: Map<string, ProviderStats> = new Map();

  // Model categories
  private fastModels = [
    "z-ai/glm4.7", // Default fast model
    "meta-llama/llama-3.1-8b-instruct:free",
    "google/gemini-flash-1.5-exp",
  ];

  private strongModels = [
    "openai/gpt-4o",
    "meta-llama/llama-3.1-405b-instruct",
    "google/gemini-pro-1.5-exp",
  ];

  private fallbacks: Record<string, string> = {
    "openai/gpt-4o": "z-ai/glm4.7",
    "z-ai/glm4.7": "meta-llama/llama-3.1-8b-instruct:free",
    "google/gemini-pro-1.5-exp": "google/gemini-flash-1.5-exp",
  };

  private cooldownDurationMs = 30000; // 30s cooldown
  private maxConsecutiveFailures = 3;

  public static getInstance(): AIProviderRouter {
    if (!AIProviderRouter.instance) {
      AIProviderRouter.instance = new AIProviderRouter();
    }
    return AIProviderRouter.instance;
  }

  private constructor() {
    // Initialize stats
    const allModels = [...this.fastModels, ...this.strongModels];
    allModels.forEach((model) => {
      this.stats.set(model, {
        model,
        provider: model.split("/")[0],
        consecutiveFailures: 0,
        lastFailureTime: 0,
        cooldownUntil: 0,
        latencies: [],
        rateLimitedUntil: 0,
      });
    });
  }

  public determineTaskType(priority: string, messages: any[]): TaskType {
    if (priority === "CRITICAL") {
      return "STRONG";
    }
    if (priority === "HIGH") {
      const promptText = JSON.stringify(messages).toLowerCase();
      if (promptText.includes("design") || promptText.includes("plan")) {
        return "STRONG";
      }
    }
    return "FAST";
  }

  public getPrimaryModel(taskType: TaskType): string {
    const list = taskType === "STRONG" ? this.strongModels : this.fastModels;
    for (const model of list) {
      if (this.isModelAvailable(model)) {
        return model;
      }
    }
    return list[0];
  }

  public getFallbackModel(currentModel: string): string | null {
    const fallback = this.fallbacks[currentModel];
    if (fallback && this.isModelAvailable(fallback)) {
      return fallback;
    }
    for (const model of this.fastModels) {
      if (model !== currentModel && this.isModelAvailable(model)) {
        return model;
      }
    }
    return null;
  }

  public isModelAvailable(model: string): boolean {
    const stat = this.stats.get(model);
    if (!stat) return true;

    const now = Date.now();
    if (stat.cooldownUntil > now) {
      return false;
    }
    if (stat.rateLimitedUntil > now) {
      return false;
    }
    return true;
  }

  public recordSuccess(model: string, latencyMs: number) {
    const stat = this.stats.get(model);
    if (stat) {
      stat.consecutiveFailures = 0;
      stat.latencies.push(latencyMs);
      if (stat.latencies.length > 10) {
        stat.latencies.shift();
      }
    }
  }

  public recordFailure(model: string) {
    const stat = this.stats.get(model);
    if (stat) {
      stat.consecutiveFailures++;
      stat.lastFailureTime = Date.now();
      if (stat.consecutiveFailures >= this.maxConsecutiveFailures) {
        stat.cooldownUntil = Date.now() + this.cooldownDurationMs;
        console.warn(
          `[AIProviderRouter] Circuit breaker triggered for ${model}. Cooling down for ${this.cooldownDurationMs}ms.`
        );
      }
    }
  }

  public recordRateLimit(model: string, retryAfterMs?: number) {
    const stat = this.stats.get(model);
    if (stat) {
      const delay = retryAfterMs || this.cooldownDurationMs;
      stat.rateLimitedUntil = Date.now() + delay;
      console.warn(
        `[AIProviderRouter] Model ${model} rate limited until ${new Date(
          stat.rateLimitedUntil
        ).toLocaleTimeString()}`
      );
    }
  }

  public getAverageLatency(model: string): number {
    const stat = this.stats.get(model);
    if (!stat || stat.latencies.length === 0) return 0;
    const sum = stat.latencies.reduce((a, b) => a + b, 0);
    return sum / stat.latencies.length;
  }
}
