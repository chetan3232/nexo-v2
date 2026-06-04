import React, { useState } from "react";
import {
  FileText,
  Cpu,
  Download,
  Terminal,
  Wrench,
  Zap,
  Layers,
  CheckCircle,
} from "lucide-react";

const Build: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "parts" | "software">(
    "overview",
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      alert("Downloading STL Files Bundle (nexo_v2_case.zip)");
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="text-center space-y-4 pt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-white">
          Build Your Own Nexo
        </h1>
        <p className="text-xl text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
          Complete guide to assembling the hardware, wiring the components, and
          installing the software.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-white dark:bg-stone-900 p-1 rounded-xl shadow-sm border border-stone-200 dark:border-stone-800 inline-flex gap-1">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "parts", label: "Parts & BOM", icon: Cpu },
            { id: "software", label: "Software", icon: Terminal },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id 
                  ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md" 
                  : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-stone-900/60 rounded-[2rem] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden min-h-[500px]">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-stone-800 dark:text-white">
                  The Architecture
                </h2>
                <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-lg">
                  Nexo v2 runs on a Raspberry Pi 4 core. It uses a specialized
                  3.5" display for facial expressions and UI, while processing
                  voice locally (using Whisper) or via cloud (Nexo AI) depending
                  on your config.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/20">
                    <div className="font-bold text-orange-800 dark:text-orange-300 mb-1">
                      Local/Cloud
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      Hybrid AI engine
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/20">
                    <div className="font-bold text-blue-800 dark:text-blue-300 mb-1">
                      Interactive
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Touch & Voice enabled
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-stone-100 dark:bg-stone-950/50 rounded-2xl p-8 flex items-center justify-center border-4 border-stone-200 dark:border-stone-800 border-dashed min-h-[300px]">
                <div className="text-center space-y-4">
                  <Wrench className="w-16 h-16 text-stone-300 dark:text-stone-700 mx-auto" />
                  <p className="text-stone-400 dark:text-stone-500 font-medium">
                    3D Exploded View Placeholder
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PARTS TAB */}
        {activeTab === "parts" && (
          <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-stone-800 dark:text-white">Bill of Materials</h2>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-5 py-2.5 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-all"
              >
                {isDownloading ? (
                  <span className="animate-pulse">Downloading...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Download STL Files
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  name: "Raspberry Pi 4 Model B (4GB+)",
                  price: "$75.00",
                  link: "#",
                },
                {
                  name: "3.5 inch MPI3508 HDMI LCD",
                  price: "$22.00",
                  link: "#",
                },
                { name: "Mini USB Microphone", price: "$6.00", link: "#" },
                { name: "3W Speaker Unit", price: "$4.50", link: "#" },
                { name: "3D Printed Chassis (PLA)", price: "DIY", link: "#" },
                {
                  name: "MicroSD Card (32GB Class 10)",
                  price: "$8.00",
                  link: "#",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-100 dark:border-stone-900/60 hover:border-stone-200 dark:hover:border-stone-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400 text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-stone-500 dark:text-stone-400 font-mono text-sm">
                    {item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOFTWARE TAB */}
        {activeTab === "software" && (
          <div className="bg-stone-900 dark:bg-stone-950 text-white p-8 md:p-12 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-8 text-white">Installation Guide</h2>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                  <CheckCircle className="w-4 h-4" /> Step 1: Clone Repository
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 dark:border-stone-800 font-mono text-sm text-stone-300 dark:text-stone-200">
                  git clone https://github.com/chetan3232/Nexo-V3-ai.git
                  <br />
                  cd Nexo-V3-ai
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                  <CheckCircle className="w-4 h-4" /> Step 2: Install
                  Dependencies
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 dark:border-stone-800 font-mono text-sm text-stone-300 dark:text-stone-200">
                  npm install
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-yellow-400 font-mono text-sm">
                  <Zap className="w-4 h-4" /> Step 3: Configure Environment
                </div>
                <p className="text-stone-400 dark:text-stone-300 text-sm">
                  Create a .env file and add your Gemini API key.
                </p>
                <div className="bg-black/50 p-4 rounded-xl border border-white/10 dark:border-stone-800 font-mono text-sm text-stone-300 dark:text-stone-200">
                  nano .env
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Build;
