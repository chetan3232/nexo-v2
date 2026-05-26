import React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Globe,
  Monitor,
} from "lucide-react";

const AVAILABLE_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "qwen/qwen3-coder-480b-a35b-instruct", name: "Qwen 3 Coder 480B" },
  { id: "stepfun-ai/step-3.5-flash", name: "Step 3.5 Flash" },
  { id: "groq/llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq)" },
];

interface LandingHeroProps {
  inputText: string;
  setInputText: (text: string) => void;
  selectedModel: string;
  onModelSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  projectMode: "frontend" | "fullstack";
  setProjectMode: (mode: "frontend" | "fullstack") => void;
  techStack: string;
  setTechStack: (stack: string) => void;
  onSendMessage: () => void;
  recentChats: any[];
  onRestoreChat: (chat: any) => void;
  onLoadSavedChats: () => void;
  onBack: () => void;
  TECH_STACKS: any[];
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  inputText,
  setInputText,
  selectedModel,
  onModelSelect,
  projectMode,
  setProjectMode,
  techStack,
  setTechStack,
  onSendMessage,
  recentChats,
  onRestoreChat,
  onLoadSavedChats,
  onBack,
  TECH_STACKS,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] overflow-y-auto overflow-x-hidden">
      {/* Cinematic Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#09090b] to-[#09090b] pointer-events-none"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[800px] h-[400px] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors z-20 group"
      >
        <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </div>
        <span className="text-sm font-medium opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          Back to Home
        </span>
      </button>

      <div className="min-h-full w-full flex flex-col items-center justify-center p-6 pt-24 pb-12">
        <div className="max-w-3xl w-full space-y-10 text-center animate-in fade-in zoom-in duration-700 relative z-10 px-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] text-white selection:bg-indigo-500/30">
            Build projects <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-orange-300 animate-pulse-slow">
              at light speed.
            </span>
          </h1>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-1.5 rounded-[2rem] shadow-2xl ring-1 ring-white/10 relative group">
            {/* Subtle glow border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-orange-500/30 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            <div className="relative bg-[#09090b]/90 rounded-[1.7rem] p-4 flex flex-col">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="What are we building? (e.g., 'A landing page for a coffee shop')"
                className="w-full bg-transparent border-none text-lg md:text-xl text-white placeholder-stone-500 focus:ring-0 resize-none h-32 p-2 font-light"
              />
              <div className="flex flex-col md:flex-row justify-between items-center pt-3 px-2 border-t border-white/5 gap-4">
                <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3 items-center w-full md:w-auto flex-1">
                  <div className="hidden sm:flex gap-2 mr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30 border border-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/50"></div>
                  </div>
                  <div className="relative group flex items-center max-w-[140px] sm:max-w-none">
                    <select
                      value={selectedModel}
                      onChange={onModelSelect}
                      className="appearance-none w-full bg-[#09090b]/50 hover:bg-[#09090b]/80 border border-white/10 text-stone-300 rounded-xl text-[10px] font-black uppercase transition-all px-3 py-2 pr-7 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer truncate"
                    >
                      {AVAILABLE_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 pointer-events-none group-hover:text-stone-300 transition-colors" />
                  </div>
                  <div className="relative group flex items-center max-w-[130px] sm:max-w-none">
                    <select
                      value={projectMode}
                      onChange={(e) => {
                        const newMode = e.target.value as
                          | "frontend"
                          | "fullstack";
                        setProjectMode(newMode);
                      }}
                      className="appearance-none w-full bg-[#09090b]/50 hover:bg-[#09090b]/80 border border-white/10 text-stone-300 rounded-xl text-[10px] font-black uppercase transition-all px-3 py-2 pr-7 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer truncate"
                    >
                      <option value="frontend">Frontend Only</option>
                      <option value="fullstack">Frontend + Backend</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 pointer-events-none group-hover:text-stone-300 transition-colors" />
                  </div>
                  <div className="relative group flex items-center max-w-[130px] sm:max-w-none">
                    <select
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                      className="appearance-none w-full bg-[#09090b]/50 hover:bg-[#09090b]/80 border border-white/10 text-stone-300 rounded-xl text-[10px] font-black uppercase transition-all px-3 py-2 pr-7 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer truncate"
                    >
                      {TECH_STACKS.filter((s) =>
                        s.modes.includes(projectMode),
                      ).map((stack) => (
                        <option key={stack.id} value={stack.id}>
                          {stack.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2 pointer-events-none group-hover:text-stone-300 transition-colors" />
                  </div>
                </div>

                <button
                  onClick={onSendMessage}
                  className="w-full md:w-auto bg-white text-black px-6 py-2.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-stone-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] shrink-0"
                >
                  Generate <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Projects Inline */}
          {recentChats.length > 0 ? (
            <div className="mt-8 w-full">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">
                  Recent Projects
                </p>
                <button
                  onClick={onLoadSavedChats}
                  className="text-stone-600 hover:text-white text-xs font-medium transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onRestoreChat(chat)}
                    className="text-left bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-400/40 rounded-2xl p-4 transition-all group"
                  >
                    <div className="w-8 h-8 bg-indigo-500/20 group-hover:bg-indigo-500/40 rounded-lg flex items-center justify-center mb-3 transition-colors">
                      <Globe className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-white text-sm font-semibold truncate">
                      {chat.name || "Untitled Project"}
                    </p>
                    <p className="text-stone-500 text-[10px] mt-1 truncate">
                      {chat.date}
                    </p>
                    {chat.content && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.keys(chat.content.files)
                          .slice(0, 2)
                          .map((f, i) => (
                            <span
                              key={i}
                              className="text-[8px] px-1.5 py-0.5 bg-black/30 border border-white/10 rounded text-stone-400 font-mono"
                            >
                              {f}
                            </span>
                          ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={onLoadSavedChats}
              className="mt-8 text-stone-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto px-4 py-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              <Monitor className="w-4 h-4" /> View Recently Created Apps
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
