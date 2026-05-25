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
import { auth, saveChatToFirebase } from "../services/firebase";

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
  Layers
} from "lucide-react";
import JSZip from "jszip";

type CenterTab = "chat" | "code" | "console" | "logs";

const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const projectStore = useProjectStore();
  const { setSelectedElement } = useDesignStore();

  // Active Tab for the Center Panel
  const [activeCenterTab, setActiveCenterTab] = useState<CenterTab>("chat");

  // UI State
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

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
    if (!auth.currentUser || chatStore.messages.length === 0) return;

    const saveTimeout = setTimeout(() => {
      const chatId = chatStore.currentChatId || crypto.randomUUID();
      if (!chatStore.currentChatId) {
        chatStore.setCurrentChatId(chatId);
      }

      saveChatToFirebase(auth.currentUser.uid, {
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
    <div className="h-screen w-full bg-studio-bg text-studio-text flex flex-col overflow-hidden font-sans relative">
      {/* Background cinematic blur radial gradients */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] rounded-full bg-studio-accent/5 blur-[120px] pointer-events-none animate-glow" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] rounded-full bg-studio-secondary/5 blur-[120px] pointer-events-none animate-glow" />

      {chatStore.messages.length === 0 && (
        <InitialOverlay onStart={handleSend} />
      )}

      {/* Futuristic Glass Top Header */}
      <header className="h-14 bg-studio-panel/65 backdrop-blur-2xl border-b border-studio-border flex items-center justify-between px-6 shrink-0 z-30 select-none shadow-xl shadow-black/10 relative">
        {/* Left Side: Back & inline project rename */}
        <div className="flex items-center gap-4 w-1/3 z-10">
          <button
            onClick={handleBackToStart}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-studio-muted hover:text-studio-text bg-studio-bg/60 border border-studio-border rounded-xl transition-all glow-border"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Start Screen
          </button>
          <div className="h-4 w-px bg-studio-border" />
          <div className="flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-studio-accent/80" />
            {isEditingTitle ? (
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingTitle(false);
                }}
                className="bg-studio-bg border border-studio-accent/30 rounded-xl px-2.5 py-1 text-xs font-bold text-studio-text focus:border-studio-accent outline-none w-48 font-sans"
                autoFocus
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                className="text-xs font-bold text-studio-text/90 hover:text-white cursor-pointer transition-colors max-w-[200px] truncate"
                title="Click to rename project"
              >
                {projectTitle}
              </span>
            )}
          </div>
        </div>

        {/* Center Side: Active AI Status Pill */}
        <div className="flex-grow flex justify-center w-1/3 z-10 select-none">
          <div className="bg-studio-card/85 border border-studio-border/80 px-4 py-1.5 rounded-full flex items-center gap-2.5 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-studio-accent/70 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-studio-accent"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-studio-muted flex items-center gap-1.5">
              SYSTEM: <span className="text-studio-text normal-case tracking-normal font-bold font-mono">{currentModel}</span>
            </span>
          </div>
        </div>

        {/* Right Side: Quick Action Pills */}
        <div className="flex items-center justify-end gap-3 w-1/3 z-10">
          <button className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold text-studio-muted hover:text-studio-text bg-studio-bg/60 border border-studio-border rounded-xl transition-all glow-border">
            <Sparkles className="w-3.5 h-3.5 text-studio-accent" /> Remix
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold text-studio-muted hover:text-studio-text bg-studio-bg/60 border border-studio-border rounded-xl transition-all glow-border">
            <Share2 className="w-3.5 h-3.5 text-studio-secondary" /> Share
          </button>
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold text-studio-text bg-gradient-to-tr from-studio-accent to-purple-600 hover:from-studio-accent/90 hover:to-purple-500 rounded-xl transition-all shadow-md shadow-studio-accent/10"
            title="Download ZIP"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <div className="h-4 w-px bg-studio-border" />

          {/* Quick Settings Icon */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-studio-muted hover:text-studio-text hover:bg-studio-panel rounded-xl transition-all"
            title="Advanced Panel Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Resizable Panels */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative z-10 bg-studio-bg/40">
        <PanelGroup orientation="horizontal">
          {/* Panel 1: Collapsible Left Sidebar */}
          <Panel defaultSize={22} minSize={16} maxSize={30} className="flex">
            <WorkspaceSidebar />
          </Panel>

          {/* Custom styled resizer split-lines */}
          <PanelResizeHandle className="w-[3px] bg-studio-bg hover:bg-studio-accent/35 transition-colors cursor-col-resize z-10 relative flex items-center justify-center">
            <div className="absolute h-10 w-[1px] bg-studio-border rounded" />
          </PanelResizeHandle>

          {/* Panel 2: Center Editor/Chat panel */}
          <Panel defaultSize={43} minSize={30} maxSize={60} className="flex flex-col overflow-hidden bg-studio-bg/10 p-4 gap-4">
            {/* Center Tab Header */}
            <div className="h-12 bg-studio-panel/40 border border-studio-border/60 rounded-2xl flex items-center justify-between px-4 shrink-0 select-none shadow-md backdrop-blur-md">
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
                          ? "text-studio-accent bg-studio-bg border border-studio-border"
                          : "text-studio-muted hover:text-studio-text hover:bg-studio-panel/40"
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
            </div>

            {/* Viewport Content */}
            <div className="flex-grow overflow-hidden relative">
              <React.Suspense
                fallback={
                  <div className="h-full w-full flex items-center justify-center bg-studio-panel/20 backdrop-blur-md rounded-2xl border border-studio-border">
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

          <PanelResizeHandle className="w-[3px] bg-studio-bg hover:bg-studio-accent/35 transition-colors cursor-col-resize z-10 relative flex items-center justify-center" />

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
