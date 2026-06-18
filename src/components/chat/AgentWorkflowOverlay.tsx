import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Loader2, FileCode, CheckCircle, AlertTriangle, ShieldCheck, HelpCircle, Terminal } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { useAgentEventStore } from "../../stores/agentEventStore";

export const AgentWorkflowOverlay: React.FC = () => {
  const { buildPhase, subStatus } = useProjectStore();
  
  const progress = useMemo(() => {
    switch (buildPhase) {
      case "planning": return 15;
      case "generating": return 45;
      case "building": return 70;
      case "fixing": return 85;
      case "deploying": return 95;
      case "done": return 100;
      default: return 0;
    }
  }, [buildPhase]);

  const phaseInfo = useMemo(() => {
    switch (buildPhase) {
      case "planning":
        return { stageName: "Intent & Design", name: "Requirements Extraction", description: "Classifying concepts and user requirements" };
      case "generating":
        return { stageName: "Generation", name: "Deep Code Generation", description: "Streaming file structures and modules" };
      case "building":
        return { stageName: "Compilation", name: "Live Sandbox Compile", description: "Vetting dependencies and booting containers" };
      case "fixing":
        return { stageName: "Quality & Audit", name: "Self-Healing Loop", description: "Repairing code and syntax warnings" };
      case "deploying":
        return { stageName: "Deployment", name: "Routing Live Preview", description: "Exposing public sandbox endpoints" };
      default:
        return { stageName: "Engine", name: "Initializing Workflow", description: "Preparing the multi-agent workspace squad" };
    }
  }, [buildPhase]);

  const { events, activeFiles, fileBuffers } = useAgentEventStore();

  const [elapsed, setElapsed] = useState(0);

  // Track elapsed time when build is active
  useEffect(() => {
    if (buildPhase === "idle" || buildPhase === "done") {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [buildPhase]);

  // Estimate remaining time based on current progress
  const eta = useMemo(() => {
    if (progress <= 0) return 60;
    if (progress >= 100) return 0;
    const estimatedTotal = 50; // default total build time in seconds
    return Math.max(3, Math.round(estimatedTotal - elapsed));
  }, [progress, elapsed]);

  // Extract the most recently active file
  const activeFilePath = useMemo(() => {
    if (activeFiles.size > 0) {
      return Array.from(activeFiles)[0];
    }
    // Fallback to last file_create or file_write event path
    const fileEvents = events.filter(e => e.type === "file_create" || e.type === "file_write" || e.type === "file_done");
    if (fileEvents.length > 0) {
      const lastEvent = fileEvents[fileEvents.length - 1];
      return (lastEvent as any).path || "";
    }
    return "";
  }, [activeFiles, events]);

  const activeFileContent = useMemo(() => {
    if (!activeFilePath) return "";
    return fileBuffers[activeFilePath] || "";
  }, [activeFilePath, fileBuffers]);

  // Get the last 4 events for the activity timeline
  const activityTimeline = useMemo(() => {
    return events
      .filter(e => ["thinking", "file_create", "file_done", "build_start", "build_success", "build_error", "auto_fix", "agent_switch", "done"].includes(e.type))
      .slice(-4)
      .reverse();
  }, [events]);

  // SVG Progress Ring calculations
  const radius = 56;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Helpers to render event types beautifully
  const getEventIcon = (type: string) => {
    switch (type) {
      case "thinking": return <BrainCircuit className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />;
      case "file_create": return <FileCode className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />;
      case "file_done": return <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />;
      case "build_start": return <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />;
      case "build_success": return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />;
      case "build_error": return <AlertTriangle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />;
      case "auto_fix": return <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-stone-400" />;
    }
  };

  const getEventText = (event: any) => {
    switch (event.type) {
      case "thinking": return event.message;
      case "file_create": return `Created file: ${event.path.split("/").pop()}`;
      case "file_done": return `Finalized compilation: ${event.path.split("/").pop()}`;
      case "build_start": return "Starting local dev container...";
      case "build_success": return "Dev server compiled successfully.";
      case "build_error": return `Build warning detected: ${event.message.substring(0, 40)}...`;
      case "auto_fix": return `Self-healing: fixing code issues (Attempt ${event.attempt}/${event.maxAttempts})`;
      case "agent_switch": return `Failover: Switching LLM agent to backup...`;
      case "done": return `Build completed successfully!`;
      default: return "Processing workflow step";
    }
  };

  // Determine stage visual accent color
  const getStageAccentColor = () => {
    switch (buildPhase) {
      case "planning": return "#3b82f6"; // Blue
      case "generating": return "#8b5cf6"; // Purple
      case "building": return "#f59e0b"; // Amber
      case "fixing": return "#10b981"; // Emerald
      case "deploying": return "#0ea5e9"; // Sky
      default: return "#0ea5e9";
    }
  };

  const accentColor = getStageAccentColor();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 select-none overflow-y-auto"
    >
      <div className="w-full max-w-lg flex flex-col items-center gap-6">
        
        {/* Cinematic Progress Ring & Logo */}
        <div className="relative flex items-center justify-center w-36 h-36">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              className="text-stone-100 dark:text-stone-800/60"
              strokeWidth={stroke}
              stroke="currentColor"
              fill="transparent"
              r={normalizedRadius}
              cx={radius + stroke}
              cy={radius + stroke}
            />
            {/* Active progress ring */}
            <motion.circle
              strokeWidth={stroke}
              strokeDasharray={circumference + " " + circumference}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              stroke={accentColor}
              fill="transparent"
              r={normalizedRadius}
              cx={radius + stroke}
              cy={radius + stroke}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </svg>
          
          {/* Central status card */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }} 
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-16 h-16 rounded-3xl bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800/80 flex items-center justify-center shadow-lg relative"
            >
              <BrainCircuit className="w-8 h-8" style={{ color: accentColor }} />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: accentColor }}></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5" style={{ backgroundColor: accentColor }}></span>
              </span>
            </motion.div>
            <span className="text-xs font-mono font-bold mt-1 text-stone-400 dark:text-stone-500">
              {progress}%
            </span>
          </div>
        </div>

        {/* Dynamic Status Header */}
        <div className="text-center space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            {phaseInfo ? `${phaseInfo.stageName} — ${phaseInfo.name}` : "Initializing Engine..."}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium leading-relaxed">
            {subStatus || phaseInfo?.description || "Analyzing application schema..."}
          </p>
        </div>

        {/* Live Code Streaming Container */}
        {activeFilePath && (
          <div className="w-full bg-[#09090b] border border-stone-800 rounded-xl overflow-hidden shadow-2xl text-left font-mono">
            <div className="bg-[#121214] px-4 py-2 border-b border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 select-none">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                <span className="truncate max-w-[280px] text-stone-300">{activeFilePath}</span>
              </div>
              <span className="text-[10px] text-stone-500 bg-stone-900 px-1.5 py-0.5 rounded">
                {activeFileContent.length.toLocaleString()} chars
              </span>
            </div>
            <div className="p-3.5 text-xs text-stone-300 h-28 overflow-hidden relative">
              <pre className="whitespace-pre-wrap break-all leading-relaxed opacity-90 select-text">
                {activeFileContent ? (
                  activeFileContent.length > 250 
                    ? `...${activeFileContent.substring(activeFileContent.length - 250)}` 
                    : activeFileContent
                ) : (
                  <span className="text-stone-600 italic">// Awaiting AI file stream buffer...</span>
                )}
                <span className="inline-block w-1.5 h-3.5 bg-indigo-500 ml-1 animate-pulse" />
              </pre>
              <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* Dynamic Activity Feed Timeline */}
        {activityTimeline.length > 0 && (
          <div className="w-full bg-stone-50/50 dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800/60 rounded-xl p-4 space-y-3 text-left">
            <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800/60 pb-1.5">
              Live Squad Timeline
            </div>
            <div className="space-y-2.5 max-h-[140px] overflow-hidden">
              <AnimatePresence initial={false}>
                {activityTimeline.map((evt, i) => (
                  <motion.div
                    key={evt.timestamp + "-" + i}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300"
                  >
                    <div className="mt-0.5 shrink-0">
                      {getEventIcon(evt.type)}
                    </div>
                    <span className="truncate font-medium flex-1">
                      {getEventText(evt)}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                      {Math.max(0, Math.floor((Date.now() - evt.timestamp) / 1000))}s ago
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Build Metrics & Elapsed Time */}
        <div className="w-full flex items-center justify-between border-t border-stone-100 dark:border-stone-800/60 pt-4 text-[10px] font-mono text-stone-400 dark:text-stone-500 select-none">
          <div className="flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: accentColor }} />
            <span>ETA: ~{eta}s remaining</span>
          </div>
          <div>
            <span>Elapsed: {elapsed}s</span>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

