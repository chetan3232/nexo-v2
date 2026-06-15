import React from 'react';
import { FileCode, Trash, FileCode2, Code, Terminal } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useRuntimeStore } from '../../stores/runtimeStore';

export const EditorPanel: React.FC = () => {
  const files = useProjectStore((state) => state.files);
  const updateFile = useProjectStore((state) => state.updateFile);
  const deleteFile = useProjectStore((state) => state.deleteFile);
  const selectedFileName = useProjectStore((state) => state.selectedFileName);
  const setSelectedFileName = useProjectStore((state) => state.setSelectedFileName);
  
  const terminalLogs = useRuntimeStore((state) => state.logs);
  const runningCommand = useRuntimeStore((state) => state.runningCommand);

  const activeContent = selectedFileName ? files[selectedFileName] || '' : '';

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0d0d0f] text-stone-200">
      
      {/* File Explorer Sidebar */}
      <div className="w-56 bg-[#09090b]/80 border-r border-stone-900 flex flex-col shrink-0 select-none">
        <div className="p-4 text-[10px] font-bold text-stone-500 uppercase tracking-widest border-b border-stone-900 flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5" /> Workspace Files
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {Object.keys(files).map((filename) => (
            <div
              key={filename}
              onClick={() => setSelectedFileName(filename)}
              className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                selectedFileName === filename
                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-white'
                  : 'text-stone-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <FileCode2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate font-mono">{filename}</span>
              </div>
              
              {filename !== 'package.json' && filename !== 'App.tsx' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(filename);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-stone-500 hover:text-red-400 rounded transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Code Editor and Console Logs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Editor Screen Header */}
        <div className="h-10 bg-[#09090b] border-b border-stone-900 flex items-center justify-between px-6 shrink-0 select-none">
          <span className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider">
            {selectedFileName || 'No File Selected'}
          </span>
          <span className="text-[9px] font-mono text-stone-600 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
            React 19 Editor
          </span>
        </div>

        {/* Text Code Area */}
        <div className="flex-1 min-h-0 relative">
          <textarea
            value={activeContent}
            onChange={(e) => selectedFileName && updateFile(selectedFileName, e.target.value)}
            disabled={!selectedFileName}
            spellCheck={false}
            className="w-full h-full bg-transparent p-6 text-indigo-200/90 font-mono text-xs md:text-sm outline-none resize-none leading-relaxed select-text"
          />
        </div>

        {/* Bottom Small Terminal logs */}
        <div className="h-40 bg-[#070709] border-t border-stone-900 flex flex-col font-mono text-[10px] text-stone-400">
          <div className="h-7 bg-[#09090b] px-4 border-b border-stone-900 flex items-center justify-between shrink-0 select-none">
            <span className="font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Output Terminal Logs
            </span>
            {runningCommand && (
              <span className="text-amber-500 font-bold animate-pulse uppercase">
                ⚙️ RUNNING: {runningCommand}
              </span>
            )}
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-1 scrollbar-thin select-text">
            {terminalLogs.slice(-20).map((log, i) => (
              <div key={i} className="leading-normal whitespace-pre-wrap">
                <span className="text-stone-600 mr-2">&gt;</span>{log}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
export default EditorPanel;
