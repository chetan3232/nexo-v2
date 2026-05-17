import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import { Orchestrator } from "../../agents/Orchestrator";
import {
  History,
  RotateCcw,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

export const TimelinePanel: React.FC = () => {
  const { snapshots } = useProjectStore();

  if (snapshots.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center text-stone-200">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-stone-900">No History Yet</h3>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            Snapshots will appear here as the AI generates code versions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto no-scrollbar bg-stone-50/30">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
          <History className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-black text-stone-900 tracking-tight">
          Time Travel
        </h2>
      </div>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-stone-200/50" />

        <div className="space-y-8">
          {[...snapshots].reverse().map((snapshot, i) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={snapshot.id}
              className="relative pl-12 group"
            >
              {/* Dot */}
              <div className="absolute left-0 top-1.5 w-10 h-10 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white border-2 border-indigo-500 rounded-full z-10 group-hover:scale-150 transition-transform" />
                <div className="absolute inset-0 bg-indigo-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div
                className="p-5 bg-white border border-stone-100 rounded-[1.8rem] hover:border-indigo-200 hover:shadow-xl hover:shadow-stone-100 transition-all cursor-pointer group/card"
                onClick={() =>
                  Orchestrator.getInstance().restoreSnapshot(snapshot.id)
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    {snapshot.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-stone-400">
                    <Clock className="w-3 h-3" />
                    {new Date(snapshot.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <h3 className="text-[12px] font-bold text-stone-900 line-clamp-2 mb-4 group-hover/card:text-indigo-600 transition-colors">
                  {snapshot.label}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[8px] font-black uppercase text-stone-400">
                      Stable Build
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-600 opacity-0 group-hover/card:opacity-100 transition-all">
                    Restore <RotateCcw className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
