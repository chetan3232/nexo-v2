import { create } from 'zustand';

interface RuntimeState {
  isBooted: boolean;
  logs: string[];
  runningCommand: string | null;
  devServerPort: number | null;
  addLog: (log: string) => void;
  clearLogs: () => void;
  setIsBooted: (isBooted: boolean) => void;
  setRunningCommand: (cmd: string | null) => void;
  setDevServerPort: (port: number | null) => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  isBooted: false,
  logs: [],
  runningCommand: null,
  devServerPort: null,
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setIsBooted: (isBooted) => set({ isBooted }),
  setRunningCommand: (cmd) => set({ runningCommand: cmd }),
  setDevServerPort: (port) => set({ devServerPort: port }),
}));
