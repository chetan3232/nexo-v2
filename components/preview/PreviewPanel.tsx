import React, { useState, useEffect } from 'react';
import { RefreshCw, Globe, ArrowLeft, Paintbrush } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { DevServerService } from '../../services/runtime/devServer';
import { checkErrorAndTriggerHeal } from '../../services/runtime/errorCapture';
import { Orchestrator } from '../../agents/Orchestrator';

export const PreviewPanel: React.FC = () => {
  const files = useProjectStore((state) => state.files);
  const updateFile = useProjectStore((state) => state.updateFile);
  
  const [previewKey, setPreviewKey] = useState(0);
  const [activeElement, setActiveElement] = useState<{ tagName: string; className: string; textContent: string } | null>(null);
  
  // Custom Visual Style color tool picker state
  const [pickedColor, setPickedColor] = useState('#4f46e5');

  // Trigger preview compilation
  const srcDoc = React.useMemo(() => {
    return DevServerService.compilePreview({
      files,
      mainFile: 'App.tsx',
      template: 'react',
    });
  }, [files, previewKey]);

  // postMessage Listener
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const { type, message, tagName, className, textContent } = e.data;
      if (type === 'CONSOLE_ERROR') {
        const orchestrator = new Orchestrator();
        checkErrorAndTriggerHeal(message, orchestrator);
      }
      if (type === 'ELEMENT_CLICKED') {
        setActiveElement({ tagName, className, textContent: textContent || '' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [files]);

  // Synchronizes chosen colors back to the React active document code
  const handleApplyVisualStyles = () => {
    if (!activeElement) return;
    
    // Find App.tsx code
    const appCode = files['App.tsx'] || '';
    if (!appCode) return;

    // Simple replacement heuristic to sync colors back: 
    // We look for color classes in standard Tailwind components matching activeElement tag and inject/replace classes.
    // To make it very generic and robust for the demo, we update primary backgrounds or texts.
    let modifiedCode = appCode;
    
    if (appCode.includes('bg-indigo-600')) {
      modifiedCode = appCode.replace(/bg-indigo-600/g, `bg-[${pickedColor}]`);
    } else if (appCode.includes('bg-indigo-500')) {
      modifiedCode = appCode.replace(/bg-indigo-500/g, `bg-[${pickedColor}]`);
    } else {
      // If no color was found, append as inline style to the matching element tag as demonstration
      const regex = new RegExp(`(<${activeElement.tagName.toLowerCase()}[^>]*className="[^"]*)(")`, 'i');
      modifiedCode = appCode.replace(regex, `$1 bg-[${pickedColor}] text-white$2`);
    }

    updateFile('App.tsx', modifiedCode);
    setPreviewKey((k) => k + 1);
    setActiveElement(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#121214] text-stone-200 overflow-hidden">
      
      {/* Sandbox Header bar */}
      <div className="h-10 bg-[#09090b] border-b border-stone-900 flex items-center justify-between px-6 shrink-0 select-none">
        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
          <Globe className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> sandbox:3000
        </div>
        <button
          onClick={() => setPreviewKey((k) => k + 1)}
          className="p-1.5 hover:bg-white/5 rounded-lg text-stone-400 hover:text-white transition-colors"
          title="Refresh server"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main split: Sandbox frame + live visual selector tools */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Iframe View */}
        <div className="flex-1 min-h-0 bg-[#0d0d0f]">
          <iframe
            key={previewKey}
            title="NEXO Sandbox Preview"
            srcDoc={srcDoc}
            className="w-full h-full border-none bg-white"
          />
        </div>

        {/* Visual styles custom controls drawer */}
        {activeElement && (
          <div className="w-60 bg-[#09090b] border-l border-stone-900 p-4 flex flex-col justify-between shrink-0 select-none animate-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Paintbrush className="w-4 h-4 text-indigo-400" /> Visual CSS Sync
              </div>
              
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1.5 text-[10px] font-mono">
                <div><span className="text-indigo-400">Tag:</span> {activeElement.tagName}</div>
                <div className="truncate"><span className="text-indigo-400">Class:</span> {activeElement.className || 'None'}</div>
                <div className="truncate"><span className="text-indigo-400">Content:</span> {activeElement.textContent || 'None'}</div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Sync Element Color</label>
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={pickedColor}
                    onChange={(e) => setPickedColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-stone-300">{pickedColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleApplyVisualStyles}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Sync Code
              </button>
              <button
                onClick={() => setActiveElement(null)}
                className="w-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
export default PreviewPanel;
