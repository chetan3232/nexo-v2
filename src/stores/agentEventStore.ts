import { create } from "zustand";
import { AgentEvent } from "../types/agentEvents";

interface AgentEventStore {
  /** Full ordered timeline of events for the current session */
  events: AgentEvent[];

  /** Live per-file write accumulator: path → accumulated content so far */
  fileBuffers: Record<string, string>;

  /** Set of file paths currently being written (for sidebar indicators) */
  activeFiles: Set<string>;

  /** Ordered list of file paths created in this session */
  createdFiles: string[];

  /** Add a new event to the timeline */
  emit: (event: AgentEvent) => void;

  /** Reset all events (called at start of each generation) */
  clearEvents: () => void;

  /** Whether a generation is in progress */
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

export const useAgentEventStore = create<AgentEventStore>((set, get) => ({
  events: [],
  fileBuffers: {},
  activeFiles: new Set(),
  createdFiles: [],
  isGenerating: false,

  emit: (event: AgentEvent) => {
    set((state) => {
      const newEvents = [...state.events, event];
      let newFileBuffers = { ...state.fileBuffers };
      let newActiveFiles = new Set(state.activeFiles);
      let newCreatedFiles = [...state.createdFiles];

      // Track file lifecycle
      if (event.type === "file_create") {
        newActiveFiles.add(event.path);
        newFileBuffers[event.path] = "";
        if (!newCreatedFiles.includes(event.path)) {
          newCreatedFiles.push(event.path);
        }
      }

      if (event.type === "file_write") {
        newFileBuffers[event.path] = event.chunk;
      }

      if (event.type === "file_done") {
        newActiveFiles.delete(event.path);
      }

      return {
        events: newEvents,
        fileBuffers: newFileBuffers,
        activeFiles: newActiveFiles,
        createdFiles: newCreatedFiles,
      };
    });
  },

  clearEvents: () => {
    set({
      events: [],
      fileBuffers: {},
      activeFiles: new Set(),
      createdFiles: [],
      isGenerating: false,
    });
  },

  setIsGenerating: (v) => set({ isGenerating: v }),
}));
