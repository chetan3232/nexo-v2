import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Cpu,
  ChevronDown,
  Mic,
  MicOff,
  Send,
  AlertTriangle,
  Plus,
  X,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  Radio
} from "lucide-react";
import { useChatStore } from "../../stores/chatStore";
import { useProjectStore } from "../../stores/projectStore";
import { useAgentStore } from "../../stores/agentStore";
import toast from "react-hot-toast";

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatPanelProps {
  onSend: (text: string, attachments?: { name: string; content: string; type: string }[]) => void;
}

// All supported models
const ALL_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", badge: "Default" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", badge: "Pro" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", badge: "New" },
  { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet", badge: "Premium" },
  { id: "openai/gpt-4o", name: "GPT-4o", badge: "Premium" },
  { id: "qwen/qwen3-coder-480b-a35b-instruct", name: "Qwen 3 Coder 480B", badge: "Nvidia" },
  { id: "stepfun-ai/step-3.5-flash", name: "Step 3.5 Flash", badge: "Nvidia" },
  { id: "groq/llama-3.3-70b-versatile", name: "Llama 3.3 70B (Groq)", badge: "Groq" },
];

const CollapsibleMessageContent: React.FC<{ text: string; role: string }> = ({ text, role }) => {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = text.length > 350;

  if (!isLong) {
    return (
      <div className="prose prose-xs max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    );
  }

  const fadeColor = role === "user" ? "from-[#111]" : "from-[#f3f3f3]";
  const displayText = expanded ? text : text.substring(0, 250) + "...";

  return (
    <div className="relative">
      <div className={`prose prose-xs max-w-none transition-all duration-300 ${!expanded ? "max-h-[140px] overflow-hidden select-none" : ""}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
        {!expanded && (
          <div className={`absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t ${fadeColor} to-transparent pointer-events-none`} />
        )}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`mt-1.5 text-[9px] font-bold uppercase tracking-wider hover:underline flex items-center gap-1 select-none ${
          role === "user" ? "text-sky-300" : "text-[#0ea5e9]"
        }`}
      >
        {expanded ? "Show Less" : "Read More"}
      </button>
    </div>
  );
};

const SkeletonLoader: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start max-w-[88%]"
    >
      <div className="bg-[#f3f3f3] border border-[#e8e8e8] text-[#111] rounded-2xl rounded-bl-sm px-4 py-3 w-64 space-y-2 select-none">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3 h-3 text-[#0ea5e9]" />
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#0ea5e9]">
            Nexo
          </span>
        </div>
        <div className="h-2 bg-[#e2e2e2] rounded w-5/6 animate-pulse" />
        <div className="h-2 bg-[#e2e2e2] rounded w-4/6 animate-pulse" />
        <div className="h-2 bg-[#e2e2e2] rounded w-3/4 animate-pulse" />
      </div>
    </motion.div>
  );
};

export const ChatPanel: React.FC<ChatPanelProps> = ({ onSend }) => {
  const { messages, input, setInput } = useChatStore();
  const { buildPhase, subStatus, tasks } = useProjectStore();
  const { selectedModel, setSelectedModel } = useAgentStore();

  const getLoaderTheme = () => {
    switch (buildPhase) {
      case "planning":
        return { bg: "bg-blue-50 border-blue-200 text-blue-700", loader: "text-blue-500" };
      case "generating":
        return { bg: "bg-purple-50 border-purple-200 text-purple-700", loader: "text-purple-500" };
      case "fixing":
        return { bg: "bg-amber-50 border-amber-200 text-amber-700", loader: "text-amber-500" };
      case "deploying":
        return { bg: "bg-teal-50 border-teal-200 text-teal-700", loader: "text-teal-500" };
      case "building":
      default:
        return { bg: "bg-[#f3f3f3] border-[#e8e8e8] text-[#555]", loader: "text-[#0ea5e9]" };
    }
  };
  const loaderTheme = getLoaderTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; content: string; type: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, buildPhase]);

  // Close model menu on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-model-menu]")) setIsModelMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Voice-to-App: Web Speech API
  const toggleVoice = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setLiveTranscript("");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("🎙️ Listening... Speak your idea!", { duration: 2000 });
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setLiveTranscript(interim);
      if (final) {
        const { input, setInput } = useChatStore.getState();
        setInput((input + " " + final).trim());
        setLiveTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setLiveTranscript("");
      if (event.error !== "no-speech") {
        toast.error(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setLiveTranscript("");
    };

    recognition.start();
  }, [isListening]);

  const handleSend = () => {
    if (!input.trim() && attachments.length === 0) return;

    let finalText = input.trim();

    // Append file contents to the message
    if (attachments.length > 0) {
      const attachText = attachments
        .map((a) =>
          a.type.startsWith("image/")
            ? `[Image attached: ${a.name}]`
            : `\n\n--- File: ${a.name} ---\n${a.content}`
        )
        .join("\n");
      finalText = finalText ? `${finalText}${attachText}` : attachText.trim();
    }

    onSend(finalText, attachments);
    setInput("");
    setAttachments([]);
  };

  // Handle file/image upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit

    const processed = await Promise.all(
      files.map(async (file) => {
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name} is too large (max 5MB)`);
          return null;
        }

        return new Promise<{ name: string; content: string; type: string } | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              content: reader.result as string,
              type: file.type,
            });
          };
          reader.onerror = () => {
            toast.error(`Failed to read ${file.name}`);
            resolve(null);
          };
          if (file.type.startsWith("image/")) {
            reader.readAsDataURL(file);
          } else {
            reader.readAsText(file);
          }
        });
      })
    );

    const valid = processed.filter(Boolean) as { name: string; content: string; type: string }[];
    setAttachments((prev) => [...prev, ...valid]);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedModelName =
    ALL_MODELS.find((m) => m.id === selectedModel)?.name || "Gemini 2.5 Flash";

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      {/* ── Header ── */}
      <div className="h-[52px] border-b border-[#e8e8e8] flex items-center justify-between px-4 shrink-0 select-none bg-white relative z-20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#0ea5e9]" />
          <span className="text-sm font-semibold text-[#111]">Nexo</span>
        </div>
        <button
          onClick={() => {
            useChatStore.getState().resetChat();
            useProjectStore.getState().setCurrentContent(null);
          }}
          className="p-1.5 hover:bg-[#f3f3f3] rounded-lg text-[#aaa] hover:text-[#111] transition-colors"
          title="New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3 pb-[160px] scrollbar-hide relative z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f3f3f3] border border-[#e8e8e8] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#0ea5e9]" />
            </div>
            <div className="space-y-1.5 max-w-[220px]">
              <h3 className="text-sm font-semibold text-[#111]">Nexo Workspace</h3>
              <p className="text-xs text-[#888] leading-relaxed">
                Describe what you'd like to build. Nexo will generate it live.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs leading-relaxed max-w-[88%] ${
                      msg.role === "user"
                        ? "bg-[#111] text-white rounded-br-sm"
                        : msg.isError
                        ? "bg-red-50 border border-red-200 text-red-700 rounded-bl-sm flex gap-2"
                        : "bg-[#f3f3f3] border border-[#e8e8e8] text-[#111] rounded-bl-sm"
                    }`}
                  >
                    {msg.role !== "user" && !msg.isError && (
                      <div className="flex items-center gap-1.5 mb-2 select-none">
                        <Sparkles className="w-3 h-3 text-[#0ea5e9]" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#0ea5e9]">
                          Nexo {msg.model ? `(${ALL_MODELS.find((m) => m.id === msg.model)?.name || msg.model})` : ""}
                        </span>
                      </div>
                    )}
                    {msg.isError && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <CollapsibleMessageContent text={msg.text} role={msg.role} />
                  </div>
                </motion.div>
              ))}

              {/* Skeleton loading bubble */}
              {buildPhase === "planning" && messages.length > 0 && messages[messages.length - 1].role === "user" && (
                <SkeletonLoader />
              )}

              {/* Multi-Agent Build Progress */}
              {(buildPhase !== "idle" && buildPhase !== "done") && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2.5 max-w-[92%]"
                >
                  {/* Phase Header */}
                  <div className={`border rounded-2xl px-4 py-3 flex items-center gap-3 w-fit select-none transition-all duration-500 ${loaderTheme.bg}`}>
                    <Loader2 className={`w-3.5 h-3.5 animate-spin shrink-0 ${loaderTheme.loader}`} />
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">
                        {buildPhase === "planning" && "🧠 Planner Agent"}
                        {buildPhase === "generating" && "⚡ Code Agent"}
                        {buildPhase === "fixing" && "🔧 Fix Agent"}
                        {buildPhase === "deploying" && "🚀 Deploy Agent"}
                        {buildPhase === "building" && "🤖 AI Engine"}
                      </div>
                      <div className="text-[11px] font-semibold">{subStatus || "Processing…"}</div>
                    </div>
                  </div>

                  {/* Agent Task Pipeline */}
                  {tasks.length > 0 && (
                    <div className="flex flex-col gap-1.5 border-l-2 border-[#e8e8e8] ml-3 pl-4 py-1 select-none">
                      {tasks.map((task, idx) => {
                        const isRunning = task.status === "running";
                        const isDone = task.status === "done";
                        const isError = task.status === "error";
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                              isDone ? "bg-emerald-500 shadow-sm shadow-emerald-300"
                              : isRunning ? "bg-[#0ea5e9] animate-pulse shadow-sm shadow-sky-300"
                              : isError ? "bg-red-400"
                              : "bg-[#ddd]"
                            }`} />
                            <span className={`text-[10px] font-medium flex-1 leading-tight transition-all ${
                              isDone ? "text-[#aaa] line-through"
                              : isRunning ? "text-[#0ea5e9] font-semibold"
                              : isError ? "text-red-500"
                              : "text-[#ccc]"
                            }`}>
                              {task.label}
                            </span>
                            {isDone && (
                              <span className="text-[7px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                ✓
                              </span>
                            )}
                            {isRunning && (
                              <span className="flex gap-0.5 shrink-0">
                                {[0,1,2].map(i => (
                                  <span key={i} className="w-1 h-1 bg-[#0ea5e9] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Floating Input ── */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 bg-gradient-to-t from-white via-white/90 to-transparent z-20">
        <div className="border border-[#e8e8e8] bg-white rounded-2xl shadow-sm focus-within:border-[#0ea5e9]/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.08)] transition-all">

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-[#f3f3f3] border border-[#e8e8e8] rounded-lg px-2 py-1 text-[10px] text-[#555] max-w-[140px]"
                >
                  {att.type.startsWith("image/") ? (
                    <ImageIcon className="w-3 h-3 text-[#0ea5e9] shrink-0" />
                  ) : (
                    <Paperclip className="w-3 h-3 text-[#0ea5e9] shrink-0" />
                  )}
                  <span className="truncate font-medium">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="shrink-0 text-[#aaa] hover:text-[#e55] transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Live transcript overlay */}
          <AnimatePresence>
            {isListening && liveTranscript && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mx-3 mt-2.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-600 font-medium italic"
              >
                🎙️ {liveTranscript}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isListening ? "🎙️ Listening... speak your idea" : "Make changes, add new features, ask for anything"}
            className="w-full bg-transparent py-3 px-4 text-xs text-[#111] placeholder:text-[#aaa] resize-none h-[58px] outline-none leading-relaxed"
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 pb-2.5">
            <div className="flex items-center gap-1.5">

              {/* Model picker */}
              <div className="relative" data-model-menu>
                <button
                  type="button"
                  onClick={() => setIsModelMenuOpen((v) => !v)}
                  className="flex items-center gap-1 px-2 py-1 bg-[#f3f3f3] hover:bg-[#ebebeb] border border-[#e8e8e8] rounded-lg text-[10px] font-semibold text-[#555] hover:text-[#111] transition-all select-none max-w-[130px]"
                >
                  <Cpu className="w-3 h-3 text-[#0ea5e9] shrink-0" />
                  <span className="truncate">{selectedModelName}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-[#aaa] shrink-0" />
                </button>

                {isModelMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-1.5 bg-white border border-[#e8e8e8] rounded-xl shadow-xl p-1 w-52 z-50">
                    <div className="px-2 py-1 text-[9px] font-bold text-[#aaa] uppercase tracking-wider">
                      Select Model
                    </div>
                    {ALL_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between gap-2 ${
                          selectedModel === m.id
                            ? "bg-[#0ea5e9] text-white"
                            : "hover:bg-[#f3f3f3] text-[#333]"
                        }`}
                      >
                        <span className="text-[11px] font-medium">{m.name}</span>
                        {m.badge && (
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${
                              selectedModel === m.id
                                ? "bg-white/20 text-white"
                                : "bg-[#e8e8e8] text-[#666]"
                            }`}
                          >
                            {m.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.txt,.md,.js,.ts,.tsx,.jsx,.css,.html,.json,.py,.rs,.go,.java,.cpp,.c,.php,.rb,.xml,.yaml,.yml,.sh,.env,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Attach file */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-[#aaa] hover:text-[#0ea5e9] hover:bg-[#f3f3f3] transition-colors"
                title="Attach file or image"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              {/* Voice-to-App Mic */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`relative p-1.5 rounded-lg transition-all ${
                  isListening
                    ? "text-red-500 bg-red-50 hover:bg-red-100 ring-2 ring-red-300"
                    : "text-[#aaa] hover:text-[#555] hover:bg-[#f3f3f3]"
                }`}
                title={isListening ? "Stop voice input" : "Voice-to-App: Speak your idea"}
              >
                {isListening ? (
                  <>
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  </>
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!input.trim() && attachments.length === 0}
              className="w-8 h-8 bg-[#111] hover:bg-[#333] text-white rounded-xl disabled:opacity-25 transition-all flex items-center justify-center active:scale-95 disabled:scale-100"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
