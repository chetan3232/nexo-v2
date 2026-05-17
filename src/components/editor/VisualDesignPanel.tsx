import React from "react";
import { useDesignStore } from "../../stores/designStore";
import {
  X,
  Type,
  Palette,
  Maximize,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
} from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { Orchestrator } from "../../agents/Orchestrator";
import toast from "react-hot-toast";

export const VisualDesignPanel: React.FC = () => {
  const { selectedElement, setSelectedElement, design, updateDesign } =
    useDesignStore();
  const { currentContent } = useProjectStore();

  if (!selectedElement) return null;

  const handleRegenerateSelection = async (instruction: string) => {
    if (!selectedElement) return;
    const description = `${selectedElement.tagName} with ID ${selectedElement.id}: ${instruction}`;
    // We'd ideally find the component code here. For now we use placeholder.
    await Orchestrator.getInstance().regenerateComponent(
      description,
      selectedElement.text,
    );
  };

  return (
    <div className="absolute right-6 top-6 w-80 bg-white/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-white/20 p-8 z-50 animate-in slide-in-from-right-10 duration-500 selection:bg-indigo-100">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
              Element
            </span>
            <span className="block text-sm font-black text-stone-900 tracking-tighter">
              {selectedElement.tagName}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedElement(null)}
          className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-8">
        {/* Visual Presets */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
            <Palette className="w-3.5 h-3.5" /> Visual Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                handleRegenerateSelection(
                  "Make it glassmorphism with blur and subtle borders",
                )
              }
              className="p-3 bg-stone-50 border border-stone-100 rounded-2xl text-[10px] font-bold text-stone-600 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-3 h-3" /> Glassmorphism
            </button>
            <button
              onClick={() =>
                handleRegenerateSelection("Add a premium dark theme gradient")
              }
              className="p-3 bg-stone-900 border border-stone-800 rounded-2xl text-[10px] font-bold text-stone-300 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Palette className="w-3 h-3" /> Dark Premium
            </button>
          </div>
        </div>

        {/* Sizing Controls */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
            <Maximize className="w-3.5 h-3.5" /> Layout & Sizing
          </label>
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <div className="flex gap-4">
              <div className="space-y-1">
                <span className="block text-[8px] font-bold text-stone-400 uppercase">
                  Width
                </span>
                <span className="block text-xs font-bold text-stone-900">
                  Auto
                </span>
              </div>
              <div className="space-y-1">
                <span className="block text-[8px] font-bold text-stone-400 uppercase">
                  Height
                </span>
                <span className="block text-xs font-bold text-stone-900">
                  Auto
                </span>
              </div>
            </div>
            <button className="p-2 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-indigo-500 transition-all">
              <Maximize className="w-3.5 h-3.5 text-stone-600" />
            </button>
          </div>
        </div>

        {/* AI Prompting */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Tweak Selection
          </label>
          <div className="relative group">
            <textarea
              placeholder="e.g. Make this responsive for mobile..."
              className="w-full bg-stone-50 border border-stone-200 rounded-3xl p-5 text-xs focus:bg-white focus:border-indigo-500 transition-all resize-none h-24 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRegenerateSelection(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
            <div className="absolute bottom-4 right-4 p-2 bg-indigo-600 text-white rounded-xl shadow-lg opacity-0 group-focus-within:opacity-100 transition-all cursor-pointer">
              <ArrowUp className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="pt-6 border-t border-stone-100 flex gap-3">
          <button
            onClick={() =>
              handleRegenerateSelection(
                "Refactor this into a reusable React component",
              )
            }
            className="flex-1 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-200"
          >
            <Layers className="w-4 h-4" /> Extract Component
          </button>
        </div>
      </div>
    </div>
  );
};
