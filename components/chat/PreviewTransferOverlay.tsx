import React from 'react';
import { Loader2, Server, Globe, ArrowRight } from 'lucide-react';

interface PreviewTransferOverlayProps {
  onComplete: () => void;
}

export const PreviewTransferOverlay: React.FC<PreviewTransferOverlayProps> = ({ onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b]/95 backdrop-blur-md text-white p-6 flex items-center justify-center font-sans select-none">
      <div className="max-w-md w-full bg-stone-900/80 border border-white/10 rounded-[2.5rem] p-8 space-y-6 text-center shadow-2xl relative">
        <div className="flex items-center justify-center gap-6 py-4">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
            <Server className="w-6 h-6 animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 text-stone-500 animate-spin" />
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
            <Globe className="w-6 h-6 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold">Deploying local sandbox...</h2>
          <p className="text-stone-400 text-xs font-light">Starting local node development container, exposing port 3000, and preparing styling iframe listeners...</p>
        </div>

        <div className="text-[10px] font-mono text-stone-500 uppercase tracking-widest animate-pulse">
          Starting webpack dev server...
        </div>
      </div>
    </div>
  );
};
export default PreviewTransferOverlay;
