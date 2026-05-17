import { create } from "zustand";

interface AgentStore {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  projectMode: "frontend" | "fullstack";
  setProjectMode: (mode: "frontend" | "fullstack") => void;
  techStack: string;
  setTechStack: (stack: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  topP: number;
  setTopP: (topP: number) => void;
  activeTab: "chat" | "preview" | "code";
  setActiveTab: (tab: "chat" | "preview" | "code") => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  selectedModel:
    localStorage.getItem("nexo_model") || "google/gemini-2.5-flash",
  setSelectedModel: (selectedModel) => {
    localStorage.setItem("nexo_model", selectedModel);
    set({ selectedModel });
  },
  projectMode:
    (localStorage.getItem("nexo_project_mode") as "frontend" | "fullstack") ||
    "frontend",
  setProjectMode: (projectMode) => {
    localStorage.setItem("nexo_project_mode", projectMode);
    set({ projectMode });
  },
  techStack: localStorage.getItem("nexo_tech_stack") || "Vanilla",
  setTechStack: (techStack) => {
    localStorage.setItem("nexo_tech_stack", techStack);
    set({ techStack });
  },
  selectedLanguage: localStorage.getItem("nexo_language") || "HTML",
  setSelectedLanguage: (selectedLanguage) => {
    localStorage.setItem("nexo_language", selectedLanguage);
    set({ selectedLanguage });
  },
  temperature: parseFloat(localStorage.getItem("nexo_temperature") || "0.7"),
  setTemperature: (temperature) => {
    localStorage.setItem("nexo_temperature", temperature.toString());
    set({ temperature });
  },
  topP: parseFloat(localStorage.getItem("nexo_top_p") || "1.0"),
  setTopP: (topP) => {
    localStorage.setItem("nexo_top_p", topP.toString());
    set({ topP });
  },
  activeTab: "chat",
  setActiveTab: (activeTab) => set({ activeTab }),
  showSettings: false,
  setShowSettings: (showSettings) => set({ showSettings }),
  showPremiumModal: false,
  setShowPremiumModal: (showPremiumModal) => set({ showPremiumModal }),
}));
