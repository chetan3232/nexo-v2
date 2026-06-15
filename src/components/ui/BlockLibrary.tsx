import React, { useState, useMemo } from "react";
import { useBlockStore, LayoutBlock } from "../../stores/blockStore";
import { useProjectStore } from "../../stores/projectStore";
import { Search, Plus, Trash2, Copy, Check, FileCode, CornerDownLeft, Sparkles, FolderPlus } from "lucide-react";
import toast from "react-hot-toast";

export const BlockLibrary: React.FC = () => {
  const { blocks, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, addCustomBlock, deleteBlock } = useBlockStore();
  const { currentContent, setCurrentContent, selectedFileName, setSelectedFileName } = useProjectStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customCat, setCustomCat] = useState<LayoutBlock["category"]>("Hero");

  const categories: Array<LayoutBlock["category"] | "All"> = ["All", "Hero", "Auth", "Dashboard", "Pricing", "Footer"];

  // Filter blocks based on search query and category
  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            b.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || b.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [blocks, searchQuery, selectedCategory]);

  const handleCopyCode = (block: LayoutBlock) => {
    navigator.clipboard.writeText(block.code);
    setCopiedId(block.id);
    toast.success(`${block.name} code copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to inject code into WebContainer runtime
  const writeToWebContainer = async (path: string, code: string) => {
    try {
      const { WebContainerService } = await import("../../services/runtime/webcontainer");
      const wc = WebContainerService.getInstance().getWebContainer();
      if (wc) {
        if (path.includes("/")) {
          const parts = path.split("/");
          parts.pop();
          await wc.fs.mkdir(parts.join("/"), { recursive: true });
        }
        await wc.fs.writeFile(path, code);
      }
    } catch (err) {
      console.error("[BlockLibrary] Failed to write file to runtime:", err);
    }
  };

  const handleOverwriteCurrent = async (block: LayoutBlock) => {
    if (!selectedFileName) {
      toast.error("No file open in editor. Please open a file or create a component.");
      return;
    }
    
    setCurrentContent((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        files: {
          ...prev.files,
          [selectedFileName]: block.code
        }
      };
    });

    await writeToWebContainer(selectedFileName, block.code);
    toast.success(`Injected ${block.name} into ${selectedFileName}!`);
  };

  const handleCreateNewFile = async (block: LayoutBlock) => {
    const defaultPath = `src/components/${block.name.replace(/\s+/g, "")}.tsx`;
    const newPath = prompt("Enter file path to create in workspace:", defaultPath);
    if (!newPath) return;

    setCurrentContent((prev) => {
      const files = prev ? { ...prev.files } : {};
      return {
        files: {
          ...files,
          [newPath]: block.code
        },
        mainFile: prev?.mainFile || newPath,
        template: prev?.template || "react"
      };
    });

    await writeToWebContainer(newPath, block.code);
    setSelectedFileName(newPath);
    toast.success(`Created ${newPath} with ${block.name}!`);
  };

  const handleSaveActiveFileAsBlock = () => {
    if (!selectedFileName || !currentContent) {
      toast.error("No active file or code content to save.");
      return;
    }
    const code = currentContent.files[selectedFileName] || "";
    if (!code.trim()) {
      toast.error("Active file content is empty.");
      return;
    }

    if (!customName.trim()) {
      toast.error("Please enter a name for the block.");
      return;
    }

    addCustomBlock({
      name: customName,
      description: customDesc || `Custom block captured from ${selectedFileName}`,
      category: customCat,
      code
    });

    setCustomName("");
    setCustomDesc("");
    setShowSaveForm(false);
    toast.success(`Saved current file as block "${customName}"!`);
  };

  const currentFileContent = useMemo(() => {
    if (!selectedFileName || !currentContent) return "";
    return currentContent.files[selectedFileName] || "";
  }, [selectedFileName, currentContent]);

  return (
    <div className="flex flex-col h-full gap-4 text-left">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-studio-muted uppercase tracking-wider block">
          Search Layout Blocks
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-studio-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blocks..."
            className="w-full bg-studio-bg border border-studio-border/60 focus:border-studio-accent rounded-xl pl-9 pr-4 py-2 text-xs text-studio-text outline-none transition-all"
          />
        </div>
      </div>

      {/* Category selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar select-none shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              selectedCategory === cat
                ? "bg-studio-accent border-studio-accent text-white"
                : "bg-studio-bg/60 border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-panel/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Capture custom block button */}
      {selectedFileName && currentFileContent.trim() && (
        <div className="bg-studio-accent/5 border border-studio-accent/20 rounded-2xl p-3 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-studio-accent flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Capture Active Component
            </span>
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              className="text-[9px] font-bold text-studio-muted hover:text-studio-accent transition-colors"
            >
              {showSaveForm ? "Cancel" : "Save as Block"}
            </button>
          </div>
          
          {showSaveForm && (
            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Block Name (e.g. Nav Bar)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-studio-bg border border-studio-border rounded-lg px-2.5 py-1.5 text-[10px] text-studio-text outline-none focus:border-studio-accent"
              />
              <input
                type="text"
                placeholder="Short description..."
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full bg-studio-bg border border-studio-border rounded-lg px-2.5 py-1.5 text-[10px] text-studio-text outline-none focus:border-studio-accent"
              />
              <div className="flex gap-2">
                <select
                  value={customCat}
                  onChange={(e) => setCustomCat(e.target.value as any)}
                  className="flex-1 bg-studio-bg border border-studio-border rounded-lg px-2 py-1 text-[10px] text-studio-text"
                >
                  <option value="Hero">Hero</option>
                  <option value="Auth">Auth</option>
                  <option value="Dashboard">Dashboard</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Footer">Footer</option>
                </select>
                <button
                  onClick={handleSaveActiveFileAsBlock}
                  className="px-3.5 py-1 bg-studio-accent text-white text-[10px] font-bold rounded-lg hover:bg-studio-accent/90 transition-all shadow"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blocks Grid */}
      <div className="flex-grow overflow-y-auto space-y-3.5 pr-1 max-h-[420px] custom-scrollbar">
        {filteredBlocks.length > 0 ? (
          filteredBlocks.map((block) => (
            <div
              key={block.id}
              className="p-3.5 bg-studio-card/30 border border-studio-border/60 hover:bg-studio-card hover:border-studio-accent/20 rounded-2xl transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-studio-text">{block.name}</span>
                    <span className="text-[8px] font-bold bg-studio-panel border border-studio-border/80 text-studio-muted px-1.5 py-0.2 rounded-full capitalize">
                      {block.category}
                    </span>
                    {block.isCustom && (
                      <span className="text-[8px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded-full">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-studio-muted leading-relaxed mt-1.5">{block.description}</p>
                </div>
                {block.isCustom && (
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="text-studio-muted hover:text-red-400 p-1 rounded hover:bg-red-500/5 transition-colors shrink-0"
                    title="Delete Custom Block"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Injection Action Grid */}
              <div className="flex items-center gap-2 pt-1.5 border-t border-studio-border/30">
                <button
                  onClick={() => handleOverwriteCurrent(block)}
                  disabled={!selectedFileName}
                  className="flex-1 py-1.5 bg-studio-accent/10 border border-studio-accent/20 hover:border-studio-accent/40 text-studio-text hover:bg-studio-accent/15 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-35 disabled:hover:bg-transparent"
                  title={selectedFileName ? `Inject into ${selectedFileName}` : "Open a file to inject"}
                >
                  <CornerDownLeft className="w-3 h-3 text-studio-accent" />
                  <span>Inject File</span>
                </button>
                
                <button
                  onClick={() => handleCreateNewFile(block)}
                  className="py-1.5 bg-studio-panel border border-studio-border hover:border-studio-muted text-studio-muted hover:text-studio-text px-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                  title="Create as new file"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleCopyCode(block)}
                  className="py-1.5 bg-studio-panel border border-studio-border hover:border-studio-muted text-studio-muted hover:text-studio-text px-2.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center shrink-0"
                  title="Copy code to clipboard"
                >
                  {copiedId === block.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-studio-muted text-xs italic text-center py-12 bg-studio-card/10 rounded-2xl border border-studio-border border-dashed">
            No matching blocks found
          </div>
        )}
      </div>
    </div>
  );
};
