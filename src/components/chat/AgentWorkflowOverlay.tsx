import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Server, Layout, FileCode2, TestTube2, AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";

export const AgentWorkflowOverlay: React.FC = () => {
  const { buildPhase, subStatus, tasks } = useProjectStore();
  const [logs, setLogs] = useState<{ id: string; text: string; type: "info" | "success" | "error" }[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const realisticMessages = [
    "Understanding requirements...",
    "Designing application architecture...",
    "Creating component hierarchy...",
    "Planning database schema...",
    "Generating responsive layouts...",
    "Building authentication system...",
    "Optimizing application performance...",
    "Fixing detected issues...",
    "Running validation checks...",
    "Preparing preview..."
  ];

  useEffect(() => {
    if (buildPhase === "idle" || buildPhase === "done") return;
    const interval = setInterval(() => {
      setCurrentMessageIndex(Math.floor(Math.random() * realisticMessages.length));
    }, 3000);
    return () => clearInterval(interval);
  }, [buildPhase]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Sync tasks to logs and AI Thinking feed
  useEffect(() => {
    if (tasks.length === 0) return;
    const latestTask = tasks[tasks.length - 1];
    
    if (latestTask.status === "running") {
      setLogs(prev => [...prev, { id: Date.now().toString(), text: `⚡ ${latestTask.label}`, type: "info" }]);
    } else if (latestTask.status === "done") {
      setLogs(prev => [...prev, { id: Date.now().toString(), text: `✓ Success: ${latestTask.label}`, type: "success" }]);
    } else if (latestTask.status === "error") {
      setLogs(prev => [...prev, { id: Date.now().toString(), text: `❌ Build Failed: ${latestTask.label}`, type: "error" }]);
    }
  }, [tasks]);

  // Map buildPhase to Progress
  const progressMap = {
    planning: { step: 1, text: "Analyzing Project", percent: 25 },
    generating: { step: 2, text: "Generating Architecture & Components", percent: 60 },
    fixing: { step: 3, text: "Self-Healing & Debugging", percent: 80 },
    deploying: { step: 4, text: "Building Database & Deploying", percent: 95 },
    done: { step: 5, text: "Completed", percent: 100 },
    idle: { step: 0, text: "Waiting", percent: 0 }
  };
  
  const currentProgress = progressMap[buildPhase as keyof typeof progressMap] || progressMap.idle;

  // Render a terminal-like block
  const renderProgressBlock = (label: string, active: boolean, completed: boolean, percent: number) => {
    const bars = Math.floor(percent / 10);
    const emptyBars = 10 - bars;
    const barString = "█".repeat(bars) + "░".repeat(emptyBars);
    
    return (
      <div className={`flex flex-col gap-1 text-xs font-mono ${completed ? "text-emerald-500" : active ? "text-indigo-400" : "text-stone-500 opacity-50"}`}>
        <div className="flex justify-between items-center">
          <span>{label}</span>
          <span>{percent}%</span>
        </div>
        <div>{barString}</div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#0a0a0a] text-stone-300 z-50 flex flex-col p-6 overflow-hidden"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6 shrink-0">
        <BrainCircuit className="w-8 h-8 text-indigo-500 animate-pulse" />
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">NEXO Brain Activated</h2>
          <p className="text-xs text-stone-400 font-mono">Live Progress Panel</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        
        {/* LEFT COLUMN: Progress & Agents */}
        <div className="w-1/3 flex flex-col gap-6">
          
          {/* Progress Bars */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col gap-4">
            {renderProgressBlock("Analyzing Project", buildPhase === "planning", currentProgress.step > 1, currentProgress.step > 1 ? 100 : currentProgress.step === 1 ? 50 : 0)}
            {renderProgressBlock("Generating Architecture", buildPhase === "generating", currentProgress.step > 2, currentProgress.step > 2 ? 100 : currentProgress.step === 2 ? 60 : 0)}
            {renderProgressBlock("Creating Components", buildPhase === "generating" || buildPhase === "fixing", currentProgress.step > 3, currentProgress.step > 3 ? 100 : currentProgress.step >= 2 ? 40 : 0)}
            {renderProgressBlock("Building Database", buildPhase === "deploying", currentProgress.step > 4, currentProgress.step > 4 ? 100 : currentProgress.step === 4 ? 50 : 0)}
          </div>

          {/* Agent Timeline */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col gap-3 flex-1">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Agent Timeline</h3>
            
            <div className="flex items-center gap-3 text-sm">
              <Layout className={`w-4 h-4 ${currentProgress.step >= 1 ? "text-emerald-500" : "text-stone-600"}`} />
              <span className={currentProgress.step >= 1 ? "text-stone-200 font-semibold" : "text-stone-500"}>Planner Agent</span>
              <div className="ml-auto text-xs">
                {currentProgress.step > 1 ? <span className="text-emerald-500">✓ Completed</span> : currentProgress.step === 1 ? <span className="text-indigo-400 animate-pulse">⏳ Running</span> : ""}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <FileCode2 className={`w-4 h-4 ${currentProgress.step >= 2 ? "text-emerald-500" : "text-stone-600"}`} />
              <span className={currentProgress.step >= 2 ? "text-stone-200 font-semibold" : "text-stone-500"}>UI Agent</span>
              <div className="ml-auto text-xs">
                {currentProgress.step > 2 ? <span className="text-emerald-500">✓ Completed</span> : currentProgress.step === 2 ? <span className="text-indigo-400 animate-pulse">⏳ Running</span> : ""}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Server className={`w-4 h-4 ${currentProgress.step >= 3 ? "text-emerald-500" : "text-stone-600"}`} />
              <span className={currentProgress.step >= 3 ? "text-stone-200 font-semibold" : "text-stone-500"}>Backend Agent</span>
              <div className="ml-auto text-xs">
                {currentProgress.step > 4 ? <span className="text-emerald-500">✓ Completed</span> : currentProgress.step >= 3 ? <span className="text-indigo-400 animate-pulse">⏳ Running</span> : ""}
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <TestTube2 className={`w-4 h-4 ${currentProgress.step >= 3 ? "text-emerald-500" : "text-stone-600"}`} />
              <span className={currentProgress.step >= 3 ? "text-stone-200 font-semibold" : "text-stone-500"}>Testing Agent</span>
              <div className="ml-auto text-xs">
                {currentProgress.step > 4 ? <span className="text-emerald-500">✓ Completed</span> : currentProgress.step === 3 ? <span className="text-amber-400 animate-pulse">⚙️ Self-Healing</span> : currentProgress.step === 4 ? <span className="text-indigo-400 animate-pulse">⏳ Running</span> : ""}
              </div>
            </div>
            
          </div>
        </div>

        {/* RIGHT COLUMN: Feeds */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* AI Thinking Feed */}
          <div className="bg-[#1a1a1a] rounded-xl border border-white/10 p-5 flex flex-col min-h-[160px]">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">🧠 NEXO Brain</span>
            </div>
            
            {buildPhase === "fixing" ? (
              <div className="flex flex-col gap-2 text-sm font-mono">
                <div className="text-amber-400">🧠 Investigating error...</div>
                <div className="text-stone-400 mt-2">Issue detected in build pipeline.</div>
                <div className="text-indigo-400 mt-2 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Applying fixes and retrying...</div>
              </div>
            ) : (
              <div className="text-sm font-mono text-stone-300 whitespace-pre-wrap leading-relaxed flex flex-col gap-2">
                {subStatus && (
                  <div className="flex items-center gap-2 text-stone-400">
                    <ChevronRight className="w-4 h-4" />
                    {subStatus}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                  {realisticMessages[currentMessageIndex]}
                  <span className="w-2 h-4 bg-indigo-500 inline-block ml-1 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* Coding Feed */}
          <div className="bg-[#050505] rounded-xl border border-white/10 p-5 flex-1 overflow-hidden flex flex-col relative font-mono text-xs">
            <h3 className="text-stone-500 uppercase tracking-wider mb-4 font-sans font-bold flex items-center justify-between z-10">
              Coding Feed
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 z-10 scrollbar-hide">
              <AnimatePresence initial={false}>
                {logs.slice(-20).map((log, i) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-2 ${
                      log.type === "success" ? "text-emerald-400" :
                      log.type === "error" ? "text-red-400" :
                      "text-stone-300"
                    }`}
                  >
                    <span>{log.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
            
            {/* Fade overlay for bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-20" />
          </div>

        </div>

      </div>
    </motion.div>
  );
};
