import { useSubscriptionStore } from "../stores/subscriptionStore";
import toast from "react-hot-toast";

export class UsageManager {
  private static instance: UsageManager;
  private runtimeStart: number | null = null;

  public static getInstance() {
    if (!UsageManager.instance) {
      UsageManager.instance = new UsageManager();
    }
    return UsageManager.instance;
  }

  startRuntimeTracking() {
    this.runtimeStart = Date.now();
  }

  stopRuntimeTracking() {
    if (!this.runtimeStart) return;
    const minutes = Math.ceil((Date.now() - this.runtimeStart) / 60000);
    useSubscriptionStore.getState().incrementUsage("runtimeMinutes", minutes);
    this.runtimeStart = null;
  }

  trackGeneration(tokenCount: number = 0) {
    const sub = useSubscriptionStore.getState();
    if (!sub.checkLimit("generations")) {
      toast.error("Generation limit reached for your plan. Upgrade for more!");
      throw new Error("Limit reached");
    }
    sub.incrementUsage("generations");
    sub.incrementUsage("tokens", tokenCount);
  }

  trackDeployment() {
    const sub = useSubscriptionStore.getState();
    if (!sub.checkLimit("deployments")) {
      toast.error("Deployment limit reached. Upgrade to Pro!");
      throw new Error("Limit reached");
    }
    sub.incrementUsage("deployments");
  }
}
