import React, { useState } from "react";
import {
  Sparkles,
  Sliders,
  Cpu,
  Brain,
  Settings,
  HelpCircle,
  FileCode,
  Globe,
  Search,
  Key,
  Database,
  RotateCcw,
  Eye,
  EyeOff,
  User,
  Trash2,
} from "lucide-react";
import { useAgentStore } from "../../stores/agentStore";
import { useMemoryStore } from "../../stores/memoryStore";
import toast from "react-hot-toast";

// Models list including Claude, GPT, Gemini
const STUDIO_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google AI", badge: "Default", desc: "Fast & highly versatile" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google AI", badge: "Pro", desc: "Complex code reasoning" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google AI", badge: "Stable", desc: "Balanced performance" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", badge: "Premium", desc: "Industry benchmark for coding" },
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI", badge: "Premium", desc: "High reasoning & speed" },
  { id: "groq/llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "Groq Cloud", badge: "Fast", desc: "Open-source high speed reasoning" },
  { id: "qwen/qwen3-coder-480b-a35b-instruct", name: "Qwen 3 Coder 480B", provider: "NVIDIA NIM", badge: "NVIDIA", desc: "State-of-the-art coding" },
];

export const StudioControls: React.FC = () => {
  const {
    selectedModel,
    setSelectedModel,
    temperature,
    setTemperature,
    topP,
    setTopP,
    systemPrompt,
    setSystemPrompt,
    enabledTools,
    setEnabledTools,
    customApiKey,
    setCustomApiKey,
  } = useAgentStore();

  const { preferences, history, setPreference, addHistory } = useMemoryStore();

  const [isPromptExpanded, setIsPromptExpanded] = useState(true);
  const [showKey, setShowKey] = useState(false);

  // Default system prompt
  const DEFAULT_PROMPT = `You are NEXO Brain, an elite AI software engineering agent.

Your mission is to help users design, build, improve, debug, and deploy modern software applications.

CORE BEHAVIOR
- Think step-by-step before acting.
- Understand the full objective before generating code.
... (Standard NEXO brain rules)`;

  const handleResetPrompt = () => {
    // Reset to store default prompt (handled by agentStore's DEFAULT_SYSTEM_PROMPT constant)
    const storeDefault = `You are NEXO Brain, an elite AI software engineering agent.

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

You are NEXO Brain.`;
    setSystemPrompt(storeDefault);
    toast.success("System prompt reset to default!");
  };

  const handlePresetPrompt = (type: "coder" | "ux" | "minimalist") => {
    let preset = "";
    if (type === "coder") {
      preset = `You are NEXO Coder, an advanced programming agent focusing purely on clean architectural patterns, robust error handling, and highly efficient algorithms. Prefer TypeScript, absolute type-safety, and modular imports.`;
    } else if (type === "ux") {
      preset = `You are NEXO UX Architect, a design-system agent specialized in Tailwind gradients, beautiful animations, Apple-like glassmorphic controls, and responsive visual flow. Keep layouts sleek and gorgeous.`;
    } else if (type === "minimalist") {
      preset = `You are NEXO Minimalist. Avoid bloated code or excess libraries. Write clean, vanilla scripts, standard layouts, fast load times, and simple structures.`;
    }
    setSystemPrompt(preset);
    toast.success(`Preset applied: ${type.toUpperCase()}`);
  };

  const toggleTool = (toolId: string) => {
    if (enabledTools.includes(toolId)) {
      setEnabledTools(enabledTools.filter((t) => t !== toolId));
      toast.success(`Disabled tool: ${toolId}`);
    } else {
      setEnabledTools([...enabledTools, toolId]);
      toast.success(`Enabled tool: ${toolId}`);
    }
  };

  const handleClearHistory = () => {
    // Clear recent build history
    useMemoryStore.setState({ history: [] });
    toast.success("Memory history cleared.");
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-stone-200 select-none overflow-hidden w-full">
      {/* Header */}
      <div className="h-[52px] border-b border-stone-200 flex items-center justify-between px-4 shrink-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-stone-700" />
          <span className="text-sm font-bold text-stone-800">Studio Controls</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
            Live
          </span>
        </div>
      </div>

      {/* Control Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Model Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-stone-600" />
              Model Switcher
            </label>
            <span className="text-[10px] text-stone-400 font-semibold">
              {STUDIO_MODELS.find((m) => m.id === selectedModel)?.provider || "Custom"}
            </span>
          </div>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-850 font-semibold focus:border-stone-450 focus:ring-4 focus:ring-stone-100 outline-none transition-all cursor-pointer"
          >
            {STUDIO_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.badge})
              </option>
            ))}
          </select>
          <p className="text-[10px] text-stone-450 italic leading-relaxed pl-1">
            {STUDIO_MODELS.find((m) => m.id === selectedModel)?.desc}
          </p>
        </div>

        {/* System Prompt Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-stone-600" />
              System Prompt
            </label>
            <div className="flex gap-1">
              <button
                onClick={handleResetPrompt}
                className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700 transition-colors"
                title="Reset to default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative border border-stone-200 rounded-xl overflow-hidden bg-stone-50">
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter system level instructions..."
              className="w-full bg-transparent px-3 py-2 text-xs text-stone-800 outline-none font-mono resize-none leading-relaxed transition-all h-40 focus:bg-white"
            />
            <div className="border-t border-stone-150 px-3 py-1.5 flex items-center justify-between bg-white text-[9px] text-stone-450 select-none">
              <span>{systemPrompt.length.toLocaleString()} characters</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handlePresetPrompt("coder")}
                  className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors font-bold uppercase"
                >
                  Coder
                </button>
                <button
                  onClick={() => handlePresetPrompt("ux")}
                  className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors font-bold uppercase"
                >
                  UX
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Temperature presets & controls */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-stone-600" />
            Temperature Control
          </label>

          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold select-none text-stone-600">
            {[
              { label: "Precise", value: 0.2 },
              { label: "Balanced", value: 0.7 },
              { label: "Creative", value: 1.2 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setTemperature(preset.value)}
                className={`py-1.5 rounded transition-all ${
                  Math.abs(temperature - preset.value) < 0.1
                    ? "bg-white text-stone-900 shadow-sm"
                    : "hover:text-stone-800"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
              <span>Value</span>
              <span className="font-mono text-stone-800">{temperature.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />
          </div>
        </div>

        {/* Tool calling settings */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-stone-600" />
            Tool Calling
          </label>
          <div className="space-y-2 bg-stone-50 border border-stone-200/60 p-3.5 rounded-xl text-xs text-stone-700">
            {[
              { id: "read_file", label: "Read File", desc: "Allows AI to view codebase structure & code", icon: FileCode },
              { id: "write_file", label: "Write File", desc: "Allows AI to create & update files", icon: Sliders },
              { id: "deploy", label: "Vercel Deploy", desc: "Enable automated live deployment", icon: Globe },
              { id: "preview", label: "Sandbox Live Preview", desc: "Boot local sandboxed web runtime", icon: Sparkles },
              { id: "search", label: "Firecrawl Web Scraper", desc: "Scrape external web content", icon: Search },
            ].map((t) => {
              const ToolIcon = t.icon;
              const enabled = enabledTools.includes(t.id);
              return (
                <div key={t.id} className="flex items-start justify-between gap-3 pt-2.5 first:pt-0 border-t border-stone-150 first:border-0">
                  <div className="flex items-start gap-2">
                    <ToolIcon className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-stone-850 tracking-tight leading-tight">{t.label}</h4>
                      <p className="text-[9.5px] text-stone-450 mt-0.5 leading-normal">{t.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTool(t.id)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 outline-none ${
                      enabled ? "bg-stone-900" : "bg-stone-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${
                        enabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Memory Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-stone-600" />
              Memory Manager
            </label>
            <button
              onClick={handleClearHistory}
              className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-red-650 transition-colors"
              title="Clear memory logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 bg-stone-50 border border-stone-200/60 p-3.5 rounded-xl text-[11px] text-stone-700">
            {/* Project Brain context */}
            <div className="space-y-1">
              <span className="font-bold text-stone-500 uppercase text-[9px] tracking-wider block">Project Memory</span>
              <p className="bg-white p-2 border border-stone-150 rounded-lg text-stone-600 leading-normal font-mono text-[9px]">
                🎯 Frameworks: React, Vite, TS, Tailwind<br />
                🛠️ UI Style: Minimal, Rounded corners (xl)<br />
                ⚙️ Backend: Node/Express APIs
              </p>
            </div>

            {/* UserPreferences */}
            <div className="space-y-1.5 pt-2.5 border-t border-stone-150">
              <span className="font-bold text-stone-500 uppercase text-[9px] tracking-wider block flex items-center gap-1">
                <User className="w-3 h-3 text-stone-400" />
                User Preferences
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-stone-450 block mb-0.5">Design Style</span>
                  <select
                    value={preferences.designStyle}
                    onChange={(e: any) => setPreference({ designStyle: e.target.value })}
                    className="w-full bg-white border border-stone-150 rounded-lg px-2 py-1 outline-none text-stone-800 font-semibold cursor-pointer"
                  >
                    <option value="minimal">Minimal</option>
                    <option value="glassmorphism">Glassmorphism</option>
                    <option value="brutalism">Brutalism</option>
                    <option value="corporate">Corporate</option>
                  </select>
                </div>
                <div>
                  <span className="text-stone-450 block mb-0.5">Stack Preference</span>
                  <select
                    value={preferences.techStack}
                    onChange={(e: any) => setPreference({ techStack: e.target.value })}
                    className="w-full bg-white border border-stone-150 rounded-lg px-2 py-1 outline-none text-stone-800 font-semibold cursor-pointer"
                  >
                    <option value="React + Vite + Tailwind">React/Tailwind</option>
                    <option value="HTML + Vanilla CSS">Vanilla JS</option>
                    <option value="Next.js + Tailwind">Next.js</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Past build history log counts */}
            <div className="pt-2 border-t border-stone-150 flex items-center justify-between text-[10px] text-stone-500 font-medium">
              <span>Session History:</span>
              <strong className="text-stone-800">{history.length} build snapshots</strong>
            </div>
          </div>
        </div>

        {/* Custom API Keys */}
        <div className="space-y-3 pb-4">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-stone-600" />
            Custom API Key
          </label>
          <div className="relative bg-stone-50 border border-stone-200/60 p-3 rounded-xl">
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-2.5 py-2.5 shadow-sm">
              <input
                type={showKey ? "text" : "password"}
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Enter OpenRouter / OpenAI API Key..."
                className="w-full bg-transparent outline-none text-xs text-stone-800 placeholder:text-stone-300 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-stone-400 hover:text-stone-700 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[9px] text-stone-450 mt-1.5 leading-relaxed">
              Provides API key encapsulation for GPT or Claude models. Keys are stored locally in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
