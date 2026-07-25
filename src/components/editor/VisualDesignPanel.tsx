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

  const [color, setColor] = React.useState("indigo-600");
  const [radius, setRadius] = React.useState("md");
  const [font, setFont] = React.useState("sans-serif");
  const [layout, setLayout] = React.useState("flex-col");
  const [animation, setAnimation] = React.useState("fade");

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

  const handleApplyAdjustments = () => {
    const instruction = `Apply custom design tweak: Color theme to ${color}, radius style to ${radius}, font to ${font}, display layout to ${layout}, animations to ${animation}`;
    handleRegenerateSelection(instruction);
  };

  return (
    <div className="absolute right-6 top-6 w-80 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] border border-stone-200 p-8 z-50 animate-in slide-in-from-right-10 duration-500 text-stone-900 select-none">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
              Visual Editor
            </span>
            <span className="block text-sm font-black text-stone-950 tracking-tighter">
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

      <div className="space-y-6">
        {/* Style Tweaks Form */}
        <div className="space-y-3.5 bg-stone-50/50 p-4 rounded-3xl border border-stone-100">
          {/* Color Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-500">Color Palette</span>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-800 outline-none focus:border-indigo-500"
            >
              <option value="indigo-600">Indigo (Premium)</option>
              <option value="rose-500">Rose (Warm)</option>
              <option value="emerald-500">Emerald (Clean)</option>
              <option value="amber-500">Amber (Vibrant)</option>
              <option value="stone-950">Midnight Dark</option>
            </select>
          </div>

          {/* Radius Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-500">Corner Radius</span>
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-800 outline-none focus:border-indigo-500"
            >
              <option value="none">None (Sharp)</option>
              <option value="sm">Small (Compact)</option>
              <option value="md">Medium (Default)</option>
              <option value="lg">Large (Rounded)</option>
              <option value="full">Full (Pill)</option>
            </select>
          </div>

          {/* Font Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-500">Typography Font</span>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-800 outline-none focus:border-indigo-500"
            >
              <option value="sans-serif">Sans-serif (Modern)</option>
              <option value="serif">Serif (Elegant)</option>
              <option value="monospace">Monospace (Code)</option>
              <option value="Outfit, Inter">Outfit / Inter</option>
            </select>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-500">Layout Display</span>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-800 outline-none focus:border-indigo-500"
            >
              <option value="flex-row">Flex Row</option>
              <option value="flex-col">Flex Column</option>
              <option value="grid">Grid Layout</option>
              <option value="block">Block Stream</option>
            </select>
          </div>

          {/* Animation Selector */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-500">Micro-Animation</span>
            <select
              value={animation}
              onChange={(e) => setAnimation(e.target.value)}
              className="bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 font-semibold text-stone-800 outline-none focus:border-indigo-500"
            >
              <option value="fade">Fade In</option>
              <option value="slide">Slide Transitions</option>
              <option value="bounce">Bounce Micro</option>
              <option value="pulse">Glowing Pulse</option>
            </select>
          </div>

          <button
            onClick={handleApplyAdjustments}
            className="w-full mt-2.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Apply Styles
          </button>
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
