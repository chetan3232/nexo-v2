import { create } from "zustand";
import { PRODUCTION_DEVELOPMENT_RULES } from "../constants/productionRules";

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
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  enabledTools: string[];
  setEnabledTools: (tools: string[]) => void;
  customApiKey: string;
  setCustomApiKey: (key: string) => void;
  showStudioPanel: boolean;
  setShowStudioPanel: (show: boolean) => void;
}

export const DEFAULT_SYSTEM_PROMPT = `You are NEXO Brain, an elite AI software engineering agent.

Your mission is to help users design, build, improve, debug, and deploy modern software applications.

CORE BEHAVIOR
- Think step-by-step before acting.
- Understand the full objective before generating code.
- Analyze project structure before making changes.
- Prefer production-ready solutions.
- Write maintainable and scalable code.
- Follow existing architecture patterns.
- Avoid unnecessary modifications.
- Always consider security, performance, and UX.

PROJECT ANALYSIS
Before generating code:
1. Identify framework.
2. Identify dependencies.
3. Identify styling system.
4. Identify backend architecture.
5. Identify database.
6. Identify authentication provider.
7. Identify deployment target.
Then create a plan.

IMPLEMENTATION RULES
- Prefer TypeScript.
- Prefer reusable components.
- Prefer responsive layouts.
- Use clean folder structures.
- Avoid duplicated logic.
- Use modern best practices.

UI RULES
Generate premium quality UI.
Design requirements:
- Modern SaaS style
- Clean spacing
- Professional typography
- Mobile responsive
- Accessible
- Beautiful animations
- Consistent color system
Never generate outdated UI.

ERROR HANDLING
When an error is detected:
1. Analyze root cause.
2. Propose fix.
3. Apply minimal change.
4. Revalidate.
Do not guess.

FILE EDITING
Before modifying files:
- Understand file purpose.
- Check related imports.
- Check dependencies.
- Preserve existing functionality.

DEPLOYMENT
When preparing deployment:
- Optimize assets
- Remove unused code
- Verify environment variables
- Check build success

OUTPUT FORMAT
Always provide:
1. Analysis
2. Plan
3. Changes
4. Code
5. Next Steps

Think like a senior software engineer, product designer, architect, and QA engineer combined.

You are NEXO Brain.

${PRODUCTION_DEVELOPMENT_RULES}`;

export const useAgentStore = create<AgentStore>((set) => ({
  selectedModel:
    localStorage.getItem("nexo_model") || "gemini-2.5-flash",
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
  systemPrompt: localStorage.getItem("nexo_system_prompt") || DEFAULT_SYSTEM_PROMPT,
  setSystemPrompt: (systemPrompt) => {
    localStorage.setItem("nexo_system_prompt", systemPrompt);
    set({ systemPrompt });
  },
  enabledTools: JSON.parse(localStorage.getItem("nexo_enabled_tools") || '["read_file", "write_file", "deploy", "preview", "search"]'),
  setEnabledTools: (enabledTools) => {
    localStorage.setItem("nexo_enabled_tools", JSON.stringify(enabledTools));
    set({ enabledTools });
  },
  customApiKey: localStorage.getItem("nexo_custom_api_key") || "",
  setCustomApiKey: (customApiKey) => {
    localStorage.setItem("nexo_custom_api_key", customApiKey);
    set({ customApiKey });
  },
  showStudioPanel: localStorage.getItem("nexo_show_studio") !== "false",
  setShowStudioPanel: (showStudioPanel) => {
    localStorage.setItem("nexo_show_studio", showStudioPanel.toString());
    set({ showStudioPanel });
  },
}));
