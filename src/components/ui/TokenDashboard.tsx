import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Coins, 
  Cpu, 
  Zap, 
  Activity, 
  PieChart, 
  X, 
  DollarSign, 
  Clock, 
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface UsageData {
  calls: {
    timestamp: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    tokens: number;
    cost: number;
    speed: number;
    durationMs: number;
  }[];
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

export const TokenDashboard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<UsageData>({
    calls: [],
    totalTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/usage");
      if (!res.ok) throw new Error("Failed to fetch");
      const usageData = await res.json();
      setData({
        calls: usageData.calls || [],
        totalTokens: usageData.totalTokens || 0,
        totalInputTokens: usageData.totalInputTokens || 0,
        totalOutputTokens: usageData.totalOutputTokens || 0,
        totalCost: usageData.totalCost || 0,
      });
    } catch (e) {
      console.error("Failed to fetch stats", e);
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const recentCalls = data.calls.slice(-5).reverse();
  
  // Group by Model for calculations
  const modelStats = data.calls.reduce((acc: any, call) => {
    if (!acc[call.model]) {
      acc[call.model] = { tokens: 0, cost: 0, count: 0 };
    }
    acc[call.model].tokens += call.tokens;
    acc[call.model].cost += call.cost;
    acc[call.model].count += 1;
    return acc;
  }, {});

  const avgSpeed = data.calls.length > 0
    ? Math.round(data.calls.reduce((sum, c) => sum + (c.speed || 0), 0) / data.calls.length)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl bg-stone-950 border border-stone-850/80 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] font-sans text-stone-200"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-stone-900 flex items-center justify-between bg-stone-900/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    NEXO Token &amp; Cost Control
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                      Realtime
                    </span>
                  </h2>
                  <p className="text-xs text-stone-400 font-medium">
                    Monitor LLM token usage, infrastructure costs, and generation metrics.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchStats}
                  disabled={loading}
                  className="p-2.5 hover:bg-stone-900 rounded-xl transition-all border border-stone-900 text-stone-400 hover:text-white"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-stone-900 rounded-xl transition-all border border-stone-900 text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
              
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-stone-900/40 rounded-3xl border border-stone-850/60 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500" />
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Total Cost</span>
                  <div className="flex items-baseline gap-1 text-2xl font-black text-white">
                    <DollarSign className="w-4 h-4 text-emerald-500 shrink-0 self-center" />
                    <span>{data.totalCost.toFixed(5)}</span>
                    <span className="text-xs text-stone-500 font-medium ml-1">USD</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-stone-500" /> Paid API usage stats
                  </p>
                </div>

                <div className="p-5 bg-stone-900/40 rounded-3xl border border-stone-850/60 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-all duration-500" />
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Total Tokens</span>
                  <div className="text-2xl font-black text-white">
                    {data.totalTokens.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                    <span className="text-stone-500 font-bold">In:</span> {data.totalInputTokens.toLocaleString()} | 
                    <span className="text-stone-500 font-bold">Out:</span> {data.totalOutputTokens.toLocaleString()}
                  </p>
                </div>

                <div className="p-5 bg-stone-900/40 rounded-3xl border border-stone-850/60 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-all duration-500" />
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Average Speed</span>
                  <div className="flex items-baseline gap-1 text-2xl font-black text-white">
                    <span>{avgSpeed}</span>
                    <span className="text-xs text-stone-500 font-medium ml-1">T/S</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-500" /> Tokens per second
                  </p>
                </div>

                <div className="p-5 bg-stone-900/40 rounded-3xl border border-stone-850/60 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500" />
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Total API Calls</span>
                  <div className="text-2xl font-black text-white">
                    {data.calls.length}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-stone-500" /> Requests routed successfully
                  </p>
                </div>
              </div>

              {/* Middle Section: Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Model Split Table */}
                <div className="lg:col-span-2 p-6 bg-stone-900/30 border border-stone-850/50 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <PieChart className="w-4.5 h-4.5 text-indigo-400" /> Model Distribution &amp; Cost
                  </h3>
                  
                  {Object.keys(modelStats).length === 0 ? (
                    <p className="text-stone-500 text-xs py-8 text-center">No active stats available.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-stone-850 text-stone-400 font-bold">
                            <th className="pb-3">Model</th>
                            <th className="pb-3">Calls</th>
                            <th className="pb-3">Tokens</th>
                            <th className="pb-3">Cost ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-900">
                          {Object.entries(modelStats).map(([model, stat]: any) => (
                            <tr key={model} className="text-stone-300 font-medium">
                              <td className="py-3 text-white font-bold">{model}</td>
                              <td className="py-3">{stat.count}</td>
                              <td className="py-3">{stat.tokens.toLocaleString()}</td>
                              <td className="py-3 text-emerald-400">${stat.cost.toFixed(6)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Quick Limits Box */}
                <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Budget Limit</h4>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed font-medium">
                      Control spending. Free tiers and developer credits are tracked live to prevent billing overflow.
                    </p>
                  </div>
                  
                  <div className="mt-8 space-y-2">
                    <div className="flex justify-between text-[11px] font-black text-stone-400 uppercase tracking-widest">
                      <span>Monthly Allowance</span>
                      <span className="text-white">$10.00 / $50.00</span>
                    </div>
                    <div className="w-full bg-stone-900 rounded-full h-2 overflow-hidden border border-stone-850">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent Generations Log */}
              <div className="p-6 bg-stone-900/30 border border-stone-850/50 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-emerald-400" /> Recent Activity Stream
                </h3>

                {recentCalls.length === 0 ? (
                  <p className="text-stone-500 text-xs py-8 text-center text-stone-500 font-medium">No recent operations logged.</p>
                ) : (
                  <div className="space-y-3">
                    {recentCalls.map((call, idx) => (
                      <div key={idx} className="p-4 bg-stone-950/60 rounded-2xl border border-stone-850/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-stone-900 rounded-xl border border-stone-800 text-stone-400 shrink-0 mt-0.5">
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[11px] text-stone-500 font-bold uppercase tracking-widest block">
                              {new Date(call.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-xs font-bold text-white">{call.model}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                          <span className="px-2.5 py-1 bg-stone-900 rounded-xl border border-stone-800 text-stone-400">
                            Tokens: <strong className="text-white">{call.tokens}</strong>
                          </span>
                          <span className="px-2.5 py-1 bg-stone-900 rounded-xl border border-stone-800 text-emerald-400">
                            Cost: <strong>${call.cost.toFixed(6)}</strong>
                          </span>
                          <span className="px-2.5 py-1 bg-stone-900 rounded-xl border border-stone-800 text-amber-400">
                            Speed: <strong>{call.speed} t/s</strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
