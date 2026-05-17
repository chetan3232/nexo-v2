import React from "react";
import { PluginService } from "../../services/pluginService";
import {
  Package,
  CheckCircle2,
  ArrowRight,
  Star,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

export const MarketplacePanel: React.FC = () => {
  const plugins = PluginService.getInstance().getInstalledPlugins();

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="p-8 border-b border-stone-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            <Package className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">
            Marketplace
          </h2>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed font-medium">
          Extend NEXO with powerful integrations and AI extensions.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        {plugins.map((plugin, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={plugin.id}
            className="group p-5 bg-white border border-stone-100 rounded-[2rem] hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-stone-100 transition-all duration-500 cursor-pointer relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-500">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-stone-900">
                    {plugin.name}
                  </h3>
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                    {plugin.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase">Active</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed mb-6 group-hover:text-stone-700 transition-colors">
              {plugin.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-stone-50">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-300" />
                <span className="text-[9px] font-bold text-stone-400">
                  Verified by NEXO
                </span>
              </div>
              <button className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:gap-2.5 transition-all">
                Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-6 bg-stone-50/50 border-t border-stone-100">
        <button className="w-full py-4 bg-stone-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-stone-200">
          Browse All Plugins
        </button>
      </div>
    </div>
  );
};
