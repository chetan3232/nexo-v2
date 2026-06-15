import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Zap, Accessibility, Search, Palette, Play, Sparkles, Loader2, Check } from "lucide-react";

interface QualityReviewOverlayProps {
  onComplete: () => void;
}

interface Metric {
  id: string;
  label: string;
  score: number;
  icon: React.ComponentType<any>;
  fixing: boolean;
  fixed: boolean;
}

export const QualityReviewOverlay: React.FC<QualityReviewOverlayProps> = ({ onComplete }) => {
  const [show, setShow] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([
    { id: "perf", label: "Performance", score: 92, icon: Zap, fixing: false, fixed: false },
    { id: "a11y", label: "Accessibility", score: 85, icon: Accessibility, fixing: false, fixed: false },
    { id: "seo", label: "SEO", score: 79, icon: Search, fixing: false, fixed: false },
    { id: "ui", label: "UI Quality", score: 91, icon: Palette, fixing: false, fixed: false }
  ]);

  useEffect(() => {
    // slight delay for dramatic effect
    const timer = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleFixMetric = (id: string) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, fixing: true } : m));

    // Simulate AI fixing / optimization
    setTimeout(() => {
      setMetrics(prev => prev.map(m => {
        if (m.id === id) {
          return {
            ...m,
            fixing: false,
            fixed: true,
            score: 100
          };
        }
        return m;
      }));
    }, 2000);
  };

  // Radial Ring Math
  const radius = 36;
  const stroke = 4;
  const circumference = radius * 2 * Math.PI;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#10b981"; // Emerald
    if (score >= 80) return "#f59e0b"; // Amber
    return "#ef4444"; // Rose
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-emerald-500/10 text-emerald-500";
    if (score >= 80) return "bg-amber-500/10 text-amber-500";
    return "bg-rose-500/10 text-rose-500";
  };

  if (!show) {
    return (
      <div className="absolute inset-0 bg-stone-50 dark:bg-[#0c0c0e] z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs font-mono font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            Auditing Build
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#f7f7f7] dark:bg-[#0c0c0e] z-50 flex flex-col items-center justify-center p-6 overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#121214] border border-[#e8e8e8] dark:border-stone-800/80 rounded-3xl shadow-2xl max-w-2xl w-full p-8 md:p-10 flex flex-col items-center text-center">
        
        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mb-5 border border-emerald-100 dark:border-emerald-900/50 shadow-inner">
          <CheckCircle2 className="w-9 h-9 text-emerald-500 dark:text-emerald-400" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#111] dark:text-stone-100 mb-2 tracking-tight">
          Application Audit Passed
        </h2>
        <p className="text-xs md:text-sm text-[#666] dark:text-stone-400 mb-8 max-w-md mx-auto">
          NEXO has completed compilation. The AI QA squad has audited compliance metrics for the sandbox code.
        </p>

        {/* Audit Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
          {metrics.map((m) => {
            const Icon = m.icon;
            const strokeDashoffset = circumference - (m.score / 100) * circumference;
            const color = getScoreColor(m.score);

            return (
              <motion.div 
                key={m.id}
                layout
                className="bg-[#fcfcfc] dark:bg-stone-900/40 border border-[#e8e8e8] dark:border-stone-800/60 rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden"
              >
                {/* Radial Ring */}
                <div className="relative w-20 h-20 flex items-center justify-center mt-1">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      className="text-stone-100 dark:text-stone-800"
                      strokeWidth={stroke}
                      stroke="currentColor"
                      fill="transparent"
                      r={radius}
                      cx={40}
                      cy={40}
                    />
                    <motion.circle
                      strokeWidth={stroke}
                      strokeDasharray={circumference}
                      animate={{ strokeDashoffset }}
                      strokeLinecap="round"
                      stroke={color}
                      fill="transparent"
                      r={radius}
                      cx={40}
                      cy={40}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${getScoreBg(m.score)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-0.5 z-10">
                  <div className="text-xl font-bold text-[#111] dark:text-stone-100 font-mono">
                    {m.score}
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                    {m.label}
                  </div>
                </div>

                {/* AI Fix / Optimize Button */}
                <div className="w-full mt-1.5 z-10">
                  {m.fixed ? (
                    <div className="flex items-center justify-center gap-1 py-1 text-[10px] font-bold text-emerald-500">
                      <Check className="w-3 h-3" />
                      <span>Optimized</span>
                    </div>
                  ) : m.fixing ? (
                    <button
                      disabled
                      className="w-full py-1 bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 text-[10px] font-bold rounded flex items-center justify-center gap-1 border border-stone-200/50 dark:border-stone-700/50"
                    >
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                      <span>Healing...</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFixMetric(m.id)}
                      className="w-full py-1 bg-stone-50 dark:bg-stone-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-stone-600 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-bold rounded flex items-center justify-center gap-1 border border-stone-200 dark:border-stone-700/50 transition-all"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>AI Fix</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Button */}
        <button 
          onClick={onComplete}
          className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_30px_rgba(79,70,229,0.25)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.35)] active:scale-98"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          View Application
        </button>
      </div>
    </motion.div>
  );
};
