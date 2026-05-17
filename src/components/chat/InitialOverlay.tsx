import React, { useState, useEffect, useRef } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
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

    setMessages(chat.messages || []);
    setCurrentContent(chat.content || null);
    setCurrentChatId(chat.id);
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
      if (Object.keys(files).length === 0) {
        // No files — just put a readme
        zip.file(
          "README.md",
          `# ${chat.title || "Nexo Project"}\n\nNo files were found in this project.`,
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
      a.download = `${(chat.title || "nexo-project").replace(/\s+/g, "-").toLowerCase()}.zip`;
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
    try {
      // Re-authenticate with Drive scope
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      const result = await signInWithPopup(auth, provider);
      // @ts-ignore
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) throw new Error("No access token");

      // Build ZIP
      const zip = new JSZip();
      const files = chat.content?.files || {};
      if (Object.keys(files).length === 0) {
        zip.file("README.md", `# ${chat.title || "Nexo Project"}`);
      } else {
        Object.entries(files).forEach(([fp, content]) => {
          zip.file(fp.startsWith("/") ? fp.slice(1) : fp, content as string);
        });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const fileName = `${(chat.title || "nexo-project").replace(/\s+/g, "-").toLowerCase()}.zip`;

      // Upload to Drive
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

  const models = [
    {
      id: "google/gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "Google",
      desc: "Superior Reasoning & Fast",
    },
    {
      id: "nvidia/minimax-m2.7",
      name: "MiniMax M2.7",
      provider: "NVIDIA",
      desc: "NVIDIA NIM · 8K ctx",
    },
    {
      id: "qwen/qwen-2.5-72b-instruct:free",
      name: "Qwen 2.5 72B",
      provider: "OpenRouter",
      desc: "Fast & Free",
    },
    {
      id: "groq/llama-3.3-70b-versatile",
      name: "Llama 3.3 70B",
      provider: "Groq",
      desc: "Direct Ultra-Fast",
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
    <div className="fixed inset-0 z-[100] bg-[#fbf9f6] flex font-sans">
      {/* Sidebar Container */}
      <div className="w-72 hidden lg:flex flex-col border-r border-stone-200/50 bg-[#fbf9f6] shrink-0">
        {/* Logo Header */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter text-stone-900 truncate">
            NEXO STUDIO
          </span>
        </div>

        {/* Chat History */}
        <div className="flex-1 flex flex-col px-6 pb-6 overflow-hidden">
          <h3 className="text-[10px] font-bold text-stone-400 mb-4 uppercase tracking-widest px-2 shrink-0">
            Recent Projects
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1 pr-2 no-scrollbar">
            {chatHistory.length === 0 && (
              <div className="text-[12px] text-stone-400 p-2">
                {!auth.currentUser ? (
                  <button
                    onClick={handleLogin}
                    className="text-indigo-500 font-medium hover:underline"
                  >
                    Sign in to save projects
                  </button>
                ) : (
                  "No projects found."
                )}
              </div>
            )}
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleLoadChat(chat)}
                className="group relative flex items-center justify-between p-3 rounded-xl hover:bg-white border border-transparent hover:border-stone-200 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <MessageSquare className="w-4 h-4 text-stone-400 shrink-0" />
                  <div className="truncate text-[13px] font-medium text-stone-700">
                    {chat.title}
                  </div>
                </div>

                {/* 3-Dot Action Menu */}
                <div
                  ref={menuRef}
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
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
                        className="absolute right-0 top-full mt-1 bg-white border border-stone-200 shadow-2xl rounded-xl overflow-hidden z-50 w-44"
                      >
                        {/* Download ZIP */}
                        <button
                          onClick={(e) => handleDownloadZip(e, chat)}
                          disabled={zipStatus[chat.id] === "zipping"}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          {zipStatus[chat.id] === "zipping" ? (
                            <>
                              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              <span>Zipping...</span>
                            </>
                          ) : zipStatus[chat.id] === "done" ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-500" />
                              <span>Downloaded!</span>
                            </>
                          ) : (
                            <>
                              <FileArchive className="w-4 h-4" />
                              <span>Download ZIP</span>
                            </>
                          )}
                        </button>
                        {/* Upload to Drive */}
                        <button
                          onClick={(e) => handleUploadToDrive(e, chat)}
                          disabled={driveStatus[chat.id] === "uploading"}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold text-stone-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                          {driveStatus[chat.id] === "uploading" ? (
                            <>
                              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : driveStatus[chat.id] === "done" ? (
                            <>
                              <Check className="w-4 h-4 text-indigo-500" />
                              <span>Saved to Drive!</span>
                            </>
                          ) : (
                            <>
                              <HardDrive className="w-4 h-4" />
                              <span>Upload to Drive</span>
                            </>
                          )}
                        </button>
                        <div className="h-px bg-stone-100 mx-2" />
                        {/* Delete */}
                        <button
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="p-8 pb-10 flex items-center gap-6 opacity-40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[9px] font-black text-stone-900 uppercase tracking-widest">
              NVIDIA H100 Cluster Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative min-w-0">
        {/* Mobile Logo Fallback */}
        <div className="absolute top-8 left-8 flex items-center gap-3 lg:hidden">
          <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tighter text-stone-900">
            NEXO STUDIO
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl space-y-10"
        >
          <div className="space-y-4 text-center">
            <h2 className="text-5xl font-black text-stone-900 tracking-tighter leading-none">
              Build your next{" "}
              <span className="text-indigo-600">masterpiece.</span>
            </h2>
            <p className="text-stone-400 text-xl font-medium">
              Simple, powerful, and autonomous AI development.
            </p>
          </div>

          {/* Main Action Bar */}
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-5 group-focus-within:opacity-20 transition duration-1000"></div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Describe what you want to build (e.g. 'A modern SaaS dashboard with dark mode')..."
              className="relative w-full bg-white border border-stone-200 rounded-[2.5rem] p-10 text-2xl font-medium focus:border-indigo-500 transition-all min-h-[220px] resize-none outline-none shadow-xl"
              autoFocus
            />
            <div className="absolute bottom-6 right-6 flex items-center gap-4">
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all flex items-center gap-3 group"
              >
                Start Generation{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>

          {/* Horizontal Configuration Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Model Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:border-indigo-500 transition-all shadow-sm"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{models.find((m) => m.id === selectedModel)?.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {isModelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-0 mb-3 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2 w-56 z-50"
                  >
                    {models.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors ${selectedModel === m.id ? "bg-indigo-50 text-indigo-600" : "hover:bg-stone-50 text-stone-600"}`}
                      >
                        <div className="text-[11px] font-bold">{m.name}</div>
                        <div className="text-[9px] opacity-60">{m.desc}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-4 w-px bg-stone-200" />

            {/* Mode Selector */}
            <div className="flex bg-white p-1 rounded-full border border-stone-200 shadow-sm">
              <button
                type="button"
                onClick={() => setProjectMode("frontend")}
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${projectMode === "frontend" ? "bg-indigo-600 text-white shadow-md" : "text-stone-400 hover:text-stone-600"}`}
              >
                <Palette className="w-3.5 h-3.5" /> Frontend
              </button>
              <button
                type="button"
                onClick={() => setProjectMode("fullstack")}
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${projectMode === "fullstack" ? "bg-indigo-600 text-white shadow-md" : "text-stone-400 hover:text-stone-600"}`}
              >
                <Database className="w-3.5 h-3.5" /> Fullstack
              </button>
            </div>

            <div className="h-4 w-px bg-stone-200" />

            {/* Language Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:border-indigo-500 transition-all shadow-sm"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{selectedLanguage}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {isLangDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-0 mb-3 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2 w-40 z-50"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-xl transition-colors ${selectedLanguage === lang ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-600"}`}
                      >
                        <div className="text-[11px] font-bold">{lang}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Suggestion Chips */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "SaaS Dashboard",
              "AI Portfolio",
              "Landing Page",
              "E-commerce UI",
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setPrompt(
                    `Build a high-fidelity ${tag} with modern aesthetics...`,
                  )
                }
                className="px-5 py-2 bg-white rounded-full border border-stone-200 text-[11px] font-bold text-stone-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
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
