import { auth } from "./firebase";
import { AIProviderRouter } from "./aiProviderRouter";

export type RequestPriority = "CRITICAL" | "HIGH" | "NORMAL" | "LOW";

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  topP?: number;
  enableThinking?: boolean;
  priority?: RequestPriority;
  signal?: AbortSignal;
  timeoutMs?: number;
  onChunk?: (text: string) => void;
}

interface QueueItem {
  id: string;
  messages: any[];
  options: AIRequestOptions;
  resolve: (value: string) => void;
  reject: (err: any) => void;
  addedAt: number;
}

export class AIRequestManager {
  private static instance: AIRequestManager;

  // Configurations
  private maxConcurrency = 3;
  private defaultTimeoutMs = 60000;
  private maxRetries = 4;
  private baseDelayMs = 1000;
  private maxDelayMs = 15000;

  // State maps
  private queue: QueueItem[] = [];
  private activeCount = 0;
  private cache = new Map<string, { result: string; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes TTL
  private activePromises = new Map<string, Promise<string>>(); // Deduplication

  // Health and usage metrics
  private providerHealth = {
    totalRequests: 0,
    failedRequests: 0,
    lastFailureTime: 0,
  };
  private usage = {
    totalRequests: 0,
    totalTokensEstimated: 0,
  };

  public static getInstance(): AIRequestManager {
    if (!AIRequestManager.instance) {
      AIRequestManager.instance = new AIRequestManager();
    }
    return AIRequestManager.instance;
  }

  private constructor() {}

  public setConcurrency(limit: number) {
    this.maxConcurrency = limit;
    this.processQueue();
  }

  public getUsage() {
    return { ...this.usage, ...this.providerHealth };
  }

  private estimateTokens(messages: any[]): number {
    let charCount = 0;
    messages.forEach((m) => {
      charCount += (m.content || m.text || "").length;
    });
    return Math.ceil(charCount / 4);
  }

  private getRequestKey(messages: any[], options: AIRequestOptions): string {
    const serializedMsgs = JSON.stringify(
      messages.map((m) => ({
        role: m.role,
        content: m.content || m.text || "",
      }))
    );
    return `${options.model}_${options.temperature}_${options.topP}_${options.enableThinking}_${serializedMsgs}`;
  }

  public request(messages: any[], options: AIRequestOptions = {}): Promise<string> {
    const priority = options.priority || "NORMAL";
    const requestKey = this.getRequestKey(messages, options);

    // 1. Caching check for low-priority / normal requests
    if (priority === "NORMAL" || priority === "LOW") {
      const cached = this.cache.get(requestKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        console.log("[AIRequestManager] Cache hit for prompt.");
        return Promise.resolve(cached.result);
      }
    }

    // 2. Request deduplication check
    const activePromise = this.activePromises.get(requestKey);
    if (activePromise) {
      console.log("[AIRequestManager] Deduplicating request in progress.");
      return activePromise;
    }

    const promise = new Promise<string>((resolve, reject) => {
      const queueItem: QueueItem = {
        id: Math.random().toString(36).substring(7),
        messages,
        options,
        resolve,
        reject,
        addedAt: Date.now(),
      };

      this.queue.push(queueItem);
      this.sortQueue();
      this.processQueue();
    });

    this.activePromises.set(requestKey, promise);

    promise.then(
      (result) => {
        this.activePromises.delete(requestKey);
        if (priority === "NORMAL" || priority === "LOW") {
          this.cache.set(requestKey, { result, timestamp: Date.now() });
        }
      },
      () => {
        this.activePromises.delete(requestKey);
      }
    );

    return promise;
  }

  private sortQueue() {
    const priorityMap: Record<RequestPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    };

    this.queue.sort((a, b) => {
      const pA = priorityMap[a.options.priority || "NORMAL"];
      const pB = priorityMap[b.options.priority || "NORMAL"];
      if (pA !== pB) {
        return pB - pA;
      }
      return a.addedAt - b.addedAt;
    });
  }

  private async processQueue() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift()!;
    this.activeCount++;

    try {
      const result = await this.executeWithRetry(item);
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  private async executeWithRetry(item: QueueItem): Promise<string> {
    const { messages, options } = item;
    const router = AIProviderRouter.getInstance();

    // 1. Determine task type and pick primary model
    const taskType = router.determineTaskType(options.priority || "NORMAL", messages);
    let activeModel = options.model || router.getPrimaryModel(taskType);

    const temperature = options.temperature ?? 0.7;
    const topP = options.topP ?? 1;
    const enableThinking = options.enableThinking ?? true;
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    this.usage.totalRequests++;
    this.usage.totalTokensEstimated += this.estimateTokens(messages);

    let attempt = 0;
    while (attempt <= this.maxRetries) {
      if (options.signal?.aborted) {
        throw new Error("Request aborted by client.");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const abortListener = () => {
        controller.abort();
      };
      if (options.signal) {
        options.signal.addEventListener("abort", abortListener);
      }

      const startTime = Date.now();
      try {
        this.providerHealth.totalRequests++;
        console.log(
          `[AIRequestManager] Sending request to ${activeModel} (Priority: ${
            options.priority || "NORMAL"
          }, Attempt ${attempt + 1}/${this.maxRetries + 1})`
        );

        const API_URL = "/api/chat";
        const customApiKey = localStorage.getItem("nexo_custom_api_key") || "";

        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(auth.currentUser
              ? {
                  "x-user-id": auth.currentUser.uid,
                  "x-user-email": auth.currentUser.email || "",
                }
              : {}),
          },
          body: JSON.stringify({
            model: activeModel,
            messages: messages.map((m) => ({
              role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
              content: m.content || m.text || "",
            })),
            temperature,
            top_p: topP,
            stream: !!options.onChunk,
            enableThinking,
            customApiKey,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (options.signal) {
          options.signal.removeEventListener("abort", abortListener);
        }

        if (response.ok) {
          const latency = Date.now() - startTime;
          router.recordSuccess(activeModel, latency);

          if (options.onChunk) {
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response stream available");

            const decoder = new TextDecoder();
            let fullText = "";
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === "data: [DONE]") continue;
                if (!trimmed.startsWith("data: ")) continue;

                try {
                  const json = JSON.parse(trimmed.slice(6));
                  const delta = json.choices?.[0]?.delta;
                  const content = delta?.content || "";

                  if (content) {
                    fullText += content;
                    options.onChunk(fullText);
                  }
                } catch (e) {
                  // Ignore parsing error on incomplete lines
                }
              }
            }
            this.usage.totalTokensEstimated += Math.ceil(fullText.length / 4);
            return fullText;
          } else {
            const data = await response.json();
            const outputText = data.choices[0].message.content;
            this.usage.totalTokensEstimated += Math.ceil(outputText.length / 4);
            return outputText;
          }
        }

        // Handle HTTP 429 rate limit detection
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          let delay = this.calculateDelay(attempt);
          if (retryAfterHeader) {
            const parsedSeconds = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsedSeconds)) {
              delay = parsedSeconds * 1000;
            }
          }
          router.recordRateLimit(activeModel, delay);

          // Failover to fallback model if available
          const fallbackModel = router.getFallbackModel(activeModel);
          if (fallbackModel) {
            console.warn(`[AIRequestManager] Failing over from ${activeModel} to ${fallbackModel} due to Rate Limit (429)`);
            activeModel = fallbackModel;
          }

          console.warn(`[AIRequestManager] HTTP 429 Rate Limited. Retrying after ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          const errText = await response.text();
          throw new Error(`Nexo API Error: ${response.status} - ${errText}`);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (options.signal) {
          options.signal.removeEventListener("abort", abortListener);
        }

        router.recordFailure(activeModel);
        this.providerHealth.failedRequests++;
        this.providerHealth.lastFailureTime = Date.now();

        if (err.name === "AbortError") {
          if (options.signal?.aborted) {
            throw new Error("Request aborted by client.");
          }
          throw new Error(`Request timed out after ${timeoutMs}ms.`);
        }

        // Failover to fallback model if available
        const fallbackModel = router.getFallbackModel(activeModel);
        if (fallbackModel) {
          console.warn(`[AIRequestManager] Failing over from ${activeModel} to ${fallbackModel} due to failure`);
          activeModel = fallbackModel;
        }

        if (attempt === this.maxRetries) {
          throw err;
        }

        const delay = this.calculateDelay(attempt);
        console.warn(`[AIRequestManager] Request failed. Retrying in ${delay}ms...`, err);
        await new Promise((r) => setTimeout(r, delay));
      }
      attempt++;
    }

    throw new Error("Request failed after maximum retries.");
  }

  private calculateDelay(attempt: number): number {
    const exponentDelay = this.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 200; // random jitter up to 200ms
    const delay = Math.min(exponentDelay + jitter, this.maxDelayMs);
    return delay;
  }
}
