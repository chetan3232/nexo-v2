import React, { useState } from "react";
import {
  X,
  ChevronRight,
  Settings,
  Download,
  MessageCircle,
  Rocket,
  Sliders,
  Cpu,
  Brain,
  FileCode,
  Search,
  Key,
  Database,
  RotateCcw,
  Eye,
  EyeOff,
  User,
  Trash2,
  Sparkles,
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { GithubIcon as Github } from "./GithubIcon";
import { useAgentStore, DEFAULT_SYSTEM_PROMPT } from "../../stores/agentStore";
import { useProjectStore } from "../../stores/projectStore";
import { useMemoryStore } from "../../stores/memoryStore";
import toast from "react-hot-toast";
import { auth, shareProject, signInWithGoogle, SharePermission } from "../../services/firebase";
import { useChatStore } from "../../stores/chatStore";

interface SettingsModalProps {
  onClose: () => void;
  onDeploy: () => void;
  onLoadHistory: () => void;
  onDownloadZip: () => void;
  temperature: number;
  setTemperature: (t: number) => void;
  topP: number;
  setTopP: (t: number) => void;
  initialTab?: string;
}

const PROVIDER_MODELS: Record<string, { id: string; name: string }[]> = {
  "Google AI": [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" }
  ],
  "OpenRouter": [
    { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super 120B" },
    { id: "openrouter/owl-alpha", name: "Owl Alpha" }
  ],
  "NVIDIA NIM": [
    { id: "qwen/qwen3-coder-480b-a35b-instruct", name: "Qwen 3 Coder 480B" },
    { id: "z-ai/glm-5.1", name: "GLM 5.1" },
    { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6" },
    { id: "stepfun-ai/step-3.7-flash", name: "Step 3.7 Flash" }
  ],
  "Anthropic": [
    { id: "anthropic/claude-3-5-sonnet", name: "Claude 3.5 Sonnet" }
  ],
  "OpenAI": [
    { id: "openai/gpt-4o", name: "GPT-4o" }
  ]
};

const getProviderForModel = (modelId: string) => {
  for (const [provider, models] of Object.entries(PROVIDER_MODELS)) {
    if (models.some((m) => m.id === modelId)) {
      return provider;
    }
  }
  return "Google AI";
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onDeploy,
  onLoadHistory,
  onDownloadZip,
  temperature,
  setTemperature,
  topP,
  setTopP,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab === "Chat" ? "Models" : (initialTab || "Models"));
  const tabs = ["Models", "Studio", "Share", "Publish", "Versions", "Integrations"];
  const {
    selectedModel,
    setSelectedModel,
    systemPrompt,
    setSystemPrompt,
    enabledTools,
    setEnabledTools,
    customApiKey,
    setCustomApiKey,
  } = useAgentStore();
  const { preferences, history, setPreference } = useMemoryStore();

  const [selectedProviderKey, setSelectedProviderKey] = useState(() => getProviderForModel(selectedModel));

  React.useEffect(() => {
    setSelectedProviderKey(getProviderForModel(selectedModel));
  }, [selectedModel]);


  const [githubToken, setGithubToken] = useState(() => localStorage.getItem("nexo_gh_token") || "");
  const [repoUrl, setRepoUrl] = useState(() => localStorage.getItem("nexo_gh_repo") || "");
  const [commitMessage, setCommitMessage] = useState("Update from Nexo");
  const [branchName, setBranchName] = useState(() => localStorage.getItem("nexo_gh_branch") || "main");

  React.useEffect(() => {
    localStorage.setItem("nexo_gh_token", githubToken);
  }, [githubToken]);

  React.useEffect(() => {
    localStorage.setItem("nexo_gh_repo", repoUrl);
  }, [repoUrl]);

  React.useEffect(() => {
    localStorage.setItem("nexo_gh_branch", branchName);
  }, [branchName]);

  const [showKey, setShowKey] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [permission, setPermission] = useState<SharePermission>("read");
  const [botRestrictions, setBotRestrictions] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleShare = async () => {
    const chatStore = useChatStore.getState();
    const projectStore = useProjectStore.getState();

    const chatId = chatStore.currentChatId;
    if (!chatId) {
      toast.error("Please start a chat session before sharing.");
      return;
    }

    if (!currentUser) {
      toast.error("Please sign in to share.");
      return;
    }

    if (!projectStore.currentContent || !projectStore.currentContent.files || Object.keys(projectStore.currentContent.files).length === 0) {
      toast.error("No generated files found. Please run the AI first to build your project!");
      return;
    }

    setIsSharing(true);
    try {
      const firstUserMessage = chatStore.messages.find((m) => m.role === "user")?.text || "New Project";
      const projectTitle = firstUserMessage.length > 24
        ? firstUserMessage.substring(0, 24) + "..."
        : firstUserMessage;

      const generatedShareId = await shareProject({
        uid: currentUser.uid,
        chatId,
        title: projectTitle,
        permission,
        botRestrictions,
        messages: chatStore.messages,
        content: projectStore.currentContent,
        ownerName: currentUser.displayName || currentUser.email || "Anonymous",
      });

      const generatedUrl = `${window.location.origin}${window.location.pathname}#/s/${generatedShareId}`;
      setShareUrl(generatedUrl);
      toast.success("Share link generated successfully!");
    } catch (error) {
      console.error("Error sharing project:", error);
      toast.error("Failed to generate share link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleResetPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    toast.success("System prompt reset to default!");
  };

  const handlePresetPrompt = (type: "coder" | "ux" | "minimalist") => {
    let preset = "";
    if (type === "coder") {
      preset = `You are NEXO Coder, an advanced programming agent focusing purely on clean architectural patterns, robust error handling, and highly efficient algorithms. Prefer TypeScript, absolute type-safety, and modular imports.`;
    } else if (type === "ux") {
      preset = `You are NEXO UX Architect, a design-system agent specialized in Tailwind gradients, beautiful animations, Apple-like glassmorphic controls, and responsive visual flow. Keep layouts sleek and gorgeous.`;
    } else if (type === "minimalist") {
      preset = `You are NEXO Minimalist. Avoid bloated code or excess libraries. Write clean, vanilla scripts, standard layouts, fast load times, and simple structures.`;
    }
    setSystemPrompt(preset);
    toast.success(`Preset applied: ${type.toUpperCase()}`);
  };

  const toggleTool = (toolId: string) => {
    if (enabledTools.includes(toolId)) {
      setEnabledTools(enabledTools.filter((t) => t !== toolId));
      toast.success(`Disabled tool: ${toolId}`);
    } else {
      setEnabledTools([...enabledTools, toolId]);
      toast.success(`Enabled tool: ${toolId}`);
    }
  };

  const handleClearHistory = () => {
    useMemoryStore.setState({ history: [] });
    toast.success("Memory history cleared.");
  };

  const [newRepoName, setNewRepoName] = useState("");
  const [isPrivateRepo, setIsPrivateRepo] = useState(true);
  const [prTitle, setPrTitle] = useState("Feature: UI update");
  const [prBody, setPrBody] = useState("Generated by Nexo AI Assistant.");
  const [prSourceBranch, setPrSourceBranch] = useState("feature-branch");
  const [prTargetBranch, setPrTargetBranch] = useState("main");
  const [prList, setPrList] = useState<any[]>([]);

  const handleCreateRepo = async () => {
    if (!githubToken || !newRepoName) {
      toast.error("Please provide GitHub token and Repository name.");
      return;
    }
    const files = useProjectStore.getState().currentContent?.files;
    if (!files || Object.keys(files).length === 0) {
      toast.error("No project files generated yet. Build a project first.");
      return;
    }
    const loadingToast = toast.loading("Creating repository...");
    try {
      const headers = {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };
      const createRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: newRepoName,
          private: isPrivateRepo,
          auto_init: true,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message || "Failed to create repository.");
      }
      const repoData = await createRes.json();
      const newRepoUrl = repoData.html_url;
      setRepoUrl(newRepoUrl);
      localStorage.setItem("nexo_gh_repo", newRepoUrl);
      toast.dismiss(loadingToast);
      toast.success(`Repository created: ${newRepoName}`);

      toast.loading("Provisioning repository commits...");
      await new Promise(r => setTimeout(r, 3000));
      
      const owner = repoData.owner.login;
      const repoName = repoData.name;
      
      const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`,
        { headers },
      );
      if (!refRes.ok) throw new Error("Could not fetch main branch reference.");
      const refData = await refRes.json();
      const latestCommitSha = refData.object.sha;

      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`,
        { headers },
      );
      const commitData = await commitRes.json();
      const baseTreeSha = commitData.tree.sha;

      const tree = Object.entries(files).map(([path, content]) => ({
        path: path.startsWith("/") ? path.slice(1) : path,
        mode: "100644",
        type: "blob",
        content,
      }));

      const newTreeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ base_tree: baseTreeSha, tree }),
        },
      );
      if (!newTreeRes.ok) throw new Error("Failed to create Git tree.");
      const newTreeData = await newTreeRes.json();
      const newTreeSha = newTreeData.sha;

      const newCommitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: "Initial commit from NEXO Workspace",
            tree: newTreeSha,
            parents: [latestCommitSha],
          }),
        },
      );
      if (!newCommitRes.ok) throw new Error("Failed to create commit.");
      const newCommitData = await newCommitRes.json();
      const newCommitSha = newCommitData.sha;

      const updateRefRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ sha: newCommitSha }),
        },
      );
      if (!updateRefRes.ok) throw new Error("Failed to update branch reference.");

      toast.dismiss();
      toast.success("Project pushed successfully to the new repository!");
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || "Failed to create repo or push.");
    }
  };

  const handleCreatePR = async () => {
    if (!githubToken || !repoUrl) {
      toast.error("GitHub credentials or repo configuration missing.");
      return;
    }
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      toast.error("Invalid GitHub URL format.");
      return;
    }
    const owner = repoMatch[1];
    const repo = repoMatch[2].replace(/\.git$/, "");
    const loadingToast = toast.loading("Creating Pull Request...");
    try {
      const headers = {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };
      const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: prTitle,
          body: prBody,
          head: prSourceBranch,
          base: prTargetBranch,
        }),
      });
      if (!prRes.ok) {
        const err = await prRes.json();
        throw new Error(err.message || "Failed to create PR.");
      }
      const prData = await prRes.json();
      toast.dismiss(loadingToast);
      toast.success(`PR Created: #${prData.number}`);
      fetchPRs();
    } catch (e: any) {
      toast.dismiss(loadingToast);
      toast.error(e.message || "PR creation failed.");
    }
  };

  const fetchPRs = async () => {
    if (!githubToken || !repoUrl) return;
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) return;
    const owner = repoMatch[1];
    const repo = repoMatch[2].replace(/\.git$/, "");
    try {
      const headers = {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      };
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPrList(data);
      }
    } catch (e) {}
  };

  React.useEffect(() => {
    if (activeTab === "Integrations" && githubToken && repoUrl) {
      fetchPRs();
    }
  }, [activeTab, githubToken, repoUrl]);

  const handleGithubPush = async () => {
    if (!githubToken || !repoUrl || !commitMessage) {
      toast.error("Please fill all required GitHub fields.");
      return;
    }

    const files = useProjectStore.getState().currentContent?.files;
    if (!files || Object.keys(files).length === 0) {
      toast.error("No files available to push. Build a project first.");
      return;
    }

    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      toast.error("Invalid GitHub URL format.");
      return;
    }
    const owner = repoMatch[1];
    const repo = repoMatch[2].replace(/\.git$/, "");

    const loadingToast = toast.loading("Pushing to GitHub...");

    try {
      const headers = {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      };

      // 1. Get branch reference
      const refRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
        { headers },
      );
      if (!refRes.ok)
        throw new Error("Branch not found or token lacks access.");
      const refData = await refRes.json();
      const latestCommitSha = refData.object.sha;

      // 2. Get latest commit tree
      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
        { headers },
      );
      const commitData = await commitRes.json();
      const baseTreeSha = commitData.tree.sha;

      // 3. Create new tree
      const tree = Object.entries(files).map(([path, content]) => ({
        path: path.startsWith("/") ? path.slice(1) : path,
        mode: "100644",
        type: "blob",
        content,
      }));

      const newTreeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ base_tree: baseTreeSha, tree }),
        },
      );
      if (!newTreeRes.ok) throw new Error("Failed to create Git tree.");
      const newTreeData = await newTreeRes.json();
      const newTreeSha = newTreeData.sha;

      // 4. Create new commit
      const newCommitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/commits`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: commitMessage,
            tree: newTreeSha,
            parents: [latestCommitSha],
          }),
        },
      );
      if (!newCommitRes.ok) throw new Error("Failed to create commit.");
      const newCommitData = await newCommitRes.json();
      const newCommitSha = newCommitData.sha;

      // 5. Update branch ref
      const updateRefRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ sha: newCommitSha }),
        },
      );
      if (!updateRefRes.ok)
        throw new Error("Failed to update branch reference.");

      toast.dismiss(loadingToast);
      toast.success("Successfully committed and pushed to GitHub!");
      setCommitMessage("");
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "An error occurred while pushing.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col rounded-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-300">
        {/* Tabs Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${activeTab === tab ? "bg-white text-stone-900 border-stone-200 shadow-sm" : "text-stone-600 hover:bg-stone-50 border-transparent hover:border-stone-200"}`}
              >
                {activeTab === tab && (
                  <span className="mr-1.5 inline-block w-1.5 h-1.5 bg-stone-800 rounded-full"></span>
                )}
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pl-2">
            <button className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
          {activeTab === "Models" && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-xl font-bold text-stone-800 mb-1">
                  Model Marketplace &amp; Routing
                </h2>
                <p className="text-xs text-stone-500">
                  Select and configure the AI model that powers your editor session.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: "nvidia/nemotron-3-super-120b-a12b:free",
                    name: "Nemotron 3 Super 120B",
                    provider: "OpenRouter",
                    desc: "Free OpenRouter high quality reasoning",
                    badge: "Free Engine",
                    badgeColor: "bg-emerald-50 text-emerald-750 border-emerald-100",
                    speed: "Fast (90 t/s)",
                    cost: "$0.00 / Free"
                  },
                  {
                    id: "openrouter/owl-alpha",
                    name: "Owl Alpha",
                    provider: "OpenRouter",
                    desc: "OpenRouter's state-of-the-art owl reasoning model",
                    badge: "Owl Alpha",
                    badgeColor: "bg-emerald-50 text-emerald-750 border-emerald-100",
                    speed: "Moderate (45 t/s)",
                    cost: "$0.00 / Free"
                  },
                  {
                    id: "gemini-2.5-flash",
                    name: "Gemini 2.5 Flash",
                    provider: "Google AI",
                    desc: "Fast reasoning, high quota (Recommended)",
                    badge: "Free / Recommended",
                    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    speed: "Fast (120+ t/s)",
                    cost: "$0.075 / 1M input"
                  },
                  {
                    id: "gemini-2.5-pro",
                    name: "Gemini 2.5 Pro",
                    provider: "Google AI",
                    desc: "Best quality, deep multi-step reasoning",
                    badge: "Pro Engine",
                    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
                    speed: "Balanced (50 t/s)",
                    cost: "$1.25 / 1M input"
                  },
                  {
                    id: "qwen/qwen3-coder-480b-a35b-instruct",
                    name: "Qwen 3 Coder 480B",
                    provider: "NVIDIA NIM",
                    desc: "State-of-the-art coding and complex planning",
                    badge: "NVIDIA NIM",
                    badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
                    speed: "Moderate (30 t/s)",
                    cost: "$0.30 / 1M input"
                  },
                  {
                    id: "z-ai/glm-5.1",
                    name: "GLM 5.1",
                    provider: "NVIDIA NIM",
                    desc: "State-of-the-art multilingual reasoning",
                    badge: "NVIDIA NIM",
                    badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
                    speed: "Fast (70 t/s)",
                    cost: "$0.00 / NVIDIA"
                  },
                  {
                    id: "moonshotai/kimi-k2.6",
                    name: "Kimi K2.6",
                    provider: "NVIDIA NIM",
                    desc: "Advanced long-context generation model",
                    badge: "NVIDIA NIM",
                    badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
                    speed: "Balanced (50 t/s)",
                    cost: "$0.00 / NVIDIA"
                  },
                  {
                    id: "stepfun-ai/step-3.7-flash",
                    name: "Step 3.7 Flash",
                    provider: "NVIDIA NIM",
                    desc: "High speed reasoning and structured files",
                    badge: "NVIDIA NIM",
                    badgeColor: "bg-purple-50 text-purple-700 border-purple-100",
                    speed: "Ultra Fast (120+ t/s)",
                    cost: "$0.00 / NVIDIA"
                  }
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative group flex flex-col justify-between h-48 hover:shadow-md ${
                      selectedModel === m.id
                        ? "bg-stone-900 border-stone-900 text-white shadow-lg"
                        : "bg-white border-stone-200 text-stone-800 hover:border-stone-400"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-wider block ${selectedModel === m.id ? "text-stone-400" : "text-stone-500"}`}>
                            {m.provider}
                          </span>
                          <h4 className="text-sm font-black tracking-tight">{m.name}</h4>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${selectedModel === m.id ? "bg-white/10 text-white border-white/20" : m.badgeColor}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed line-clamp-2 ${selectedModel === m.id ? "text-stone-300" : "text-stone-500"}`}>
                        {m.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3 border-dashed border-stone-700 mt-2 text-[10px] font-semibold text-stone-400">
                      <span>Speed: {m.speed}</span>
                      <span>Cost: {m.cost}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px w-full bg-stone-100"></div>

              {/* Advanced controls */}
              <div className="grid grid-cols-2 gap-6 bg-stone-50/50 p-5 rounded-2xl border border-stone-200/60">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest">
                    Temperature: {temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-600 uppercase tracking-widest">
                    Top P: {topP}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "Studio" && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-xl font-bold text-stone-800 mb-1 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-stone-700" />
                  Studio Configuration
                </h2>
                <p className="text-xs text-stone-500">
                  Tune system prompt, agent reasoning constraints, and tool permissions.
                </p>
              </div>

              {/* System Prompt Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-stone-500" />
                    System Instructions
                  </label>
                  <button
                    onClick={handleResetPrompt}
                    className="flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-stone-800 transition-colors bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg border border-stone-200"
                    title="Reset to default"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Default
                  </button>
                </div>

                <div className="relative border border-stone-200 rounded-2xl overflow-hidden bg-stone-50">
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter system level instructions..."
                    className="w-full bg-transparent px-4 py-3 text-xs text-stone-800 outline-none font-mono resize-none leading-relaxed transition-all h-36 focus:bg-white"
                  />
                  <div className="border-t border-stone-150 px-4 py-2 flex items-center justify-between bg-white text-[10px] text-stone-450 select-none">
                    <span>{systemPrompt.length.toLocaleString()} characters</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePresetPrompt("coder")}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors font-bold uppercase text-[9px]"
                      >
                        Coder Preset
                      </button>
                      <button
                        onClick={() => handlePresetPrompt("ux")}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors font-bold uppercase text-[9px]"
                      >
                        UX Preset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: LLM Settings, Keys & Memory */}
                <div className="space-y-6">
                  {/* Temperature Slider & Presets */}
                  <div className="space-y-3 bg-stone-50/50 p-5 rounded-2xl border border-stone-200">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-stone-500" />
                      Temperature presets
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-stone-100 p-0.5 rounded-lg text-[10px] font-bold text-stone-600">
                      {[
                        { label: "Precise", value: 0.2 },
                        { label: "Balanced", value: 0.7 },
                        { label: "Creative", value: 1.2 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => setTemperature(preset.value)}
                          className={`py-1 rounded-md transition-all ${
                            Math.abs(temperature - preset.value) < 0.1
                              ? "bg-white text-stone-900 shadow-sm"
                              : "hover:text-stone-800"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                      <span>Slider Value</span>
                      <span className="font-mono text-stone-800">{temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-850"
                    />
                  </div>

                  {/* Custom API Key */}
                  <div className="space-y-3 bg-stone-50/50 p-5 rounded-2xl border border-stone-200">
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-stone-500" />
                      Encapsulated API Key
                    </label>
                    <div className="relative flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2.5 shadow-sm">
                      <input
                        type={showKey ? "text" : "password"}
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Enter OpenRouter / OpenAI Key..."
                        className="w-full bg-transparent outline-none text-xs text-stone-800 placeholder:text-stone-300 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Provider & Model Dropdowns */}
                    <div className="space-y-2.5 pt-2.5 border-t border-stone-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">API Provider</span>
                        <select
                          value={selectedProviderKey}
                          onChange={(e) => {
                            const newProv = e.target.value;
                            setSelectedProviderKey(newProv);
                            const firstModel = PROVIDER_MODELS[newProv]?.[0]?.id;
                            if (firstModel) setSelectedModel(firstModel);
                          }}
                          className="bg-white border border-stone-200 rounded-lg px-2 py-1 outline-none text-[11px] font-bold cursor-pointer text-stone-800"
                        >
                          {Object.keys(PROVIDER_MODELS).map((prov) => (
                            <option key={prov} value={prov}>{prov}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Provider Models</span>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="bg-white border border-stone-200 rounded-lg px-2 py-1 outline-none text-[11px] font-bold cursor-pointer text-stone-800 max-w-[150px] truncate"
                        >
                          {PROVIDER_MODELS[selectedProviderKey]?.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <p className="text-[10px] text-stone-450 leading-relaxed font-semibold">
                      Custom keys remain encrypted inside your client browser space.
                    </p>
                  </div>

                  {/* Memory Preferences */}
                  <div className="space-y-3 bg-stone-50/50 p-5 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-stone-500" />
                        Memory preferences
                      </label>
                      <button
                        onClick={handleClearHistory}
                        className="p-1 hover:bg-stone-100 rounded text-stone-450 hover:text-red-650 transition-colors"
                        title="Clear build snapshots"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-stone-450 block mb-1 font-semibold">Design UI Style</span>
                        <select
                          value={preferences.designStyle}
                          onChange={(e: any) => setPreference({ designStyle: e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 outline-none text-stone-805 font-bold cursor-pointer"
                        >
                          <option value="minimal">Minimal</option>
                          <option value="glassmorphism">Glassmorphism</option>
                          <option value="brutalism">Brutalism</option>
                          <option value="corporate">Corporate</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-stone-450 block mb-1 font-semibold">Stack Preference</span>
                        <select
                          value={preferences.techStack}
                          onChange={(e: any) => setPreference({ techStack: e.target.value })}
                          className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1.5 outline-none text-stone-805 font-bold cursor-pointer"
                        >
                          <option value="React + Vite + Tailwind">React/Tailwind</option>
                          <option value="HTML + Vanilla CSS">Vanilla JS</option>
                          <option value="Next.js + Tailwind">Next.js</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Tool Calling toggles */}
                <div className="space-y-4 bg-stone-50/50 p-5 rounded-2xl border border-stone-200 h-full flex flex-col justify-between">
                  <div>
                    <label className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1.5 mb-4">
                      <FileCode className="w-3.5 h-3.5 text-stone-500" />
                      AI Tool Call Authorization
                    </label>
                    <div className="space-y-3.5 text-xs text-stone-750">
                      {[
                        { id: "read_file", label: "Read File", desc: "Allow AI to analyze local workspace files", icon: FileCode },
                        { id: "write_file", label: "Write File", desc: "Allow AI to create and patch files", icon: Sliders },
                        { id: "deploy", label: "Vercel Deploy", desc: "Automate live endpoints generation", icon: Globe },
                        { id: "preview", label: "Sandbox Live Preview", desc: "Boot WebContainer sandbox live updates", icon: Sparkles },
                        { id: "search", label: "Firecrawl Web Scraper", desc: "Query exterior documentation", icon: Search },
                      ].map((t) => {
                        const ToolIcon = t.icon;
                        const enabled = enabledTools.includes(t.id);
                        return (
                          <div key={t.id} className="flex items-start justify-between gap-3 pt-3 first:pt-0 border-t border-stone-200/60 first:border-0">
                            <div className="flex items-start gap-2">
                              <ToolIcon className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-bold text-stone-800 tracking-tight leading-none">{t.label}</h4>
                                <p className="text-[10px] text-stone-450 mt-1 leading-normal">{t.desc}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleTool(t.id)}
                              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors shrink-0 outline-none ${
                                enabled ? "bg-stone-900" : "bg-stone-200"
                              }`}
                            >
                              <div
                                className={`bg-white w-3.5 h-3.5 rounded-full shadow transition-transform ${
                                  enabled ? "translate-x-3.5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Integrations" && (
            <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
                  <Github className="w-6 h-6 text-stone-800" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-800">
                    GitHub Integrations
                  </h2>
                  <p className="text-stone-500 text-sm">
                    Manage repositories, commit updates, and generate pull requests.
                  </p>
                </div>
              </div>

              {/* GitHub Credentials */}
              <div className="space-y-6 bg-stone-50/50 p-6 rounded-2xl border border-stone-200">
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">GitHub Settings</h3>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600">
                    GitHub Access Token
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100 transition-all"
                  />
                  <p className="text-[10px] text-stone-500">
                    Requires 'repo' scope. Stored locally in your browser.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600">
                    Repository URL
                  </label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repo-name"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100 transition-all"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label className="block text-xs font-semibold text-stone-600">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="main"
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100 transition-all"
                    />
                  </div>
                  <div className="space-y-2 flex-[2]">
                    <label className="block text-xs font-semibold text-stone-600">
                      Commit Message
                    </label>
                    <input
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder="Update components..."
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100 transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGithubPush}
                  className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-medium hover:bg-black transition-colors shadow-lg shadow-stone-900/10 mt-4 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Github className="w-4 h-4" /> Push Commit
                </button>
              </div>

              {/* Create Repository */}
              <div className="space-y-4 bg-stone-50/50 p-6 rounded-2xl border border-stone-200">
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">Create New Repository</h3>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600">Repository Name</label>
                  <input
                    type="text"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    placeholder="my-cool-ai-app"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                  <input
                    type="checkbox"
                    checked={isPrivateRepo}
                    onChange={(e) => setIsPrivateRepo(e.target.checked)}
                    className="rounded accent-stone-900"
                  />
                  <span>Private repository</span>
                </div>
                <button
                  onClick={handleCreateRepo}
                  className="w-full py-3 bg-white border border-stone-300 text-stone-850 hover:bg-stone-50 rounded-xl font-semibold transition-colors mt-2"
                >
                  Create &amp; Push Project
                </button>
              </div>

              {/* Pull Request generator */}
              <div className="space-y-4 bg-stone-50/50 p-6 rounded-2xl border border-stone-200">
                <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">Generate Pull Request (PR)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-600">Source (Compare)</label>
                    <input
                      type="text"
                      value={prSourceBranch}
                      onChange={(e) => setPrSourceBranch(e.target.value)}
                      placeholder="feature-branch"
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-600">Target (Base)</label>
                    <input
                      type="text"
                      value={prTargetBranch}
                      onChange={(e) => setPrTargetBranch(e.target.value)}
                      placeholder="main"
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600">PR Title</label>
                  <input
                    type="text"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    placeholder="Implement new styling"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-xs outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-stone-600">PR Description</label>
                  <textarea
                    value={prBody}
                    onChange={(e) => setPrBody(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2 text-xs outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleCreatePR}
                  className="w-full py-3 bg-indigo-650 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-colors mt-2"
                >
                  Create Pull Request
                </button>
              </div>

              {/* PR List */}
              {prList.length > 0 && (
                <div className="space-y-4 bg-stone-50/50 p-6 rounded-2xl border border-stone-200">
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Active Pull Requests</h3>
                  <div className="space-y-2 divide-y divide-stone-200/60 max-h-48 overflow-y-auto no-scrollbar">
                    {prList.map((pr: any) => (
                      <div key={pr.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-stone-800">#{pr.number} {pr.title}</span>
                          <span className="text-[10px] text-stone-400 block">
                            State: <strong className={pr.state === "open" ? "text-emerald-600" : "text-stone-500"}>{pr.state}</strong> | Creator: {pr.user.login}
                          </span>
                        </div>
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-stone-100 border border-stone-200 rounded-lg hover:bg-stone-250 hover:text-black font-semibold text-stone-600"
                        >
                          View PR
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Share Tab */}
          {activeTab === "Share" && (
            <div className="max-w-xl mx-auto h-full flex flex-col pt-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                Share Project
              </h2>
              <p className="text-xs text-stone-500 mb-6">
                Generate a public share link. Anyone with this link can view the live preview, read the chat history, and fork/remix the project.
              </p>

              {!currentUser ? (
                <div className="flex flex-col items-center justify-center p-8 bg-[#f9f9fb] rounded-2xl border border-stone-200 text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-800">Authentication Required</h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm">
                      Please sign in to save and share your creations. Your shared projects will be safely stored under your account.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await signInWithGoogle();
                        toast.success("Signed in successfully!");
                      } catch (err) {
                        console.error(err);
                        toast.error("Failed to sign in.");
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#111] hover:bg-[#333] text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    <User className="w-4 h-4" />
                    Sign In with Google
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Share Configuration */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
                    {/* Permission Select */}
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                        Permission Level
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPermission("read")}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                            permission === "read"
                              ? "border-indigo-600 bg-indigo-50/40 text-indigo-950 font-medium"
                              : "border-stone-200 hover:border-stone-300 text-stone-600"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            permission === "read" ? "border-indigo-600" : "border-stone-300"
                          }`}>
                            {permission === "read" && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                          </div>
                          <div>
                            <div className="text-xs font-semibold">Read-only</div>
                            <div className="text-[10px] opacity-75">View & remix only</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermission("write")}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                            permission === "write"
                              ? "border-indigo-600 bg-indigo-50/40 text-indigo-950 font-medium"
                              : "border-stone-200 hover:border-stone-300 text-stone-600"
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            permission === "write" ? "border-indigo-600" : "border-stone-300"
                          }`}>
                            {permission === "write" && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                          </div>
                          <div>
                            <div className="text-xs font-semibold">Collaborator</div>
                            <div className="text-[10px] opacity-75">Allow direct edits</div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Bot Restrictions Input */}
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                        Bot Restrictions (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. database setup, layout styles, API endpoints"
                        value={botRestrictions}
                        onChange={(e) => setBotRestrictions(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-indigo-500 placeholder-stone-400"
                      />
                      <span className="text-[10px] text-stone-400 block mt-1">
                        Topics or components the AI companion will be restricted from modifying.
                      </span>
                    </div>
                  </div>

                  {/* Generate / Share output */}
                  {shareUrl ? (
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-3">
                      <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                        Your Share Link
                      </div>
                      <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-2.5">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="flex-1 text-xs text-stone-600 bg-transparent outline-none truncate"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            setCopiedShareLink(true);
                            toast.success("Link copied to clipboard!");
                            setTimeout(() => setCopiedShareLink(false), 2000);
                          }}
                          className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-800 transition-colors"
                          title="Copy Link"
                        >
                          {copiedShareLink ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Link
                        </a>
                        <button
                          onClick={() => setShareUrl("")}
                          className="px-4 py-2 bg-white hover:bg-stone-150 text-stone-600 border border-stone-200 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Generate New
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-600/10"
                    >
                      {isSharing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating Share Link...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          Generate Share Link
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Publish & Versions Tab */}
          {["Publish", "Versions"].includes(activeTab) && (
            <div className="max-w-xl mx-auto h-full flex flex-col pt-8 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-stone-800 mb-6">
                {activeTab}
              </h2>
              <p className="text-stone-500 mb-8">
                Quick actions for {activeTab.toLowerCase()} and deployment.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    onClose();
                    onDeploy();
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-2xl border border-stone-200 transition-all active:scale-[0.98]"
                >
                  <Rocket className="w-6 h-6" />
                  <span className="font-medium">Deploy Live</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onDownloadZip();
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-6 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-2xl border border-stone-200 transition-all active:scale-[0.98]"
                >
                  <Download className="w-6 h-6" />
                  <span className="font-medium">Export ZIP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
