import React, { useState, useEffect } from "react";
import { Activity, Zap, BarChart3 } from "lucide-react";

export const UsageStats: React.FC = () => {
  const [stats, setStats] = useState<{ calls: any[]; totalTokens: number }>({
    calls: [],
    totalTokens: 0,
  });
  const [callsPerMin, setCallsPerMin] = useState(0);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/usage");
      const data = await res.json();
      setStats(data);

      // Calculate calls in the last minute
      const now = Date.now();
      const oneMinAgo = now - 60000;
      const recentCalls = data.calls.filter(
        (c: any) => new Date(c.timestamp).getTime() > oneMinAgo,
      );
      setCallsPerMin(recentCalls.length);
    } catch (e) {
      console.error("Failed to fetch stats");
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-stone-900 rounded-full border border-stone-800 shadow-xl">
      <div className="flex items-center gap-1.5 border-r border-stone-800 pr-3">
        <Activity className="w-3 h-3 text-emerald-500" />
        <span className="text-[10px] font-black text-stone-300 uppercase tracking-tighter">
          {callsPerMin} <span className="text-stone-500">RPM</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Zap className="w-3 h-3 text-amber-500" />
        <span className="text-[10px] font-black text-stone-300 uppercase tracking-tighter">
          {stats.totalTokens.toLocaleString()}{" "}
          <span className="text-stone-500">Tokens</span>
        </span>
      </div>
    </div>
  );
};
