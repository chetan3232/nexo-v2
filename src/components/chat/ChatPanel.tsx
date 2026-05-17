import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useProjectStore } from "../../stores/projectStore";

interface ChatPanelProps {
  onSend: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onSend }) => {
  const { messages, input, setInput } = useChatStore();
  const { buildPhase, subStatus, tasks } = useProjectStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-stone-50/30 backdrop-blur-xl border-r border-stone-200 relative">
      <div className="h-12 border-b border-stone-200 flex items-center justify-between px-4 shrink-0 bg-white/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-sm text-stone-900">Nexo</span>
        </div>
        <button className="p-1.5 text-stone-400 hover:text-stone-600 rounded-md transition-colors hover:bg-stone-100">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white pb-32 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-5 py-3 rounded-2xl text-[13px] max-w-[90%] leading-relaxed shadow-sm border ${msg.role === "user" ? "bg-stone-900 text-white border-stone-800" : "bg-white text-stone-800 border-stone-200"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1 opacity-50">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Nexo AI
                    </span>
                  </div>
                )}
                <div className="prose prose-sm max-w-none prose-stone">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {buildPhase === "building" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              <div className="bg-white border border-stone-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 w-fit">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </div>
                <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                  Nexo AI:{" "}
                  <span className="text-stone-400 font-bold normal-case tracking-normal">
                    {subStatus || "Processing..."}
                  </span>
                </span>
              </div>

              {/* Task List UI */}
              <div className="ml-5 flex flex-col gap-1.5 border-l-2 border-stone-50 pl-4 py-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 group"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                        task.status === "done"
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          : task.status === "running"
                            ? "bg-indigo-500 animate-pulse"
                            : "bg-stone-200"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold tracking-tight transition-all duration-300 ${
                        task.status === "done"
                          ? "text-stone-900"
                          : task.status === "running"
                            ? "text-indigo-600"
                            : "text-stone-400"
                      }`}
                    >
                      {task.label}
                    </span>
                    {task.status === "done" && (
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                        Done
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-100">
        <div className="relative border border-stone-200 rounded-2xl bg-white shadow-sm focus-within:border-stone-300 focus-within:shadow-md transition-all overflow-hidden flex flex-col">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Make changes, add new features, ask for anything"
            className="w-full bg-transparent py-3 px-4 text-sm resize-none h-20 placeholder:text-stone-400 outline-none"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <button className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
              <button className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-1.5 bg-stone-900 text-white rounded-full hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
