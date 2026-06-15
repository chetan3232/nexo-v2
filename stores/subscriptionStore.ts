import { create } from 'zustand';

interface UsageMeter {
  aiCalls: number;
  maxCalls: number;
  tokenCount: number;
}

interface SubscriptionState {
  currentPlan: 'free' | 'pro' | 'enterprise';
  usageMeter: UsageMeter;
  setPlan: (plan: 'free' | 'pro' | 'enterprise') => void;
  incrementUsage: (callsCount: number, tokensCount: number) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  currentPlan: 'free',
  usageMeter: {
    aiCalls: 4,
    maxCalls: 20,
    tokenCount: 8400,
  },
  setPlan: (currentPlan) => set({ currentPlan }),
  incrementUsage: (callsCount, tokensCount) =>
    set((state) => ({
      usageMeter: {
        aiCalls: state.usageMeter.aiCalls + callsCount,
        maxCalls: state.usageMeter.maxCalls,
        tokenCount: state.usageMeter.tokenCount + tokensCount,
      },
    })),
}));

export default useSubscriptionStore;
