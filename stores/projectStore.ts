import { create } from 'zustand';
import { DesignTokens, AppConcept, BuildTask, QualityScores } from '../types';

interface ProjectState {
  files: Record<string, string>;
  selectedFileName: string | null;
  buildPhase: number; // 1 to 12 representing the cinematic generation stages
  designTokens: DesignTokens;
  activeConcept: AppConcept | null;
  concepts: AppConcept[];
  blueprintTasks: BuildTask[];
  qualityScores: QualityScores;
  
  // Actions
  setFiles: (files: Record<string, string>) => void;
  updateFile: (filename: string, content: string) => void;
  deleteFile: (filename: string) => void;
  setSelectedFileName: (name: string | null) => void;
  setBuildPhase: (phase: number) => void;
  setDesignTokens: (tokens: Partial<DesignTokens>) => void;
  setActiveConcept: (concept: AppConcept | null) => void;
  setConcepts: (concepts: AppConcept[]) => void;
  setBlueprintTasks: (tasks: BuildTask[]) => void;
  updateBlueprintTaskStatus: (taskId: string, status: BuildTask['status']) => void;
  setQualityScores: (scores: QualityScores) => void;
  resetProject: () => void;
}

const defaultDesignTokens: DesignTokens = {
  themeMode: 'dark',
  primaryColor: '#6366f1', // Indigo
  accentColor: '#f97316',  // Orange
  borderRadius: 'lg',
  fontFamily: 'Inter',
};

const defaultQualityScores: QualityScores = {
  performance: 92,
  accessibility: 88,
  seo: 95,
  security: 90,
};

export const useProjectStore = create<ProjectState>((set) => ({
  files: {},
  selectedFileName: null,
  buildPhase: 0, // 0 = not started
  designTokens: defaultDesignTokens,
  activeConcept: null,
  concepts: [],
  blueprintTasks: [],
  qualityScores: defaultQualityScores,

  setFiles: (files) => set({ files }),
  updateFile: (filename, content) => set((state) => ({
    files: { ...state.files, [filename]: content }
  })),
  deleteFile: (filename) => set((state) => {
    const updated = { ...state.files };
    delete updated[filename];
    return {
      files: updated,
      selectedFileName: state.selectedFileName === filename ? Object.keys(updated)[0] || null : state.selectedFileName
    };
  }),
  setSelectedFileName: (name) => set({ selectedFileName: name }),
  setBuildPhase: (phase) => set({ buildPhase: phase }),
  setDesignTokens: (tokens) => set((state) => ({
    designTokens: { ...state.designTokens, ...tokens }
  })),
  setActiveConcept: (concept) => set({ activeConcept: concept }),
  setConcepts: (concepts) => set({ concepts }),
  setBlueprintTasks: (tasks) => set({ blueprintTasks: tasks }),
  updateBlueprintTaskStatus: (taskId, status) => set((state) => ({
    blueprintTasks: state.blueprintTasks.map((t) =>
      t.id === taskId ? { ...t, status } : t
    ),
  })),
  setQualityScores: (qualityScores) => set({ qualityScores }),
  resetProject: () => set({
    files: {},
    selectedFileName: null,
    buildPhase: 0,
    designTokens: defaultDesignTokens,
    activeConcept: null,
    concepts: [],
    blueprintTasks: [],
    qualityScores: defaultQualityScores,
  }),
}));
