import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const BuildQueue: React.FC = () => {
  const { tasks } = useProjectStore();

  if (tasks.length === 0) return null;

  return (
    <div className="bg-white/50 backdrop-blur-md border border-stone-200 rounded-2xl p-4 mt-4 space-y-3 shadow-sm overflow-hidden">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 px-1">
        Build Pipeline
      </h4>
      <div className="space-y-2">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {task.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : task.status === "running" ? (
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  ) : task.status === "error" ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-stone-300" />
                  )}
                </div>
                <span
                  className={`text-[12px] font-medium transition-colors ${task.status === "running" ? "text-indigo-600" : task.status === "done" ? "text-stone-600" : "text-stone-400"}`}
                >
                  {task.label}
                </span>
              </div>

              {task.status === "running" && (
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
