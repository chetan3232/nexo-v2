import React, { useState, useRef, useEffect } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Check,
  Sliders,
  Wifi,
  Battery,
  Globe
} from "lucide-react";
import { useRuntimeStore } from "../../stores/runtimeStore";
import { useProjectStore } from "../../stores/projectStore";
import { VisualDesignPanel } from "../editor/VisualDesignPanel";

interface PreviewPanelProps {
  isVisualMode: boolean;
  setIsVisualMode?: (val: boolean) => void;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  isVisualMode,
  setIsVisualMode
}) => {
  const { url, isBooted } = useRuntimeStore();
  const { previewKey, incrementPreviewKey } = useProjectStore();
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [zoomScale, setZoomScale] = useState<number>(100);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync visual mode state to iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SET_VISUAL_MODE",
          enabled: isVisualMode,
        },
        "*",
      );
    }
  }, [isVisualMode, previewKey]);

  const handleRefresh = () => {
    incrementPreviewKey();
  };

  const handleCopyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentUrl = url || "http://localhost:5173/";

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-zinc-300 overflow-hidden border border-zinc-900 rounded-2xl shadow-xl">
      {/* Top Preview Toolbar */}
      <div className="h-11 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 shrink-0 select-none gap-4">
        {/* Device Switcher */}
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800/80">
          {[
            { id: "desktop", icon: Monitor, title: "Desktop Preview" },
            { id: "tablet", icon: Tablet, title: "Tablet Preview" },
            { id: "mobile", icon: Smartphone, title: "Mobile Preview" },
          ].map((dev) => {
            const Icon = dev.icon;
            return (
              <button
                key={dev.id}
                onClick={() => setDeviceMode(dev.id as DeviceMode)}
                className={`p-1.5 rounded-md transition-all ${
                  deviceMode === dev.id
                    ? "bg-zinc-800 text-indigo-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                title={dev.title}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        {/* Address Bar */}
        <div className="flex-grow max-w-md flex items-center bg-zinc-900 border border-zinc-800/80 rounded-lg px-3 py-1 gap-2 text-xs font-mono">
          <Globe className="w-3.5 h-3.5 text-zinc-650 shrink-0" />
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="bg-transparent text-zinc-450 outline-none w-full select-all"
          />
          <button
            onClick={handleCopyUrl}
            className="text-zinc-500 hover:text-zinc-300 shrink-0 font-bold text-[10px] uppercase tracking-wider"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : "Copy"}
          </button>
        </div>

        {/* Actions Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Selector */}
          <div className="flex items-center bg-zinc-900 rounded-lg px-2 py-1 gap-1 border border-zinc-800/80 text-[10px] text-zinc-450 font-bold">
            <span>Zoom:</span>
            <select
              value={zoomScale}
              onChange={(e) => setZoomScale(parseInt(e.target.value))}
              className="bg-transparent outline-none cursor-pointer border-none text-zinc-400"
            >
              {[50, 75, 90, 100].map((scale) => (
                <option key={scale} value={scale} className="bg-zinc-950 text-zinc-300">
                  {scale}%
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="p-1.5 bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg transition-all"
            title="Refresh Live Preview"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* New Tab Action */}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800 rounded-lg transition-all flex items-center justify-center"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Visual Editor Toggle */}
          {setIsVisualMode && (
            <button
              onClick={() => setIsVisualMode(!isVisualMode)}
              className={`p-1.5 rounded-lg border transition-all ${
                isVisualMode
                  ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
              }`}
              title="Visual Designer Mode"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Screen */}
      <div className="flex-1 bg-zinc-900 flex items-center justify-center p-6 overflow-auto relative">
        {isBooted ? (
          <div
            className="transition-all duration-300 origin-center flex items-center justify-center w-full h-full"
            style={{ transform: `scale(${zoomScale / 100})` }}
          >
            {/* DESKTOP MODE */}
            {deviceMode === "desktop" && (
              <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden relative">
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full h-full border-none"
                  title="Live Desktop Preview"
                />
              </div>
            )}

            {/* TABLET MODE (iPad Viewport) */}
            {deviceMode === "tablet" && (
              <div className="w-[580px] h-[740px] rounded-[32px] border-[14px] border-zinc-850 bg-black flex flex-col overflow-hidden relative shadow-2xl ring-1 ring-zinc-800/80">
                <div className="flex-1 bg-white relative">
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-none"
                    title="Live Tablet Preview"
                  />
                </div>
              </div>
            )}

            {/* MOBILE MODE (iPhone Viewport) */}
            {deviceMode === "mobile" && (
              <div className="w-[340px] h-[640px] rounded-[44px] border-[12px] border-zinc-850 bg-black flex flex-col overflow-hidden relative shadow-2xl ring-1 ring-zinc-800/80">
                {/* Notch Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5.5 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 mr-8" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                </div>

                {/* Mock Status Bar */}
                <div className="h-6 w-full px-6 flex justify-between items-center text-[10px] font-bold text-zinc-700 bg-white select-none shrink-0 z-20 pointer-events-none">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3.5 h-3.5 text-zinc-700" />
                    <Battery className="w-3.5 h-3.5 text-zinc-700" />
                  </div>
                </div>

                {/* Main Viewport */}
                <div className="flex-1 bg-white relative">
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-none"
                    title="Live Mobile Preview"
                  />
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-800 rounded-full z-30 pointer-events-none" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow h-full flex flex-col items-center justify-center text-zinc-500 gap-6 bg-zinc-950">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center shadow-lg">
                <Monitor className="w-8 h-8 text-zinc-650" />
              </div>
              <div className="absolute -inset-1.5 border border-indigo-500/25 border-t-indigo-500 rounded-2xl animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                Booting Live Sandbox
              </span>
              <span className="block text-[10px] text-zinc-600">
                Setting up node runtime container in your browser...
              </span>
            </div>
          </div>
        )}

        {isVisualMode && <VisualDesignPanel />}
      </div>
    </div>
  );
};
