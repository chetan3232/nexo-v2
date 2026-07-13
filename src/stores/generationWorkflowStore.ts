import { create } from "zustand";
import { useProjectStore } from "./projectStore";
import { useChatStore } from "./chatStore";
import { CompanionState } from "../types";

export type GenerationPhase =
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

export interface GenerationWorkflowState {
  currentPhase: GenerationPhase;
  userPrompt: string;
  normalizedPrompt: string;
  projectMode: "frontend" | "fullstack";
  analysisResult: any;
  designConcepts: any[];
  selectedDesignId: string | null;
  selectedDesign: any | null;
  designFeedback: string;
  implementationPlan: any | null;
  editedImplementationPlan: any | null;
  generatedFiles: Record<string, string>;
  validationResults: any;
  repairAttempts: number;
  error: string | null;
}

export interface GenerationWorkflowActions {
  transitionTo: (nextPhase: GenerationPhase) => void;
  startAnalysis: (prompt: string, mode: "frontend" | "fullstack") => void;
  setAnalysisResult: (result: any) => void;
  setNormalizedPrompt: (normalized: string) => void;
  startThinking: () => void;
  startGeneratingDesigns: () => void;
  setDesignConcepts: (concepts: any[]) => void;
  selectDesign: (designId: string) => void;
  submitDesignFeedback: (feedback: string) => void;
  startGeneratingPlan: () => void;
  setImplementationPlan: (plan: any) => void;
  approvePlan: (editedPlan?: any) => void;
  startImplementation: () => void;
  updateGeneratedFiles: (files: Record<string, string>) => void;
  startValidation: () => void;
  setValidationResults: (results: any) => void;
  triggerRepair: (attempt: number) => void;
  runApplication: () => void;
  completeGeneration: () => void;
  setError: (err: string) => void;
  resetWorkflow: () => void;
}

export type GenerationWorkflowStore = GenerationWorkflowState & GenerationWorkflowActions;

const VALID_TRANSITIONS: Record<GenerationPhase, GenerationPhase[]> = {
  IDLE: ["ANALYZING"],
  ANALYZING: ["THINKING", "ERROR", "IDLE"],
  THINKING: ["GENERATING_DESIGNS", "ERROR", "IDLE"],
  GENERATING_DESIGNS: ["AWAITING_DESIGN_SELECTION", "ERROR", "IDLE"],
  AWAITING_DESIGN_SELECTION: ["DESIGN_SELECTED", "GENERATING_DESIGNS", "ERROR", "IDLE"],
  DESIGN_SELECTED: ["GENERATING_IMPLEMENTATION_PLAN", "ERROR", "IDLE"],
  GENERATING_IMPLEMENTATION_PLAN: ["AWAITING_PLAN_APPROVAL", "ERROR", "IDLE"],
  AWAITING_PLAN_APPROVAL: ["IMPLEMENTING", "GENERATING_IMPLEMENTATION_PLAN", "ERROR", "IDLE"],
  IMPLEMENTING: ["VALIDATING", "ERROR", "IDLE"],
  VALIDATING: ["RUNNING", "REPAIRING", "ERROR", "IDLE"],
  REPAIRING: ["VALIDATING", "ERROR", "IDLE"],
  RUNNING: ["COMPLETED", "ERROR", "IDLE"],
  COMPLETED: ["IDLE"],
  ERROR: ["IDLE"],
};

function mapGenerationPhaseToBuildPhase(phase: GenerationPhase): "idle" | "analyzing" | "planning" | "designing" | "generating" | "building" | "testing" | "fixing" | "previewing" | "deploying" | "completed" {
  switch (phase) {
    case "IDLE":
      return "idle";
    case "ANALYZING":
      return "analyzing";
    case "THINKING":
      return "planning";
    case "GENERATING_DESIGNS":
    case "AWAITING_DESIGN_SELECTION":
      return "designing";
    case "DESIGN_SELECTED":
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
      return "building";
    case "COMPLETED":
      return "completed";
    case "ERROR":
    default:
      return "idle";
  }
}

function mapGenerationPhaseToCompanionState(phase: GenerationPhase): CompanionState {
  switch (phase) {
    case "IDLE":
    case "AWAITING_DESIGN_SELECTION":
    case "AWAITING_PLAN_APPROVAL":
    case "COMPLETED":
    case "ERROR":
      return CompanionState.IDLE;
    case "ANALYZING":
    case "THINKING":
    case "DESIGN_SELECTED":
    case "GENERATING_DESIGNS":
    case "GENERATING_IMPLEMENTATION_PLAN":
      return CompanionState.THINKING;
    case "IMPLEMENTING":
      return CompanionState.CODING;
    case "VALIDATING":
    case "REPAIRING":
    case "RUNNING":
      return CompanionState.BUILDING;
    default:
      return CompanionState.IDLE;
  }
}

const initialState: GenerationWorkflowState = {
  currentPhase: "IDLE",
  userPrompt: "",
  normalizedPrompt: "",
  projectMode: "frontend",
  analysisResult: null,
  designConcepts: [],
  selectedDesignId: null,
  selectedDesign: null,
  designFeedback: "",
  implementationPlan: null,
  editedImplementationPlan: null,
  generatedFiles: {},
  validationResults: null,
  repairAttempts: 0,
  error: null,
};

export const useGenerationWorkflowStore = create<GenerationWorkflowStore>((set, get) => ({
  ...initialState,

  transitionTo: (nextPhase: GenerationPhase) => {
    const current = get().currentPhase;
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed.includes(nextPhase)) {
      throw new Error(`Invalid workflow transition from ${current} to ${nextPhase}`);
    }

    set({ currentPhase: nextPhase });

    // Sync with projectStore
    const oldBuildPhase = mapGenerationPhaseToBuildPhase(nextPhase);
    useProjectStore.getState().setBuildPhase(oldBuildPhase);

    // Sync with chatStore
    const oldCompanionState = mapGenerationPhaseToCompanionState(nextPhase);
    useChatStore.getState().setState(oldCompanionState);
  },

  startAnalysis: (prompt: string, mode: "frontend" | "fullstack") => {
    // Force transition to ANALYZING from IDLE (or start a new one directly)
    if (get().currentPhase !== "IDLE") {
      set({ currentPhase: "IDLE" });
    }
    get().transitionTo("ANALYZING");
    set({
      userPrompt: prompt,
      projectMode: mode,
      error: null,
      normalizedPrompt: "",
      analysisResult: null,
      designConcepts: [],
      selectedDesignId: null,
      selectedDesign: null,
      designFeedback: "",
      implementationPlan: null,
      editedImplementationPlan: null,
      generatedFiles: {},
      validationResults: null,
      repairAttempts: 0,
    });
  },

  setAnalysisResult: (result: any) => {
    set({ analysisResult: result });
  },

  setNormalizedPrompt: (normalized: string) => {
    set({ normalizedPrompt: normalized });
  },

  startThinking: () => {
    get().transitionTo("THINKING");
  },

  startGeneratingDesigns: () => {
    get().transitionTo("GENERATING_DESIGNS");
  },

  setDesignConcepts: (concepts: any[]) => {
    set({ designConcepts: concepts });
  },

  selectDesign: (designId: string) => {
    const concept = get().designConcepts.find((c) => c.id === designId) || null;
    set({ selectedDesignId: designId, selectedDesign: concept });
    get().transitionTo("DESIGN_SELECTED");
  },

  submitDesignFeedback: (feedback: string) => {
    set({ designFeedback: feedback });
    get().transitionTo("GENERATING_DESIGNS"); // Return to generating designs with feedback
  },

  startGeneratingPlan: () => {
    get().transitionTo("GENERATING_IMPLEMENTATION_PLAN");
  },

  setImplementationPlan: (plan: any) => {
    set({ implementationPlan: plan, editedImplementationPlan: plan });
    get().transitionTo("AWAITING_PLAN_APPROVAL");
  },

  approvePlan: (editedPlan?: any) => {
    if (editedPlan !== undefined) {
      set({ editedImplementationPlan: editedPlan });
    }
    get().transitionTo("IMPLEMENTING");
  },

  startImplementation: () => {
    get().transitionTo("IMPLEMENTING");
  },

  updateGeneratedFiles: (files: Record<string, string>) => {
    set((state) => ({
      generatedFiles: { ...state.generatedFiles, ...files },
    }));
  },

  startValidation: () => {
    get().transitionTo("VALIDATING");
  },

  setValidationResults: (results: any) => {
    set({ validationResults: results });
  },

  triggerRepair: (attempt: number) => {
    set({ repairAttempts: attempt });
    get().transitionTo("REPAIRING");
  },

  runApplication: () => {
    get().transitionTo("RUNNING");
  },

  completeGeneration: () => {
    get().transitionTo("COMPLETED");
  },

  setError: (err: string) => {
    set({ error: err });
    get().transitionTo("ERROR");
  },

  resetWorkflow: () => {
    set(initialState);
    
    // Sync with projectStore
    useProjectStore.getState().setBuildPhase("idle");

    // Sync with chatStore
    useChatStore.getState().setState(CompanionState.IDLE);
  },
}));
