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
  Globe,
  Loader2,
  Zap
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
    <div className="h-full flex flex-col bg-[#0F172A]/90 border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative group backdrop-blur-md">
      {/* Subtle ambient gradient mesh behind preview container */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-studio-accent/5 blur-[80px] pointer-events-none animate-glow z-0" />

      {/* Top Preview Toolbar */}
      <div className="h-12 bg-[#0F172A]/40 border-b border-white/5 flex items-center justify-between px-5 shrink-0 select-none gap-4 z-10 relative">
        {/* Device Switcher */}
        <div className="flex bg-[#070B14]/60 border border-white/5 p-0.5 rounded-xl">
          {[
            { id: "desktop", icon: Monitor, title: "Monitor Mode" },
            { id: "tablet", icon: Tablet, title: "Tablet Bezel" },
            { id: "mobile", icon: Smartphone, title: "Phone Emulator" },
          ].map((dev) => {
            const Icon = dev.icon;
            const isSel = deviceMode === dev.id;
            return (
              <button
                key={dev.id}
                onClick={() => setDeviceMode(dev.id as DeviceMode)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isSel
                    ? "bg-[#0F172A] text-studio-accent shadow-sm border border-white/5"
                    : "text-studio-muted hover:text-white"
                }`}
                title={dev.title}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>

        {/* Address Bar */}
        <div className="flex-grow max-w-sm flex items-center bg-[#070B14]/40 border border-white/5 rounded-xl px-3 py-1.5 gap-2.5 text-[11px] font-mono shadow-inner">
          <Globe className="w-3.5 h-3.5 text-studio-accent/75 shrink-0" />
          <input
            type="text"
            readOnly
            value={currentUrl}
            className="bg-transparent text-studio-muted outline-none w-full select-all font-medium"
          />
          <button
            onClick={handleCopyUrl}
            className="text-studio-muted hover:text-white shrink-0 font-bold text-[9px] uppercase tracking-wider transition-colors"
          >
            {copied ? <span className="text-emerald-400 font-bold">Copied!</span> : "Copy"}
          </button>
        </div>

        {/* Actions Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Selector */}
          <div className="flex items-center bg-[#070B14]/40 border border-white/5 rounded-xl px-2.5 py-1.5 gap-1.5 text-[10px] text-studio-muted font-bold">
            <span>Zoom:</span>
            <select
              value={zoomScale}
              onChange={(e) => setZoomScale(parseInt(e.target.value))}
              className="bg-transparent outline-none cursor-pointer border-none text-studio-muted focus:text-studio-accent font-sans"
            >
              {[50, 75, 90, 100].map((scale) => (
                <option key={scale} value={scale} className="bg-[#0F172A] text-studio-text">
                  {scale}%
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="p-2 bg-[#070B14]/40 hover:bg-white/5 border border-white/5 rounded-xl text-studio-muted hover:text-white transition-colors"
            title="Hot Reload Preview"
          >
            <RotateCw className="w-3.5 h-3.5 animate-in spin-in-12 duration-500" />
          </button>

          {/* New Tab Action */}
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="p-2 bg-[#070B14]/40 hover:bg-white/5 border border-white/5 rounded-xl text-studio-muted hover:text-white transition-colors flex items-center justify-center"
              title="Open Sandbox Endpoint"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          {/* Visual Editor Toggle */}
          {setIsVisualMode && (
            <button
              onClick={() => setIsVisualMode(!isVisualMode)}
              className={`p-2 rounded-xl border transition-all ${
                isVisualMode
                  ? "bg-studio-accent/10 text-studio-accent border-studio-accent/25"
                  : "bg-[#070B14]/40 text-studio-muted border-white/5 hover:bg-white/5 hover:text-white"
              }`}
              title="Visual Element Editor"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div className="flex-1 bg-transparent flex items-center justify-center p-6 overflow-auto relative z-10">
        {isBooted ? (
          <div
            className="transition-all duration-500 origin-center flex items-center justify-center w-full h-full"
            style={{ transform: `scale(${zoomScale / 100})` }}
          >
            {/* DESKTOP BROWSER FRAME */}
            {deviceMode === "desktop" && (
              <div className="w-full h-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-white/5 overflow-hidden relative transition-all duration-300 animate-in fade-in zoom-in-95 duration-300">
                {/* Fake Browser Headers bar */}
                <div className="h-7 w-full bg-[#0F172A]/70 border-b border-white/5 px-3 flex items-center gap-1.5 select-none shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div className="h-4 w-48 bg-[#070B14]/50 border border-white/5 rounded ml-4 flex items-center px-2 text-[9px] text-studio-muted select-none">
                    localhost:5173
                  </div>
                </div>
                <iframe
                  key={previewKey}
                  ref={iframeRef}
                  src={currentUrl}
                  className="w-full h-full border-none bg-white"
                  title="Studio Live Desktop"
                />
              </div>
            )}

            {/* TABLET VIEW (iPad frame bezel) */}
            {deviceMode === "tablet" && (
              <div className="w-[580px] h-[720px] rounded-[36px] border-[16px] border-slate-850 bg-black flex flex-col overflow-hidden relative shadow-[0_30px_80px_rgba(0,0,0,0.15)] ring-1 ring-slate-800 transition-all duration-300">
                {/* Camera indicator */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-900 z-30" />
                <div className="flex-1 bg-white relative">
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-none bg-white"
                    title="Studio Live Tablet"
                  />
                </div>
              </div>
            )}

            {/* MOBILE VIEW (iPhone bezel) */}
            {deviceMode === "mobile" && (
              <div className="w-[330px] h-[620px] rounded-[48px] border-[12px] border-slate-850 bg-black flex flex-col overflow-hidden relative shadow-[0_30px_80px_rgba(0,0,0,0.15)] ring-1 ring-slate-800 transition-all duration-300">
                {/* Dynamic Island Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5.5 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-zinc-900 mr-7" />
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                </div>

                {/* Status Bar Indicators */}
                <div className="h-6 w-full px-6 flex justify-between items-center text-[9px] font-bold text-zinc-900 bg-white select-none shrink-0 z-20 pointer-events-none font-sans">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3 text-zinc-900" />
                    <Battery className="w-3.5 h-3.5 text-zinc-900" />
                  </div>
                </div>

                {/* Content Viewport */}
                <div className="flex-1 bg-white relative">
                  <iframe
                    key={previewKey}
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-none bg-white"
                    title="Studio Live Mobile"
                  />
                </div>

                {/* Home indicator strip */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-zinc-800 rounded-full z-30 pointer-events-none" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-grow h-full flex flex-col items-center justify-center text-studio-text gap-6 bg-[#0F172A]/50 backdrop-blur-md rounded-3xl border border-white/5 select-none relative overflow-hidden">
            {/* Ambient loading glow orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-studio-accent/20 blur-[50px] pointer-events-none animate-pulse" />

            <div className="w-16 h-16 bg-[#070B14]/80 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl relative z-10">
              <div className="w-8 h-8 border-2 border-studio-accent/25 border-t-studio-accent rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-1.5 relative z-10">
              <span className="block text-xs font-black tracking-[0.2em] text-studio-text uppercase animate-pulse">
                Assembling Sandbox
              </span>
              <span className="block text-[10px] text-studio-muted font-medium">
                Booting local server container & hot-reload sockets...
              </span>
            </div>
          </div>
        )}

        {isVisualMode && <VisualDesignPanel />}
      </div>

      {/* Floating active app running indicator (Bottom Bezel Info) */}
      {isBooted && (
        <div className="absolute bottom-4 right-4 bg-[#0F172A]/85 backdrop-blur-md border border-white/5 py-1 px-3 rounded-full text-[9px] text-emerald-400 font-bold flex items-center gap-1.5 shadow-lg select-none z-20">
          <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>APP RUNNING</span>
        </div>
      )}
    </div>
  );
};
