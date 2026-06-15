import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Globe, Paintbrush, Edit3 } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useVisualEditorStore } from '../../stores/visualEditorStore';
import { DevServerService } from '../../services/runtime/devServer';
import { checkErrorAndTriggerHeal } from '../../services/runtime/errorCapture';
import { Orchestrator } from '../../agents/Orchestrator';

export const PreviewPanel: React.FC = () => {
  const files = useProjectStore((state) => state.files);
  const updateFile = useProjectStore((state) => state.updateFile);
  
  // Zustand visual editor states
  const visualMode = useVisualEditorStore((state) => state.visualMode);
  const setVisualMode = useVisualEditorStore((state) => state.setVisualMode);
  const selectedElement = useVisualEditorStore((state) => state.selectedElement);
  const setSelectedElement = useVisualEditorStore((state) => state.setSelectedElement);
  const clearSelectedElement = useVisualEditorStore((state) => state.clearSelectedElement);

  const [previewKey, setPreviewKey] = useState(0);
  const [pickedColor, setPickedColor] = useState('#6366f1');
  const [editedClass, setEditedClass] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Sync edited class local state when selectedElement changes
  useEffect(() => {
    if (selectedElement) {
      setEditedClass(selectedElement.className || '');
    }
  }, [selectedElement]);

  // Sync visual inspect outlines mode status to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SET_VISUAL_MODE',
        visualMode
      }, '*');
    }
  }, [visualMode, previewKey]);

  // Compile active workspace code
  const srcDoc = React.useMemo(() => {
    return DevServerService.compilePreview({
      files,
      mainFile: 'App.tsx',
      template: 'react',
    });
  }, [files, previewKey]);

  // postMessage event listeners
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const { type, message, id, tagName, className, textContent } = e.data;
      
      if (type === 'CONSOLE_ERROR') {
        const orchestrator = new Orchestrator();
        checkErrorAndTriggerHeal(message, orchestrator);
      }
      
      if (type === 'ELEMENT_SELECTED') {
        setSelectedElement({ id, tagName, className, textContent });
      }

      if (type === 'STYLE_SYNCED') {
        console.log(`[VisualEditor] Styling synced successfully for element ${id}`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [files, setSelectedElement]);

  // Appends chosen picker color classes directly to classes input
  const handleApplyColor = (color: string) => {
    setPickedColor(color);
    
    // Replace hex color bg configs, or append bg-[color]
    let classes = editedClass;
    if (classes.includes('bg-[')) {
      classes = classes.replace(/bg-\[[^\]]+\]/g, `bg-[${color}]`);
    } else {
      classes += ` bg-[${color}]`;
    }
    setEditedClass(classes);

    // Apply live dynamic styles inside iframe instantly
    if (selectedElement?.id && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_STYLE',
        id: selectedElement.id,
        styleClass: classes
      }, '*');
    }
  };

  // Synchronizes visual selector styles changes back to active source code file
  const handleApplyVisualStyles = () => {
    if (!selectedElement) return;
    
    const appCode = files['App.tsx'] || '';
    if (!appCode) return;

    let modifiedCode = appCode;
    
    if (selectedElement.className) {
      // Escape special characters to match exactly
      const escapedClass = selectedElement.className.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`className=["']${escapedClass}["']`, 'g');
      
      if (regex.test(appCode)) {
        modifiedCode = appCode.replace(regex, `className="${editedClass}"`);
      } else {
        // Fallback replacement if class sequence differs slightly
        const partialRegex = new RegExp(`className=["']([^"']*)${escapedClass}([^"']*)["']`, 'g');
        modifiedCode = appCode.replace(partialRegex, `className="$1${editedClass}$2"`);
      }
    } else {
      // Append className to tag directly
      const regex = new RegExp(`(<${selectedElement.tagName.toLowerCase()}[^>]*)(>)`, 'i');
      modifiedCode = appCode.replace(regex, `$1 className="${editedClass}"$2`);
    }

    updateFile('App.tsx', modifiedCode);
    clearSelectedElement();
    setPreviewKey((k) => k + 1);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#121214] text-stone-200 overflow-hidden">
      
      {/* Sandbox Header bar */}
      <div className="h-10 bg-[#09090b] border-b border-stone-900 flex items-center justify-between px-6 shrink-0 select-none">
        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500">
          <Globe className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> sandbox:3000
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVisualMode(!visualMode)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
              visualMode
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-white/5 text-stone-400 hover:text-white'
            }`}
            title="Inspect & Edit UI Element"
          >
            <Paintbrush className="w-3.5 h-3.5" /> {visualMode ? 'Inspecting' : 'Inspect UI'}
          </button>
          
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-stone-400 hover:text-white transition-colors"
            title="Refresh sandbox dev server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main split: Sandbox frame + live visual selector tools */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Iframe View */}
        <div className="flex-1 min-h-0 bg-[#0d0d0f]">
          <iframe
            ref={iframeRef}
            key={previewKey}
            title="NEXO Sandbox Preview"
            srcDoc={srcDoc}
            className="w-full h-full border-none bg-white"
          />
        </div>

        {/* Visual styles custom controls drawer */}
        {selectedElement && (
          <div className="w-64 bg-[#09090b] border-l border-stone-900 p-5 flex flex-col justify-between shrink-0 select-none animate-in slide-in-from-right-4">
            <div className="space-y-5">
              <div className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1.5 border-b border-stone-900 pb-3">
                <Edit3 className="w-4 h-4 text-indigo-400" /> Visual UI Editor
              </div>
              
              {/* Element metadata details */}
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl space-y-2 text-[10px] font-mono">
                <div><span className="text-indigo-400 font-bold">Tag:</span> {selectedElement.tagName}</div>
                <div className="truncate"><span className="text-indigo-400 font-bold">Selector:</span> {selectedElement.id}</div>
                <div className="truncate"><span className="text-indigo-400 font-bold">Content:</span> {selectedElement.textContent.trim() || 'None'}</div>
              </div>

              {/* Class Edit input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Tailwind Classes</label>
                <textarea
                  value={editedClass}
                  onChange={(e) => setEditedClass(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-[11px] text-stone-300 font-mono focus:border-stone-700 outline-none resize-none h-20"
                />
              </div>

              {/* Quick Color Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">Sync Element Color</label>
                <div className="flex items-center gap-2.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={pickedColor}
                    onChange={(e) => handleApplyColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-xs font-mono text-stone-300">{pickedColor}</span>
                </div>
              </div>
            </div>

            {/* Sync actions buttons */}
            <div className="space-y-2 pt-4 border-t border-stone-900">
              <button
                onClick={handleApplyVisualStyles}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                Sync Code
              </button>
              <button
                onClick={clearSelectedElement}
                className="w-full bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white py-2.5 rounded-xl text-xs font-bold transition-all"
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
