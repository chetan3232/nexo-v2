import { create } from 'zustand';
import { ModelId } from '../types';

interface AgentState {
  selectedModel: ModelId;
  techStack: 'react' | 'web' | 'node' | 'python';
  setSelectedModel: (model: ModelId) => void;
  setTechStack: (stack: 'react' | 'web' | 'node' | 'python') => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  selectedModel: 'nvidia/nemotron-3-super-120b-a12b:free',
  techStack: 'react',
  setSelectedModel: (model) => set({ selectedModel: model }),
  setTechStack: (stack) => set({ techStack: stack }),
}));
