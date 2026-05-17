import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  Search,
  Zap,
  Code,
  Shield,
  Rocket,
  Palette,
  Hammer,
} from "lucide-react";
import { Orchestrator } from "../../agents/Orchestrator";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const commands: CommandItem[] = [
    {
      id: "fix",
      label: "/fix - Auto-repair code errors",
      icon: Hammer,
      action: () =>
        Orchestrator.getInstance().manualFix(
          "Please fix the current project errors",
        ),
    },
    {
      id: "optimize",
      label: "/optimize - Performance & Clean code",
      icon: Zap,
      action: () => Orchestrator.getInstance().runArchitectureAudit(),
    },
    {
      id: "deploy",
      label: "/deploy - One-click Vercel deployment",
      icon: Rocket,
      action: () => {},
    },
    {
      id: "darkmode",
      label: "/darkmode - Toggle Dark/Light themes",
      icon: Palette,
      action: () => {},
    },
    {
      id: "refactor",
      label: "/convert-nextjs - Migrate project to Next.js",
      icon: Code,
      action: () =>
        Orchestrator.getInstance().handleRefactor(
          "Convert this project to Next.js",
        ),
    },
    {
      id: "security",
      label: "/scan - Run Security Audit",
      icon: Shield,
      action: () => {},
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border border-stone-200/50 overflow-hidden"
        >
          <div className="p-6 border-b border-stone-100 flex items-center gap-4">
            <Search className="w-5 h-5 text-stone-400" />
            <input
              autoFocus
              placeholder="Type a command (e.g. /fix)..."
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-stone-900 placeholder:text-stone-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-[10px] font-black text-stone-400">ESC</span>
            </div>
          </div>

          <div className="p-3 max-h-[400px] overflow-y-auto no-scrollbar">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-stone-50 rounded-[1.5rem] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-stone-50 rounded-xl text-stone-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <cmd.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-stone-700 group-hover:text-stone-900 transition-colors">
                    {cmd.label}
                  </span>
                </div>
                {cmd.shortcut && (
                  <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Command className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                  Nexo Command Palette
                </span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-stone-400">
              ↑↓ to navigate · ↵ to select
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
