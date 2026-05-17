import { create } from "zustand";

export type PlanType = "free" | "pro" | "team" | "enterprise";

interface PlanDetails {
  name: string;
  generationsLimit: number;
  runtimeMinutesLimit: number;
  deploymentLimit: number;
  models: string[];
}

export const PLANS: Record<PlanType, PlanDetails> = {
  free: {
    name: "Free",
    generationsLimit: 5,
    runtimeMinutesLimit: 30,
    deploymentLimit: 1,
    models: ["gemini-1.5-flash"],
  },
  pro: {
    name: "Pro",
    generationsLimit: 50,
    runtimeMinutesLimit: 300,
    deploymentLimit: 10,
    models: ["gemini-1.5-pro", "gpt-4o", "claude-3.5-sonnet"],
  },
  team: {
    name: "Team",
    generationsLimit: 500,
    runtimeMinutesLimit: 3000,
    deploymentLimit: 100,
    models: ["all-models"],
  },
  enterprise: {
    name: "Enterprise",
    generationsLimit: Infinity,
    runtimeMinutesLimit: Infinity,
    deploymentLimit: Infinity,
    models: ["all-models", "private-models"],
  },
};

interface SubscriptionStore {
  currentPlan: PlanType;
  usage: {
    generations: number;
    runtimeMinutes: number;
    deployments: number;
    tokens: number;
  };
  setPlan: (plan: PlanType) => void;
  incrementUsage: (
    key: keyof SubscriptionStore["usage"],
    amount?: number,
  ) => void;
  checkLimit: (key: keyof SubscriptionStore["usage"]) => boolean;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  currentPlan: "free",
  usage: {
    generations: 0,
    runtimeMinutes: 0,
    deployments: 0,
    tokens: 0,
  },
  setPlan: (plan) => set({ currentPlan: plan }),
  incrementUsage: (key, amount = 1) =>
    set((state) => ({
      usage: { ...state.usage, [key]: state.usage[key] + amount },
    })),
  checkLimit: (key) => {
    const { currentPlan, usage } = get();
    const plan = PLANS[currentPlan];

    if (key === "generations" && usage.generations >= plan.generationsLimit)
      return false;
    if (
      key === "runtimeMinutes" &&
      usage.runtimeMinutes >= plan.runtimeMinutesLimit
    )
      return false;
    if (key === "deployments" && usage.deployments >= plan.deploymentLimit)
      return false;

    return true;
  },
}));
