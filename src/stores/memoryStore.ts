import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BrainService } from "../services/brainService";
import { PluginService } from "../services/pluginService";
import { BlockService } from "../services/blockService";

interface UserPreference {
  designStyle: "minimal" | "glassmorphism" | "brutalism" | "corporate";
  techStack: string;
  darkMode: boolean;
}

interface BuildHistory {
  id: string;
  prompt: string;
  timestamp: number;
  success: boolean;
  errorsFixed: number;
}

interface MemoryStore {
  preferences: UserPreference;
  history: BuildHistory[];
  setPreference: (pref: Partial<UserPreference>) => void;
  addHistory: (item: BuildHistory) => void;
  getMemoryContext: () => string;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      preferences: {
        designStyle: "minimal",
        techStack: "React + Vite + Tailwind",
        darkMode: true,
      },
      history: [],
      setPreference: (pref) =>
        set((state) => ({
          preferences: { ...state.preferences, ...pref },
        })),
      addHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history].slice(0, 10),
        })),
      getMemoryContext: () => {
        const { preferences, history } = get();
        const historySummary = history
          .map((h) => `- ${h.prompt} (${h.success ? "Success" : "Failed"})`)
          .join("\n");
        const brainContext = BrainService.getInstance().getBrainContext();
        const pluginContext = PluginService.getInstance().getPluginContext();
        const blockContext = BlockService.getInstance().getBlockContext();

        return `${brainContext}\n\n${pluginContext}\n\n${blockContext}\n\nUSER PREFERENCES:
- Design Style: ${preferences.designStyle}
- Preferred Stack: ${preferences.techStack}
- Dark Mode: ${preferences.darkMode}
- Rounded Corners: xl (Auto-learned)

PAST BUILD HISTORY:
${historySummary || "No previous builds."}`;
      },
    }),
    { name: "nexo-ai-memory" },
  ),
);
