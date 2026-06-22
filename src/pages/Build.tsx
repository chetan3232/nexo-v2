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
  ExternalLink,
  Server,
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
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-white"><br></br>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-800 dark:text-white">Bill of Materials</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Required components and files to build Nexo v2.</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-5 py-2.5 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-sm active:scale-95"
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

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  name: "Raspberry Pi 4 Model B (4GB+)",
                  price: "$75.00",
                  link: "https://www.amazon.com/s?k=raspberry+pi+4+4gb",
                },
                {
                  name: "3.5 inch MPI3508 HDMI LCD",
                  price: "$22.00",
                  link: "https://www.amazon.com/s?k=3.5+inch+hdmi+lcd+raspberry+pi",
                },
                {
                  name: "Mini USB Microphone",
                  price: "$6.00",
                  link: "https://www.amazon.com/s?k=mini+usb+microphone",
                },
                {
                  name: "3W Speaker Unit",
                  price: "$4.50",
                  link: "https://www.amazon.com/s?k=3w+speaker+unit+raspberry+pi",
                },
                {
                  name: "3D Printed Chassis (PLA)",
                  price: "DIY",
                  link: "https://www.thingiverse.com/search?q=raspberry+pi+4+case",
                },
                {
                  name: "MicroSD Card (32GB Class 10)",
                  price: "$8.00",
                  link: "https://www.amazon.com/s?k=microsd+32gb+class+10",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-900/30 rounded-xl border border-stone-200/60 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700/80 hover:bg-stone-100/50 dark:hover:bg-stone-900/50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-stone-200/80 dark:bg-stone-800/80 flex items-center justify-center text-stone-600 dark:text-stone-300 text-xs font-bold transition-colors group-hover:bg-stone-300 dark:group-hover:bg-stone-700">
                      {i + 1}
                    </div>
                    <span className="font-semibold text-stone-800 dark:text-stone-100 text-sm md:text-base">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-500 dark:text-stone-400 font-mono text-sm font-medium">
                      {item.price}
                    </span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-stone-455 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-all"
                      title="View Parts Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SOFTWARE TAB */}
        {activeTab === "software" && (
          <div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold text-stone-800 dark:text-white">Installation Guide</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Complete instructions to set up and run both the web client and backend service.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Frontend Card */}
              <div className="bg-stone-50/50 dark:bg-stone-900/30 rounded-2xl border border-stone-200/60 dark:border-stone-800/80 p-6 space-y-6 hover:border-stone-300 dark:hover:border-stone-700/80 transition-all duration-300">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-200/60 dark:border-stone-800/60">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 dark:text-white">Frontend Client</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Vite-powered React UI interface</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" /> Step 1: Clone Repository
                    </div>
                    <div className="bg-stone-950 border border-stone-900 font-mono text-xs text-stone-200 p-4 rounded-xl shadow-inner select-all">
                      git clone https://github.com/chetan3232/nexo-v2.git
                      <br />
                      cd nexo-v2
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" /> Step 2: Install Dependencies
                    </div>
                    <div className="bg-stone-950 border border-stone-900 font-mono text-xs text-stone-200 p-4 rounded-xl shadow-inner select-all">
                      npm install
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" /> Step 3: Run Application
                    </div>
                    <div className="bg-stone-950 border border-stone-900 font-mono text-xs text-stone-200 p-4 rounded-xl shadow-inner select-all">
                      npm run dev
                    </div>
                  </div>
                </div>
              </div>

              {/* Backend Card */}
              <div className="bg-stone-50/50 dark:bg-stone-900/30 rounded-2xl border border-stone-200/60 dark:border-stone-800/80 p-6 space-y-6 hover:border-stone-300 dark:hover:border-stone-700/80 transition-all duration-300">
                <div className="flex items-center gap-3 pb-3 border-b border-stone-200/60 dark:border-stone-800/60">
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-800 dark:text-white">Backend Server</h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">Node & Express AI service host</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Step 1 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" /> Step 1: Open Server Directory
                    </div>
                    <div className="bg-stone-950 border border-stone-900 font-mono text-xs text-stone-200 p-4 rounded-xl shadow-inner select-all">
                      cd project-name/server
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" /> Step 2: Install Dependencies
                    </div>
                    <div className="bg-stone-950 border border-stone-900 font-mono text-xs text-stone-200 p-4 rounded-xl shadow-inner select-all">
                      npm install
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-mono text-sm font-semibold">
                      <Zap className="w-4 h-4" /> Step 3: Configure Environment
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-normal">
                      Create a <code className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded font-mono text-stone-800 dark:text-stone-200">.env</code> file in the server directory:
                    </p>
                    <div className="bg-stone-950 border border-stone-900 font-mono text-xs text-stone-200 p-4 rounded-xl shadow-inner select-all">
                      PORT=5000
                      <br />
                      GEMINI_API_KEY=your_key_here
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" /> Step 4: Run Server
                    </div>
                    <div className="bg-stone-950 border border-stone-900 font-mono text-xs text-stone-200 p-4 rounded-xl shadow-inner select-all">
                      npm run dev
                    </div>
                  </div>
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
