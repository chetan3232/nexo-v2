import React, { useRef, useEffect } from "react";
import { Monitor, Loader2, Zap } from "lucide-react";
import { useRuntimeStore } from "../../stores/runtimeStore";
import { useProjectStore } from "../../stores/projectStore";
import { VisualDesignPanel } from "../editor/VisualDesignPanel";

interface PreviewPanelProps {
  isVisualMode: boolean;
  setIsVisualMode?: (val: boolean) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  isVisualMode,
  setIsVisualMode,
}) => {
  const { url, isBooted } = useRuntimeStore();
  const { previewKey } = useProjectStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentUrl = url || "http://localhost:5173/";

  // Sync visual mode state to iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_VISUAL_MODE", enabled: isVisualMode },
        "*",
      );
    }
  }, [isVisualMode, previewKey]);

  return (
    <div className="h-full w-full relative overflow-hidden bg-white">
      {isBooted ? (
        <>
          <iframe
            key={previewKey}
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-none bg-white"
            title="Preview"
          />
          {/* Live indicator */}
          <div className="absolute bottom-3 right-3 bg-white/90 border border-[#e8e8e8] py-1 px-2.5 rounded-full text-[9px] text-emerald-600 font-semibold flex items-center gap-1.5 shadow-sm select-none z-10">
            <Zap className="w-2.5 h-2.5 text-emerald-500" />
            Live
          </div>
        </>
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white">
          <Monitor className="w-10 h-10 text-[#ddd]" strokeWidth={1} />
          <span className="text-[10px] font-bold text-[#bbb] uppercase tracking-[0.25em]">
            Booting Runtime
          </span>
        </div>
      )}

      {isVisualMode && <VisualDesignPanel />}
    </div>
  );
};
