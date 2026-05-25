import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Cpu, ChevronDown, Paperclip, Mic, Send, AlertTriangle } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useProjectStore } from "../../stores/projectStore";
import { useAgentStore } from "../../stores/agentStore";

interface ChatPanelProps {
  onSend: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onSend }) => {
  const { messages, input, setInput } = useChatStore();
  const { buildPhase, subStatus, tasks } = useProjectStore();
  const { selectedModel, setSelectedModel } = useAgentStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, buildPhase]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const models = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  ];

  return (
    <div className="h-full flex flex-col bg-studio-bg relative overflow-hidden">
      {/* Subtle background glow orb */}
      <div className="absolute top-[20%] left-[-10%] w-[45%] h-[45%] rounded-full bg-studio-accent/5 blur-[100px] pointer-events-none animate-glow z-0" />

      {/* Message Timeline */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 pb-44 no-scrollbar relative z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-studio-panel border border-studio-border flex items-center justify-center shadow-lg shadow-black/40">
                <Sparkles className="w-8 h-8 text-studio-accent animate-pulse" />
              </div>
              <div className="absolute -inset-1 border border-studio-accent/15 border-t-studio-accent rounded-2xl animate-spin duration-1000" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-studio-text text-sm font-bold tracking-tight">Nexo Workspace OS</h3>
              <p className="text-xs text-studio-muted leading-relaxed">
                Describe the web page or logic you'd like to build. Nexo will orchestrate frontend, design, and architecture agents to code it live.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-5 py-4 rounded-[22px] text-xs leading-relaxed max-w-[85%] shadow-lg border ${
                      msg.role === "user"
                        ? "glass-card bg-studio-panel/85 border-studio-border/95 text-studio-text rounded-tr-none"
                        : msg.isError
                        ? "bg-red-950/15 border-red-900/40 text-red-200 rounded-tl-none flex gap-3 shadow-md"
                        : "glass-card bg-studio-panel/40 border-studio-border/60 text-studio-text/90 rounded-tl-none shadow-md"
                    }`}
                  >
                    {msg.role !== "user" && !msg.isError && (
                      <div className="flex items-center gap-1.5 mb-2.5 opacity-60 select-none">
                        <Sparkles className="w-3.5 h-3.5 text-studio-accent animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-studio-accent">
                          NEXO INTELLIGENCE
                        </span>
                      </div>
                    )}
                    {msg.isError && (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="prose prose-sm prose-invert max-w-none text-studio-text/90 font-medium">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Streaming/Building Agent progress logs */}
              {buildPhase === "building" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4 max-w-[85%] z-10"
                >
                  {/* Status Indicator */}
                  <div className="bg-studio-panel/45 border border-studio-border/80 rounded-2xl px-4 py-3.5 shadow-md flex items-center gap-3 w-fit select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-studio-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-studio-accent"></span>
                    </span>
                    <span className="text-[10px] font-black text-studio-text uppercase tracking-widest flex items-center gap-2">
                      NEXO AGENT:{" "}
                      <span className="text-studio-muted font-bold normal-case tracking-normal">
                        {subStatus || "Orchestrating instructions..."}
                      </span>
                    </span>
                  </div>

                  {/* Task steps checklist */}
                  {tasks.length > 0 && (
                    <div className="ml-5 flex flex-col gap-2.5 border-l border-studio-border/60 pl-4 py-1.5 select-none">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-350 ${
                              task.status === "done"
                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]"
                                : task.status === "running"
                                ? "bg-studio-accent animate-pulse shadow-[0_0_8px_rgba(124,58,237,0.55)]"
                                : "bg-studio-border/80"
                            }`}
                          />
                          <span
                            className={`text-[10px] font-bold tracking-wide transition-all ${
                              task.status === "done"
                                ? "text-studio-muted/75"
                                : task.status === "running"
                                ? "text-studio-accent"
                                : "text-studio-muted/40"
                            }`}
                          >
                            {task.label}
                          </span>
                          {task.status === "done" && (
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Done
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Prompt Input Panel */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-studio-bg via-studio-bg/95 to-transparent z-20">
        <div className="relative border border-studio-border/70 bg-studio-panel/75 backdrop-blur-xl rounded-[24px] shadow-2xl focus-within:border-studio-accent/40 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.06)] transition-all flex flex-col p-3.5 gap-2">
          {/* Text Area */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message or describe layout enhancements..."
            className="w-full bg-transparent py-1 px-2.5 text-xs text-studio-text placeholder:text-studio-muted/30 resize-none h-16 outline-none font-medium"
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between px-2 pt-2 border-t border-studio-border/50">
            <div className="flex items-center gap-3">
              {/* Model Dropdown Selection */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-studio-bg/85 border border-studio-border/70 hover:border-studio-accent/40 rounded-xl text-[10px] font-bold text-studio-muted hover:text-studio-text transition-all select-none"
                >
                  <Cpu className="w-3.5 h-3.5 text-studio-accent animate-pulse" />
                  <span>{models.find((m) => m.id === selectedModel)?.name || "Gemini 2.5 Flash"}</span>
                  <ChevronDown className="w-3 h-3 text-studio-muted" />
                </button>
                {isModelMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 bg-studio-card border border-studio-border rounded-xl shadow-2xl p-1 w-44 z-50">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                          selectedModel === m.id
                            ? "bg-studio-accent text-white"
                            : "hover:bg-studio-panel/50 text-studio-muted hover:text-studio-text"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Attach action */}
              <button
                type="button"
                className="p-1.5 hover:bg-studio-panel/60 rounded-xl text-studio-muted hover:text-studio-text transition-colors"
                title="Attach code context"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Mic action */}
              <button
                type="button"
                className="p-1.5 hover:bg-studio-panel/60 rounded-xl text-studio-muted hover:text-studio-text transition-colors"
                title="Voice prompt"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2.5 bg-gradient-to-tr from-studio-accent to-purple-650 hover:from-studio-accent hover:to-purple-550 text-studio-text rounded-xl disabled:opacity-30 transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:scale-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
