import React from "react";
import { useProjectStore } from "../../stores/projectStore";
import { ExportService } from "../../services/exportService";
import { Orchestrator } from "../../agents/Orchestrator";
import {
  Download,
  Github,
  Rocket,
  Smartphone,
  Monitor,
  ShieldCheck,
  Zap,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";

export const ExportPanel: React.FC = () => {
  const { currentContent } = useProjectStore();
  const exportService = ExportService.getInstance();

  const handleExport = (type: string) => {
    if (!currentContent) return;
    switch (type) {
      case "zip":
        exportService.exportToZip(currentContent);
        break;
      case "github":
        exportService.exportToGitHub();
        break;
      case "vercel":
        exportService.deployToVercel(currentContent);
        break;
      case "android":
        exportService.exportAsMobileApp();
        break;
    }
  };

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto no-scrollbar">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-stone-900 rounded-2xl text-white shadow-lg">
          <Rocket className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-black text-stone-900 tracking-tight">
          Export & Deploy
        </h2>
      </div>

      {/* SaaS Killer Feature */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-rose-600 rounded-[2.5rem] opacity-30 blur-xl group-hover:opacity-50 transition-all duration-500"></div>
        <button
          onClick={() => Orchestrator.getInstance().handleSaaSExport()}
          className="relative w-full bg-white border border-stone-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-xl hover:scale-[1.02] transition-all duration-500"
        >
          <div className="w-14 h-14 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-4">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h3 className="text-sm font-black text-stone-900 mb-1">
            Export as SaaS Starter
          </h3>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-loose">
            AI will auto-add Auth, Payments, <br /> Dashboard & Onboarding
          </p>
        </button>
      </div>

      {/* Standard Exports */}
      <div className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 px-2">
          Distribution
        </span>
        <div className="grid grid-cols-2 gap-3">
          <ExportButton
            icon={Download}
            label="Project ZIP"
            onClick={() => handleExport("zip")}
          />
          <ExportButton
            icon={Github}
            label="GitHub Repo"
            onClick={() => handleExport("github")}
          />
          <ExportButton
            icon={Globe}
            label="Vercel"
            onClick={() => handleExport("vercel")}
            color="indigo"
          />
          <ExportButton
            icon={Smartphone}
            label="Android APK"
            onClick={() => handleExport("android")}
          />
          <ExportButton icon={Monitor} label="Electron" onClick={() => {}} />
          <ExportButton icon={ShieldCheck} label="Netlify" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
};

const ExportButton: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}> = ({ icon: Icon, label, onClick, color }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] border border-stone-100 bg-white hover:border-stone-900 hover:shadow-2xl transition-all duration-500 group`}
  >
    <div
      className={`p-3 rounded-2xl ${color === "indigo" ? "bg-indigo-50 text-indigo-600" : "bg-stone-50 text-stone-400"} group-hover:bg-stone-900 group-hover:text-white transition-all duration-500`}
    >
      <Icon className="w-5 h-5" />
    </div>
    <span className="text-[10px] font-black text-stone-900 uppercase tracking-tighter">
      {label}
    </span>
  </button>
);
