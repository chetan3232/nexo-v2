import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ListChecks,
} from "lucide-react";
import { useProjectStore, BuildTask } from "../../stores/projectStore";

export const TaskBoard: React.FC = () => {
  const { tasks, buildPhase } = useProjectStore();

  if (tasks.length === 0 || buildPhase === "idle") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-stone-500 font-bold text-[9px] uppercase tracking-wider">
          <ListChecks className="w-3.5 h-3.5" />
          Build Execution
        </div>
        <div className="text-[9px] font-black text-indigo-600 uppercase">
          {buildPhase}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2.5 px-2 py-1.5 bg-white border border-stone-100 rounded-xl shadow-sm"
          >
            <div className="shrink-0">
              {task.status === "done" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : task.status === "running" ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              ) : task.status === "error" ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-stone-200" />
              )}
            </div>
            <span
              className={`text-[10px] font-bold ${task.status === "running" ? "text-stone-900" : "text-stone-500"}`}
            >
              {task.label}
            </span>
            {task.status === "running" && (
              <div className="ml-auto flex items-center">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
