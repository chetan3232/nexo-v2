import { create } from "zustand";

interface RuntimeStore {
  isBooted: boolean;
  setIsBooted: (val: boolean) => void;
  url: string | null;
  setUrl: (url: string | null) => void;
  terminalLogs: string[];
  addLog: (log: string) => void;
  consoleLogs: string[];
  addConsoleLog: (log: string) => void;
  networkLogs: string[];
  addNetworkLog: (log: string) => void;
  aiReasoning: string[];
  addReasoning: (log: string) => void;
  clearLogs: () => void;
}

export const useRuntimeStore = create<RuntimeStore>((set) => ({
  isBooted: false,
  setIsBooted: (isBooted) => set({ isBooted }),
  url: null,
  setUrl: (url) => set({ url }),
  terminalLogs: [],
  addLog: (log) =>
    set((state) => ({
      terminalLogs: [...state.terminalLogs, log].slice(-100),
    })),
  consoleLogs: [],
  addConsoleLog: (log) =>
    set((state) => ({ consoleLogs: [...state.consoleLogs, log].slice(-50) })),
  networkLogs: [],
  addNetworkLog: (log) =>
    set((state) => ({ networkLogs: [...state.networkLogs, log].slice(-50) })),
  aiReasoning: [],
  addReasoning: (log) =>
    set((state) => ({ aiReasoning: [...state.aiReasoning, log].slice(-50) })),
  clearLogs: () =>
    set({
      terminalLogs: [],
      consoleLogs: [],
      networkLogs: [],
      aiReasoning: [],
    }),
}));
