import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import { ChatPanel } from "../components/chat/ChatPanel";
import { InitialOverlay } from "../components/chat/InitialOverlay";
import { WorkspaceSidebar } from "../components/sidebar/WorkspaceSidebar";
import { auth, saveChatToFirebase, signInWithGoogle } from "../services/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

// Lazy load heavy components
const EditorPanel = React.lazy(() =>
  import("../components/editor/EditorPanel").then((m) => ({
    default: m.EditorPanel,
  })),
);
const PreviewPanel = React.lazy(() =>
  import("../components/preview/PreviewPanel").then((m) => ({
    default: m.PreviewPanel,
  })),
);

import { DevTools } from "../components/editor/DevTools";
import { SettingsModal } from "../components/ui/SettingsModal";

// Stores & Services
import { useProjectStore } from "../stores/projectStore";
import { useChatStore } from "../stores/chatStore";
import { useAgentStore } from "../stores/agentStore";
import { useDesignStore } from "../stores/designStore";
import { Orchestrator } from "../agents/Orchestrator";
import { Message } from "../types";

// Icons
import {
  MessageSquare,
  Code,
  Terminal,
  FileText,
  Sparkles,
  ArrowLeft,
  Share2,
  Settings,
  Download,
  FolderLock,
  GitBranch,
  Cpu,
  Layers,
  Search,
  Globe,
  Layout,
  User,
} from "lucide-react";
import JSZip from "jszip";

type CenterTab = "chat" | "code" | "console" | "logs";

const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const projectStore = useProjectStore();
  const { setSelectedElement } = useDesignStore();

  // Active Tab for the Center Panel from store
  const { activeCenterTab, setActiveCenterTab } = projectStore;

  // UI State
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const { deployStatus, deployUrl, setDeployStatus, setDeployUrl } = useProjectStore();
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleDeploy = () => {
    setIsDeploying(true);
    setDeployStatus("deploying");
    setTimeout(() => {
      setIsDeploying(false);
      setDeployStatus("done");
      const mockUrl = `https://nexo-preview-${Math.random().toString(36).substring(2, 7)}.vercel.app`;
      setDeployUrl(mockUrl);
      toast.success("Project deployed live!");
    }, 3000);
  };

  // Sync selectedFileName if none is selected and project has files
  useEffect(() => {
    if (!selectedFileName && projectStore.currentContent?.files) {
      const files = Object.keys(projectStore.currentContent.files);
      if (files.length > 0) {
        const main = files.find((f) => f.includes("App.tsx")) || files[0];
        setSelectedFileName(main);
      }
    }
  }, [projectStore.currentContent, selectedFileName]);

  // Sync project title when chat messages change
  useEffect(() => {
    if (chatStore.messages.length > 0) {
      const firstUserMessage =
        chatStore.messages.find((m) => m.role === "user")?.text ||
        "New Project";
      const title =
        firstUserMessage.length > 20
          ? firstUserMessage.substring(0, 20) + "..."
          : firstUserMessage;
      setProjectTitle(title);
    } else {
      setProjectTitle("Untitled Project");
    }
  }, [chatStore.messages]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "NEXO_ELEMENT_SELECTED") {
        setSelectedElement({
          id: event.data.id,
          tagName: event.data.tagName,
          text: event.data.text,
          styles: {},
        });
        setIsVisualMode(true);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setSelectedElement]);

  // Auto-save chat to Firebase when messages or content change
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || chatStore.messages.length === 0) return;

    const saveTimeout = setTimeout(() => {
      const chatId = chatStore.currentChatId || crypto.randomUUID();
      if (!chatStore.currentChatId) {
        chatStore.setCurrentChatId(chatId);
      }

      saveChatToFirebase(currentUser.uid, {
        id: chatId,
        name: projectTitle,
        date: new Date().toLocaleDateString(),
        updatedAt: Date.now(),
        messages: chatStore.messages,
        content: projectStore.currentContent,
        model: useAgentStore.getState().selectedModel,
        projectMode: useAgentStore.getState().projectMode,
        messageCount: chatStore.messages.length,
        fileCount: Object.keys(projectStore.currentContent?.files || {}).length,
      });
    }, 2000); // Debounce saves by 2 seconds

    return () => clearTimeout(saveTimeout);
  }, [chatStore.messages, projectStore.currentContent, projectTitle]);

  const handleSend = async (prompt: string) => {
    chatStore.setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", text: prompt, timestamp: Date.now() },
    ]);
    setActiveCenterTab("chat");
    try {
      await Orchestrator.getInstance().executeFullFlow(prompt);
    } catch (error) {
      toast.error("Generation failed.");
    }
  };

  const handleBackToStart = () => {
    useChatStore.getState().resetChat();
    useProjectStore.getState().setCurrentContent(null);
  };

  const handleDownloadZip = async () => {
    const files = projectStore.currentContent?.files || {};
    if (Object.keys(files).length === 0) {
      toast.error("No code generated to export.");
      return;
    }
    try {
      const zip = new JSZip();
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path.startsWith("/") ? path.slice(1) : path, content as string);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectTitle.replace(/\s+/g, "-").toLowerCase()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ZIP exported successfully!");
    } catch (e) {
      toast.error("Failed to build ZIP.");
    }
  };

  const currentModel = useAgentStore((state) => state.selectedModel);

  return (
    <div className="h-screen w-full bg-[#070B14] text-studio-text flex flex-col overflow-hidden font-sans relative">
      {/* Background cinematic blur radial gradients */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] rounded-full bg-studio-accent/5 blur-[120px] pointer-events-none animate-glow" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] rounded-full bg-studio-secondary/5 blur-[120px] pointer-events-none animate-glow" />

      {/* Sticky glassmorphic navbar */}
      <header className="h-14 border-b border-white/5 bg-[#070B14]/65 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-50 select-none">
        {/* Left: Brand & Rename input */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-studio-accent to-blue-500 flex items-center justify-center shadow-lg shadow-studio-accent/20 group-hover:scale-105 active:scale-95 transition-transform duration-300">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="font-black text-xs tracking-wider uppercase text-white bg-clip-text">
              Nexo
            </span>
          </button>
        </div>

        <div className="flex-1 flex justify-center font-medium text-stone-900 text-sm w-1/3">
          Untitled
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="hidden md:flex items-center justify-center">
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0F172A]/40 hover:bg-[#0F172A]/70 border border-white/5 rounded-xl text-xs text-studio-muted transition-all w-60 justify-between group shadow-inner"
          >
            <div className="flex items-center gap-2">
              <span className="text-stone-400 group-hover:text-studio-text transition-colors">Search or command...</span>
            </div>
            <kbd className="bg-white/5 text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-stone-400 group-hover:text-studio-text font-sans font-black tracking-wide">
              /
            </kbd>
          </button>
        </div>

        {/* Right: Model Status & Actions & User Profile */}
        <div className="flex items-center gap-4">
          {/* Active AI Model Status */}
          <div className="hidden sm:flex items-center gap-2 bg-[#0F172A]/40 border border-white/5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-studio-muted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="uppercase tracking-wider font-semibold">Active:</span>
            <span className="font-mono text-studio-accent">{currentModel}</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Share */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Project workspace URL copied!");
              }}
              className="p-2 bg-[#0F172A]/40 hover:bg-studio-panel border border-white/5 rounded-xl text-studio-muted hover:text-studio-text transition-colors shadow-sm"
              title="Share Workspace"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Export ZIP */}
            <button
              onClick={handleDownloadZip}
              className="p-2 bg-[#0F172A]/40 hover:bg-studio-panel border border-white/5 rounded-xl text-studio-muted hover:text-studio-text transition-colors shadow-sm"
              title="Export Source ZIP"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Deploy */}
            <button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-3.5 py-1.5 bg-gradient-to-tr from-studio-accent to-blue-600 hover:from-studio-accent hover:to-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-studio-accent/15 disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deploying</span>
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" />
                  <span>Deploy</span>
                </>
              )}
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Profile Avatar / User info */}
          {user ? (
            <img
              src={user.photoURL || ""}
              alt="Profile"
              className="w-7 h-7 rounded-full border border-white/10 shadow-md"
              title={user.email || ""}
            />
          ) : (
            <button
              onClick={signInWithGoogle}
              className="w-7 h-7 rounded-full bg-studio-panel border border-white/5 flex items-center justify-center text-studio-muted hover:text-studio-text transition-colors"
              title="Sign In"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Resizable Panels */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative z-10 bg-transparent">
        <PanelGroup orientation="horizontal">
          {/* Panel 1: Collapsible Left Sidebar */}
          <Panel defaultSize={22} minSize={16} maxSize={30} className="flex">
            <WorkspaceSidebar />
          </Panel>

          {/* Custom styled resizer split-lines */}
          <PanelResizeHandle className="w-[3px] bg-studio-bg hover:bg-studio-accent/35 transition-colors cursor-col-resize z-10 relative flex items-center justify-center">
            <div className="absolute h-10 w-[1px] bg-white/10 rounded" />
          </PanelResizeHandle>

          {/* Panel 2: Center Editor/Chat panel */}
          <Panel defaultSize={43} minSize={30} maxSize={60} className="flex flex-col overflow-hidden bg-transparent p-4 gap-4">
            {/* Center Tab Header (Only shown when not in Chat mode) */}
            {activeCenterTab !== "chat" && (
              <div className="h-12 bg-studio-panel/45 border border-white/5 backdrop-blur-md rounded-2xl flex items-center justify-between px-4 shrink-0 select-none shadow-lg shadow-black/20">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "chat", label: "AI Assistant", icon: MessageSquare },
                    { id: "code", label: "Monaco Editor", icon: Code },
                    { id: "console", label: "DevTools", icon: Terminal },
                    { id: "logs", label: "Agent Logs", icon: FileText },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeCenterTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCenterTab(tab.id as CenterTab)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 relative ${
                          isActive
                            ? "text-studio-accent bg-studio-panel border border-white/10 shadow-sm"
                            : "text-studio-muted hover:text-studio-text hover:bg-studio-panel/45"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="centerTabGlow"
                            className="absolute -bottom-px left-1/4 right-1/4 h-[1px] bg-studio-accent"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => {
                    setActiveCenterTab("chat");
                    setSelectedFileName(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-studio-muted hover:text-studio-accent hover:bg-studio-panel/45 transition-all"
                >
                  Back to Chat
                </button>
              </div>
            )}

            {/* Viewport Content */}
            <div className="flex-grow overflow-hidden relative">
              <React.Suspense
                fallback={
                  <div className="h-full w-full flex items-center justify-center bg-studio-panel/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-2xl">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-studio-accent/25 border-t-studio-accent rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-studio-muted uppercase tracking-[0.2em] animate-pulse">
                        Booting Sandbox...
                      </span>
                    </div>
                  </div>
                }
              >
                {activeCenterTab === "chat" && (
                  <ChatPanel onSend={handleSend} />
                )}
                {activeCenterTab === "code" && (
                  <EditorPanel
                    selectedFileName={selectedFileName}
                    setSelectedFileName={setSelectedFileName}
                  />
                )}
                {activeCenterTab === "console" && (
                  <DevTools defaultTab="console" />
                )}
                {activeCenterTab === "logs" && (
                  <DevTools defaultTab="terminal" />
                )}
              </React.Suspense>
            </div>
          </Panel>

          <PanelResizeHandle className="w-[3px] bg-studio-bg hover:bg-studio-accent/35 transition-colors cursor-col-resize z-10 relative flex items-center justify-center">
            <div className="absolute h-10 w-[1px] bg-white/10 rounded" />
          </PanelResizeHandle>

          {/* Panel 3: Right Live Preview Sandbox */}
          <Panel defaultSize={35} minSize={25} maxSize={50} className="flex flex-col overflow-hidden p-4 pl-0">
            <PreviewPanel
              isVisualMode={isVisualMode}
              setIsVisualMode={setIsVisualMode}
            />
          </Panel>
        </PanelGroup>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0F172A",
            color: "#F8FAFC",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "12px",
            fontWeight: "600",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
          },
        }}
      />
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onDeploy={() => toast.success("Deploying...")}
          onLoadHistory={() => toast.success("Loading history...")}
          onDownloadZip={() => toast.success("Downloading...")}
          temperature={0.7}
          setTemperature={() => {}}
          topP={1}
          setTopP={() => {}}
        />
      )}
    </div>
  );
};

export default ChatInterface;
