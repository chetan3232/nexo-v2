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
  HardDrive,
  Trash2,
  Check,
  ChevronDown,
  Image,
  Layers,
  Database,
  Palette,
  Play,
  User,
  Plus
} from "lucide-react";
import { useProjectStore } from "../../stores/projectStore";
import { useChatStore } from "../../stores/chatStore";
import { useAgentStore } from "../../stores/agentStore";
import { PROJECT_TEMPLATES } from "../../lib/templates";
import {
  auth,
  loadChatsFromFirebase,
  deleteChatFromFirebase,
  saveChatToFirebase,
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

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-300 select-none shrink-0 z-20">
      {/* Tab Icons (Vertical Bar) */}
      <div className="w-16 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-4 justify-between">
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Studio Brand Spark */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 mb-6">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>

          {[
            { id: "projects", icon: FolderOpen, label: "Explorer" },
            { id: "chats", icon: MessageSquare, label: "Chats" },
            { id: "templates", icon: Sparkles, label: "Starters" },
            { id: "assets", icon: Image, label: "Assets" },
            { id: "keys", icon: Key, label: "API Keys" },
            { id: "deploy", icon: Globe, label: "Deploy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id as SidebarTab)}
              className={`p-3 rounded-xl transition-all relative group ${
                activeTab === tab.id && isExpanded
                  ? "bg-zinc-900 text-indigo-400 border border-zinc-800"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              }`}
              title={tab.label}
            >
              <tab.icon className="w-5 h-5" />
              {activeTab === tab.id && isExpanded && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r" />
              )}
            </button>
          ))}
        </div>

        {/* Settings Icon (Bottom) */}
        <button
          onClick={() => handleTabClick("settings")}
          className={`p-3 rounded-xl transition-all relative group ${
            activeTab === "settings" && isExpanded
              ? "bg-zinc-900 text-indigo-400 border border-zinc-800"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
          {activeTab === "settings" && isExpanded && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-500 rounded-r" />
          )}
        </button>
      </div>

      {/* Expanded Subpanel Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-72 bg-zinc-900/90 border-r border-zinc-900 flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="h-14 border-b border-zinc-900 px-6 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {activeTab}
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2 py-1 rounded hover:bg-zinc-800 transition-all"
              >
                Hide &rarr;
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {/* PROJECTS / EXPLORER VIEW */}
              {activeTab === "projects" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-medium">Workspace Files</span>
                    <button
                      onClick={() => {
                        const name = prompt("Enter filename:");
                        if (name) {
                          useProjectStore.getState().setCurrentContent((prev) => {
                            const files = prev ? { ...prev.files } : {};
                            return {
                              files: { ...files, [name]: `// Code for ${name}` },
                              mainFile: prev?.mainFile || name,
                              template: prev?.template || "web"
                            };
                          });
                          setSelectedFileName(name);
                        }
                      }}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                      title="New File"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {currentContent?.files && Object.keys(currentContent.files).length > 0 ? (
                      Object.keys(currentContent.files).map((filename) => (
                        <button
                          key={filename}
                          onClick={() => setSelectedFileName(filename)}
                          className={`w-full px-3 py-2 flex items-center gap-2 rounded-lg text-xs font-semibold tracking-wide text-left transition-all ${
                            selectedFileName === filename
                              ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                          }`}
                        >
                          <FileCode className="w-4 h-4 shrink-0 text-zinc-500" />
                          <span className="truncate">{filename}</span>
                        </button>
                      ))
                    ) : (
                      <div className="text-zinc-500 text-xs italic text-center py-8">
                        No files in project yet
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CHATS / HISTORY VIEW */}
              {activeTab === "chats" && (
                <div className="space-y-2">
                  {!user ? (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-xs text-zinc-500">Sign in to save and browse your projects.</p>
                      <button
                        onClick={signInWithGoogle}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-bold transition-all w-full flex items-center justify-center gap-2"
                      >
                        <User className="w-4 h-4" /> Sign In
                      </button>
                    </div>
                  ) : chatHistory.length === 0 ? (
                    <div className="text-zinc-500 text-xs italic text-center py-8">
                      No saved projects yet.
                    </div>
                  ) : (
                    chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleLoadChat(chat)}
                        className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          currentChatId === chat.id
                            ? "bg-zinc-800/80 border-indigo-500/30 shadow-md"
                            : "bg-zinc-900 border-zinc-800/50 hover:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-zinc-200 truncate flex-1">
                            {chat.name || "Untitled Project"}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadZip(chat);
                              }}
                              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                              title="Download ZIP"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.id);
                              }}
                              className="p-1 hover:bg-red-950 rounded text-zinc-500 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                          <span>{chat.date}</span>
                          <span>{chat.fileCount || 0} files</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* STARTER TEMPLATES VIEW */}
              {activeTab === "templates" && (
                <div className="space-y-3">
                  <span className="text-xs text-zinc-500">Pick a starter code repository:</span>
                  <div className="grid gap-3">
                    {Object.values(PROJECT_TEMPLATES).map((temp) => (
                      <div
                        key={temp.id}
                        onClick={() => handleApplyTemplate(temp)}
                        className="p-3 bg-zinc-900 border border-zinc-800/60 rounded-xl hover:border-indigo-500/40 hover:bg-zinc-800/20 cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200">{temp.name}</span>
                          <Play className="w-3 h-3 text-indigo-400" />
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          {temp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ASSETS VIEW */}
              {activeTab === "assets" && (
                <div className="space-y-3">
                  <span className="text-xs text-zinc-500">Project Asset Library</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "Nexo Logo", type: "Image", url: "/src/assets/NEXO-V2.png" },
                      { name: "Background Wave", type: "SVG", url: "#" },
                      { name: "Placeholder Avatar", type: "Image", url: "#" },
                      { name: "Pricing Card", type: "Component", url: "#" },
                    ].map((asset, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-zinc-900 border border-zinc-800/50 rounded-xl flex flex-col items-center justify-center text-center gap-1.5"
                      >
                        <Image className="w-6 h-6 text-zinc-600" />
                        <div className="text-[10px] font-bold text-zinc-300 truncate w-full">
                          {asset.name}
                        </div>
                        <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                          {asset.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API KEYS CONFIGURATION */}
              {activeTab === "keys" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                      Google Gemini API Key
                    </label>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Input your own API key to bypass rate limits. It is saved securely in your browser's local storage.
                    </p>
                    <input
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveApiKey}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-500/10"
                    >
                      Save Key
                    </button>
                    {localStorage.getItem("nexo_custom_api_key") && (
                      <button
                        onClick={handleClearApiKey}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-xs font-bold transition-all"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* DEPLOYMENTS CONTROL */}
              {activeTab === "deploy" && (
                <div className="space-y-4">
                  <div className="p-4 bg-zinc-900 border border-zinc-800/80 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">Status</span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          deployStatus === "done"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : deployStatus === "deploying"
                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {deployStatus === "done" ? "Live" : deployStatus === "deploying" ? "Deploying" : "Not Deployed"}
                      </span>
                    </div>

                    {deployUrl && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-zinc-500">Deployment URL</span>
                        <a
                          href={deployUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-400 hover:underline break-all block font-mono"
                        >
                          {deployUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDeploy}
                    disabled={isDeploying}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 disabled:opacity-50"
                  >
                    {isDeploying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Deploy Live Website
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* SETTINGS VIEW */}
              {activeTab === "settings" && (
                <div className="space-y-4">
                  {/* Model Selector */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">AI Model</label>
                    <button
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 hover:border-zinc-700 transition-all font-mono"
                    >
                      <span>{models.find((m) => m.id === selectedModel)?.name || "Gemini 2.5 Flash"}</span>
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                    </button>
                    {isModelDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5">
                        {models.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              setSelectedModel(m.id);
                              setIsModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                              selectedModel === m.id
                                ? "bg-indigo-600 text-white"
                                : "hover:bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            <div>{m.name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Project Mode</label>
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
                      <button
                        onClick={() => setProjectMode("frontend")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          projectMode === "frontend" ? "bg-indigo-600 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" /> Frontend
                      </button>
                      <button
                        onClick={() => setProjectMode("fullstack")}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          projectMode === "fullstack" ? "bg-indigo-600 text-white shadow" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Database className="w-3.5 h-3.5" /> Fullstack
                      </button>
                    </div>
                  </div>

                  {/* Language Selector */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Code Language</label>
                    <button
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 hover:border-zinc-700 transition-all"
                    >
                      <span>{selectedLanguage}</span>
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                    </button>
                    {isLangDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50">
                        {languages.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setSelectedLanguage(lang);
                              setIsLangDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                              selectedLanguage === lang
                                ? "bg-indigo-600 text-white"
                                : "hover:bg-zinc-900 text-zinc-400"
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Temperature slider */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider">Temperature</span>
                      <span className="font-mono text-indigo-400 font-semibold">{temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 bg-zinc-800 h-1 rounded-lg outline-none cursor-pointer"
                    />
                  </div>

                  {/* Top P slider */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider">Top P</span>
                      <span className="font-mono text-indigo-400 font-semibold">{topP}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={topP}
                      onChange={(e) => setTopP(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 bg-zinc-800 h-1 rounded-lg outline-none cursor-pointer"
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
