import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { FileCode, X, Minimize2, Text, Type } from "lucide-react";
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
  const [openTabs, setOpenTabs] = useState<string[]>([]);

  // Editor Options State
  const [fontSize, setFontSize] = useState<number>(13);
  const [minimap, setMinimap] = useState<boolean>(false);
  const [wordWrap, setWordWrap] = useState<"on" | "off">("on");

  // Sync open tabs with selectedFileName
  useEffect(() => {
    if (selectedFileName && !openTabs.includes(selectedFileName)) {
      setOpenTabs((prev) => [...prev, selectedFileName]);
    }
  }, [selectedFileName]);

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

  const handleCloseTab = (e: React.MouseEvent, tabName: string) => {
    e.stopPropagation();
    const remainingTabs = openTabs.filter((t) => t !== tabName);
    setOpenTabs(remainingTabs);

    if (selectedFileName === tabName) {
      if (remainingTabs.length > 0) {
        setSelectedFileName(remainingTabs[remainingTabs.length - 1]);
      } else {
        setSelectedFileName(null);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden border border-zinc-900 rounded-2xl shadow-xl">
      {/* Editor Header / Tab Bar */}
      <div className="h-11 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 shrink-0 select-none">
        {/* Open Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar h-full pt-1.5">
          {openTabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setSelectedFileName(tab)}
              className={`h-full px-3 flex items-center gap-2 rounded-t-lg text-xs font-semibold cursor-pointer border-t-2 transition-all ${
                selectedFileName === tab
                  ? "bg-zinc-900 text-indigo-400 border-t-indigo-500 border-x border-zinc-900"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30 border-t-transparent"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="max-w-[100px] truncate">{tab}</span>
              <button
                onClick={(e) => handleCloseTab(e, tab)}
                className="p-0.5 rounded-full hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Selector */}
          <div className="flex items-center bg-zinc-900 rounded-lg px-2 py-1 gap-1 border border-zinc-800/80">
            <Type className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="bg-transparent text-[10px] text-zinc-400 font-bold outline-none cursor-pointer border-none"
            >
              {[11, 12, 13, 14, 15, 16].map((sz) => (
                <option key={sz} value={sz} className="bg-zinc-950 text-zinc-350">
                  {sz}px
                </option>
              ))}
            </select>
          </div>

          {/* Minimap Toggle */}
          <button
            onClick={() => setMinimap(!minimap)}
            className={`p-1.5 rounded-lg border transition-all ${
              minimap ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800"
            }`}
            title="Toggle Minimap"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Word Wrap Toggle */}
          <button
            onClick={() => setWordWrap(wordWrap === "on" ? "off" : "on")}
            className={`p-1.5 rounded-lg border transition-all ${
              wordWrap === "on" ? "bg-indigo-600/10 text-indigo-400 border-indigo-500/20" : "bg-zinc-900 text-zinc-500 border-zinc-800"
            }`}
            title="Toggle Word Wrap"
          >
            <Text className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Window */}
      <div className="flex-grow overflow-hidden relative bg-zinc-900">
        {selectedFileName ? (
          <Editor
            height="100%"
            theme="vs-dark"
            path={selectedFileName}
            language={
              selectedFileName.split(".").pop() === "tsx" ||
              selectedFileName.split(".").pop() === "ts"
                ? "typescript"
                : selectedFileName.split(".").pop() === "json"
                ? "json"
                : "javascript"
            }
            value={localValue}
            onChange={(val) => setLocalValue(val || "")}
            options={{
              fontSize,
              minimap: { enabled: minimap },
              wordWrap,
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
          <div className="h-full flex flex-col items-center justify-center text-zinc-700 gap-4 bg-zinc-950">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center shadow-lg">
              <FileCode className="w-8 h-8 text-zinc-600 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <span className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                No File Open
              </span>
              <span className="block text-[10px] text-zinc-600">
                Select a file from the explorer sidebar to view code.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
