import React from "react";
import { Monitor } from "lucide-react";
import { useRuntimeStore } from "../../stores/runtimeStore";
import { VisualDesignPanel } from "../editor/VisualDesignPanel";

interface PreviewPanelProps {
  isVisualMode: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ isVisualMode }) => {
  const { url, isBooted } = useRuntimeStore();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SET_VISUAL_MODE",
          enabled: isVisualMode,
        },
        "*",
      );
    }
  }, [isVisualMode]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      {url ? (
        <iframe
          ref={iframeRef}
          src={url}
          className="flex-1 w-full border-none shadow-inner"
          title="Preview"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-stone-400 gap-6 bg-stone-50/50">
          <div className="relative">
            <Monitor className="w-10 h-10 text-stone-200" />
            {!isBooted && (
              <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin scale-125 opacity-20" />
            )}
          </div>
          <div className="text-center space-y-0.5">
            <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-stone-600">
              {!isBooted ? "Booting Runtime" : "Waiting for Server"}
            </span>
          </div>
        </div>
      )}
      {isVisualMode && <VisualDesignPanel />}
    </div>
  );
};
