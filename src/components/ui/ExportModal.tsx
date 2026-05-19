import React from "react";
import {
  X,
  Cloud,
  Package,
  Smartphone,
  Box,
  Download,
  ExternalLink,
} from "lucide-react";
import { GithubIcon as Github } from "./GithubIcon";
import { motion, AnimatePresence } from "framer-motion";

import { GitHubService } from "../../services/githubService";
import { DeploymentService } from "../../services/deploymentService";
import { useProjectStore } from "../../stores/projectStore";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
}) => {
  const { currentContent } = useProjectStore();

  if (!isOpen) return null;

  const handleAction = async (id: string) => {
    if (!currentContent) return;

    switch (id) {
      case "github":
        await GitHubService.getInstance().createRepoAndPush(
          "nexo-project",
          currentContent.files,
        );
        break;
      case "vercel":
      case "netlify":
      case "docker":
        await DeploymentService.getInstance().generateConfig(id as any);
        break;
      default:
        onExport(id);
    }
  };

  const options = [
    {
      id: "zip",
      label: "Download ZIP",
      icon: Download,
      description: "Source code in a zip file",
      color: "bg-blue-500",
    },
    {
      id: "github",
      label: "Push to GitHub",
      icon: Github,
      description: "Create a new repository",
      color: "bg-stone-800",
    },
    {
      id: "vercel",
      label: "Deploy to Vercel",
      icon: ExternalLink,
      description: "One-click deployment",
      color: "bg-black",
    },
    {
      id: "netlify",
      label: "Deploy to Netlify",
      icon: Cloud,
      description: "Direct site hosting",
      color: "bg-teal-500",
    },
    {
      id: "apk",
      label: "Build APK",
      icon: Smartphone,
      description: "Android application package",
      color: "bg-green-600",
    },
    {
      id: "docker",
      label: "Docker Image",
      icon: Box,
      description: "Containerized deployment",
      color: "bg-blue-600",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-[#1e1e1e] rounded-2xl border border-stone-800 shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-[#252526]">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                Export Project
              </h3>
              <p className="text-stone-500 text-[11px] font-bold uppercase tracking-widest mt-1">
                Select your destination
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-stone-400" />
            </button>
          </div>

          <div className="p-8 grid grid-cols-2 gap-4">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleAction(opt.id)}
                className="flex items-start gap-4 p-4 rounded-xl border border-stone-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left group"
              >
                <div
                  className={`${opt.color} p-3 rounded-lg text-white shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <opt.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-stone-200 font-bold text-sm">
                    {opt.label}
                  </h4>
                  <p className="text-stone-500 text-[10px] mt-1">
                    {opt.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 bg-stone-900/50 border-t border-stone-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-stone-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
