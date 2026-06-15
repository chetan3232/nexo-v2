import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Server, Box, Monitor, CheckCircle2 } from "lucide-react";

interface PreviewTransferOverlayProps {
  onComplete: () => void;
}

export const PreviewTransferOverlay: React.FC<PreviewTransferOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  useEffect(() => {
    const totalDuration = 4500; // Total loading time
    const intervalTime = 50;
    const stepsCount = totalDuration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const p = Math.min((currentStep / stepsCount) * 100, 100);
      setProgress(p);

      if (p > 95) setStep(4);
      else if (p > 66) setStep(3);
      else if (p > 33) setStep(2);

      if (p === 100) {
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Log simulation matching the steps
  useEffect(() => {
    if (step === 1 && consoleLogs.length === 0) {
      setConsoleLogs([
        "Initializing sandboxed WebContainer environment...",
        "Resolving local file tree structure...",
        "Setting up virtual package manager..."
      ]);
    } else if (step === 2 && consoleLogs.length < 5) {
      setConsoleLogs(prev => [
        ...prev,
        "Installing project dependencies from workspace cache...",
        "Vite dev server starting on host container...",
        "Binding listener to virtual local port 5173..."
      ]);
    } else if (step === 3 && consoleLogs.length < 8) {
      setConsoleLogs(prev => [
        ...prev,
        "Injecting visual-editor proxy middleware...",
        "Establishing Hot Module Replacement connection...",
        "Active sandbox frame bound to localhost:5173"
      ]);
    }
  }, [step, consoleLogs]);

  const renderBar = (label: string, icon: React.ReactNode, isActive: boolean, isDone: boolean, percent: number) => {
    return (
      <div className={`flex flex-col gap-2 transition-all duration-300 ${isActive || isDone ? "opacity-100" : "opacity-40"}`}>
        <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className={isDone ? "text-emerald-500" : isActive ? "text-indigo-500" : ""}>
              {icon}
            </span>
            <span>{label}</span>
          </div>
          <span className="font-mono text-[10px] text-stone-400 dark:text-stone-500">
            {isDone ? "100" : isActive ? Math.floor(percent) : "0"}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${isDone ? "bg-emerald-500" : "bg-indigo-600"}`} 
            style={{ width: `${isDone ? 100 : isActive ? percent : 0}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#f7f7f7] dark:bg-[#0c0c0e] z-50 flex flex-col items-center justify-center p-6"
    >
      <div className="bg-white dark:bg-[#121214] border border-[#e8e8e8] dark:border-stone-800/80 rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col">
        
        <div className="flex items-center gap-3.5 border-b border-stone-100 dark:border-stone-800/60 pb-5 mb-5">
          <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
            <Rocket className="w-5.5 h-5.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">Launching Application</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">Transferring compilation to live preview</p>
          </div>
        </div>

        {/* Action steps */}
        <div className="flex flex-col gap-5 mb-5">
          {renderBar("Deploying Sandbox", <Box className="w-4 h-4" />, step === 1, step > 1, progress * 3)}
          {renderBar("Starting Server", <Server className="w-4 h-4" />, step === 2, step > 2, (progress - 33) * 3)}
          {renderBar("Opening Preview", <Monitor className="w-4 h-4" />, step === 3, step > 3, (progress - 66) * 3)}
        </div>

        {/* Micro Console Output */}
        <div className="bg-[#09090b] border border-stone-800 rounded-xl p-3 font-mono text-[10px] text-stone-400 h-24 overflow-y-auto flex flex-col gap-1 text-left">
          {consoleLogs.map((log, i) => (
            <div key={i} className="flex gap-1.5 leading-relaxed">
              <span className="text-indigo-500 select-none">$</span>
              <span className="text-stone-300 truncate">{log}</span>
            </div>
          ))}
          {step < 4 && (
            <div className="flex items-center gap-1 text-stone-500">
              <span className="text-indigo-500 animate-pulse">$</span>
              <span className="animate-pulse">_</span>
            </div>
          )}
          {step === 4 && (
            <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Sandbox ready. Redirecting...</span>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};
