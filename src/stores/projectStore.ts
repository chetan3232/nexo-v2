import { create } from "zustand";
import { WebsiteContent, FileProgress } from "../types";

interface ProjectStore {
  currentContent: WebsiteContent | null;
  setCurrentContent: (
    content:
      | WebsiteContent
      | null
      | ((prev: WebsiteContent | null) => WebsiteContent | null),
  ) => void;
  selectedFileName: string | null;
  setSelectedFileName: (name: string | null) => void;
  buildPhase: "idle" | "analyzing" | "planning" | "designing" | "generating" | "building" | "testing" | "fixing" | "previewing" | "deploying" | "completed";
  setBuildPhase: (phase: "idle" | "analyzing" | "planning" | "designing" | "generating" | "building" | "testing" | "fixing" | "previewing" | "deploying" | "completed") => void;
  buildingFiles: Record<string, FileProgress>;
  setBuildingFiles: (
    files:
      | Record<string, FileProgress>
      | ((prev: Record<string, FileProgress>) => Record<string, FileProgress>),
  ) => void;
  deployStatus: "idle" | "deploying" | "done" | "error";
  setDeployStatus: (status: "idle" | "deploying" | "done" | "error") => void;
  deployUrl: string;
  setDeployUrl: (url: string) => void;
  showDeployModal: boolean;
  setShowDeployModal: (show: boolean) => void;
  previewKey: number;
  incrementPreviewKey: () => void;
  tasks: BuildTask[];
  subStatus: string;
  setSubStatus: (status: string) => void;
  setTasks: (tasks: BuildTask[]) => void;
  depNodes: any[];
  analysisInsights: string | null;
  setDepNodes: (nodes: any[]) => void;
  setAnalysisInsights: (insights: string | null) => void;
  healthScore: number | null;
  healthMetrics: any[];
  snapshots: any[];
  reasoningSteps: string[];
  productionChecks: any[];
  setSnapshots: (snapshots: any[]) => void;
  setReasoningSteps: (steps: string[]) => void;
  addReasoningStep: (step: string) => void;
  setProductionChecks: (checks: any[]) => void;
  setHealthData: (score: number, metrics: any[]) => void;
  updateTask: (id: string, updates: Partial<BuildTask>) => void;
  pendingPrompt: string | null;
  setPendingPrompt: (prompt: string | null) => void;
  resetProject: () => void;
}

export interface BuildTask {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  progress?: number;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  currentContent: null,
  setCurrentContent: (updater) =>
    set((state) => ({
      currentContent:
        typeof updater === "function" ? updater(state.currentContent) : updater,
    })),
  selectedFileName: null,
  setSelectedFileName: (selectedFileName) => set({ selectedFileName }),
  buildPhase: "idle",
  setBuildPhase: (buildPhase) => set({ buildPhase }),
  buildingFiles: {},
  setBuildingFiles: (updater) =>
    set((state) => ({
      buildingFiles:
        typeof updater === "function" ? updater(state.buildingFiles) : updater,
    })),
  deployStatus: "idle",
  setDeployStatus: (deployStatus) => set({ deployStatus }),
  deployUrl: "",
  setDeployUrl: (deployUrl) => set({ deployUrl }),
  showDeployModal: false,
  setShowDeployModal: (showDeployModal) => set({ showDeployModal }),
  previewKey: 0,
  incrementPreviewKey: () =>
    set((state) => ({ previewKey: state.previewKey + 1 })),
  tasks: [],
  subStatus: "",
  depNodes: [],
  analysisInsights: null,
  healthScore: null,
  healthMetrics: [],
  snapshots: [],
  reasoningSteps: [],
  productionChecks: [],
  setSubStatus: (subStatus) => set({ subStatus }),
  setTasks: (tasks) => set({ tasks }),
  setDepNodes: (depNodes) => set({ depNodes }),
  setSnapshots: (snapshots) => set({ snapshots }),
  setReasoningSteps: (reasoningSteps) => set({ reasoningSteps }),
  addReasoningStep: (step) =>
    set((state) => ({ reasoningSteps: [...state.reasoningSteps, step] })),
  setProductionChecks: (productionChecks) => set({ productionChecks }),
  setAnalysisInsights: (analysisInsights) => set({ analysisInsights }),
  setHealthData: (healthScore, healthMetrics) =>
    set({ healthScore, healthMetrics }),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  pendingPrompt: null,
  setPendingPrompt: (pendingPrompt) => set({ pendingPrompt }),
  resetProject: () =>
    set({
      currentContent: null,
      selectedFileName: "",
      buildPhase: "idle",
      buildingFiles: {},
      previewKey: 0,
      tasks: [],
      subStatus: "",
      depNodes: [],
      analysisInsights: null,
      healthScore: null,
      healthMetrics: [],
      snapshots: [],
      reasoningSteps: [],
      productionChecks: [],
      pendingPrompt: null,
    }),
}));
