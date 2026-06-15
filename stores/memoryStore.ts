import { create } from 'zustand';

interface MemoryState {
  preferences: Record<string, any>;
  decisions: string[];
  roadmap: string[];
  addDecision: (decision: string) => void;
  setRoadmap: (roadmap: string[]) => void;
  setPreferences: (pref: Record<string, any>) => void;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  preferences: {
    githubToken: localStorage.getItem('github_token') || '',
    repoUrl: localStorage.getItem('github_repo_url') || '',
    branchName: localStorage.getItem('github_branch') || 'main',
  },
  decisions: [
    'Initialized project with React 19 + TypeScript + Tailwind CSS.',
    'Chose modular routing configuration using client HashRouter.',
  ],
  roadmap: [
    'Phase 1: Foundation Layout setup',
    'Phase 2: Add primary component views',
    'Phase 3: Connect mock backend endpoints',
    'Phase 4: Run automated validation checks',
  ],
  addDecision: (decision) => set((state) => ({ decisions: [...state.decisions, decision] })),
  setRoadmap: (roadmap) => set({ roadmap }),
  setPreferences: (preferences) => set((state) => {
    // Sync to local storage
    if (preferences.githubToken !== undefined) localStorage.setItem('github_token', preferences.githubToken);
    if (preferences.repoUrl !== undefined) localStorage.setItem('github_repo_url', preferences.repoUrl);
    if (preferences.branchName !== undefined) localStorage.setItem('github_branch', preferences.branchName);
    return { preferences: { ...state.preferences, ...preferences } };
  }),
}));
