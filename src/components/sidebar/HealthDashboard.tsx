import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import {
  Activity,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

export const HealthDashboard: React.FC = () => {
  const { healthScore, healthMetrics } = useProjectStore();

  if (healthScore === null) return null;

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500 rounded-2xl text-white shadow-lg shadow-emerald-100">
            <Activity className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            Project Health
          </h2>
        </div>
      </div>

      {/* Score Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-[2.5rem] opacity-20 blur group-hover:opacity-30 transition-all"></div>
        <div className="relative bg-white border border-stone-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-stone-100">
          <div className="text-5xl font-black text-stone-900 mb-2 tracking-tighter">
            {healthScore}
            <span className="text-stone-300 text-2xl">/100</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Optimized
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${healthScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
            Core Metrics
          </span>
          <BarChart3 className="w-3.5 h-3.5 text-stone-300" />
        </div>

        <div className="grid gap-3">
          {healthMetrics.map((metric, i) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="group p-5 bg-stone-50/50 border border-stone-100 rounded-[1.8rem] hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-stone-100 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-[13px] font-bold text-stone-900 flex items-center gap-2">
                    {metric.label}
                    {metric.status === "good" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : metric.status === "warning" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    )}
                  </h3>
                  <p className="text-[11px] text-stone-500 leading-relaxed group-hover:text-stone-700">
                    {metric.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-200 group-hover:text-indigo-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Auto Fix Button */}
      <button className="w-full py-5 bg-stone-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-stone-200 flex items-center justify-center gap-2 group">
        <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
        Auto-Optimize Project
      </button>
    </div>
  );
};
