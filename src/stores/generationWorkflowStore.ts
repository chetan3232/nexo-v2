import { create } from "zustand";
import { DesignConcept } from "../types/designConcept";
import { useProjectStore } from "./projectStore";

export type WorkflowPhase =
  | "IDLE"
  | "ANALYZING"
  | "THINKING"
  | "GENERATING_DESIGNS"
  | "AWAITING_DESIGN_SELECTION"
  | "DESIGN_SELECTED"
  | "GENERATING_IMPLEMENTATION_PLAN"
  | "AWAITING_PLAN_APPROVAL"
  | "IMPLEMENTING"
  | "VALIDATING"
  | "REPAIRING"
  | "RUNNING"
  | "COMPLETED"
  | "ERROR";

export interface AnalysisResult {
  projectGoal: string;
  targetAudience: string;
  projectType: string;
  requiredPages: string[];
  requiredFeatures: string[];
  designDirection: string;
  technicalRequirements: string[];
  complexity: "low" | "medium" | "high";
  modeConflicts: string[];
  normalizedRequest: string;
  [key: string]: any;
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
  logs?: string;
  [key: string]: any;
}

export interface GenerationWorkflowState {
  currentPhase: WorkflowPhase;
  userPrompt: string;
  normalizedPrompt: string;
  projectMode: "frontend" | "fullstack";
  analysisResult: AnalysisResult | null;
  designConcepts: DesignConcept[];
  selectedDesignId: string | null;
  selectedDesign: DesignConcept | null;
  designFeedback: string;
  designHistory: Record<string, DesignConcept[]>;
  implementationPlan: string;
  editedImplementationPlan: string;
  generatedFiles: Record<string, string>;
  validationResults: ValidationResult | null;
  repairAttempts: number;
  error: string | null;

  // Actions
  transitionTo: (phase: WorkflowPhase) => boolean;
  setUserPrompt: (prompt: string) => void;
  setNormalizedPrompt: (prompt: string) => void;
  setProjectMode: (mode: "frontend" | "fullstack") => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setDesignConcepts: (concepts: DesignConcept[]) => void;
  setSelectedDesignId: (id: string | null) => void;
  selectDesign: (id: string | null) => void;
  setDesignFeedback: (feedback: string) => void;
  addDesignVersion: (conceptId: string, refinedConcept: DesignConcept) => void;
  restoreDesignVersion: (conceptId: string, versionIndex: number) => void;
  setImplementationPlan: (plan: string) => void;
  setEditedImplementationPlan: (plan: string) => void;
  setGeneratedFiles: (files: Record<string, string>) => void;
  setValidationResults: (results: ValidationResult | null) => void;
  setRepairAttempts: (attempts: number | ((prev: number) => number)) => void;
  setError: (error: string | null) => void;
  resetWorkflow: () => void;
}

const VALID_TRANSITIONS: Record<WorkflowPhase, WorkflowPhase[]> = {
  IDLE: ["ANALYZING"],
  ANALYZING: ["THINKING", "ERROR"],
  THINKING: ["GENERATING_DESIGNS", "GENERATING_IMPLEMENTATION_PLAN", "ERROR"],
  GENERATING_DESIGNS: ["AWAITING_DESIGN_SELECTION", "ERROR"],
  AWAITING_DESIGN_SELECTION: ["DESIGN_SELECTED", "THINKING", "GENERATING_DESIGNS", "ERROR"],
  DESIGN_SELECTED: ["GENERATING_IMPLEMENTATION_PLAN", "ERROR"],
  GENERATING_IMPLEMENTATION_PLAN: ["AWAITING_PLAN_APPROVAL", "ERROR"],
  AWAITING_PLAN_APPROVAL: ["IMPLEMENTING", "GENERATING_IMPLEMENTATION_PLAN", "THINKING", "ERROR"],
  IMPLEMENTING: ["VALIDATING", "ERROR"],
  VALIDATING: ["REPAIRING", "RUNNING", "COMPLETED", "ERROR"],
  REPAIRING: ["VALIDATING", "ERROR"],
  RUNNING: ["COMPLETED", "ERROR"],
  COMPLETED: ["IDLE", "ANALYZING"],
  ERROR: ["IDLE", "ANALYZING", "REPAIRING"]
};

const mapWorkflowToProjectPhase = (
  phase: WorkflowPhase
): "idle" | "analyzing" | "planning" | "designing" | "generating" | "building" | "testing" | "fixing" | "previewing" | "deploying" | "completed" => {
  switch (phase) {
    case "IDLE":
      return "idle";
    case "ANALYZING":
      return "analyzing";
    case "THINKING":
      return "planning";
    case "GENERATING_DESIGNS":
    case "AWAITING_DESIGN_SELECTION":
    case "DESIGN_SELECTED":
      return "designing";
    case "GENERATING_IMPLEMENTATION_PLAN":
    case "AWAITING_PLAN_APPROVAL":
      return "planning";
    case "IMPLEMENTING":
      return "generating";
    case "VALIDATING":
      return "testing";
    case "REPAIRING":
      return "fixing";
    case "RUNNING":
      return "previewing";
    case "COMPLETED":
      return "completed";
    case "ERROR":
    default:
      return "idle";
  }
};

export const useGenerationWorkflowStore = create<GenerationWorkflowState>((set, get) => ({
  currentPhase: "IDLE",
  userPrompt: "",
  normalizedPrompt: "",
  projectMode: "frontend",
  analysisResult: null,
  designConcepts: [],
  selectedDesignId: null,
  selectedDesign: null,
  designFeedback: "",
  designHistory: {},
  implementationPlan: "",
  editedImplementationPlan: "",
  generatedFiles: {},
  validationResults: null,
  repairAttempts: 0,
  error: null,

  transitionTo: (nextPhase: WorkflowPhase) => {
    const { currentPhase } = get();
    
    // Explicit transition to ERROR is always allowed
    if (nextPhase === "ERROR") {
      set({ currentPhase: nextPhase });
      useProjectStore.getState().setBuildPhase(mapWorkflowToProjectPhase(nextPhase));
      return true;
    }

    const allowed = VALID_TRANSITIONS[currentPhase];
    if (allowed && allowed.includes(nextPhase)) {
      set({ currentPhase: nextPhase });
      useProjectStore.getState().setBuildPhase(mapWorkflowToProjectPhase(nextPhase));
      return true;
    }

    console.warn(
      `[Workflow State Machine] Invalid phase transition attempted from "${currentPhase}" to "${nextPhase}"`
    );
    return false;
  },

  setUserPrompt: (userPrompt: string) => set({ userPrompt }),
  setNormalizedPrompt: (normalizedPrompt: string) => set({ normalizedPrompt }),
  setProjectMode: (projectMode: "frontend" | "fullstack") => set({ projectMode }),
  setAnalysisResult: (analysisResult: AnalysisResult | null) => set({ analysisResult }),
  setDesignConcepts: (designConcepts: DesignConcept[]) => {
    const designHistory: Record<string, DesignConcept[]> = {};
    designConcepts.forEach((d) => {
      designHistory[d.id] = [d];
    });
    set({ designConcepts, designHistory });
  },
  setSelectedDesignId: (selectedDesignId: string | null) => {
    const { designConcepts } = get();
    const selectedDesign = designConcepts.find((d) => d.id === selectedDesignId) || null;
    set({ selectedDesignId, selectedDesign });
  },
  selectDesign: (id: string | null) => {
    const { designConcepts } = get();
    const selectedDesign = designConcepts.find((d) => d.id === id) || null;
    set({ selectedDesignId: id, selectedDesign });
    get().transitionTo("DESIGN_SELECTED");
  },
  setDesignFeedback: (designFeedback: string) => set({ designFeedback }),
  addDesignVersion: (conceptId: string, refinedConcept: DesignConcept) => {
    const { designConcepts, designHistory } = get();
    const history = designHistory[conceptId] || [];
    const updatedHistory = [...history, refinedConcept];
    const updatedConcepts = designConcepts.map((d) =>
      d.id === conceptId ? refinedConcept : d
    );
    set({
      designConcepts: updatedConcepts,
      designHistory: {
        ...designHistory,
        [conceptId]: updatedHistory,
      },
    });
  },
  restoreDesignVersion: (conceptId: string, versionIndex: number) => {
    const { designConcepts, designHistory } = get();
    const history = designHistory[conceptId] || [];
    const restoredConcept = history[versionIndex];
    if (restoredConcept) {
      const updatedConcepts = designConcepts.map((d) =>
        d.id === conceptId ? restoredConcept : d
      );
      set({ designConcepts: updatedConcepts });
    }
  },
  setImplementationPlan: (implementationPlan: string) => set({ implementationPlan }),
  setEditedImplementationPlan: (editedImplementationPlan: string) => set({ editedImplementationPlan }),
  setGeneratedFiles: (generatedFiles: Record<string, string>) => set({ generatedFiles }),
  setValidationResults: (validationResults: ValidationResult | null) => set({ validationResults }),
  setRepairAttempts: (updater: number | ((prev: number) => number)) => {
    set((state) => ({
      repairAttempts: typeof updater === "function" ? updater(state.repairAttempts) : updater,
    }));
  },
  setError: (error: string | null) => set({ error }),
  resetWorkflow: () => {
    set({
      currentPhase: "IDLE",
      userPrompt: "",
      normalizedPrompt: "",
      projectMode: "frontend",
      analysisResult: null,
      designConcepts: [],
      selectedDesignId: null,
      selectedDesign: null,
      designFeedback: "",
      designHistory: {},
      implementationPlan: "",
      editedImplementationPlan: "",
      generatedFiles: {},
      validationResults: null,
      repairAttempts: 0,
      error: null,
    });
    useProjectStore.getState().setBuildPhase("idle");
  },
}));
