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
    <div className="h-full flex flex-col bg-zinc-950 relative overflow-hidden">
      {/* Message Timeline */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-40 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-zinc-200 text-sm font-bold">Nexo AI Workspace</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
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
                    className={`px-4.5 py-3.5 rounded-[22px] text-xs leading-relaxed max-w-[85%] shadow-md border ${
                      msg.role === "user"
                        ? "bg-zinc-900 border-zinc-800 text-zinc-100 rounded-tr-none"
                        : msg.isError
                        ? "bg-red-950/20 border-red-900/50 text-red-200 rounded-tl-none flex gap-2.5"
                        : "bg-zinc-900/40 border-zinc-900/60 backdrop-blur-md text-zinc-300 rounded-tl-none"
                    }`}
                  >
                    {msg.role !== "user" && !msg.isError && (
                      <div className="flex items-center gap-1.5 mb-2 opacity-50 select-none">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                          Nexo AI
                        </span>
                      </div>
                    )}
                    {msg.isError && (
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="prose prose-sm prose-invert max-w-none text-zinc-300">
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
                  className="flex flex-col gap-4 max-w-[85%]"
                >
                  {/* Status Indicator */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl px-4 py-3 shadow-md flex items-center gap-3 w-fit select-none">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                      Nexo Agent:{" "}
                      <span className="text-zinc-500 font-semibold normal-case tracking-normal">
                        {subStatus || "Running flow operations..."}
                      </span>
                    </span>
                  </div>

                  {/* Task steps checklist */}
                  {tasks.length > 0 && (
                    <div className="ml-5 flex flex-col gap-2 border-l border-zinc-800 pl-4 py-1 select-none">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              task.status === "done"
                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                : task.status === "running"
                                ? "bg-indigo-500 animate-pulse"
                                : "bg-zinc-850"
                            }`}
                          />
                          <span
                            className={`text-[10px] font-bold tracking-wide transition-all ${
                              task.status === "done"
                                ? "text-zinc-400"
                                : task.status === "running"
                                ? "text-indigo-400"
                                : "text-zinc-650"
                            }`}
                          >
                            {task.label}
                          </span>
                          {task.status === "done" && (
                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
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
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
        <div className="relative border border-zinc-800 bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-xl focus-within:border-zinc-700 transition-all flex flex-col p-3 gap-2">
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
            placeholder="Type a message or edit instructions..."
            className="w-full bg-transparent py-1 px-2 text-xs text-zinc-200 placeholder:text-zinc-650 resize-none h-16 outline-none"
          />

          {/* Action Toolbar */}
          <div className="flex items-center justify-between px-2 pt-2 border-t border-zinc-850">
            <div className="flex items-center gap-3">
              {/* Model Dropdown Selection */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950/80 border border-zinc-850 hover:border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-450 transition-all select-none"
                >
                  <Cpu className="w-3.5 h-3.5 text-zinc-600" />
                  <span>{models.find((m) => m.id === selectedModel)?.name || "Gemini 2.5 Flash"}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-600" />
                </button>
                {isModelMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-1.5 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-1 w-44 z-50">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                          selectedModel === m.id
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-zinc-900 text-zinc-450"
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
                className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-zinc-350 transition-colors"
                title="Attach code context"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Mic action */}
              <button
                type="button"
                className="p-1.5 hover:bg-zinc-850 rounded-lg text-zinc-500 hover:text-zinc-350 transition-colors"
                title="Voice prompt"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 bg-zinc-200 hover:bg-white text-zinc-900 rounded-xl disabled:opacity-30 transition-all flex items-center justify-center shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
