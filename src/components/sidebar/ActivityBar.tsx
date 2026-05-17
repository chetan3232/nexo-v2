import React from "react";
import {
  MessageCircle,
  FileCode,
  Globe,
  Palette,
  Rocket,
  Settings,
  Download,
  Columns,
} from "lucide-react";

interface ActivityBarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isVisualMode: boolean;
  setIsVisualMode: (val: boolean) => void;
  onSettings: () => void;
  onExport: () => void;
  onDeploy: () => void;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeTab,
  setActiveTab,
  isVisualMode,
  setIsVisualMode,
  onSettings,
  onExport,
  onDeploy,
}) => {
  return (
    <aside className="w-10 bg-white border-r border-stone-200 flex flex-col items-center py-3 gap-3 shrink-0 z-40">
      <button
        onClick={() => setActiveTab("chat")}
        className={`p-2 rounded-lg transition-all ${activeTab === "chat" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-stone-300 hover:text-stone-500"}`}
        title="Chat"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
      <button
        onClick={() => setActiveTab("code")}
        className={`p-2 rounded-lg transition-all ${activeTab === "code" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-stone-300 hover:text-stone-500"}`}
        title="Code"
      >
        <FileCode className="w-4 h-4" />
      </button>
      <button
        onClick={() => setActiveTab("preview")}
        className={`p-2 rounded-lg transition-all ${activeTab === "preview" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-stone-300 hover:text-stone-500"}`}
        title="Preview"
      >
        <Globe className="w-4 h-4" />
      </button>
      <button
        onClick={() => setActiveTab("all")}
        className={`p-2 rounded-lg transition-all ${activeTab === "all" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-stone-300 hover:text-stone-500"}`}
        title="Split View"
      >
        <Columns className="w-4 h-4" />
      </button>

      <div className="mt-auto border-t border-stone-100 w-full pt-3 flex flex-col items-center gap-3">
        <button
          onClick={() => setIsVisualMode(!isVisualMode)}
          className={`p-2 rounded-lg transition-all ${isVisualMode ? "bg-indigo-600 text-white shadow-md" : "text-stone-300 hover:text-indigo-600"}`}
          title="Visual Editor"
        >
          <Palette className="w-4 h-4" />
        </button>
        <button
          onClick={onDeploy}
          className="p-2 rounded-lg text-stone-300 hover:text-emerald-600 transition-colors"
          title="Deploy"
        >
          <Rocket className="w-4 h-4" />
        </button>
        <button
          onClick={onExport}
          className="p-2 rounded-lg text-stone-300 hover:text-stone-700 transition-colors"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onSettings}
          className="p-2 rounded-lg text-stone-300 hover:text-indigo-600 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
