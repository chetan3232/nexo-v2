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
  RefreshCw,
  Gauge,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { auth } from "../../services/firebase";

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
  const [allowance, setAllowance] = useState<{
    userId: string;
    email: string;
    balance: number;
    lastReset: string;
  } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usage");
      if (!res.ok) throw new Error("Failed to fetch");
      const usageData = await res.json();
      const cleanCalls = (usageData.calls || []).map((call: any) => ({
        timestamp: call.timestamp || new Date().toISOString(),
        model: call.model || "Unknown Model",
        inputTokens: call.inputTokens || 0,
        outputTokens: call.outputTokens || 0,
        tokens: call.tokens || 0,
        cost: call.cost || 0,
        speed: call.speed || 0,
        durationMs: call.durationMs || 0,
      }));
      setData({
        calls: cleanCalls,
        totalTokens: usageData.totalTokens || 0,
        totalInputTokens: usageData.totalInputTokens || 0,
        totalOutputTokens: usageData.totalOutputTokens || 0,
        totalCost: usageData.totalCost || 0,
      });
    } catch (e) {
      console.error("Failed to fetch stats", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowance = async () => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (auth.currentUser) {
        headers["x-user-id"] = auth.currentUser.uid;
        headers["x-user-email"] = auth.currentUser.email || "";
      }
      const res = await fetch("/api/allowance", { headers });
      if (!res.ok) throw new Error("Failed to fetch allowance");
      const allowanceData = await res.json();
      setAllowance(allowanceData);
    } catch (e) {
      console.error("Failed to fetch allowance status", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      fetchAllowance();
      const interval = setInterval(() => {
        fetchStats();
        fetchAllowance();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const recentCalls = data.calls.slice(-5).reverse();
  
  // Group by Model for calculations
  const modelStats = data.calls.reduce((acc: any, call) => {
    const modelName = call.model || "Unknown Model";
    if (!acc[modelName]) {
      acc[modelName] = { tokens: 0, cost: 0, count: 0 };
    }
    acc[modelName].tokens += (call.tokens || 0);
    acc[modelName].cost += (call.cost || 0);
    acc[modelName].count += 1;
    return acc;
  }, {});

  const avgSpeed = data.calls.length > 0
    ? Math.round(data.calls.reduce((sum, c) => sum + (c.speed || 0), 0) / data.calls.length)
    : 0;

  // Subscription & Allowance calculations
  const isAnonymous = !allowance || allowance.userId === 'anonymous';
  const limit = isAnonymous ? 0.50 : 5.00;
  const balance = allowance ? allowance.balance : limit;
  const spent = Math.max(0, limit - balance);
  const percentUsed = Math.min(100, (spent / limit) * 100);

  const lastResetDate = allowance ? new Date(allowance.lastReset) : new Date();
  const nextResetDate = new Date(lastResetDate.getTime() + 2 * 24 * 60 * 60 * 1000);
  const [resetTimer, setResetTimer] = useState("Checking reset...");

  useEffect(() => {
    const updateTimer = () => {
      const diff = nextResetDate.getTime() - Date.now();
      if (diff <= 0) {
        setResetTimer("Resets soon");
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      if (days > 0) {
        setResetTimer(`Resets in ${days}d ${hours}h`);
      } else if (hours > 0) {
        setResetTimer(`Resets in ${hours}h ${mins}m`);
      } else {
        setResetTimer(`Resets in ${mins}m`);
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 60000);
    return () => clearInterval(timerInterval);
  }, [allowance]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 md:p-6 overflow-hidden">
          {/* Background Mesh Glow */}
          <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-pulse" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="w-full max-w-5xl bg-zinc-950/90 border border-zinc-800/80 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[90vh] font-sans text-zinc-300 backdrop-blur-md relative z-10"
          >
            {/* Top Header Bar */}
            <div className="p-6 md:p-8 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/10 relative">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-2xl text-black shadow-lg shadow-indigo-500/15">
                  <TrendingUp className="w-5 h-5 font-black text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white tracking-tight">
                      System Resource Control
                    </h2>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                      LIVE FEED
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                    Monitor token allocation, latency metrics, and API credits in real-time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => { fetchStats(); fetchAllowance(); }}
                  disabled={loading}
                  className="p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-800/60 text-zinc-400 hover:text-white"
                  title="Force Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-800/60 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Core Scroll View */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800/80 scrollbar-track-transparent">
              
              {/* Top Analytical Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Cost Card */}
                <div className="p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-[2rem] relative overflow-hidden group hover:border-emerald-500/20 hover:bg-zinc-900/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Infrastructure Cost</span>
                  <div className="flex items-baseline gap-1.5 text-2xl font-black text-white tracking-tighter">
                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0 self-center" />
                    <span>{(data.totalCost ?? 0).toFixed(5)}</span>
                    <span className="text-[10px] text-zinc-500 font-bold ml-0.5">USD</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-2 font-medium flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-zinc-500" /> Total paid provider cost
                  </div>
                </div>

                {/* Tokens Card */}
                <div className="p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-[2rem] relative overflow-hidden group hover:border-purple-500/20 hover:bg-zinc-900/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/10 transition-all duration-500" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Accumulated Tokens</span>
                  <div className="text-2xl font-black text-white tracking-tighter">
                    {(data.totalTokens ?? 0).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-2 font-medium flex items-center gap-1.5">
                    <span>In: <strong className="text-zinc-400">{(data.totalInputTokens ?? 0).toLocaleString()}</strong></span>
                    <span className="h-2 w-px bg-zinc-850" />
                    <span>Out: <strong className="text-zinc-400">{(data.totalOutputTokens ?? 0).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Speed Card */}
                <div className="p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-[2rem] relative overflow-hidden group hover:border-amber-500/20 hover:bg-zinc-900/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all duration-500" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Average Response Speed</span>
                  <div className="flex items-baseline gap-1 text-2xl font-black text-white tracking-tighter">
                    <span>{avgSpeed}</span>
                    <span className="text-[10px] text-zinc-500 font-bold ml-0.5">T/S</span>
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-2 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" /> Tokens generated per sec
                  </div>
                </div>

                {/* Request Card */}
                <div className="p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-[2rem] relative overflow-hidden group hover:border-cyan-500/20 hover:bg-zinc-900/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-500" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Active Requests</span>
                  <div className="text-2xl font-black text-white tracking-tighter">
                    {data.calls.length}
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-2 font-medium flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-zinc-500" /> Successful calls registered
                  </div>
                </div>

              </div>

              {/* Grid 2 Column Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Model split & allocations */}
                <div className="lg:col-span-2 p-6 bg-zinc-900/20 border border-zinc-800/60 rounded-[2.5rem] space-y-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                      <PieChart className="w-4 h-4 text-indigo-400" /> Model Allocation & Weight
                    </h3>
                    
                    {Object.keys(modelStats).length === 0 ? (
                      <p className="text-zinc-500 text-xs py-10 text-center font-bold">No active model allocations monitored.</p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(modelStats).map(([model, stat]: any) => {
                          const pct = Math.round((stat.tokens / Math.max(data.totalTokens, 1)) * 100);
                          return (
                            <div key={model} className="p-4 bg-zinc-900/40 border border-zinc-800/40 rounded-2xl flex flex-col gap-3 group hover:border-zinc-700 transition-all">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <span className="text-xs font-black text-white block">{model}</span>
                                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                                    {stat.count} requests routed
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-black text-white block">{(stat.tokens ?? 0).toLocaleString()} <span className="text-[9px] text-zinc-500 font-bold">TKN</span></span>
                                  <span className="text-[9px] text-emerald-400 font-black">${(stat.cost ?? 0).toFixed(6)} USD</span>
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                                  <span>Distribution Weight</span>
                                  <span className="text-indigo-400">{pct}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Allowance Control */}
                <div className="p-6 bg-zinc-900/20 border border-zinc-800/60 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-400/5 rounded-full blur-[60px] pointer-events-none" />
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                        {isAnonymous ? "PREVIEW CREDITS" : "DEVELOPER SUBSCRIPTION"}
                      </h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                      {isAnonymous 
                        ? "Using anonymous preview tokens. Register to unlock the full developer quota." 
                        : `Active developer profile: ${allowance?.email}. Usage caps applied correctly.`}
                    </p>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <span>Remaining Balance</span>
                      <span className="text-emerald-400 font-black">${(balance ?? 0).toFixed(4)} / ${(limit ?? 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-900">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentUsed > 90 ? 'bg-rose-500' : percentUsed > 70 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`} 
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{resetTimer}</span>
                    </div>

                    {isAnonymous && (
                      <div className="mt-4 pt-4 border-t border-zinc-805">
                        <button
                          onClick={() => {
                            onClose();
                            toast("Please click Sign In at the top right to claim your $5.00 developer allowance!", { icon: "🔑" });
                          }}
                          className="w-full py-3 bg-gradient-to-tr from-cyan-50 to-indigo-500 hover:from-cyan-60 hover:to-indigo-600 text-black font-black rounded-2xl text-[9px] tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/15"
                        >
                          Unlock Developer Quota
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Simulated Latency Timeline (Pure CSS representation) */}
              <div className="p-6 bg-zinc-900/20 border border-zinc-800/60 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" /> API Latency Timeline
                  </h3>
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Latency over last 10 calls</span>
                </div>
                
                {data.calls.length === 0 ? (
                  <p className="text-zinc-500 text-xs py-6 text-center font-bold">Waiting for operations to track latency...</p>
                ) : (
                  <div className="flex items-end justify-between h-20 pt-4 px-2">
                    {data.calls.slice(-10).map((call, idx) => {
                      const lat = call.durationMs || 1000;
                      const maxLat = Math.max(...data.calls.map(c => c.durationMs || 1000), 2000);
                      const heightPct = Math.max(15, Math.min(100, (lat / maxLat) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                          {/* Tooltip */}
                          <span className="absolute bottom-full mb-1 bg-zinc-900 text-[8px] text-white px-1.5 py-0.5 rounded border border-zinc-850 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            {lat}ms
                          </span>
                          <div 
                            className="w-4 bg-gradient-to-t from-indigo-500/20 to-indigo-500 hover:to-cyan-400 rounded-t-sm transition-all duration-300"
                            style={{ height: `${heightPct}px` }}
                          />
                          <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-tighter mt-1 truncate max-w-[40px]">
                            {call.model.split("/").pop()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Generative Log Timeline */}
              <div className="p-6 bg-zinc-900/20 border border-zinc-800/60 rounded-[2.5rem] space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Request Activity Feed
                </h3>

                {recentCalls.length === 0 ? (
                  <p className="text-zinc-500 text-xs py-10 text-center font-bold">No active calls monitored.</p>
                ) : (
                  <div className="space-y-2.5">
                    {recentCalls.map((call, idx) => (
                      <div key={idx} className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-zinc-700 transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-zinc-400 shrink-0 mt-0.5 group-hover:text-indigo-400 transition-colors">
                            <Cpu className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                              {new Date(call.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="text-xs font-black text-white tracking-tight block mt-0.5">{call.model}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider">
                          <span className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-850 text-zinc-400">
                            Tokens: <strong className="text-white ml-0.5">{call.tokens ?? 0}</strong>
                          </span>
                          <span className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-850 text-emerald-400">
                            Cost: <strong className="ml-0.5">${(call.cost ?? 0).toFixed(6)}</strong>
                          </span>
                          <span className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-850 text-amber-500">
                            Speed: <strong className="ml-0.5">{call.speed ?? 0} T/S</strong>
                          </span>
                          <span className="px-3 py-1.5 bg-zinc-950 rounded-xl border border-zinc-850 text-indigo-400">
                            Time: <strong className="ml-0.5">{call.durationMs || 0}ms</strong>
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
