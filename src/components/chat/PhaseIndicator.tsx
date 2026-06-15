import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  Layers,
  Zap,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import {
  useBuildPhaseStore,
  BUILD_PHASES,
  STAGE_COLORS,
  type BuildPhaseDefinition,
} from "../../stores/buildPhaseStore";

const stageIcons: Record<string, React.ElementType> = {
  A: Palette,
  B: Layers,
  C: Zap,
  D: Rocket,
};

export const PhaseIndicator: React.FC = () => {
  const currentPhaseId = useBuildPhaseStore((s) => s.currentPhaseId);
  const completedPhases = useBuildPhaseStore((s) => s.completedPhases);

  const currentPhase = useMemo(
    () => BUILD_PHASES.find((p) => p.id === currentPhaseId) || null,
    [currentPhaseId]
  );

  const progress = useMemo(() => {
    if (currentPhaseId <= 0) return 0;
    if (currentPhaseId >= 12) return 100;
    return Math.round((currentPhaseId / 12) * 100);
  }, [currentPhaseId]);

  const stageColor = currentPhase
    ? STAGE_COLORS[currentPhase.stage]
    : null;

  if (currentPhaseId <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full px-3 select-none"
    >
      <div className="bg-white rounded-xl border border-[#e8e8e8] shadow-sm p-3">
        {/* Phase label + progress */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {stageColor && (
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: stageColor.hex }}
              />
            )}
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#888]">
              {stageColor?.label || "Processing"}
            </span>
            {currentPhase && (
              <span className="text-[10px] font-semibold text-[#555]">
                — Phase {currentPhase.id}: {currentPhase.name}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold text-[#aaa]">{progress}%</span>
        </div>

        {/* 12-segment progress bar */}
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-[#f3f3f3]">
          {BUILD_PHASES.map((phase) => {
            const isCompleted = completedPhases.has(phase.id) || phase.id < currentPhaseId;
            const isCurrent = phase.id === currentPhaseId;
            const color = STAGE_COLORS[phase.stage]?.hex || "#cbd5e1";

            return (
              <div
                key={phase.id}
                className="flex-1 rounded-full transition-all duration-500 relative overflow-hidden"
                style={{
                  backgroundColor: isCompleted
                    ? color
                    : isCurrent
                    ? `${color}40`
                    : "transparent",
                }}
                title={`Phase ${phase.id}: ${phase.name}`}
              >
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Description */}
        {currentPhase && (
          <p className="text-[10px] text-[#aaa] mt-1.5 truncate">
            {currentPhase.description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ── Compact version for sidebar/header ──
export const PhaseIndicatorCompact: React.FC = () => {
  const currentPhaseId = useBuildPhaseStore((s) => s.currentPhaseId);

  const currentPhase = useMemo(
    () => BUILD_PHASES.find((p) => p.id === currentPhaseId) || null,
    [currentPhaseId]
  );

  if (!currentPhase || currentPhaseId <= 0) return null;

  const stageColor = STAGE_COLORS[currentPhase.stage];
  const StageIcon = stageIcons[currentPhase.stage] || Zap;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
      style={{
        borderColor: `${stageColor.hex}30`,
        backgroundColor: `${stageColor.hex}08`,
      }}
    >
      <StageIcon
        className="w-3.5 h-3.5 animate-pulse"
        style={{ color: stageColor.hex }}
      />
      <span
        className="text-[11px] font-semibold"
        style={{ color: stageColor.hex }}
      >
        {currentPhase.name}
      </span>
      <span className="text-[10px] font-bold text-[#aaa]">
        {currentPhase.id}/12
      </span>
    </motion.div>
  );
};
