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
import { UsageStats } from "../components/ui/UsageStats";

// Stores & Services
import { useProjectStore } from "../stores/projectStore";
import { useChatStore } from "../stores/chatStore";
import { useAgentStore } from "../stores/agentStore";
import { useDesignStore } from "../stores/designStore";
import { Orchestrator } from "../agents/Orchestrator";
import { Message } from "../types";

// Icons
import {
  Sparkles,
  Settings,
  Download,
  Rocket,
  Code,
  Globe,
  Terminal,
  Layout,
  Loader2,
} from "lucide-react";

const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const projectStore = useProjectStore();
  const { setSelectedElement } = useDesignStore();

  // UI State
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "terminal">(
    "preview",
  );
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

      const firstUserMessage =
        chatStore.messages.find((m) => m.role === "user")?.text ||
        "New Project";
      const title =
        firstUserMessage.length > 30
          ? firstUserMessage.substring(0, 30) + "..."
          : firstUserMessage;

      saveChatToFirebase(auth.currentUser.uid, {
        id: chatId,
        name: title,
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
  }, [chatStore.messages, projectStore.currentContent]);

  const handleSend = async (prompt: string) => {
    chatStore.setMessages((prev: Message[]) => [
      ...prev,
      { role: "user", text: prompt, timestamp: Date.now() },
    ]);
    try {
      await Orchestrator.getInstance().executeFullFlow(prompt);
    } catch (error) {
      toast.error("Generation failed.");
    }
  };

  const handleBackToStart = () => {
    // Reset chat state → triggers InitialOverlay to show again (keeps model/language/mode selections)
    useChatStore.getState().resetChat();
    useProjectStore.getState().setCurrentContent(null);
  };

  return (
    <div className="h-screen w-full bg-[#fbf9f6] flex flex-col overflow-hidden font-sans">
      {chatStore.messages.length === 0 && (
        <InitialOverlay onStart={handleSend} />
      )}

      {/* Premium Compact Header */}
      <header className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-4 shrink-0 z-50 shadow-sm">
        <div className="flex items-center w-1/3">
          <button
            onClick={handleBackToStart}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50 rounded-full border border-stone-200 transition-colors"
          >
            &larr; Back to start
          </button>
        </div>

        <div className="flex-1 flex justify-center font-medium text-stone-900 text-sm w-1/3">
          {projectStore.buildPhase === "building" ? (
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-full border border-indigo-100/50 animate-pulse font-medium text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>AI Active: {projectStore.subStatus || "Thinking..."}</span>
            </div>
          ) : (
            "Nexo Editor"
          )}
        </div>

        <div className="flex items-center justify-end gap-3 w-1/3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
            <Sparkles className="w-3.5 h-3.5" /> Remix
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-full border border-stone-200 transition-colors">
            Share
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-stone-900 bg-white border border-stone-200 hover:bg-stone-50 rounded-full transition-colors shadow-sm"
          >
            Publish
          </button>
          <button className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">
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
                d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
              />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden min-h-0">
        <PanelGroup orientation="horizontal">
          <Panel defaultSize={60} minSize={40}>
            <div className="h-full w-full flex flex-col bg-white overflow-hidden">
              {/* Sub-header for context */}
              <div className="h-12 px-4 flex items-center justify-between border-b border-stone-100 bg-white">
                <div className="w-1/3 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-stone-800"></div>
                    {activeTab === "preview"
                      ? "Preview"
                      : activeTab === "code"
                        ? "Code"
                        : "Logs"}
                  </span>
                </div>
                <div className="w-1/3 flex justify-center">
                  <div className="flex items-center bg-stone-50 p-1 rounded-full border border-stone-200">
                    <button
                      onClick={() => setActiveTab("preview")}
                      className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${activeTab === "preview" ? "bg-white text-stone-900 shadow-sm border border-stone-200" : "text-stone-500 hover:text-stone-700 border border-transparent"}`}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => setActiveTab("code")}
                      className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${activeTab === "code" ? "bg-white text-stone-900 shadow-sm border border-stone-200" : "text-stone-500 hover:text-stone-700 border border-transparent"}`}
                    >
                      Code
                    </button>
                  </div>
                </div>
                <div className="w-1/3 flex justify-end gap-2 items-center">
                  <button className="p-1.5 text-stone-400 hover:text-stone-600 border border-stone-200 rounded-md transition-colors">
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                  <button className="p-1.5 text-stone-400 hover:text-stone-600 border border-stone-200 rounded-md transition-colors">
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
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>
                  <div className="w-px h-4 bg-stone-200 mx-1"></div>
                  <button className="p-1.5 text-stone-400 hover:text-stone-600 border border-stone-200 rounded-md transition-colors">
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
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </button>
                  {activeTab === "preview" && (
                    <button
                      onClick={() => setIsVisualMode(!isVisualMode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${isVisualMode ? "bg-indigo-600 text-white shadow-md" : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"}`}
                    >
                      <Layout className="w-3 h-3" />{" "}
                      {isVisualMode ? "Exit Visual Mode" : "Visual Mode"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative">
                <React.Suspense
                  fallback={
                    <div className="h-full w-full flex items-center justify-center bg-stone-50">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          Preparing Workspace...
                        </span>
                      </div>
                    </div>
                  }
                >
                  {activeTab === "preview" && (
                    <PreviewPanel isVisualMode={isVisualMode} />
                  )}
                  {activeTab === "code" && (
                    <EditorPanel
                      selectedFileName={selectedFileName}
                      setSelectedFileName={setSelectedFileName}
                    />
                  )}
                  {activeTab === "terminal" && <DevTools />}
                </React.Suspense>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 hover:bg-indigo-500 transition-colors cursor-col-resize" />

          {/* Sidebar: Chat */}
          <Panel
            defaultSize={40}
            minSize={28}
            maxSize={45}
            className="bg-white border-l border-stone-200"
            style={{ minWidth: "280px", maxWidth: "520px" }}
          >
            <ChatPanel onSend={handleSend} />
          </Panel>
        </PanelGroup>
      </main>

      <Toaster position="bottom-right" />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={(type) => {
          toast.success(`Exporting as ${type}...`);
          setIsExportModalOpen(false);
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
