import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import toast, { Toaster } from "react-hot-toast";

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
import { ExportModal } from "../components/ui/ExportModal";
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
  ExternalLink,
  Globe,
  Settings,
  Download
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Sync selectedFileName if none is selected and project has files
  useEffect(() => {
    if (!selectedFileName && projectStore.currentContent?.files) {
      const files = Object.keys(projectStore.currentContent.files);
      if (files.length > 0) {
        // Prefer src/App.tsx if exists, otherwise first file
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
        firstUserMessage.length > 24
          ? firstUserMessage.substring(0, 24) + "..."
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
    // Force transition to chat tab to observe response
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

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden font-sans">
      {chatStore.messages.length === 0 && (
        <InitialOverlay onStart={handleSend} />
      )}

      {/* Google AI Studio Premium Compact Header */}
      <header className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 shrink-0 z-30 select-none">
        {/* Left Side: Back & Project Title */}
        <div className="flex items-center gap-4 w-1/3">
          <button
            onClick={handleBackToStart}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="h-4 w-px bg-zinc-900" />
          {isEditingTitle ? (
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingTitle(false);
              }}
              className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-xs font-bold text-zinc-200 focus:border-indigo-500 outline-none w-48 font-sans"
              autoFocus
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-bold text-zinc-300 hover:text-white cursor-pointer transition-colors max-w-[200px] truncate"
              title="Click to rename"
            >
              {projectTitle}
            </span>
          )}
        </div>

        {/* Center Side: Accent Brand Info */}
        <div className="flex-1 flex justify-center text-xs font-black uppercase tracking-wider text-zinc-550 w-1/3">
          <span className="bg-zinc-900/50 border border-zinc-900 px-3 py-1 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Nexo Workspace Studio
          </span>
        </div>

        {/* Right Side: Quick Action Pills */}
        <div className="flex items-center justify-end gap-2.5 w-1/3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-xl transition-all">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Remix
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-xl transition-all">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-xl transition-all"
            title="Download code source bundle"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          <div className="h-4 w-px bg-zinc-900 mx-1" />

          {/* Quick Settings Icon */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-xl transition-all"
            title="Advanced Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Panels Layout */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative">
        <PanelGroup direction="horizontal">
          {/* Panel 1: Left Workspace Sidebar */}
          <Panel defaultSize={22} minSize={16} maxSize={30} className="flex">
            <WorkspaceSidebar />
          </Panel>

          <PanelResizeHandle className="w-1 hover:bg-indigo-500/40 bg-zinc-950 transition-colors cursor-col-resize z-10" />

          {/* Panel 2: Center Editor/Chat panel */}
          <Panel defaultSize={43} minSize={30} maxSize={60} className="bg-zinc-950 flex flex-col overflow-hidden">
            {/* Center Tab Header */}
            <div className="h-12 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 shrink-0 select-none">
              <div className="flex items-center gap-1">
                {[
                  { id: "chat", label: "Chat", icon: MessageSquare },
                  { id: "code", label: "Code", icon: Code },
                  { id: "console", label: "Console", icon: Terminal },
                  { id: "logs", label: "Logs", icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCenterTab(tab.id as CenterTab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeCenterTab === tab.id
                          ? "bg-zinc-900 text-indigo-400 border border-zinc-800"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Viewport Content */}
            <div className="flex-1 overflow-hidden relative p-4">
              <React.Suspense
                fallback={
                  <div className="h-full w-full flex items-center justify-center bg-zinc-950">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Loading Studio...
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

          <PanelResizeHandle className="w-1 hover:bg-indigo-500/40 bg-zinc-950 transition-colors cursor-col-resize z-10" />

          {/* Panel 3: Right Live Preview Sandbox */}
          <Panel defaultSize={35} minSize={25} maxSize={50} className="bg-zinc-950 flex flex-col overflow-hidden p-4 pl-0">
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
            background: "#18181b",
            color: "#f4f4f5",
            border: "1px solid #27272a",
            fontSize: "12px",
            fontWeight: "600",
            borderRadius: "12px",
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
