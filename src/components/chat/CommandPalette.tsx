import React, { useState, useEffect, useRef } from "react";
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette: Ctrl+K or Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
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
      shortcut: "F",
    },
    {
      id: "optimize",
      label: "/optimize - Performance & Clean code",
      icon: Zap,
      action: () => Orchestrator.getInstance().runArchitectureAudit(),
      shortcut: "O",
    },
    {
      id: "deploy",
      label: "/deploy - One-click Live Vercel deployment",
      icon: Rocket,
      action: () => {
        // Trigger deploy in store
        // @ts-ignore
        Orchestrator.getInstance().handleDeploy?.() || toast.success("Deploying...");
      },
      shortcut: "D",
    },
    {
      id: "refactor",
      label: "/convert-nextjs - Migrate project code to Next.js",
      icon: Code,
      action: () =>
        Orchestrator.getInstance().handleRefactor(
          "Convert this project to Next.js",
        ),
      shortcut: "R",
    },
    {
      id: "security",
      label: "/scan - Run security & vulnerability audit",
      icon: Shield,
      action: () => Orchestrator.getInstance().runProductionScan(),
      shortcut: "S",
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Sync index boundary
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle keyboard navigation when open
  useEffect(() => {
    if (!isOpen) return;

    const handleNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleNav);
    return () => window.removeEventListener("keydown", handleNav);
  }, [isOpen, selectedIndex, filteredCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        {/* Background Blur Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Command Palette Card Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-studio-card/95 backdrop-blur-xl border border-studio-border shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Search Header */}
          <div className="p-5 border-b border-studio-border/60 flex items-center gap-3.5 bg-studio-panel/50">
            <Search className="w-5 h-5 text-studio-muted shrink-0" />
            <input
              autoFocus
              placeholder="Search AI action scripts (e.g. /fix, /optimize)..."
              className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-studio-text placeholder:text-studio-muted/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-studio-bg rounded-lg border border-studio-border">
              <span className="text-[9px] font-black text-studio-muted">ESC</span>
            </div>
          </div>

          {/* List Items */}
          <div
            ref={listRef}
            className="p-2 max-h-[340px] overflow-y-auto no-scrollbar bg-studio-bg/25"
          >
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-left border ${
                    selectedIndex === index
                      ? "bg-studio-accent/15 border-studio-accent/30 text-studio-accent"
                      : "bg-transparent border-transparent text-studio-muted hover:bg-studio-panel/50 hover:text-studio-text"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`p-2 rounded-lg transition-all duration-350 flex items-center justify-center border ${
                        selectedIndex === index
                          ? "bg-studio-accent text-white border-studio-accent/20"
                          : "bg-studio-bg text-studio-muted border-studio-border/60"
                      }`}
                    >
                      <cmd.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold transition-colors">
                      {cmd.label}
                    </span>
                  </div>
                  {cmd.shortcut && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] bg-studio-bg px-2 py-0.5 rounded border border-studio-border/80 font-black text-studio-muted">
                        ⌘{cmd.shortcut}
                      </span>
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="text-studio-muted/50 text-xs italic text-center py-8">
                No matching commands found
              </div>
            )}
          </div>

          {/* Footer Guide info */}
          <div className="p-3.5 bg-studio-panel/90 border-t border-studio-border/70 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-studio-accent animate-pulse" />
              <span className="text-[8px] font-black text-studio-muted uppercase tracking-widest">
                Nexo Command Console
              </span>
            </div>
            <span className="text-[8px] font-bold text-studio-muted/75">
              [↑↓] navigate  ·  [Enter] execute  ·  [Ctrl+K] toggle
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
