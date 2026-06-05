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

import { SettingsModal } from "../components/ui/SettingsModal";
import { TokenDashboard } from "../components/ui/TokenDashboard";

// Stores & Services
import { useProjectStore } from "../stores/projectStore";
import { useChatStore } from "../stores/chatStore";
import { useAgentStore } from "../stores/agentStore";
import { useDesignStore } from "../stores/designStore";
import { useRuntimeStore } from "../stores/runtimeStore";
import { saveCurrentProject } from "../services/saveService";
import { Orchestrator } from "../agents/Orchestrator";
import { Message } from "../types";

// Icons
import {
  ArrowLeft,
  Settings,
  Download,
  Pencil,
  RotateCw,
  Monitor,
  Sparkles,
  Share2,
  GitBranch,
  X,
  ExternalLink,
  Coins,
  Sliders,
  Sun,
  Moon,
  Save,
} from "lucide-react";
import { StudioControls } from "../components/ui/StudioControls";
import JSZip from "jszip";

const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const projectStore = useProjectStore();
  const { setSelectedElement } = useDesignStore();
  const isBooted = useRuntimeStore((state) => state.isBooted);
  const {
    selectedModel,
    temperature,
    setTemperature,
    topP,
    setTopP,
    showStudioPanel,
    setShowStudioPanel
  } = useAgentStore();

  const [workspaceTab, setWorkspaceTab] = useState<"preview" | "code">("preview");
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [settingsTab, setSettingsTab] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("Untitled");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [ghPushing, setGhPushing] = useState(false);
  const [isTokenDashboardOpen, setIsTokenDashboardOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(chatStore.messages.length === 0);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  useEffect(() => {
    if (chatStore.currentChatId) {
      setShowLanding(false);
    }
  }, [chatStore.currentChatId]);

  useEffect(() => {
    if (chatStore.messages.length === 0) {
      setShowLanding(true);
    }
  }, [chatStore.messages.length]);

  useEffect(() => {
    if (selectedFileName) setWorkspaceTab("code");
  }, [selectedFileName]);

  useEffect(() => {
    const chatId = chatStore.currentChatId;
    if (!chatId) return;

    const activeJobId = localStorage.getItem(`nexo_active_job_${chatId}`);
    if (activeJobId) {
      console.log(`[ChatInterface] Found active job ${activeJobId} on mount. Resuming...`);
      fetch(`/api/ai/job/${activeJobId}`)
        .then(res => {
          if (!res.ok) throw new Error("Job not found");
          return res.json();
        })
        .then(job => {
          if (job.status !== "completed" && job.status !== "failed") {
            Orchestrator.getInstance().connectToJobStream(activeJobId, chatId);
          } else {
            localStorage.removeItem(`nexo_active_job_${chatId}`);
          }
        })
        .catch(err => {
          console.warn("[ChatInterface] Failed to resume job:", err);
          localStorage.removeItem(`nexo_active_job_${chatId}`);
        });
    }
  }, [chatStore.currentChatId]);

  useEffect(() => {
    if (!selectedFileName && projectStore.currentContent?.files) {
      const files = Object.keys(projectStore.currentContent.files);
      if (files.length > 0) {
        const main = files.find((f) => f.includes("App.tsx")) || files[0];
        setSelectedFileName(main);
      }
    }
  }, [projectStore.currentContent, selectedFileName]);

  useEffect(() => {
    if (chatStore.messages.length > 0) {
      const firstUserMessage =
        chatStore.messages.find((m) => m.role === "user")?.text || "New Project";
      const title =
        firstUserMessage.length > 24
          ? firstUserMessage.substring(0, 24) + "..."
          : firstUserMessage;
      setProjectTitle(title);
    } else {
      setProjectTitle("Untitled");
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

  // Auto-save chat and code changes after a 2-second debounce
  useEffect(() => {
    if (chatStore.messages.length === 0) return;
    const saveTimeout = setTimeout(() => {
      saveCurrentProject().catch((err) => console.error("Auto-save failed:", err));
    }, 2000);
    return () => clearTimeout(saveTimeout);
  }, [chatStore.messages, projectStore.currentContent, projectTitle, selectedModel]);

  // Save before unload (tab close / refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentProject();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Boot runtime automatically if currentContent exists but runtime is not booted
  useEffect(() => {
    if (projectStore.currentContent && !isBooted && projectStore.buildPhase === "idle") {
      console.log("[ChatInterface] Code exists but runtime is not booted. Auto-booting virtual environment...");
      Orchestrator.getInstance().bootRuntime().catch(err => {
        console.error("Failed to auto-boot runtime on content load:", err);
      });
    }
  }, [projectStore.currentContent, isBooted, projectStore.buildPhase]);

  const handleSend = async (prompt: string, attachments?: { name: string; content: string; type: string }[]) => {
    if (showLanding && chatStore.messages.length > 0) {
      // Save current project first before starting a new one
      await saveCurrentProject();
      chatStore.resetChat();
      projectStore.setCurrentContent(null);
      // Reset booted status for new project
      useRuntimeStore.getState().setIsBooted(false);
      useRuntimeStore.getState().setUrl(null);
    }
    setShowLanding(false);

    const userMsg: Message = {
      role: "user",
      text: prompt,
      timestamp: Date.now(),
      model: selectedModel,
    };
    const images = attachments?.filter(a => a.type.startsWith("image/")) || [];
    if (images.length > 0) {
      userMsg.content = [
        { type: "text", text: prompt },
        ...images.map(img => ({
          type: "image_url",
          image_url: { url: img.content }
        }))
      ];
    }
    chatStore.setMessages((prev: Message[]) => [...prev, userMsg]);
    try {
      await Orchestrator.getInstance().executeFullFlow(prompt);
    } catch (error) {
      toast.error("Generation failed.");
    }
  };

  const handleBackToStart = async () => {
    // Save project state first when going back to start
    await saveCurrentProject();
    setShowLanding(true);
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

  const handleOneClickGithubPush = async () => {
    const token = localStorage.getItem("nexo_gh_token") || "";
    const repo = localStorage.getItem("nexo_gh_repo") || "";
    const branch = localStorage.getItem("nexo_gh_branch") || "main";
    const commit = "Update from Nexo";

    if (!token || !repo) {
      toast.error("Please configure GitHub settings in Integrations tab.");
      setSettingsTab("Integrations");
      return;
    }
    const files = projectStore.currentContent?.files;
    if (!files || Object.keys(files).length === 0) {
      toast.error("No files to push. Build a project first.");
      return;
    }
    const repoMatch = repo.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      toast.error("Invalid GitHub repository URL configured in Settings.");
      setSettingsTab("Integrations");
      return;
    }
    const owner = repoMatch[1];
    const repoName = repoMatch[2].replace(/\.git$/, "");
    setGhPushing(true);
    const loadingToast = toast.loading("Pushing to GitHub…");
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };
      const refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers });
      if (!refRes.ok) throw new Error("Branch not found or token lacks access.");
      const refData = await refRes.json();
      const latestCommitSha = refData.object.sha;
      const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, { headers });
      const commitData = await commitRes.json();
      const baseTreeSha = commitData.tree.sha;
      const tree = Object.entries(files).map(([path, content]) => ({
        path: path.startsWith("/") ? path.slice(1) : path,
        mode: "100644", type: "blob", content,
      }));
      const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
        method: "POST", headers, body: JSON.stringify({ base_tree: baseTreeSha, tree }),
      });
      if (!newTreeRes.ok) throw new Error("Failed to create Git tree.");
      const newTreeSha = (await newTreeRes.json()).sha;
      const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
        method: "POST", headers,
        body: JSON.stringify({ message: commit, tree: newTreeSha, parents: [latestCommitSha] }),
      });
      if (!newCommitRes.ok) throw new Error("Failed to create commit.");
      const newCommitSha = (await newCommitRes.json()).sha;
      const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
        method: "PATCH", headers, body: JSON.stringify({ sha: newCommitSha }),
      });
      if (!updateRes.ok) throw new Error("Failed to update branch ref.");
      toast.dismiss(loadingToast);
      toast.success("✓ Pushed to GitHub!");
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || "GitHub push failed.");
    } finally {
      setGhPushing(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-sans bg-[#f7f7f7]">
      {showLanding && (
        <InitialOverlay onStart={handleSend} onResume={() => setShowLanding(false)} />
      )}

      {/* ── Workspace Inner Header (Back + Title) ── */}
      <div className="h-[52px] bg-white border-b border-[#e8e8e8] flex items-center justify-between px-5 shrink-0 z-20 select-none">
        {/* Left: back + editable title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToStart}
            className="flex items-center gap-1.5 text-[#888] hover:text-[#111] transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to start
          </button>
          <div className="h-4 w-px bg-[#e8e8e8]" />
          {isEditingTitle ? (
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingTitle(false);
              }}
              className="border border-[#e8e8e8] rounded-lg px-2.5 py-1 text-sm font-semibold text-[#111] focus:border-[#0ea5e9] outline-none w-36 bg-white"
              autoFocus
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="text-sm font-semibold text-[#111] cursor-pointer hover:text-[#0ea5e9] transition-colors"
            >
              {projectTitle}
            </span>
          )}
        </div>

        {/* Right: Save + GitHub + Remix / Share / Publish + icon buttons */}
        <div className="flex items-center gap-2">
          {/* Manual Save Button */}
          <button
            onClick={async () => {
              const savePromise = saveCurrentProject();
              toast.promise(savePromise, {
                loading: "Saving project...",
                success: "Project saved successfully! 💾",
                error: "Failed to save project.",
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] border border-[#e8e8e8] transition-all"
            title="Save Project & Code"
          >
            <Save className="w-3.5 h-3.5 text-indigo-500" />
            Save
          </button>
          {/* GitHub one-click */}
          <button
            onClick={handleOneClickGithubPush}
            disabled={ghPushing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] border border-[#e8e8e8] transition-all disabled:opacity-50"
            title="Push to GitHub"
          >
            <GitBranch className="w-3.5 h-3.5" />
            {ghPushing ? "Pushing…" : "GitHub"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] border border-[#e8e8e8] transition-all">
            <Sparkles className="w-3.5 h-3.5 text-[#0ea5e9]" />
            Remix
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] border border-[#e8e8e8] transition-all">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#111] hover:bg-[#333] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Publish
          </button>
          <div className="w-px h-4 bg-[#e8e8e8]" />
          <button
            onClick={() => setIsEditingTitle(true)}
            className="p-2 rounded-lg text-[#888] hover:text-[#111] hover:bg-[#f3f3f3] transition-colors"
            title="Rename"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-[#888] hover:text-[#111] hover:bg-[#f3f3f3] transition-colors"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setSettingsTab("Chat")}
            className="p-2 rounded-lg text-[#888] hover:text-[#111] hover:bg-[#f3f3f3] transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsTokenDashboardOpen(true)}
            className="p-2 rounded-lg text-[#888] hover:text-[#111] hover:bg-[#f3f3f3] transition-colors flex items-center gap-1"
            title="Token & Cost Dashboard"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          </button>
        </div>
      </div>

      {/* ── Main Workspace ── */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        <PanelGroup orientation="horizontal">

          {/* LEFT: Preview / Code panel */}
          <Panel defaultSize={65} minSize={40} maxSize={82} className="flex flex-col overflow-hidden p-3 pr-1.5 gap-2">

            {/* Secondary toolbar: Preview | Code toggle */}
            <div className="bg-white rounded-xl border border-[#e8e8e8] h-11 flex items-center justify-between px-3 shrink-0 shadow-sm">
              <div className="flex items-center gap-0.5 bg-[#f3f3f3] rounded-lg p-0.5">
                <button
                  onClick={() => setWorkspaceTab("preview")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${workspaceTab === "preview"
                      ? "bg-white text-[#111] shadow-sm"
                      : "text-[#888] hover:text-[#333]"
                    }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setWorkspaceTab("code")}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${workspaceTab === "code"
                      ? "bg-white text-[#111] shadow-sm"
                      : "text-[#888] hover:text-[#333]"
                    }`}
                >
                  Code
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {workspaceTab === "preview" ? (
                  <>
                    <button
                      onClick={() => useProjectStore.getState().incrementPreviewKey()}
                      className="p-1.5 rounded-lg text-[#888] hover:text-[#111] hover:bg-[#f3f3f3] transition-colors"
                      title="Reload preview"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsVisualMode(!isVisualMode)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${isVisualMode
                          ? "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/25"
                          : "text-[#888] border-[#e8e8e8] hover:text-[#111] hover:bg-[#f3f3f3]"
                        }`}
                    >
                      <Monitor className="w-3 h-3" />
                      Visual Mode
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-[#bbb] font-semibold uppercase tracking-wider">
                    Editor Active
                  </span>
                )}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-hidden bg-white rounded-xl border border-[#e8e8e8] shadow-sm relative">
              <React.Suspense
                fallback={
                  <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white">
                    <Monitor className="w-10 h-10 text-[#ddd]" strokeWidth={1} />
                    <span className="text-[10px] font-bold text-[#bbb] uppercase tracking-[0.25em]">
                      Booting Runtime
                    </span>
                  </div>
                }
              >
                <div className={workspaceTab === "preview" ? "h-full w-full block" : "h-full w-full hidden"}>
                  <PreviewPanel
                    isVisualMode={isVisualMode}
                    setIsVisualMode={setIsVisualMode}
                  />
                </div>
                <div className={workspaceTab === "code" ? "h-full w-full block" : "h-full w-full hidden"}>
                  <EditorPanel
                    selectedFileName={selectedFileName}
                    setSelectedFileName={setSelectedFileName}
                  />
                </div>
              </React.Suspense>
            </div>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-[#0ea5e9]/20 transition-colors cursor-col-resize" />

          {/* RIGHT: Chat sidebar */}
          <Panel defaultSize={showStudioPanel ? 25 : 35} minSize={20} maxSize={50} className="flex flex-col overflow-hidden p-3 pl-1.5 pr-1">
            <div className="flex-1 overflow-hidden rounded-xl border border-[#e8e8e8] shadow-sm bg-white">
              <React.Suspense
                fallback={
                  <div className="h-full w-full flex items-center justify-center bg-white rounded-xl">
                    <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#0ea5e9] rounded-full animate-spin" />
                  </div>
                }
              >
                <ChatPanel onSend={handleSend} />
              </React.Suspense>
            </div>
          </Panel>

          {showStudioPanel && (
            <>
              {/* Resize handle */}
              <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-[#0ea5e9]/20 transition-colors cursor-col-resize" />
              {/* STUDIO: Studio controls sidebar */}
              <Panel defaultSize={20} minSize={15} maxSize={35} className="flex flex-col overflow-hidden p-3 pl-1">
                <div className="flex-1 overflow-hidden rounded-xl border border-[#e8e8e8] shadow-sm bg-white">
                  <StudioControls />
                </div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: "12px",
            fontWeight: "600",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          },
        }}
      />

      {settingsTab !== null && (
        <SettingsModal
          initialTab={settingsTab}
          onClose={() => setSettingsTab(null)}
          onDeploy={() => toast.success("Deploying...")}
          onLoadHistory={() => toast.success("Loading history...")}
          onDownloadZip={handleDownloadZip}
          temperature={temperature}
          setTemperature={setTemperature}
          topP={topP}
          setTopP={setTopP}
        />
      )}

      <TokenDashboard
        isOpen={isTokenDashboardOpen}
        onClose={() => setIsTokenDashboardOpen(false)}
      />
    </div>
  );
};

export default ChatInterface;
