import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import { Brain, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ReasoningPanel: React.FC = () => {
  const { reasoningSteps, buildPhase } = useProjectStore();

  if (reasoningSteps.length === 0 && buildPhase !== "building") return null;

  return (
    <div className="mt-6 p-6 bg-stone-50/50 border border-stone-100 rounded-[2.5rem] overflow-hidden relative group">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
          <Brain className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-stone-900">
          AI Reasoning Engine
        </span>
        {buildPhase === "building" && (
          <Loader2 className="w-3 h-3 text-indigo-500 animate-spin ml-auto" />
        )}
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {reasoningSteps.map((step, i) => (
            <motion.div
              initial={{ opacity: 0, x: -10, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              key={i}
              className="flex items-start gap-3"
            >
              <div className="mt-1 w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
              </div>
              <span className="text-[11px] font-bold text-stone-600 leading-relaxed">
                {step}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {buildPhase === "building" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            </div>
            <span className="text-[11px] font-bold text-stone-400 italic">
              Thinking next step...
            </span>
          </motion.div>
        )}
      </div>

      {/* Background Glow */}
      <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
    </div>
  );
};
