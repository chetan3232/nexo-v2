import React, { useState } from "react";
import {
  X,
  ChevronRight,
  Settings,
  Download,
  MessageCircle,
  Rocket,
} from "lucide-react";
import { GithubIcon as Github } from "./GithubIcon";
import { useAgentStore } from "../../stores/agentStore";
import { useProjectStore } from "../../stores/projectStore";
import toast from "react-hot-toast";

interface SettingsModalProps {
  onClose: () => void;
  onDeploy: () => void;
  onLoadHistory: () => void;
  onDownloadZip: () => void;
  temperature: number;
  setTemperature: (t: number) => void;
  topP: number;
  setTopP: (t: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onDeploy,
  onLoadHistory,
  onDownloadZip,
  temperature,
  setTemperature,
  topP,
  setTopP,
}) => {
  const [activeTab, setActiveTab] = useState("Chat");
  const tabs = ["Chat", "Share", "Publish", "Versions", "Integrations"];

  const [githubToken, setGithubToken] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [branchName, setBranchName] = useState("main");

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
          {activeTab === "Chat" && (
            <div className="max-w-xl mx-auto space-y-10">
              <h2 className="text-[22px] font-bold text-stone-800">
                Chat settings
              </h2>

              <div className="space-y-3 relative">
                <label className="block text-[15px] text-stone-500">
                  Select model for chat
                </label>
                <div className="relative">
                  <select
                    value={useAgentStore.getState().selectedModel}
                    onChange={(e) =>
                      useAgentStore.getState().setSelectedModel(e.target.value)
                    }
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-stone-800 outline-none focus:border-stone-300 appearance-none shadow-sm cursor-pointer"
                  >
                    <option value="google/gemini-2.5-flash">
                      Default (Gemini 3 Flash Preview)
                    </option>
                    <option value="google/gemini-2.5-pro">
                      Gemini 2.5 Pro
                    </option>
                    <option value="stepfun-ai/step-3.5-flash">
                      Step 3.5 Flash (NVIDIA)
                    </option>
                    <option value="nvidia/minimax-m2.7">
                      MiniMax M2.7 (NVIDIA)
                    </option>
                    <option value="qwen/qwen-2.5-72b-instruct:free">
                      Qwen 2.5 72B (Free)
                    </option>
                    <option value="groq/llama-3.3-70b-versatile">
                      Llama 3.3 70B (Groq)
                    </option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-stone-100"></div>

              <button className="w-full flex items-center justify-between p-5 border border-stone-200 rounded-2xl hover:border-stone-300 transition-all text-left bg-white group">
                <div className="pr-4">
                  <h4 className="text-[17px] text-stone-800 mb-1.5">
                    System instructions
                  </h4>
                  <p className="text-[15px] text-stone-500 leading-relaxed">
                    Add custom instructions for your project to control style,
                    models used, add specific knowledge, and more.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-600 shrink-0" />
              </button>

              <div className="h-px w-full bg-stone-100"></div>

              <div className="space-y-3 relative">
                <label className="block text-[15px] text-stone-500">
                  Microphone source
                </label>
                <div className="relative">
                  <select className="w-full bg-white border border-stone-100 rounded-xl px-4 py-3.5 text-stone-700 outline-none focus:border-stone-300 appearance-none shadow-sm cursor-pointer">
                    <option>Default System Microphone</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
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
                    GitHub Integration
                  </h2>
                  <p className="text-stone-500 text-sm">
                    Commit and push code directly to a repository.
                  </p>
                </div>
              </div>

              <div className="space-y-6 bg-stone-50/50 p-6 rounded-2xl border border-stone-200">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">
                    GitHub Access Token
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-stone-400 focus:ring-4 focus:ring-stone-100 transition-all"
                  />
                  <p className="text-[11px] text-stone-500">
                    Requires 'repo' scope. Your token is never stored on our
                    servers.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-stone-700">
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
                    <label className="block text-sm font-medium text-stone-700">
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
                    <label className="block text-sm font-medium text-stone-700">
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
                  <Github className="w-4 h-4" /> Push to GitHub
                </button>
              </div>
            </div>
          )}

          {/* Share & Publish tab stubs with old quick actions */}
          {["Share", "Publish", "Versions"].includes(activeTab) && (
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
