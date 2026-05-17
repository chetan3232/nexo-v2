import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { FileCode, Files } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";

interface EditorPanelProps {
  selectedFileName: string | null;
  setSelectedFileName: (name: string | null) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  selectedFileName,
  setSelectedFileName,
}) => {
  const { currentContent, setCurrentContent } = useProjectStore();
  const [localValue, setLocalValue] = useState<string>("");

  // Sync local value when file selection changes
  useEffect(() => {
    if (selectedFileName && currentContent?.files[selectedFileName]) {
      setLocalValue(currentContent.files[selectedFileName]);
    }
  }, [selectedFileName, currentContent?.files]);

  // Debounced update to global store
  useEffect(() => {
    if (!selectedFileName || !currentContent) return;

    const timeout = setTimeout(() => {
      if (localValue !== currentContent.files[selectedFileName]) {
        setCurrentContent((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            files: { ...prev.files, [selectedFileName]: localValue },
          };
        });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [localValue, selectedFileName]);

  return (
    <div className="h-full flex bg-[#1e1e1e] overflow-hidden">
      {/* Minimalist File Explorer Sidebar */}
      <div className="w-48 border-r border-white/5 flex flex-col bg-[#181818] shrink-0">
        <div className="h-10 px-4 flex items-center gap-2 border-b border-white/5 bg-white/5">
          <Files className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Explorer
          </span>
        </div>
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {currentContent?.files &&
            Object.keys(currentContent.files).map((filename) => (
              <button
                key={filename}
                onClick={() => setSelectedFileName(filename)}
                className={`w-full px-4 py-2 flex items-center gap-2 text-[11px] font-medium transition-all group ${selectedFileName === filename ? "text-white bg-indigo-600/10" : "text-stone-500 hover:text-stone-300 hover:bg-white/5"}`}
              >
                <FileCode
                  className={`w-3.5 h-3.5 ${selectedFileName === filename ? "text-indigo-400" : "text-stone-600 group-hover:text-stone-400"}`}
                />
                <span className="truncate">{filename}</span>
              </button>
            ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-10 px-4 flex items-center gap-2 border-b border-white/5 bg-[#1e1e1e]">
          {selectedFileName && (
            <>
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold text-stone-200">
                {selectedFileName}
              </span>
            </>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          {selectedFileName ? (
            <Editor
              height="100%"
              theme="vs-dark"
              path={selectedFileName}
              language={
                selectedFileName.split(".").pop() === "tsx"
                  ? "typescript"
                  : "javascript"
              }
              value={localValue}
              onChange={(val) => setLocalValue(val || "")}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                fontFamily: "JetBrains Mono, monospace",
                lineHeight: 1.6,
                padding: { top: 12 },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorSmoothCaretAnimation: "on",
                renderLineHighlight: "all",
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-stone-700 gap-4 opacity-50">
              <Files className="w-12 h-12 text-stone-800" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                No File Selected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
