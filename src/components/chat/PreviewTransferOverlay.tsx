import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Rocket, Server, Box, Monitor } from "lucide-react";

interface PreviewTransferOverlayProps {
  onComplete: () => void;
}

export const PreviewTransferOverlay: React.FC<PreviewTransferOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = 4500; // Total fake loading time
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

  const renderBar = (label: string, icon: React.ReactNode, isActive: boolean, isDone: boolean, percent: number) => {
    return (
      <div className={`flex flex-col gap-2 transition-all duration-300 ${isActive || isDone ? "opacity-100" : "opacity-40"}`}>
        <div className="flex items-center justify-between text-xs font-bold text-[#111] uppercase tracking-wider">
          <div className="flex items-center gap-2">
            {icon}
            {label}
          </div>
          <span>{isDone ? 100 : isActive ? Math.floor(percent) : 0}%</span>
        </div>
        <div className="h-2 w-full bg-[#f3f3f3] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${isDone ? "bg-emerald-500" : "bg-indigo-600"}`} 
            style={{ width: `${isDone ? 100 : isActive ? percent : 0}%` }} 
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
      className="absolute inset-0 bg-[#f7f7f7] z-50 flex flex-col items-center justify-center p-6"
    >
      <div className="bg-white border border-[#e8e8e8] rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col">
        
        <div className="flex items-center gap-3 border-b border-[#e8e8e8] pb-4 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#111]">Launching Application</h2>
            <p className="text-xs text-[#666]">Transferring to live preview...</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {renderBar("Deploying Sandbox", <Box className="w-4 h-4" />, step === 1, step > 1, progress * 3)}
          {renderBar("Starting Server", <Server className="w-4 h-4" />, step === 2, step > 2, (progress - 33) * 3)}
          {renderBar("Opening Preview", <Monitor className="w-4 h-4" />, step === 3, step > 3, (progress - 66) * 3)}
        </div>

      </div>
    </motion.div>
  );
};
