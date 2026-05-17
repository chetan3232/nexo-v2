import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Globe,
  Accessibility,
  Zap,
  Smartphone,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";

export const ProductionScanner: React.FC = () => {
  const { productionChecks } = useProjectStore();

  if (productionChecks.length === 0) return null;

  const iconMap: Record<string, any> = {
    seo: <Globe />,
    accessibility: <Accessibility />,
    performance: <Zap />,
    security: <Lock />,
    mobile: <Smartphone />,
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-stone-900 rounded-2xl text-white shadow-lg">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-black text-stone-900 tracking-tight">
          Production Ready
        </h2>
      </div>

      <div className="space-y-4">
        {productionChecks.map((check, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={check.id}
            className="p-5 bg-white border border-stone-100 rounded-[2rem] hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${check.status === "pass" ? "bg-emerald-50 text-emerald-500" : check.status === "warn" ? "bg-amber-50 text-amber-500" : "bg-rose-50 text-rose-500"}`}
                >
                  {React.cloneElement(iconMap[check.id] || <Globe />, {
                    className: "w-4 h-4",
                  })}
                </div>
                <span className="text-xs font-black text-stone-900 uppercase tracking-widest">
                  {check.label}
                </span>
              </div>
              {check.status === "pass" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
              {check.description}
            </p>
          </motion.div>
        ))}
      </div>

      <button className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
        Fix All Issues
      </button>
    </div>
  );
};
