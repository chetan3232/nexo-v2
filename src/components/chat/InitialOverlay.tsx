import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Code,
  Database,
  Palette,
  ChevronDown,
  Cpu,
  Zap,
  Info,
  Command,
  Globe,
  MessageSquare,
  HardDrive,
  FileArchive,
  Trash2,
  MoreVertical,
  Check,
  CloudUpload,
  User,
  Mic,
  Radio,
} from "lucide-react";
import { useAgentStore } from "../../stores/agentStore";
import { useChatStore } from "../../stores/chatStore";
import { useProjectStore } from "../../stores/projectStore";
import {
  auth,
  loadChatsFromFirebase,
  deleteChatFromFirebase,
} from "../../services/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import JSZip from "jszip";

interface InitialOverlayProps {
  onStart: (prompt: string) => void;
}

export const InitialOverlay: React.FC<InitialOverlayProps> = ({ onStart }) => {
  const {
    selectedModel,
    setSelectedModel,
    projectMode,
    setProjectMode,
    selectedLanguage,
    setSelectedLanguage,
  } = useAgentStore();

  const [prompt, setPrompt] = useState("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [zipStatus, setZipStatus] = useState<
    Record<string, "idle" | "zipping" | "done">
  >({});
  const [driveStatus, setDriveStatus] = useState<
    Record<string, "idle" | "uploading" | "done">
  >({});
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadChatsFromFirebase(user.uid).then((chats) => {
          setChatHistory(chats);
        });
      } else {
        setChatHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLoadChat = (chat: any) => {
    const { setMessages, setCurrentChatId, setHasStarted } =
      useChatStore.getState();
    const { setCurrentContent } = useProjectStore.getState();
    const { setSelectedModel, setProjectMode, setTechStack } = useAgentStore.getState();

    setMessages(chat.messages || []);
    setCurrentContent(chat.content || null);
    setCurrentChatId(chat.id);
    if (chat.model) {
      setSelectedModel(chat.model);
    }
    if (chat.projectMode) {
      setProjectMode(chat.projectMode);
    }
    if (chat.techStack) {
      setTechStack(chat.techStack);
    }
    if (chat.messages?.length > 0) {
      setHasStarted(true);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (auth.currentUser) {
      await deleteChatFromFirebase(auth.currentUser.uid, id);
      setChatHistory((prev) => prev.filter((c) => c.id !== id));
    }
    setOpenMenuId(null);
  };

  const handleDownloadZip = async (e: React.MouseEvent, chat: any) => {
    e.stopPropagation();
    setZipStatus((prev) => ({ ...prev, [chat.id]: "zipping" }));
    try {
      const zip = new JSZip();
      const files = chat.content?.files || {};
      const projName = chat.name || chat.title || "Untitled Project";
      if (Object.keys(files).length === 0) {
        zip.file(
          "README.md",
          `# ${projName}\n\nNo files were found in this project.`,
        );
      } else {
        Object.entries(files).forEach(([filePath, content]) => {
          const cleanPath = filePath.startsWith("/")
            ? filePath.slice(1)
            : filePath;
          zip.file(cleanPath, content as string);
        });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projName.replace(/\s+/g, "-").toLowerCase()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setZipStatus((prev) => ({ ...prev, [chat.id]: "done" }));
      setTimeout(
        () => setZipStatus((prev) => ({ ...prev, [chat.id]: "idle" })),
        2000,
      );
    } catch (err) {
      console.error("ZIP failed:", err);
      setZipStatus((prev) => ({ ...prev, [chat.id]: "idle" }));
    }
    setOpenMenuId(null);
  };

  const handleUploadToDrive = async (e: React.MouseEvent, chat: any) => {
    e.stopPropagation();
    if (!auth.currentUser) {
      alert("Please sign in first to upload to Google Drive.");
      return;
    }
    setDriveStatus((prev) => ({ ...prev, [chat.id]: "uploading" }));
    const projName = chat.name || chat.title || "Untitled Project";
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      const result = await signInWithPopup(auth, provider);
      // @ts-ignore
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) throw new Error("No access token");

      const zip = new JSZip();
      const files = chat.content?.files || {};
      if (Object.keys(files).length === 0) {
        zip.file("README.md", `# ${projName}`);
      } else {
        Object.entries(files).forEach(([fp, content]) => {
          zip.file(fp.startsWith("/") ? fp.slice(1) : fp, content as string);
        });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const fileName = `${projName.replace(/\s+/g, "-").toLowerCase()}.zip`;

      const metadata = {
        name: fileName,
        mimeType: "application/zip",
      };
      const form = new FormData();
      form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
      );
      form.append("file", blob);

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );

      if (!uploadRes.ok) throw new Error("Drive upload failed");
      const uploadData = await uploadRes.json();
      setDriveStatus((prev) => ({ ...prev, [chat.id]: "done" }));
      alert(
        `✅ "${fileName}" uploaded to your Google Drive!\nFile ID: ${uploadData.id}`,
      );
      setTimeout(
        () => setDriveStatus((prev) => ({ ...prev, [chat.id]: "idle" })),
        3000,
      );
    } catch (err: any) {
      console.error("Drive upload failed:", err);
      alert(`Drive upload failed: ${err.message}`);
      setDriveStatus((prev) => ({ ...prev, [chat.id]: "idle" }));
    }
    setOpenMenuId(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (prompt.trim()) {
      onStart(prompt);
    }
  };

  // Voice-to-App on landing screen
  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser.");
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

    recognition.onstart = () => setIsListening(true);

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
        setPrompt(prev => (prev + " " + final).trim());
        setLiveTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setLiveTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setLiveTranscript("");
    };

    recognition.start();
  }, [isListening]);

  const models = [
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "Google",
      desc: "Fast reasoning, high free-tier quota (Recommended)",
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      provider: "Google",
      desc: "Best quality, deep reasoning",
    },
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "Google",
      desc: "Balanced speed & quality, generous limits",
    },
    {
      id: "qwen/qwen3-coder-480b-a35b-instruct",
      name: "Qwen 3 Coder 480B",
      provider: "NVIDIA NIM",
      desc: "State-of-the-art coding and reasoning assistant",
    },
    {
      id: "stepfun-ai/step-3.5-flash",
      name: "Step 3.5 Flash",
      provider: "NVIDIA NIM",
      desc: "StepFun Reasoning and Generation Model",
    },
    {
      id: "groq/llama-3.3-70b-versatile",
      name: "Llama 3.3 70B (Groq)",
      provider: "Groq",
      desc: "High performance open source reasoning",
    },
  ];

  const languages = [
    "HTML",
    "TypeScript",
    "JavaScript",
    "Python",
    "Go",
    "Rust",
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-studio-bg flex font-sans text-studio-text overflow-hidden">
      {/* Background cinematic blur radial gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-studio-accent/5 blur-[120px] pointer-events-none animate-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-studio-secondary/5 blur-[120px] pointer-events-none animate-glow" />

      {/* Sidebar Container */}
      <div className="w-72 hidden lg:flex flex-col border-r border-studio-border bg-studio-panel/40 backdrop-blur-xl shrink-0 z-10">
        {/* Logo Header */}
        <div className="p-8 flex items-center gap-3 select-none">
          <div className="w-10 h-10 bg-gradient-to-tr from-studio-accent to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-studio-accent/25 shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95 cursor-pointer">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter text-studio-text truncate">
            NEXO WORKSPACE
          </span>
        </div>

        {/* Chat History */}
        <div className="flex-1 flex flex-col px-6 pb-6 overflow-hidden">
          <h3 className="text-[10px] font-black text-studio-muted mb-4 uppercase tracking-[0.2em] px-2 shrink-0 select-none">
            Recent Projects
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {chatHistory.length === 0 && (
              <div className="text-[12px] text-studio-muted p-4 text-center rounded-2xl bg-studio-card/30 border border-studio-border/60 border-dashed">
                {!auth.currentUser ? (
                  <div className="space-y-3">
                    <p className="text-xs">Sign in to save and sync projects.</p>
                    <button
                      onClick={handleLogin}
                      className="px-4 py-2 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold rounded-xl text-xs transition-all w-full flex items-center justify-center gap-2 shadow-lg shadow-studio-accent/20"
                    >
                      <User className="w-4.5 h-4.5" /> Connect Google Account
                    </button>
                  </div>
                ) : (
                  "No projects found."
                )}
              </div>
            )}
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleLoadChat(chat)}
                className="group relative flex items-center justify-between p-3.5 rounded-xl bg-studio-card/25 hover:bg-studio-card/65 border border-studio-border/60 hover:border-studio-accent/30 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <MessageSquare className="w-4 h-4 text-stone-400 shrink-0" />
                  <div className="truncate text-[13px] font-medium text-stone-700">
                    {chat.name || chat.title || "Untitled Project"}
                  </div>
                </div>

                {/* 3-Dot Action Menu */}
                <div
                  className="relative action-menu-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="p-1 text-studio-muted hover:text-studio-text hover:bg-studio-panel/50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {openMenuId === chat.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-1.5 bg-studio-card border border-studio-border shadow-2xl rounded-xl overflow-hidden z-50 w-44"
                      >
                        {/* Download ZIP */}
                        <button
                          onClick={(e) => handleDownloadZip(e, chat)}
                          disabled={zipStatus[chat.id] === "zipping"}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold text-studio-muted hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
                        >
                          {zipStatus[chat.id] === "zipping" ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              <span>Zipping...</span>
                            </>
                          ) : zipStatus[chat.id] === "done" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Downloaded!</span>
                            </>
                          ) : (
                            <>
                              <FileArchive className="w-3.5 h-3.5" />
                              <span>Download ZIP</span>
                            </>
                          )}
                        </button>
                        {/* Upload to Drive */}
                        <button
                          onClick={(e) => handleUploadToDrive(e, chat)}
                          disabled={driveStatus[chat.id] === "uploading"}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold text-studio-muted hover:bg-studio-accent/15 hover:text-studio-accent transition-colors"
                        >
                          {driveStatus[chat.id] === "uploading" ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-studio-accent border-t-transparent rounded-full animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : driveStatus[chat.id] === "done" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-studio-accent" />
                              <span>Uploaded!</span>
                            </>
                          ) : (
                            <>
                              <HardDrive className="w-3.5 h-3.5" />
                              <span>Upload to Drive</span>
                            </>
                          )}
                        </button>
                        <div className="h-px bg-studio-border mx-2" />
                        {/* Delete */}
                        <button
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-bold text-red-400 hover:bg-red-950/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="p-8 pb-10 flex flex-col gap-2 select-none shrink-0">
          <div className="flex items-center gap-2 opacity-60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black text-studio-muted uppercase tracking-[0.2em]">
              Dual AI Engine Active
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-bold text-studio-accent/70 bg-studio-accent/10 px-2 py-0.5 rounded-full border border-studio-accent/20">
              ⚡ Fast: Gemini Flash
            </span>
            <span className="text-[8px] font-bold text-purple-500/70 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              🧠 Deep: {models.find(m => m.id === selectedModel)?.name?.split(" ").slice(0, 3).join(" ") || "Gemini Pro"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative min-w-0 z-10">
        {/* Mobile Logo Fallback */}
        <div className="absolute top-8 left-8 flex items-center gap-3 lg:hidden select-none">
          <div className="w-9 h-9 bg-gradient-to-tr from-studio-accent to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tighter text-studio-text">
            NEXO WORKSPACE
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-4xl space-y-10"
        >
          <div className="space-y-4 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-studio-text tracking-tighter leading-none">
              Build your next{" "}
              <span className="bg-gradient-to-r from-studio-accent via-sky-400 to-studio-secondary bg-clip-text text-transparent">
                masterpiece.
              </span>
            </h2>
            <p className="text-studio-muted text-lg font-medium max-w-xl mx-auto">
              A premium AI Operating System for creating complete application structures.
            </p>
          </div>

            {/* Main Action Bar */}
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-studio-accent to-studio-secondary rounded-[2.5rem] blur opacity-15 group-focus-within:opacity-35 transition duration-1000"></div>
            
            {/* Live transcript in textarea */}
            {isListening && liveTranscript && (
              <div className="absolute top-3 left-6 right-6 text-base text-indigo-400 italic opacity-80 pointer-events-none z-10">
                🎙️ {liveTranscript}
              </div>
            )}
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={isListening ? "🎙️ Listening... describe your app idea" : "Describe what you want to build (e.g. 'A modern SaaS dashboard with dark mode')..."}
              className="relative w-full bg-white border border-stone-200 rounded-[2.5rem] p-10 text-2xl font-medium focus:border-indigo-500 transition-all min-h-[220px] resize-none outline-none shadow-xl"
              autoFocus
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-3">
              {/* Voice Button */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-3.5 rounded-2xl font-bold transition-all flex items-center gap-2 relative ${
                  isListening
                    ? "bg-red-500 text-white shadow-xl shadow-red-200 scale-105"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200 hover:scale-105"
                }`}
                title={isListening ? "Stop recording" : "Voice-to-App: Speak your idea"}
              >
                {isListening ? (
                  <>
                    <Radio className="w-5 h-5 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <button
                type="submit"
                disabled={!prompt.trim()}
                className="px-7 py-3.5 bg-gradient-to-tr from-studio-accent to-blue-500 hover:from-studio-accent/90 hover:to-sky-400 text-white rounded-2xl font-bold shadow-xl shadow-studio-accent/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all flex items-center gap-2.5 group"
              >
                <span>Start Generation</span>{" "}
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </form>

          {/* Horizontal Configuration Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {/* Model Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-studio-panel/55 border border-studio-border hover:border-studio-accent/50 rounded-full text-xs font-bold text-studio-muted hover:text-studio-text transition-all shadow-md select-none"
              >
                <Cpu className="w-4 h-4 text-studio-accent" />
                <span>{models.find((m) => m.id === selectedModel)?.name || "Gemini 2.5 Flash"}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {isModelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-3 bg-studio-card border border-studio-border rounded-2xl shadow-2xl p-2 w-64 z-50"
                  >
                    {models.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors ${selectedModel === m.id ? "bg-studio-accent/15 text-studio-accent" : "hover:bg-studio-panel/40 text-studio-muted hover:text-studio-text"}`}
                      >
                        <div className="text-xs font-bold">{m.name}</div>
                        <div className="text-[9px] opacity-60 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-4 w-px bg-studio-border" />

            {/* Mode Selector */}
            <div className="flex bg-studio-panel/55 p-1 rounded-full border border-studio-border shadow-md">
              <button
                type="button"
                onClick={() => setProjectMode("frontend")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${projectMode === "frontend" ? "bg-studio-accent text-white shadow-md shadow-studio-accent/10" : "text-studio-muted hover:text-studio-text"}`}
              >
                <Palette className="w-4 h-4" /> Frontend Only
              </button>
              <button
                type="button"
                onClick={() => setProjectMode("fullstack")}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${projectMode === "fullstack" ? "bg-studio-accent text-white shadow-md shadow-studio-accent/10" : "text-studio-muted hover:text-studio-text"}`}
              >
                <Database className="w-4 h-4" /> Fullstack Node
              </button>
            </div>

            <div className="h-4 w-px bg-studio-border" />

            {/* Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-studio-panel/55 border border-studio-border hover:border-studio-accent/50 rounded-full text-xs font-bold text-studio-muted hover:text-studio-text transition-all shadow-md select-none"
              >
                <Code className="w-4 h-4 text-studio-secondary" />
                <span>{selectedLanguage}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {isLangDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 mb-3 bg-studio-card border border-studio-border rounded-2xl shadow-2xl p-2 w-44 z-50"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-xl transition-colors ${selectedLanguage === lang ? "bg-studio-accent text-white" : "hover:bg-studio-panel/40 text-studio-muted hover:text-studio-text"}`}
                      >
                        <div className="text-xs font-bold">{lang}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap justify-center gap-3 select-none">
            {[
              "SaaS Dashboard",
              "AI Portfolio",
              "3D Product Landing",
              "Real-time E-commerce",
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setPrompt(
                    `Build a premium, high-fidelity ${tag} page with glowing cinematic design, responsive grid, dynamic charts, and clean animations...`,
                  )
                }
                className="px-5 py-2 bg-studio-panel/30 rounded-full border border-studio-border hover:border-studio-accent/40 text-xs font-bold text-studio-muted hover:text-studio-accent hover:bg-studio-panel/50 transition-all shadow-sm"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
