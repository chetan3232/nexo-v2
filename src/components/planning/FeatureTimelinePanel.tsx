import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, FastForward, Cpu, CheckCircle2, Circle, Layout, Database, Check } from "lucide-react";
import { useGenerationWorkflowStore } from "../../stores/generationWorkflowStore";
import toast from "react-hot-toast";

interface Step {
  id: number;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

const STEPS: Step[] = [
  { id: 1, label: "UI Complete", description: "Generating pages layout and base interface views", icon: Layout },
  { id: 2, label: "Components", description: "Building reusable components and interactive widgets", icon: Cpu },
  { id: 3, label: "Backend", description: "Configuring mock endpoints, data stores and state handlers", icon: Database },
  { id: 4, label: "Testing", description: "Running safety review and automated quality tests", icon: CheckCircle2 }
];

export const FeatureTimelinePanel: React.FC = () => {
  const { startImplementation } = useGenerationWorkflowStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progresses, setProgresses] = useState<number[]>([0, 0, 0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setProgresses((prev) => {
        const next = [...prev];
        const currentProgress = next[currentStepIndex];

        if (currentProgress < 100) {
          // Increment progress by 5% every 100ms
          next[currentStepIndex] = Math.min(currentProgress + 5, 100);
          return next;
        } else {
          // Current step is 100% complete
          if (currentStepIndex < 3) {
            setCurrentStepIndex((prevIdx) => prevIdx + 1);
          } else {
            // All steps finished
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            toast.success("Timeline review complete! Proceeding to implementation.");
            startImplementation();
          }
          return next;
        }
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentStepIndex, isPaused, startImplementation]);

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    toast.success("Skipping timeline... Commencing code generation 🚀");
    startImplementation();
  };

  const handlePause = () => {
    setIsPaused(true);
    toast.success("Timeline progression paused.");
  };

  const handleResume = () => {
    setIsPaused(false);
    toast.success("Timeline progression resumed.");
  };

  // Helper to generate the text-based retro progress bar (e.g. ████░░░░░░)
  const getBlockyProgressBar = (progress: number) => {
    const totalBlocks = 10;
    const filledBlocks = Math.floor(progress / 10);
    const emptyBlocks = totalBlocks - filledBlocks;
    return "█".repeat(filledBlocks) + "░".repeat(emptyBlocks);
  };

  return (
    <div className="h-full w-full flex flex-col bg-stone-50 overflow-hidden relative">
      {/* Header */}
      <div className="h-[64px] border-b border-stone-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 animate-pulse">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-sm uppercase tracking-tight">Phase 17 — Feature Timeline</h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              Previewing build timeline before implementation
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isPaused ? (
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          )}
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95"
          >
            <FastForward className="w-3.5 h-3.5" />
            Skip
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto w-full flex flex-col justify-center">
        <div className="space-y-6 bg-white border border-stone-200 rounded-[2rem] p-8 shadow-sm">
          <div className="border-b border-stone-100 pb-4 mb-2">
            <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">Build Pipeline</span>
            <h2 className="text-xl font-black text-stone-900 tracking-tight mt-1 uppercase">Pre-Flight Orchestration</h2>
          </div>

          <div className="space-y-6">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const progress = progresses[idx];
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              const blockyBar = getBlockyProgressBar(progress);

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-2xl transition-all border ${
                    isActive
                      ? "bg-indigo-50/30 border-indigo-150 shadow-sm"
                      : isCompleted
                      ? "bg-stone-50/50 border-stone-100 opacity-80"
                      : "bg-white border-stone-100/50 opacity-50"
                  }`}
                >
                  {/* Status Indicator */}
                  <div className="mt-1">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : isActive ? (
                      <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 animate-spin" style={{ animationDuration: "3s" }}>
                        <StepIcon className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                        <Circle className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {/* Step details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                        Step {step.id}
                      </span>
                      {isActive && !isPaused && (
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                          Analyzing & Scaffolding
                        </span>
                      )}
                      {isPaused && isActive && (
                        <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[9px] font-black uppercase rounded-full">
                          Paused
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-stone-900 text-sm tracking-tight mt-0.5 uppercase">
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-stone-400 font-medium leading-relaxed mt-0.5">
                      {step.description}
                    </p>

                    {/* Progress Bar Container */}
                    <div className="mt-3 space-y-1.5">
                      {/* Retro block progress bar */}
                      <div className="font-mono text-xs text-indigo-600 font-bold select-none tracking-tight">
                        {blockyBar} <span className="ml-1 text-[10px] font-bold text-stone-500">{progress}%</span>
                      </div>

                      {/* Smooth standard progress bar */}
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
