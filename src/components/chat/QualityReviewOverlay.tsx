import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, Accessibility, Search, Palette, Play } from "lucide-react";

interface QualityReviewOverlayProps {
  onComplete: () => void;
}

export const QualityReviewOverlay: React.FC<QualityReviewOverlayProps> = ({ onComplete }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // slight delay for dramatic effect
    const timer = setTimeout(() => setShow(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const metrics = [
    { label: "Performance", score: 92, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Accessibility", score: 95, icon: Accessibility, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "SEO", score: 89, icon: Search, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "UI Quality", score: 98, icon: Palette, color: "text-purple-500", bg: "bg-purple-500/10" }
  ];

  if (!show) return <div className="absolute inset-0 bg-[#0a0a0a] z-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#f7f7f7] z-50 flex flex-col items-center justify-center p-6"
    >
      <div className="bg-white border border-[#e8e8e8] rounded-3xl shadow-xl max-w-2xl w-full p-10 flex flex-col items-center text-center">
        
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        
        <h2 className="text-3xl font-black text-[#111] mb-2 tracking-tight">Generation Complete</h2>
        <p className="text-[#666] mb-10 max-w-md mx-auto">NEXO has finished generating your application. Here are the quality metrics for the generated code.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#fcfcfc] border border-[#e8e8e8] rounded-2xl p-5 flex flex-col items-center gap-3"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${m.bg}`}>
                  <Icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <div className="text-3xl font-black text-[#111]">{m.score}<span className="text-sm font-bold text-[#aaa]">/100</span></div>
                <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider">{m.label}</div>
              </motion.div>
            );
          })}
        </div>

        <button 
          onClick={onComplete}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-[0_8px_30px_rgba(79,70,229,0.3)] active:scale-95 hover:shadow-[0_8px_30px_rgba(79,70,229,0.4)]"
        >
          <Play className="w-4 h-4 fill-white" />
          View Application
        </button>
      </div>
    </motion.div>
  );
};
