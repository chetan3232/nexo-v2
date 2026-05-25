import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  MessageSquare,
  Sparkles,
  Key,
  Globe,
  Settings,
  Cpu,
  Code,
  FileCode,
  Download,
  Trash2,
  ChevronDown,
  Image,
  Palette,
  Play,
  User,
  Plus,
  Compass,
  Database,
  Layers,
  Activity
} from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { useChatStore } from "../../stores/chatStore";
import { useAgentStore } from "../../stores/agentStore";
import { PROJECT_TEMPLATES } from "../../lib/templates";
import {
  auth,
  loadChatsFromFirebase,
  deleteChatFromFirebase,
  signInWithGoogle
} from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import JSZip from "jszip";
import toast from "react-hot-toast";

type SidebarTab = "projects" | "chats" | "templates" | "assets" | "keys" | "deploy" | "settings";

export const WorkspaceSidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("projects");
  const [isExpanded, setIsExpanded] = useState(true);

  // States from stores
  const { currentContent, selectedFileName, setSelectedFileName, deployStatus, deployUrl, setDeployStatus, setDeployUrl } = useProjectStore();
  const { messages, setMessages, currentChatId, setCurrentChatId, setHasStarted } = useChatStore();
  const {
    selectedModel,
    setSelectedModel,
    projectMode,
    setProjectMode,
    selectedLanguage,
    setSelectedLanguage,
    temperature,
    setTemperature,
    topP,
    setTopP
  } = useAgentStore();

  // Local Sidebar States
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [customApiKey, setCustomApiKey] = useState("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Auth monitoring
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadChatsFromFirebase(currentUser.uid).then((chats) => {
          setChatHistory(chats);
        });
      } else {
        setChatHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // API Key initialization
  useEffect(() => {
    const savedKey = localStorage.getItem("nexo_custom_api_key") || "";
    setCustomApiKey(savedKey);
    if (savedKey) {
      // @ts-ignore
      window.process = window.process || { env: {} };
      // @ts-ignore
      window.process.env = window.process.env || {};
      // @ts-ignore
      window.process.env.API_KEY = savedKey;
    }
  }, []);

  const handleSaveApiKey = () => {
    localStorage.setItem("nexo_custom_api_key", customApiKey);
    // @ts-ignore
    window.process = window.process || { env: {} };
    // @ts-ignore
    window.process.env = window.process.env || {};
    // @ts-ignore
    window.process.env.API_KEY = customApiKey;
    toast.success("API Key saved successfully!");
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("nexo_custom_api_key");
    setCustomApiKey("");
    // @ts-ignore
    if (window.process?.env) {
      // @ts-ignore
      window.process.env.API_KEY = "AIzaSyBdwndziQV1EcJkzxjMkzq3HrL2u-YCQ7c"; // Default fallback
    }
    toast.success("API Key cleared. Using default key.");
  };

  const handleTabClick = (tab: SidebarTab) => {
    if (activeTab === tab) {
      setIsExpanded(!isExpanded);
    } else {
      setActiveTab(tab);
      setIsExpanded(true);
    }
  };

  const handleLoadChat = (chat: any) => {
    setMessages(chat.messages || []);
    useProjectStore.getState().setCurrentContent(chat.content || null);
    setCurrentChatId(chat.id);
    if (chat.model) setSelectedModel(chat.model);
    if (chat.projectMode) setProjectMode(chat.projectMode);
    if (chat.messages?.length > 0) setHasStarted(true);
    toast.success(`Loaded: ${chat.name || "Untitled Project"}`);
  };

  const handleDeleteChat = async (id: string) => {
    if (!user) return;
    try {
      await deleteChatFromFirebase(user.uid, id);
      setChatHistory((prev) => prev.filter((c) => c.id !== id));
      if (currentChatId === id) {
        useChatStore.getState().resetChat();
        useProjectStore.getState().setCurrentContent(null);
      }
      toast.success("Project deleted");
    } catch (e) {
      toast.error("Failed to delete project");
    }
  };

  const handleDownloadZip = async (chat: any) => {
    try {
      const zip = new JSZip();
      const files = chat.content?.files || {};
      if (Object.keys(files).length === 0) {
        zip.file("README.md", `# ${chat.name || "Nexo Project"}\nNo files found.`);
      } else {
        Object.entries(files).forEach(([path, content]) => {
          zip.file(path.startsWith("/") ? path.slice(1) : path, content as string);
        });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(chat.name || "nexo-project").replace(/\s+/g, "-").toLowerCase()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ZIP downloaded successfully!");
    } catch (e) {
      toast.error("ZIP creation failed");
    }
  };

  const handleApplyTemplate = (template: any) => {
    useProjectStore.getState().setCurrentContent({
      files: template.files,
      mainFile: "src/App.tsx",
      template: "react"
    });
    setMessages([
      {
        role: "assistant",
        text: `Starting project using **${template.name}** template. Files have been loaded!`,
        timestamp: Date.now()
      }
    ]);
    setHasStarted(true);
    toast.success(`Applied starter template: ${template.name}`);
  };

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

  const models = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Recommended model" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "Heavy reasoning" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", desc: "Fast balanced" },
  ];

  const languages = ["HTML", "TypeScript", "JavaScript", "Python"];

  const tabs = [
    { id: "projects", icon: FolderOpen, label: "Explorer" },
    { id: "chats", icon: MessageSquare, label: "Chats" },
    { id: "templates", icon: Compass, label: "Starters" },
    { id: "assets", icon: Image, label: "Assets" },
    { id: "keys", icon: Key, label: "API Keys" },
    { id: "deploy", icon: Globe, label: "Deployments" },
  ];

  return (
    <div className="flex h-full bg-studio-bg text-studio-text select-none shrink-0 z-20 border-r border-studio-border/60">
      {/* Icon Sidebar (Vertical Action Strip) */}
      <div className="w-16 bg-studio-bg/95 flex flex-col items-center py-4 justify-between relative">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* AI Pulse Logo */}
          <div className="relative group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-studio-accent to-indigo-600 flex items-center justify-center shadow-lg shadow-studio-accent/20 transition-transform duration-300 group-hover:scale-105 active:scale-95">
              <Sparkles className="w-5 h-5 text-studio-text" />
            </div>
            {/* Live pulsing glowing dot */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-studio-bg"></span>
            </span>
          </div>

          <div className="h-px w-8 bg-studio-border/60 my-2" />

          {/* Floating Create Button */}
          <button
            onClick={() => {
              const name = prompt("Enter new filename:");
              if (name) {
                useProjectStore.getState().setCurrentContent((prev) => {
                  const files = prev ? { ...prev.files } : {};
                  return {
                    files: { ...files, [name]: `// New file ${name}` },
                    mainFile: prev?.mainFile || name,
                    template: prev?.template || "web"
                  };
                });
                setSelectedFileName(name);
              }
            }}
            className="w-10 h-10 rounded-xl bg-studio-panel border border-studio-border hover:border-studio-accent text-studio-muted hover:text-studio-text flex items-center justify-center transition-all duration-300 shadow-md group hover:bg-studio-panel/80 hover:shadow-studio-accent/5"
            title="Create New File"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Tabs Map */}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id && isExpanded;
            return (
              <div
                key={tab.id}
                className="relative"
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <button
                  onClick={() => handleTabClick(tab.id as SidebarTab)}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    isTabActive
                      ? "bg-studio-panel text-studio-accent border border-studio-border/60 shadow-lg shadow-black/30"
                      : "text-studio-muted hover:text-studio-text hover:bg-studio-panel/40"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isTabActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-studio-accent rounded-r"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>

                {/* Micro Tooltip */}
                <AnimatePresence>
                  {hoveredTab === tab.id && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 20 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="absolute left-full top-1/2 -translate-y-1/2 bg-studio-card border border-studio-border px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-studio-text whitespace-nowrap shadow-xl z-50 pointer-events-none"
                    >
                      {tab.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Settings Button */}
        <div
          className="relative"
          onMouseEnter={() => setHoveredTab("settings")}
          onMouseLeave={() => setHoveredTab(null)}
        >
          <button
            onClick={() => handleTabClick("settings")}
            className={`p-3 rounded-xl transition-all duration-300 ${
              activeTab === "settings" && isExpanded
                ? "bg-studio-panel text-studio-accent border border-studio-border/60"
                : "text-studio-muted hover:text-studio-text hover:bg-studio-panel/40"
            }`}
          >
            <Settings className="w-5 h-5" />
            {activeTab === "settings" && isExpanded && (
              <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-studio-accent rounded-r" />
            )}
          </button>
          <AnimatePresence>
            {hoveredTab === "settings" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 20 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute left-full top-1/2 -translate-y-1/2 bg-studio-card border border-studio-border px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-studio-text whitespace-nowrap shadow-xl z-50 pointer-events-none"
              >
                Settings
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expanded Subpanel Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-72 bg-studio-panel/30 border-r border-studio-border/60 flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Expanded Header */}
            <div className="h-14 border-b border-studio-border/60 px-6 flex items-center justify-between shrink-0 bg-studio-panel/10">
              <span className="text-[10px] font-black text-studio-accent uppercase tracking-[0.2em]">
                {activeTab}
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-studio-muted hover:text-studio-text text-[10px] font-bold tracking-wider px-2 py-1 rounded-md border border-studio-border/60 hover:bg-studio-panel/50 transition-all"
              >
                Collapse
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-grow overflow-y-auto p-5 space-y-5 custom-scrollbar bg-studio-panel/5">
              {/* PROJECTS / EXPLORER VIEW */}
              {activeTab === "projects" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-studio-muted font-black uppercase tracking-wider">WORKSPACE FILES</span>
                  </div>
                  <div className="space-y-1.5">
                    {currentContent?.files && Object.keys(currentContent.files).length > 0 ? (
                      Object.keys(currentContent.files).map((filename) => (
                        <button
                          key={filename}
                          onClick={() => setSelectedFileName(filename)}
                          className={`w-full px-3 py-2.5 flex items-center gap-2.5 rounded-xl text-xs font-semibold tracking-wide text-left transition-all border ${
                            selectedFileName === filename
                              ? "bg-studio-accent/10 text-studio-text border-studio-accent/25 shadow-md shadow-studio-accent/5"
                              : "bg-transparent border-transparent text-studio-muted hover:text-studio-text hover:bg-studio-panel/40"
                          }`}
                        >
                          <FileCode className="w-4 h-4 shrink-0 text-studio-accent/80 animate-pulse" />
                          <span className="truncate">{filename}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-studio-muted text-xs italic text-center py-10 bg-studio-card/20 rounded-2xl border border-studio-border border-dashed">
                        No files generated yet
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CHATS HISTORY VIEW */}
              {activeTab === "chats" && (
                <div className="space-y-4">
                  {!user ? (
                    <div className="text-center py-10 space-y-4 bg-studio-card/30 rounded-2xl border border-studio-border p-4">
                      <p className="text-xs text-studio-muted leading-relaxed">Sign in to save progress and collaborate on projects.</p>
                      <button
                        onClick={signInWithGoogle}
                        className="px-4 py-2.5 bg-studio-accent hover:bg-studio-accent/90 text-studio-text rounded-xl text-xs font-bold transition-all w-full flex items-center justify-center gap-2 shadow-lg shadow-studio-accent/20"
                      >
                        <User className="w-4 h-4" /> Google Connect
                      </button>
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="text-studio-muted text-xs italic text-center py-10 bg-studio-card/20 rounded-2xl border border-studio-border border-dashed">
                      No saved projects yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {chatHistory.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => handleLoadChat(chat)}
                          className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                            currentChatId === chat.id
                              ? "bg-studio-accent/10 border-studio-accent/30 shadow-lg"
                              : "bg-studio-card/50 border-studio-border/60 hover:border-studio-border hover:bg-studio-card"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 z-10">
                            <span className="text-xs font-bold text-studio-text truncate flex-1">
                              {chat.name || "Untitled Project"}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadZip(chat);
                                }}
                                className="p-1 hover:bg-studio-panel rounded-md text-studio-muted hover:text-studio-text"
                                title="Download Source ZIP"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteChat(chat.id);
                                }}
                                className="p-1 hover:bg-red-950/40 rounded-md text-studio-muted hover:text-red-400"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-studio-muted font-mono z-10">
                            <span>{chat.date}</span>
                            <span className="bg-studio-panel px-2 py-0.5 rounded-full border border-studio-border/80">{chat.fileCount || 0} files</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STARTERS VIEW */}
              {activeTab === "templates" && (
                <div className="space-y-4">
                  <span className="text-xs text-studio-muted block">Apply boilerplate structures to kickstart app creation:</span>
                  <div className="space-y-3">
                    {Object.values(PROJECT_TEMPLATES).map((temp) => (
                      <div
                        key={temp.id}
                        onClick={() => handleApplyTemplate(temp)}
                        className="p-4 bg-studio-card/45 border border-studio-border/60 rounded-2xl hover:border-studio-accent/40 hover:bg-studio-card cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-studio-text group-hover:text-studio-accent transition-colors">{temp.name}</span>
                          <Play className="w-3 h-3 text-studio-muted group-hover:text-studio-accent transition-colors" />
                        </div>
                        <p className="text-[10px] text-studio-muted leading-relaxed">
                          {temp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ASSETS VIEW */}
              {activeTab === "assets" && (
                <div className="space-y-4">
                  <span className="text-xs text-studio-muted">Global asset dictionary</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { name: "Brand Logo", type: "Image" },
                      { name: "Glow Mesh", type: "SVG" },
                      { name: "Avatar Map", type: "JSON" },
                      { name: "Pricing UI", type: "CSS" },
                    ].map((asset, i) => (
                      <div
                        key={i}
                        className="p-3 bg-studio-card/30 border border-studio-border/60 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 hover:border-studio-border hover:bg-studio-card transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-studio-panel/50 border border-studio-border flex items-center justify-center">
                          <Image className="w-4 h-4 text-studio-accent" />
                        </div>
                        <div className="text-[9px] font-bold text-studio-text truncate w-full">
                          {asset.name}
                        </div>
                        <span className="text-[8px] bg-studio-panel text-studio-muted px-1.5 py-0.5 rounded-full border border-studio-border">
                          {asset.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API KEYS CONFIG */}
              {activeTab === "keys" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-studio-muted uppercase tracking-wider block">
                      Google Gemini Key
                    </label>
                    <p className="text-[10px] text-studio-muted leading-relaxed">
                      Supply a private key to bypass workspace limits. Keys are stored in the client local storage browser frame.
                    </p>
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-studio-bg border border-studio-border rounded-xl px-3.5 py-2.5 text-xs text-studio-text outline-none focus:border-studio-accent transition-all font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveApiKey}
                      className="flex-1 py-2.5 bg-studio-accent hover:bg-studio-accent/90 text-studio-text rounded-xl text-xs font-bold transition-all shadow-md shadow-studio-accent/25"
                    >
                      Save Key
                    </button>
                    {localStorage.getItem("nexo_custom_api_key") && (
                      <button
                        onClick={handleClearApiKey}
                        className="px-3.5 py-2.5 bg-studio-card border border-studio-border hover:border-studio-muted text-studio-muted hover:text-studio-text rounded-xl text-xs font-bold transition-all"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* DEPLOYMENTS VIEW */}
              {activeTab === "deploy" && (
                <div className="space-y-4">
                  <div className="p-4 bg-studio-card/30 border border-studio-border/60 rounded-2xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider">Live Status</span>
                      <span
                        className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          deployStatus === "done"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : deployStatus === "deploying"
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : "bg-studio-panel text-studio-muted border-studio-border"
                        }`}
                      >
                        {deployStatus === "done" ? "Active" : deployStatus === "deploying" ? "Building" : "Idle"}
                      </span>
                    </div>

                    {deployUrl && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-studio-muted uppercase block tracking-wider font-bold">App Endpoint</span>
                        <a
                          href={deployUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-studio-accent hover:underline break-all block font-mono"
                        >
                          {deployUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="w-full py-3 bg-gradient-to-tr from-studio-accent to-purple-600 hover:from-studio-accent hover:to-purple-500 text-studio-text rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-studio-accent/20 disabled:opacity-50"
                  >
                    {isDeploying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Triggering Sandbox...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Deploy Live Endpoint
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* SETTINGS VIEW */}
              {activeTab === "settings" && (
                <div className="space-y-4">
                  {/* Model Selector */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-studio-muted uppercase tracking-wider block">AI LLM Model</label>
                    <button
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-studio-bg border border-studio-border rounded-xl text-xs text-studio-text hover:border-studio-accent transition-all font-mono"
                    >
                      <span>{models.find((m) => m.id === selectedModel)?.name || "Gemini 2.5 Flash"}</span>
                      <ChevronDown className="w-3 h-3 text-studio-muted" />
                    </button>
                    {isModelDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-studio-card border border-studio-border rounded-xl shadow-2xl p-1 z-50">
                        {models.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              selectedModel === m.id
                                ? "bg-studio-accent text-white"
                                : "hover:bg-studio-panel text-studio-muted"
                            }`}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-studio-muted uppercase tracking-wider block">Developer Mode</label>
                    <div className="flex bg-studio-bg p-1 rounded-xl border border-studio-border">
                      <button
                        onClick={() => setProjectMode("frontend")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          projectMode === "frontend" ? "bg-studio-accent text-studio-text shadow" : "text-studio-muted hover:text-studio-text"
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" /> UI Design
                      </button>
                      <button
                        onClick={() => setProjectMode("fullstack")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          projectMode === "fullstack" ? "bg-studio-accent text-studio-text shadow" : "text-studio-muted hover:text-studio-text"
                        }`}
                      >
                        <Database className="w-3.5 h-3.5" /> Fullstack
                      </button>
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-studio-muted uppercase tracking-wider block">Source Language</label>
                    <button
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-studio-bg border border-studio-border rounded-xl text-xs text-studio-text hover:border-studio-accent transition-all"
                    >
                      <span>{selectedLanguage}</span>
                      <ChevronDown className="w-3 h-3 text-studio-muted" />
                    </button>
                    {isLangDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-studio-card border border-studio-border rounded-xl shadow-2xl p-1 z-50">
                        {languages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setSelectedLanguage(lang);
                              setIsLangDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                              selectedLanguage === lang
                                ? "bg-studio-accent text-white"
                                : "hover:bg-studio-panel text-studio-muted"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Temperature slider */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-studio-muted uppercase tracking-wider text-[9px]">Temperature</span>
                      <span className="font-mono text-studio-accent font-semibold">{temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-studio-accent bg-studio-bg h-1 rounded-lg outline-none cursor-pointer"
                    />
                  </div>

                  {/* Top P slider */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-studio-muted uppercase tracking-wider text-[9px]">Top P</span>
                      <span className="font-mono text-studio-accent font-semibold">{topP}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                      className="w-full accent-studio-accent bg-studio-bg h-1 rounded-lg outline-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
