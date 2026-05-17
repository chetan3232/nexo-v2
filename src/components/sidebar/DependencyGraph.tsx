import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import { Share2, AlertTriangle, Info, Zap } from "lucide-react";
import { motion } from "framer-motion";

export const DependencyGraph: React.FC = () => {
  const { depNodes, setAnalysisInsights } = useProjectStore();

  if (depNodes.length === 0) return null;

  const handleNodeClick = (node: any) => {
    // Trigger AI Explanation (simulated for now)
    setAnalysisInsights(
      `Analyzing ${node.id}... \n\n- Dependencies: ${node.dependencies.length}\n- Status: ${node.isUnused ? "Dead Code Detected" : "Active"}\n- Suggested Refactor: Move shared logic to a hook.`,
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black uppercase tracking-widest text-stone-900">
            Dependency Graph
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {depNodes.map((node, i) => (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={node.id}
            onClick={() => handleNodeClick(node)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              node.isUnused
                ? "bg-rose-50 border-rose-100 hover:border-rose-300"
                : "bg-white border-stone-100 hover:border-indigo-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${node.isUnused ? "bg-rose-500" : "bg-indigo-500"}`}
                />
                <span className="text-xs font-bold text-stone-900 truncate max-w-[120px]">
                  {node.label}
                </span>
              </div>
              {node.isUnused && (
                <div className="flex items-center gap-1 text-[8px] font-black uppercase text-rose-500 bg-rose-100/50 px-1.5 py-0.5 rounded">
                  <AlertTriangle className="w-2 h-2" /> Dead Code
                </div>
              )}
            </div>

            {node.dependencies.length > 0 && (
              <div className="mt-2 pt-2 border-t border-stone-50 flex flex-wrap gap-1">
                {node.dependencies.map((dep, j) => (
                  <span
                    key={j}
                    className="text-[9px] text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded"
                  >
                    {dep.split("/").pop()}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* AI Insights Modal/Panel */}
      <InsightsPanel />
    </div>
  );
};

const InsightsPanel: React.FC = () => {
  const { analysisInsights, setAnalysisInsights } = useProjectStore();

  if (!analysisInsights) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 right-6 p-6 bg-stone-900 text-white rounded-3xl shadow-2xl z-50"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
            AI Architect Insights
          </span>
        </div>
        <button
          onClick={() => setAnalysisInsights(null)}
          className="text-stone-500 hover:text-white transition-all"
        >
          ✕
        </button>
      </div>
      <p className="text-xs leading-relaxed text-stone-300 whitespace-pre-wrap">
        {analysisInsights}
      </p>
    </motion.div>
  );
};
