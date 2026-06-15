import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight, Gauge, CheckCircle } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';

interface QualityReviewOverlayProps {
  onConfirm: () => void;
}

export const QualityReviewOverlay: React.FC<QualityReviewOverlayProps> = ({ onConfirm }) => {
  const scores = useProjectStore((state) => state.qualityScores);

  const scoreItems = [
    { label: 'Performance', val: scores.performance, color: 'text-green-400', barBg: 'bg-green-500' },
    { label: 'Accessibility', val: scores.accessibility, color: 'text-indigo-400', barBg: 'bg-indigo-500' },
    { label: 'SEO Optimization', val: scores.seo, color: 'text-yellow-400', barBg: 'bg-yellow-500' },
    { label: 'Security Headers', val: scores.security, color: 'text-emerald-400', barBg: 'bg-emerald-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b]/95 backdrop-blur-md text-white p-6 flex items-center justify-center font-sans select-none">
      <div className="max-w-md w-full bg-stone-900/80 border border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Glow behind modal */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full"></div>
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto text-green-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold">Phase 10: Audits Finished</h2>
          <p className="text-stone-400 text-xs font-light">The workspace code has compiled. Review quality checklist metrics.</p>
        </div>

        {/* Scores Grid */}
        <div className="space-y-4 pt-2">
          {scoreItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-stone-300">{item.label}</span>
                <span className={item.color}>{item.val}/100</span>
              </div>
              <div className="h-2 w-full bg-black/40 border border-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.val}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${item.barBg}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Trigger */}
        <button
          onClick={onConfirm}
          className="w-full bg-white text-black py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 duration-200"
        >
          Confirm & Launch Sandbox <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default QualityReviewOverlay;
