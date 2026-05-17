import React, { useState, useEffect, useRef } from "react";
import { useRuntimeStore } from "../../stores/runtimeStore";
import { useProjectStore } from "../../stores/projectStore";
import {
  Terminal as TerminalIcon,
  Activity,
  Globe,
  Box,
  Cpu,
  FileText,
  Brain,
  Sparkles,
} from "lucide-react";
import { Orchestrator } from "../../agents/Orchestrator";

type TabType =
  | "terminal"
  | "console"
  | "network"
  | "deps"
  | "env"
  | "logs"
  | "ai";

export const DevTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("terminal");
  const { terminalLogs, consoleLogs, networkLogs, aiReasoning } =
    useRuntimeStore();
  const { currentContent } = useProjectStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLogs, consoleLogs, networkLogs, aiReasoning, activeTab]);

  const tabs = [
    { id: "terminal", label: "Terminal", icon: TerminalIcon },
    { id: "console", label: "Console", icon: Activity },
    { id: "network", label: "Network", icon: Globe },
    { id: "deps", label: "Dependencies", icon: Box },
    { id: "env", label: "Environment", icon: Cpu },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "ai", label: "AI Reasoning", icon: Brain },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "terminal":
        return (
          <div className="space-y-1">
            {terminalLogs.map((log, i) => (
              <div
                key={i}
                className="whitespace-pre-wrap break-all leading-relaxed hover:bg-stone-800/50 px-1 rounded transition-colors"
              >
                {log}
              </div>
            ))}
          </div>
        );
      case "console":
        return (
          <div className="space-y-1 text-blue-300">
            {consoleLogs.length > 0 ? (
              consoleLogs.map((log, i) => (
                <div
                  key={i}
                  className="border-l-2 border-blue-500/30 pl-2 py-0.5"
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="text-stone-500 italic">
                No console logs yet...
              </div>
            )}
          </div>
        );
      case "ai":
        return (
          <div className="space-y-3">
            {aiReasoning.map((reason, i) => (
              <div
                key={i}
                className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex gap-3"
              >
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-indigo-200 leading-relaxed text-[11px]">
                  {reason}
                </div>
              </div>
            ))}
          </div>
        );
      case "deps":
        const pkg = currentContent?.files["package.json"]
          ? JSON.parse(currentContent.files["package.json"])
          : null;
        const deps = pkg?.dependencies || {};
        const devDeps = pkg?.devDependencies || {};
        return (
          <div className="grid grid-cols-2 gap-4">
            <section className="space-y-2">
              <h5 className="text-stone-500 font-black text-[9px] uppercase tracking-wider">
                Dependencies
              </h5>
              {Object.entries(deps).map(([name, ver]) => (
                <div
                  key={name}
                  className="flex items-center justify-between bg-stone-800/40 p-2 rounded border border-stone-700/50"
                >
                  <span className="text-stone-300">{name}</span>
                  <span className="text-indigo-400 font-bold">
                    {ver as string}
                  </span>
                </div>
              ))}
            </section>
            <section className="space-y-2">
              <h5 className="text-stone-500 font-black text-[9px] uppercase tracking-wider">
                Dev Dependencies
              </h5>
              {Object.entries(devDeps).map(([name, ver]) => (
                <div
                  key={name}
                  className="flex items-center justify-between bg-stone-800/40 p-2 rounded border border-stone-700/50 opacity-60"
                >
                  <span className="text-stone-300">{name}</span>
                  <span className="text-stone-500 font-bold">
                    {ver as string}
                  </span>
                </div>
              ))}
            </section>
          </div>
        );
      default:
        return (
          <div className="text-stone-500 italic">
            This tab is coming soon in Nexo V3...
          </div>
        );
    }
  };

  return (
    <div className="bg-[#181818] text-[#d4d4d4] font-mono text-[10px] flex flex-col overflow-hidden h-full">
      {/* Tab Header (Compact) */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-stone-800 bg-[#252526] shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all shrink-0 ${activeTab === tab.id ? "bg-[#1e1e1e] text-indigo-400" : "text-stone-500 hover:text-stone-300"}`}
            >
              <tab.icon className="w-2.5 h-2.5" />
              <span className="font-bold text-[9px]">{tab.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() =>
            Orchestrator.getInstance().manualFix(
              terminalLogs.slice(-10).join("\n"),
            )
          }
          className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded text-[8px] font-black transition-all shrink-0 ml-2"
        >
          <Sparkles className="w-2 h-2" />
          FIX
        </button>
      </div>

      {/* Tab Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-[#1e1e1e]"
      >
        {renderContent()}
      </div>
    </div>
  );
};
