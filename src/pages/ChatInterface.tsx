import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import toast, { Toaster } from "react-hot-toast";

import logoV2 from "../assets/NEXO-V2.png";
import { ChatPanel } from "../components/chat/ChatPanel";
import { InitialOverlay } from "../components/chat/InitialOverlay";
import {
  auth,
  saveChatToFirebase,
  signInWithGoogle,
  logout,
  onAuthStateChanged,
  loadSingleChatFromFirebaseOrLocal,
} from "../services/firebase";
import { User as FirebaseUser } from "firebase/auth";

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
import { DeployModal } from "../components/ui/DeployModal";
import { DeploymentService } from "../services/deploymentService";
import { compileAndBundle } from "../utils/bundler";

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
  GitBranch,
  X,
  ExternalLink,
  Coins,
  Sliders,
  Sun,
  Moon,
  Save,
  Rocket,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  MoreVertical,
  Menu,
  Code,
} from "lucide-react";
import { StudioControls } from "../components/ui/StudioControls";
import JSZip from "jszip";

const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const chatStore = useChatStore();
  const { chatId } = useParams<{ chatId?: string }>();
  const [loadingChat, setLoadingChat] = useState(false);
  
  // Optimize store subscriptions using selectors to avoid re-rendering on tasks/logs/reasoning streaming
  const currentContent = useProjectStore((s) => s.currentContent);
  const buildPhase = useProjectStore((s) => s.buildPhase);
  const showDeployModal = useProjectStore((s) => s.showDeployModal);
  const deployStatus = useProjectStore((s) => s.deployStatus);
  const deployUrl = useProjectStore((s) => s.deployUrl);
  const pendingPrompt = useProjectStore((s) => s.pendingPrompt);
  const setCurrentContent = useProjectStore((s) => s.setCurrentContent);
  const setBuildPhase = useProjectStore((s) => s.setBuildPhase);
  const setPendingPrompt = useProjectStore((s) => s.setPendingPrompt);
  const setShowDeployModal = useProjectStore((s) => s.setShowDeployModal);
  const setDeployStatus = useProjectStore((s) => s.setDeployStatus);
  const setDeployUrl = useProjectStore((s) => s.setDeployUrl);
  const incrementPreviewKey = useProjectStore((s) => s.incrementPreviewKey);

  const projectStore = {
    currentContent,
    buildPhase,
    showDeployModal,
    deployStatus,
    deployUrl,
    pendingPrompt,
    setCurrentContent,
    setBuildPhase,
    setPendingPrompt,
    setShowDeployModal,
    setDeployStatus,
    setDeployUrl,
    incrementPreviewKey,
  };

  const { setSelectedElement } = useDesignStore();
  const isBooted = useRuntimeStore((state) => state.isBooted);
  const {
    selectedModel,
    setSelectedModel,
    temperature,
    setTemperature,
    topP,
    setTopP,
    showStudioPanel,
    setShowStudioPanel,
    projectMode,
    setProjectMode,
  } = useAgentStore();

  const [workspaceTab, setWorkspaceTab] = useState<"preview" | "code">(
    useAgentStore.getState().projectMode === "fullstack" ? "code" : "preview"
  );
  const [isVisualMode, setIsVisualMode] = useState(false);
  const selectedFileName = useProjectStore((s) => s.selectedFileName);
  const setSelectedFileName = useProjectStore((s) => s.setSelectedFileName);
  const [settingsTab, setSettingsTab] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"chat" | "preview" | "code" | "studio">("chat");
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Monitor mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Click outside listener for more actions dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Responsive adaptive panel widths
  useEffect(() => {
    if (window.innerWidth < 1280) {
      setShowStudioPanel(false);
    }
    if (window.innerWidth < 1024) {
      setShowChatPanel(false);
    }
  }, [setShowStudioPanel]);

  // If user switches to fullstack mode, disable live preview and switch to code tab
  useEffect(() => {
    if (projectMode === "fullstack") {
      setWorkspaceTab("code");
    }
  }, [projectMode]);

  // Auto-switch to Code tab when AI starts analyzing/generating
  useEffect(() => {
    const phase = projectStore.buildPhase;
    if (phase === "planning" || phase === "generating" || phase === "building" || phase === "fixing") {
      setWorkspaceTab("code");
      if (isMobile) {
        setActiveMobileTab("code");
      }
    }
  }, [projectStore.buildPhase, isMobile]);


  const [projectTitle, setProjectTitle] = useState("Untitled");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [ghPushing, setGhPushing] = useState(false);
  const [isTokenDashboardOpen, setIsTokenDashboardOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(chatStore.messages.length === 0);
  const prevBuildPhase = useRef(projectStore.buildPhase);
  
  useEffect(() => {
    if (prevBuildPhase.current !== "idle" && prevBuildPhase.current !== "done" && projectStore.buildPhase === "done") {
      if (projectMode === "frontend") {
        setWorkspaceTab("preview");
        if (isMobile) {
          setActiveMobileTab("preview");
        }
      }
    }
    prevBuildPhase.current = projectStore.buildPhase;
  }, [projectStore.buildPhase]);

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

  // Load chat on mount or when chatId parameter changes
  useEffect(() => {
    const loadChat = async () => {
      if (chatId) {
        if (chatStore.currentChatId !== chatId) {
          setLoadingChat(true);
          const currentUser = auth.currentUser;
          const uid = currentUser ? currentUser.uid : "mock-local-user-id";
          try {
            const chatData = await loadSingleChatFromFirebaseOrLocal(uid, chatId);
            if (chatData) {
              chatStore.setMessages(chatData.messages || []);
              projectStore.setCurrentContent(chatData.content || null);
              chatStore.setCurrentChatId(chatData.id);
              if (chatData.model) setSelectedModel(chatData.model);
              if (chatData.projectMode) setProjectMode(chatData.projectMode as "frontend" | "fullstack");
              if (chatData.messages?.length > 0) {
                chatStore.setHasStarted(true);
              }
              setShowLanding(false);
            } else {
              toast.error("Project not found or failed to load");
              navigate("/chat");
            }
          } catch (err) {
            console.error("Error loading chat:", err);
            toast.error("Failed to load project");
            navigate("/chat");
          } finally {
            setLoadingChat(false);
          }
        } else {
          setShowLanding(false);
        }
      } else {
        if (chatStore.currentChatId) {
          chatStore.resetChat();
          projectStore.setCurrentContent(null);
          useRuntimeStore.getState().setIsBooted(false);
          useRuntimeStore.getState().setUrl(null);
        }
        setShowLanding(true);
      }
    };

    loadChat();
  }, [chatId]);

  // Keep URL in sync with currentChatId state
  useEffect(() => {
    if (chatStore.currentChatId) {
      if (chatId !== chatStore.currentChatId) {
        navigate(`/nexostudio/${chatStore.currentChatId}`);
      }
    } else {
      if (chatId) {
        navigate("/chat");
      }
    }
  }, [chatStore.currentChatId, chatId, navigate]);

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
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === "NEXO_ELEMENT_SELECTED" || event.data.type === "ELEMENT_SELECTED") {
        setSelectedElement({
          id: event.data.id,
          tagName: event.data.tagName,
          text: event.data.text,
          styles: event.data.styles || {},
        });
        
        // Sync to visualEditorStore
        const { useVisualEditorStore } = await import("../stores/visualEditorStore");
        useVisualEditorStore.getState().setSelectedElementId(event.data.id);
        useVisualEditorStore.getState().updateStyle(event.data.id, event.data.styles || {});
        
        setIsVisualMode(true);
      } else if (event.data.type === "STYLE_SYNCED") {
        const { useVisualEditorStore } = await import("../stores/visualEditorStore");
        useVisualEditorStore.getState().updateStyle(event.data.id, event.data.styles);
      } else if (event.data.type === "NEXO_RUNTIME_ERROR") {
        console.error("Caught runtime error in iframe:", event.data);
        const { ErrorCaptureService } = await import("../services/runtime/errorCapture");
        ErrorCaptureService.getInstance().captureIframeError(event.data);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setSelectedElement]);

  // Auto-save chat and code changes after a 2-second debounce
  useEffect(() => {
    if (chatStore.messages.length === 0) return;
    
    // Do NOT auto-save if we are in the middle of planning or code generation to save CPU/network
    const isGenerating = ["planning", "generating", "building", "fixing"].includes(buildPhase);
    if (isGenerating) return;

    const saveTimeout = setTimeout(() => {
      saveCurrentProject().catch((err) => console.error("Auto-save failed:", err));
    }, 2000);
    return () => clearTimeout(saveTimeout);
  }, [chatStore.messages, currentContent, projectTitle, selectedModel, buildPhase]);

  // Save before unload (tab close / refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentProject();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Refresh preview when switching to the Preview tab
  useEffect(() => {
    if (workspaceTab === "preview" || activeMobileTab === "preview") {
      projectStore.incrementPreviewKey();
    }
  }, [workspaceTab, activeMobileTab]);

  // Boot runtime automatically if currentContent exists but runtime is not booted
  const bootAttempted = useRef(false);
  useEffect(() => {
    if (projectStore.currentContent && !isBooted && !bootAttempted.current && (projectStore.buildPhase === "idle" || projectStore.buildPhase === "done")) {
      bootAttempted.current = true;
      console.log("[ChatInterface] Code exists but runtime is not booted. Auto-booting virtual environment...");
      Orchestrator.getInstance().bootRuntime().catch(err => {
        console.error("Failed to auto-boot runtime on content load:", err);
        // Reset so user can retry manually, but don't auto-retry
      });
    }
    // Reset boot attempt flag when content changes (new project)
    if (!projectStore.currentContent) {
      bootAttempted.current = false;
    }
  }, [projectStore.currentContent, isBooted, projectStore.buildPhase]);

  const handleSend = async (prompt: string, attachments?: { name: string; content: string; type: string }[]) => {
    if (prompt === "Deploy") {
      handleDeploy();
      return;
    }

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
    
    // Step into design selection phase
    projectStore.setPendingPrompt(prompt);
    projectStore.setBuildPhase("design_selection");
    setWorkspaceTab("preview");
    if (isMobile) {
      setActiveMobileTab("preview");
    }

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
  };

  const handleDesignSelect = async (designName: string) => {
    const prompt = projectStore.pendingPrompt || "Build a website";
    projectStore.setBuildPhase("planning");
    
    try {
      await Orchestrator.getInstance().executeFullFlow(prompt + "\n\nDesign Style Requirement: " + designName);
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

  const handleDeploy = async () => {
    projectStore.setShowDeployModal(true);
    projectStore.setDeployStatus("deploying");
    projectStore.setDeployUrl("");
    try {
      const url = await DeploymentService.getInstance().deployProject();
      projectStore.setDeployUrl(url);
      projectStore.setDeployStatus("done");
    } catch (e) {
      console.error("[ChatInterface] Deployment error:", e);
      projectStore.setDeployStatus("error");
    }
  };

  const handleDownloadSingleHtml = async () => {
    try {
      toast.loading("Compiling and bundling for HTML download...", { id: "html-download" });
      const htmlContent = await compileAndBundle();
      
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectTitle.replace(/\s+/g, "-").toLowerCase()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Single HTML page downloaded successfully!", { id: "html-download" });
    } catch (e) {
      console.error("[ChatInterface] Failed to download single HTML:", e);
      toast.error("Failed to compile HTML.", { id: "html-download" });
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

  if (loadingChat) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-studio-bg text-studio-text gap-4 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-studio-accent/20 border-t-studio-accent rounded-full animate-spin" />
          <div className="absolute w-8 h-8 border border-studio-secondary/10 border-t-studio-secondary rounded-full animate-spin animate-reverse" style={{ animationDuration: "1.5s" }} />
        </div>
        <span className="text-[10px] font-bold tracking-[0.25em] text-studio-muted animate-pulse uppercase">
          Loading Project Workspace...
        </span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden font-sans bg-[#f7f7f7]">
      <AnimatePresence>
        {showLanding && (
          <InitialOverlay onStart={handleSend} onResume={chatStore.currentChatId ? () => navigate(`/nexostudio/${chatStore.currentChatId}`) : undefined} />
        )}
      </AnimatePresence>

      {/* ── Workspace Inner Header (Back + Title) ── */}
      <div className="h-[52px] bg-white border-b border-[#e8e8e8] flex items-center justify-between px-5 shrink-0 z-20 select-none">
        {/* Left: back + editable title + Chat Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToStart}
            className="flex items-center gap-1.5 text-[#888] hover:text-[#111] transition-colors text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to start
          </button>
          <div className="h-4 w-px bg-[#e8e8e8]" />
          
          {/* Chat Sidebar Toggle */}
          <button
            onClick={() => setShowChatPanel(!showChatPanel)}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
              showChatPanel
                ? "text-[#0ea5e9] bg-[#0ea5e9]/10"
                : "text-[#888] hover:text-[#111] hover:bg-[#f3f3f3] border border-[#e8e8e8]/60"
            }`}
            title={showChatPanel ? "Hide Chat Sidebar" : "Show Chat Sidebar"}
          >
            {showChatPanel ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeft className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="h-4 w-px bg-[#e8e8e8]" />

          {/* Nexo Logo & Title */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center shrink-0 bg-white border border-[#e8e8e8]">
              <img src={logoV2} alt="Nexo Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-xs tracking-tight text-[#111] hidden sm:inline">Nexo v2</span>
          </div>

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

        {/* Right: Save + GitHub + Remix / Share / Publish + icon buttons + User Widget */}
        <div className="flex items-center gap-2">
          {isMobile ? (
            <>
              {/* Mobile compact Save */}
              <button
                onClick={async () => {
                  const savePromise = saveCurrentProject();
                  toast.promise(savePromise, {
                    loading: "Saving project...",
                    success: "Project saved successfully! 💾",
                    error: "Failed to save project.",
                  });
                }}
                className="p-2 rounded-lg text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] border border-[#e8e8e8] transition-all"
                title="Save Project"
              >
                <Save className="w-3.5 h-3.5 text-indigo-500" />
              </button>

              {/* Mobile compact Deploy */}
              <button
                onClick={handleDeploy}
                className="p-2 rounded-lg text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 transition-all shadow-md active:scale-95"
                title="Deploy Live"
              >
                <Rocket className="w-3.5 h-3.5" />
              </button>

              {/* Mobile actions dropdown */}
              <div className="relative" ref={moreMenuRef}>
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-[#e8e8e8] ${
                    isMoreMenuOpen ? "text-[#0ea5e9] bg-[#0ea5e9]/10" : "text-[#888] hover:text-[#111] hover:bg-[#f3f3f3]"
                  }`}
                  title="More Actions"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 bg-white border border-[#e8e8e8] shadow-2xl rounded-2xl overflow-hidden z-50 w-56 p-1.5 flex flex-col gap-0.5"
                    >
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          handleOneClickGithubPush();
                        }}
                        disabled={ghPushing}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] transition-all disabled:opacity-50"
                      >
                        <GitBranch className="w-4 h-4 text-stone-500 shrink-0" />
                        <span className="truncate">{ghPushing ? "Pushing to GitHub..." : "Push to GitHub"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          toast.success("Remixing project context...");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] transition-all"
                      >
                        <Sparkles className="w-4 h-4 text-[#0ea5e9] shrink-0" />
                        <span>Remix App</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          toggleTheme();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] transition-all"
                      >
                        {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 text-stone-500 shrink-0" />}
                        <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setShowStudioPanel(!showStudioPanel);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] transition-all"
                      >
                        <Sliders className="w-4 h-4 text-teal-500 shrink-0" />
                        <span>Studio Controls</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setSettingsTab("Chat");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] transition-all"
                      >
                        <Settings className="w-4 h-4 text-stone-600 shrink-0" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          setIsTokenDashboardOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] transition-all"
                      >
                        <Coins className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span>Token Dashboard</span>
                      </button>
                      <div className="h-px bg-[#e8e8e8] my-1 mx-1.5" />
                      {/* User Account Info inside mobile menu */}
                      {user ? (
                        <div className="px-3 py-2 flex flex-col gap-2 bg-[#f9f9f9] rounded-xl border border-[#e8e8e8] m-1">
                          <div className="flex items-center gap-2">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white text-[10px] font-bold">
                                {(user.displayName || user.email || "U")[0].toUpperCase()}
                              </div>
                            )}
                            <span className="text-[10px] font-bold text-[#333] truncate max-w-[120px]" title={user.displayName || user.email || ""}>
                              {user.displayName || user.email?.split("@")[0]}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              setIsMoreMenuOpen(false);
                              await logout();
                            }}
                            className="w-full py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1.5"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setIsMoreMenuOpen(false);
                            signInWithGoogle();
                          }}
                          className="m-1 py-2 bg-[#f3f3f3] hover:bg-[#ebebeb] text-[#333] rounded-xl text-[10px] font-bold transition-all border border-[#e8e8e8] flex items-center justify-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Sign In</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
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
              <button
                onClick={handleDeploy}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 transition-all shadow-md shadow-emerald-700/10 active:scale-95"
              >
                <Rocket className="w-3.5 h-3.5" />
                Deploy
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

              {/* Studio Panel Toggle */}
              <button
                onClick={() => setShowStudioPanel(!showStudioPanel)}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                  showStudioPanel
                    ? "text-[#0ea5e9] bg-[#0ea5e9]/10"
                    : "text-[#888] hover:text-[#111] hover:bg-[#f3f3f3]"
                }`}
                title={showStudioPanel ? "Hide Studio Panel" : "Show Studio Panel"}
              >
                <Sliders className="w-3.5 h-3.5" />
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
                <Coins className="w-3.5 h-3.5 text-cyan-500" />
              </button>

              {/* User Widget */}
              <div className="w-px h-4 bg-[#e8e8e8] mx-1" />
              {user ? (
                <div className="flex items-center gap-1.5 bg-[#f7f7f7] pl-1 pr-2.5 py-1 rounded-full border border-[#e8e8e8] shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white text-[9px] font-bold">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] font-semibold text-[#333] max-w-[120px] truncate" title={user.displayName || user.email || ""}>
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                  <button
                    onClick={logout}
                    className="text-[#aaa] hover:text-[#e55] transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#f3f3f3] hover:bg-[#ebebeb] text-[#333] rounded-full text-[10px] font-semibold transition-all border border-[#e8e8e8] shrink-0"
                >
                  <User className="w-3 h-3" />
                  Sign In
                </button>
              )}
            </>
          )}
        </div>
      </div>



      {/* ── Main Workspace ── */}
      <main className="flex-1 flex overflow-hidden min-h-0">
        {isMobile ? (
          <div className="flex-1 flex flex-col overflow-hidden p-2.5 gap-2">
            {activeMobileTab === "chat" && (
              <div className="flex-1 overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-sm">
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
            )}
            {activeMobileTab === "code" && (
              <div className="flex-1 overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-sm">
                <React.Suspense
                  fallback={
                    <div className="h-full w-full flex items-center justify-center bg-white rounded-xl">
                      <div className="w-6 h-6 border-2 border-[#e8e8e8] border-t-[#0ea5e9] rounded-full animate-spin" />
                    </div>
                  }
                >
                  <EditorPanel
                    selectedFileName={selectedFileName}
                    setSelectedFileName={setSelectedFileName}
                  />
                </React.Suspense>
              </div>
            )}
            {activeMobileTab === "preview" && (
              <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                <div className="bg-white rounded-xl border border-[#e8e8e8] h-10 flex items-center justify-between px-3 shrink-0 shadow-sm">
                  <span className="text-[10px] text-[#bbb] font-bold uppercase tracking-wider">Live Preview</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => useProjectStore.getState().incrementPreviewKey()}
                      className="p-1.5 rounded-lg text-[#888] hover:text-[#111] hover:bg-[#f3f3f3] transition-colors"
                      title="Reload preview"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsVisualMode(!isVisualMode)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                        isVisualMode
                          ? "bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/25"
                          : "text-[#888] border-[#e8e8e8] hover:text-[#111] hover:bg-[#f3f3f3]"
                      }`}
                    >
                      <Monitor className="w-2.5 h-2.5" />
                      Visual Mode
                    </button>
                  </div>
                </div>
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
                    <PreviewPanel
                      isVisualMode={isVisualMode}
                      setIsVisualMode={setIsVisualMode}
                      onDesignSelect={handleDesignSelect}
                    />
                  </React.Suspense>
                </div>
              </div>
            )}
            {activeMobileTab === "studio" && (
              <div className="flex-1 overflow-hidden rounded-xl border border-[#e8e8e8] bg-white shadow-sm">
                <StudioControls />
              </div>
            )}
          </div>
        ) : (
          <PanelGroup orientation="horizontal">

            {/* LEFT: Chat sidebar */}
            {showChatPanel && (
              <>
                <Panel defaultSize={showStudioPanel ? 25 : 35} minSize={20} maxSize={50} className="flex flex-col overflow-hidden p-3 pr-1.5">
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

                {/* Resize handle */}
                <PanelResizeHandle className="w-1.5 bg-transparent hover:bg-[#0ea5e9]/20 transition-colors cursor-col-resize" />
              </>
            )}

            {/* RIGHT: Preview / Code panel */}
            <Panel defaultSize={65} minSize={40} maxSize={82} className="flex flex-col overflow-hidden p-3 pl-1.5 pr-1 gap-2">

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
                      onDesignSelect={handleDesignSelect}
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
        )}
      </main>

      {/* Mobile Tab Footer Navigation */}
      {isMobile && (
        <div className="h-14 bg-white border-t border-[#e8e8e8] flex items-center justify-around px-4 shrink-0 z-20 select-none">
          <button
            onClick={() => setActiveMobileTab("chat")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
              activeMobileTab === "chat" ? "text-[#0ea5e9]" : "text-[#888]"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("code")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
              activeMobileTab === "code" ? "text-[#0ea5e9]" : "text-[#888]"
            }`}
          >
            <Code className="w-5 h-5" />
            <span>Code</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("preview")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
              activeMobileTab === "preview" ? "text-[#0ea5e9]" : "text-[#888]"
            }`}
          >
            <Monitor className="w-5 h-5" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("studio")}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-all ${
              activeMobileTab === "studio" ? "text-[#0ea5e9]" : "text-[#888]"
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span>Studio</span>
          </button>
        </div>
      )}

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
          onDeploy={handleDeploy}
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

      {projectStore.showDeployModal && (
        <DeployModal
          status={projectStore.deployStatus}
          url={projectStore.deployUrl}
          onClose={() => projectStore.setShowDeployModal(false)}
          onDownloadHtml={handleDownloadSingleHtml}
          onDownloadZip={handleDownloadZip}
        />
      )}
    </div>
  );
};

export default ChatInterface;
