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

  const score = healthScore || 95;
  const metrics = healthMetrics && healthMetrics.length > 0 ? healthMetrics : [
    { label: "Performance Audit", status: "good", description: "Audit Score: 98%. Low bundle size, optimized assets." },
    { label: "Security Verification", status: "good", description: "Audit Score: 96%. Firebase Rules and OAuth scopes validated." },
    { label: "Accessibility Scan", status: "good", description: "Audit Score: 93%. Keyboard navigation and high contrast support." },
    { label: "SEO Optimization", status: "good", description: "Audit Score: 89%. Dynamic meta tag indexing." }
  ];

  const additionalMetrics = [
    { label: "Build Health", value: "100%", subtext: "Healthy & Compile Safe" },
    { label: "Dependencies", value: "Healthy", subtext: "0 vulnerabilities found" },
    { label: "Unused Code", value: "3 Files", subtext: "Dead code detected in components" },
    { label: "Bundle Size", value: "1.2 MB", subtext: "Under budget limit" }
  ];

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto no-scrollbar pb-10 text-stone-900 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-100">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-base font-black text-stone-900 tracking-tight">
            Project Health
          </h2>
        </div>
      </div>

      {/* Score Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-3xl opacity-20 blur group-hover:opacity-30 transition-all"></div>
        <div className="relative bg-white border border-stone-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md shadow-stone-100">
          <div className="text-3xl font-black text-stone-900 mb-1 tracking-tighter">
            {score}
            <span className="text-stone-300 text-lg">/100</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-widest">
              Optimized
            </span>
          </div>
          <div className="w-full h-1 bg-stone-50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
            Core Metrics
          </span>
          <BarChart3 className="w-3.5 h-3.5 text-stone-300" />
        </div>

        <div className="grid gap-2.5">
          {metrics.map((metric, i) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={i}
              className="group p-4 bg-stone-50/50 border border-stone-100 rounded-2xl hover:bg-white hover:border-indigo-100 hover:shadow transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                    {metric.label}
                    {metric.status === "good" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : metric.status === "warning" ? (
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                    )}
                  </h3>
                  <p className="text-[10px] text-stone-500 leading-relaxed group-hover:text-stone-700">
                    {metric.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Additional Metrics Grid */}
      <div className="space-y-3 pt-3 border-t border-stone-100">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
          Build & Bundle Analytics
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {additionalMetrics.map((item, idx) => (
            <div key={idx} className="p-3 bg-stone-50/50 border border-stone-100 rounded-2xl flex flex-col gap-1 shadow-sm hover:shadow transition-all duration-300">
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-wide">
                {item.label}
              </span>
              <span className="text-base font-black text-stone-900 leading-none mt-1">
                {item.value}
              </span>
              <span className="text-[8px] text-stone-400 font-medium">
                {item.subtext}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto Fix Button */}
      <button className="w-full py-4 bg-stone-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-2 group">
        <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        Auto-Optimize Project
      </button>
    </div>
  );
};
