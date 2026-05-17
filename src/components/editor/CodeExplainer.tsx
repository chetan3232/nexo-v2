import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  UserCheck,
  GraduationCap,
  Eye,
  Zap,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { EnhancementAgent } from "../../agents/EnhancementAgent";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

type Persona = "senior" | "beginner" | "visual";

export const CodeExplainer: React.FC<{
  code: string;
  onDismiss: () => void;
}> = ({ code, onDismiss }) => {
  const [persona, setPersona] = useState<Persona>("senior");
  const [explanation, setExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleExplain = async (selectedPersona: Persona) => {
    setPersona(selectedPersona);
    setIsLoading(true);
    setExplanation("");

    const prompts = {
      senior:
        "Explain this code like a Senior Architect. Focus on patterns, performance, security risks, and architectural decisions.",
      beginner:
        "Explain this code like a friendly teacher to a beginner. Use simple analogies and explain what every line does.",
      visual:
        "Explain this code visually. Use markdown tables, diagrams (if possible), and bullet points to show the data flow.",
    };

    try {
      const agent = new EnhancementAgent();
      const result = await agent.enhance(
        `${prompts[selectedPersona]}\n\nCODE:\n${code}`,
        [],
        { model: "gpt-4o", temperature: 0.7 },
      );
      setExplanation(result);
    } catch (error) {
      toast.error("Failed to generate explanation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute inset-x-6 bottom-6 top-1/2 bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_-20px_100px_rgba(0,0,0,0.1)] border border-stone-200/50 flex flex-col z-[60] overflow-hidden">
      {/* Persona Switcher */}
      <div className="p-6 border-b border-stone-100 flex items-center justify-between">
        <div className="flex bg-stone-50 p-1.5 rounded-2xl border border-stone-100">
          <PersonaTab
            active={persona === "senior"}
            icon={<UserCheck />}
            label="Senior Dev"
            onClick={() => handleExplain("senior")}
          />
          <PersonaTab
            active={persona === "beginner"}
            icon={<GraduationCap />}
            label="Beginner"
            onClick={() => handleExplain("beginner")}
          />
          <PersonaTab
            active={persona === "visual"}
            icon={<Eye />}
            label="Visual Flow"
            onClick={() => handleExplain("visual")}
          />
        </div>
        <button
          onClick={onDismiss}
          className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Explanation Content */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Activity className="w-8 h-8 text-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 animate-pulse">
              AI is deconstructing code...
            </span>
          </div>
        ) : explanation ? (
          <div className="prose prose-sm prose-stone max-w-none">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center text-stone-300">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-stone-900">
                Select an explanation mode
              </h3>
              <p className="text-xs text-stone-400">
                Choose how you want to understand this logic.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PersonaTab: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${active ? "bg-white text-indigo-600 shadow-sm" : "text-stone-400 hover:text-stone-600"}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, {
      className: "w-3.5 h-3.5",
    })}
    <span className="text-[10px] font-black uppercase tracking-tight">
      {label}
    </span>
  </button>
);
