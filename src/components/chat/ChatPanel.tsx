import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Sparkles,
  Loader2,
  Brain,
  FileCode2,
  CheckCircle2,
  Zap,
  Hammer,
  AlertTriangle,
  Wrench,
  Rocket,
  Shuffle,
  PartyPopper
} from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useProjectStore } from "../../stores/projectStore";
import { AgentEvent } from "../../types/agentEvents";

interface ChatPanelProps {
  onSend: (text: string) => void;
}

// ─── Individual Event Cards ─────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.25, ease: "easeOut" as any } },
};

const ThinkingCard: React.FC<{ message: string }> = ({ message }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-start gap-3">
    <div className="mt-0.5 w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
      <Brain className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
    </div>
    <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[90%]">
      <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-widest mb-0.5">Thinking</p>
      <p className="text-[13px] text-indigo-900 leading-relaxed">{message}</p>
    </div>
  </motion.div>
);

const FileCreateCard: React.FC<{ path: string; isDone: boolean }> = ({ path, isDone }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-center gap-2.5 ml-9">
    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDone ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-mono font-medium transition-all duration-300 ${isDone ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
      <FileCode2 className="w-3 h-3 shrink-0" />
      {path}
      {!isDone && <Loader2 className="w-3 h-3 animate-spin ml-1 opacity-60" />}
      {isDone && <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-500" />}
    </div>
  </motion.div>
);

const CodePreviewCard: React.FC<{ path: string; chunk: string }> = ({ path, chunk }) => {
  const lines = chunk.split("\n").slice(0, 5);
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" className="ml-9 max-w-[90%]">
      <div className="bg-stone-900 rounded-xl overflow-hidden border border-stone-700/50">
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-800/80 border-b border-stone-700/50">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-mono text-stone-400">{path}</span>
          <span className="ml-auto text-[9px] text-stone-500 uppercase tracking-wider">writing...</span>
        </div>
        <div className="px-3 py-2.5 space-y-0.5">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-stone-600 text-[10px] font-mono w-4 text-right shrink-0">{i + 1}</span>
              <span className="text-stone-300 text-[10px] font-mono truncate">{line || " "}</span>
            </div>
          ))}
          <div className="flex gap-3">
            <span className="text-stone-600 text-[10px] font-mono w-4 text-right shrink-0">···</span>
            <span className="text-indigo-400 text-[10px] font-mono animate-pulse">▋</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BuildStartCard: React.FC = () => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-center gap-3 ml-1">
    <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
      <Hammer className="w-3.5 h-3.5 text-amber-600" />
    </div>
    <div className="bg-amber-50/80 border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
      <p className="text-[12px] font-bold text-amber-800">🏗️ Starting build process...</p>
      <div className="mt-2 h-1 w-48 bg-amber-100 rounded-full overflow-hidden">
        <div className="h-full bg-amber-400 rounded-full animate-[buildProgress_2s_ease-in-out_infinite]" style={{ width: "70%" }} />
      </div>
    </div>
  </motion.div>
);

const BuildSuccessCard: React.FC = () => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-center gap-3 ml-1">
    <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
    </div>
    <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
      <p className="text-[12px] font-bold text-emerald-800">✅ Build successful!</p>
    </div>
  </motion.div>
);

const BuildErrorCard: React.FC<{ message: string }> = ({ message }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-start gap-3 ml-1">
    <div className="mt-0.5 w-6 h-6 rounded-full bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
    </div>
    <div className="bg-red-50/80 border border-red-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[90%]">
      <p className="text-[12px] font-bold text-red-800 mb-1">⚠️ Error detected</p>
      <p className="text-[11px] text-red-700 font-mono leading-relaxed opacity-80 break-all">{message}</p>
    </div>
  </motion.div>
);

const AutoFixCard: React.FC<{ attempt: number; maxAttempts: number; error: string }> = ({ attempt, maxAttempts, error }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-start gap-3 ml-1">
    <div className="mt-0.5 w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
      <Wrench className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: "2s" }} />
    </div>
    <div className="bg-amber-50/80 border border-amber-100 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[90%]">
      <p className="text-[12px] font-bold text-amber-800">🔧 Auto-fixing (attempt {attempt}/{maxAttempts})</p>
      <p className="text-[11px] text-amber-700 font-mono mt-0.5 opacity-70 truncate">{error.slice(0, 80)}</p>
    </div>
  </motion.div>
);

const PreviewReadyCard: React.FC<{ url: string }> = ({ url }) => (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    className="flex items-start gap-3 ml-1"
  >
    <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
      <Rocket className="w-3.5 h-3.5 text-blue-600" />
    </div>
    <div className="bg-blue-50/80 border border-blue-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
      <p className="text-[12px] font-bold text-blue-800">🚀 Preview is ready!</p>
      <p className="text-[11px] text-blue-600 mt-0.5 font-mono">{url}</p>
    </div>
  </motion.div>
);

const AgentSwitchCard: React.FC<{ from: string; to: string }> = ({ from, to }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-center gap-2 ml-9">
    <Shuffle className="w-3 h-3 text-stone-400" />
    <span className="text-[11px] text-stone-400">Failover: <span className="line-through opacity-50">{from}</span> → <span className="font-semibold text-stone-600">{to}</span></span>
  </motion.div>
);

const DoneCard: React.FC<{ message: string; fileCount: number }> = ({ message, fileCount }) => (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    className="flex items-start gap-3 ml-1"
  >
    <div className="mt-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
      <PartyPopper className="w-3.5 h-3.5 text-white" />
    </div>
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-2xl rounded-tl-sm px-5 py-3.5 max-w-[90%]">
      <p className="text-[13px] font-bold text-indigo-900">{message}</p>
      {fileCount > 0 && (
        <div className="flex items-center gap-1.5 mt-2">
          <FileCode2 className="w-3 h-3 text-indigo-500" />
          <span className="text-[11px] text-indigo-600 font-semibold">{fileCount} files generated</span>
        </div>
      )}
    </div>
  </motion.div>
);

const UserBubble: React.FC<{ text: string }> = ({ text }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex justify-end">
    <div className="px-5 py-3 rounded-2xl rounded-tr-sm text-[13px] max-w-[85%] leading-relaxed bg-stone-900 text-white shadow-sm">
      {text}
    </div>
  </motion.div>
);

const AssistantBubble: React.FC<{ text: string }> = ({ text }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex justify-start">
    <div className="px-5 py-3 rounded-2xl rounded-tl-sm text-[13px] max-w-[90%] leading-relaxed bg-white text-stone-800 border border-stone-200 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
        <Sparkles className="w-3 h-3" />
        <span className="text-[9px] font-black uppercase tracking-widest">Nexo AI</span>
      </div>
      <div className="prose prose-sm max-w-none prose-stone">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  </motion.div>
);

// ─── Event Renderer ─────────────────────────────────────────────────────────

const EventRenderer: React.FC<{ event: AgentEvent; doneFiles: Set<string>; fileChunks: Record<string, string> }> = ({
  event,
  doneFiles,
  fileChunks,
}) => {
  switch (event.type) {
    case "thinking":
      return <ThinkingCard message={event.message} />;
    case "file_create":
      return <FileCreateCard path={event.path} isDone={doneFiles.has(event.path)} />;
    case "file_write":
      // Show code preview only for meaningful chunks
      if (event.chunk && event.chunk.trim().length > 20) {
        return <CodePreviewCard path={event.path} chunk={event.chunk} />;
      }
      return null;
    case "file_done":
      return null; // file_create card handles done state via doneFiles set
    case "build_start":
      return <BuildStartCard />;
    case "build_success":
      return <BuildSuccessCard />;
    case "build_error":
      return <BuildErrorCard message={event.message} />;
    case "auto_fix":
      return <AutoFixCard attempt={event.attempt} maxAttempts={event.maxAttempts} error={event.error} />;
    case "preview_ready":
      return <PreviewReadyCard url={event.url} />;
    case "agent_switch":
      return <AgentSwitchCard from={event.from} to={event.to} />;
    case "user":
      return <UserBubble text={event.text} />;
    case "assistant":
      return <AssistantBubble text={event.text} />;
    case "done":
      return <DoneCard message={event.message} fileCount={event.fileCount} />;
    default:
      return null;
  }
};

// ─── Main ChatPanel ──────────────────────────────────────────────────────────

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
            disabled={buildPhase === "building"}
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

            {/* Send button */}
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
        <p className="text-center text-[9px] text-stone-400 mt-2 font-medium tracking-wide uppercase">
          Nexo AI Workspace Engine · Autonomous Code Generation
        </p>
      </div>
    </div>
  );
};
