import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { FileCode, X, Minimize2, Text, Type, Sparkles, Cpu, Hammer, Code } from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { Orchestrator } from "../../agents/Orchestrator";

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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  
  const editorRef = useRef<any>(null);

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

  // Debounced update to global store and WebContainer filesystem
  useEffect(() => {
    if (!selectedFileName || !currentContent) return;

    const timeout = setTimeout(async () => {
      if (localValue !== currentContent.files[selectedFileName]) {
        // 1. Update React store
        setCurrentContent((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            files: { ...prev.files, [selectedFileName]: localValue },
          };
        });

        // 2. Write to WebContainer filesystem for instant HMR / preview sync
        try {
          const { WebContainerService } = await import("../../services/runtime/webcontainer");
          const wc = WebContainerService.getInstance().getWebContainer();
          if (wc) {
            console.log(`[EditorPanel] Syncing ${selectedFileName} with WebContainer virtual filesystem...`);
            await wc.fs.writeFile(selectedFileName, localValue);
          }
        } catch (e) {
          console.error("[EditorPanel] Failed to write changes to WebContainer:", e);
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [localValue, selectedFileName]);

  // Handle outside click to close context menu
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!selectedFileName) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const getSelectedText = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      if (selection && model) {
        const text = model.getValueInRange(selection);
        if (text) return text;
      }
    }
    return localValue;
  };

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
    <div className="h-full flex flex-col bg-studio-panel/30 border border-studio-border/60 rounded-[24px] shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Editor Header / Tab Bar */}
      <div className="h-12 bg-studio-panel/50 border-b border-studio-border/60 flex items-center justify-between px-5 shrink-0 select-none">
        {/* Open Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar h-full pt-2">
          {openTabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setSelectedFileName(tab)}
              className={`h-full px-3.5 flex items-center gap-2 rounded-t-xl text-xs font-semibold cursor-pointer border-t-2 transition-all duration-300 ${
                selectedFileName === tab
                  ? "bg-studio-bg text-studio-accent border-t-studio-accent border-x border-studio-border/60 shadow-inner"
                  : "text-studio-muted hover:text-studio-text hover:bg-studio-panel/30 border-t-transparent"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="max-w-[110px] truncate">{tab}</span>
              <button
                onClick={(e) => handleCloseTab(e, tab)}
                className="p-0.5 rounded-full hover:bg-studio-panel text-studio-muted hover:text-studio-accent transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Selector */}
          <div className="flex items-center bg-studio-bg border border-studio-border/60 rounded-xl px-2.5 py-1.5 gap-1.5">
            <Type className="w-3.5 h-3.5 text-studio-muted" />
            <select
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="bg-transparent text-[10px] text-studio-muted font-bold outline-none cursor-pointer border-none focus:text-studio-accent"
            >
              {[11, 12, 13, 14, 15, 16].map((sz) => (
                <option key={sz} value={sz} className="bg-studio-card text-studio-text">
                  {sz}px
                </option>
              ))}
            </select>
          </div>

          {/* Minimap Toggle */}
          <button
            onClick={() => setMinimap(!minimap)}
            className={`p-2 rounded-xl border transition-all duration-300 ${
              minimap
                ? "bg-studio-accent/15 text-studio-accent border-studio-accent/30 shadow-md shadow-studio-accent/5"
                : "bg-studio-bg text-studio-muted border-studio-border/60 hover:text-studio-text hover:bg-studio-panel"
            }`}
            title="Toggle Minimap"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          {/* Word Wrap Toggle */}
          <button
            onClick={() => setWordWrap(wordWrap === "on" ? "off" : "on")}
            className={`p-2 rounded-xl border transition-all duration-300 ${
              wordWrap === "on"
                ? "bg-studio-accent/15 text-studio-accent border-studio-accent/30 shadow-md shadow-studio-accent/5"
                : "bg-studio-bg text-studio-muted border-studio-border/60 hover:text-studio-text hover:bg-studio-panel"
            }`}
            title="Toggle Word Wrap"
          >
            <Text className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Window wrapper capturing ContextMenu */}
      <div 
        className="flex-grow overflow-hidden relative bg-studio-bg/10"
        onContextMenu={handleContextMenu}
      >
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
            onMount={handleEditorDidMount}
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
              contextmenu: false, // Disable default Monaco context menu
            }}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-studio-muted gap-5 bg-studio-bg/60 rounded-3xl border border-studio-border/50 border-dashed m-6">
            <div className="w-14 h-14 rounded-2xl bg-studio-panel border border-studio-border/80 flex items-center justify-center shadow-lg shadow-black/40">
              <FileCode className="w-7 h-7 text-studio-accent animate-pulse" />
            </div>
            <div className="text-center space-y-1.5 select-none">
              <span className="block text-xs font-black uppercase tracking-[0.25em] text-studio-text">
                No File Selected
              </span>
              <span className="block text-[10px] text-studio-muted">
                Select a workspace file from the explorer sidebar to begin editing.
              </span>
            </div>
          </div>
        )}

        {/* Custom Glassmorphic Context Menu */}
        {contextMenu && selectedFileName && (
          <div
            className="fixed bg-studio-card/95 backdrop-blur-xl border border-studio-border/80 rounded-2xl py-2 shadow-2xl z-[9999] w-52 text-left"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                Orchestrator.getInstance().explainCode(selectedFileName, getSelectedText());
                setContextMenu(null);
              }}
              className="w-full px-4.5 py-2.5 hover:bg-studio-accent/10 text-xs font-bold text-studio-muted hover:text-studio-text flex items-center gap-3 transition-all"
            >
              <Sparkles className="w-4 h-4 text-studio-accent shrink-0" />
              <span>Explain Code</span>
            </button>
            <button
              onClick={() => {
                Orchestrator.getInstance().optimizeCode(selectedFileName, getSelectedText());
                setContextMenu(null);
              }}
              className="w-full px-4.5 py-2.5 hover:bg-studio-accent/10 text-xs font-bold text-studio-muted hover:text-studio-text flex items-center gap-3 transition-all"
            >
              <Cpu className="w-4 h-4 text-studio-accent shrink-0" />
              <span>Optimize Code</span>
            </button>
            <button
              onClick={() => {
                Orchestrator.getInstance().manualFix(`Fix code block in ${selectedFileName}:\n${getSelectedText()}`);
                setContextMenu(null);
              }}
              className="w-full px-4.5 py-2.5 hover:bg-studio-accent/10 text-xs font-bold text-studio-muted hover:text-studio-text flex items-center gap-3 transition-all"
            >
              <Hammer className="w-4 h-4 text-studio-accent shrink-0" />
              <span>Fix Selected Code</span>
            </button>
            <div className="h-px bg-studio-border mx-2.5 my-1.5" />
            <button
              onClick={() => {
                const promptVal = prompt("Enter refactor instruction (e.g. 'convert to async/await'):");
                if (promptVal) {
                  Orchestrator.getInstance().refactorSelection(selectedFileName, getSelectedText(), promptVal);
                }
                setContextMenu(null);
              }}
              className="w-full px-4.5 py-2.5 hover:bg-studio-accent/10 text-xs font-bold text-studio-muted hover:text-studio-text flex items-center gap-3 transition-all"
            >
              <Code className="w-4 h-4 text-studio-accent shrink-0" />
              <span>Refactor Code...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
