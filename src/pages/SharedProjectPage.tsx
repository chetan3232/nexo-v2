import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, GitFork, Lock, Pencil, Eye, ArrowLeft, ExternalLink, Copy, Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  getSharedProject, SharedProject, remixProject, auth,
} from "../services/firebase";
import { useChatStore } from "../stores/chatStore";
import { useProjectStore } from "../stores/projectStore";

const SharedProjectPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [remixing, setRemixing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "chat">("preview");

  useEffect(() => {
    if (!shareId) return;
    getSharedProject(shareId).then((p) => {
      setProject(p);
      setLoading(false);
    });
  }, [shareId]);

  const handleRemix = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Sign in to remix this project.");
      return;
    }
    if (!project) return;
    setRemixing(true);
    try {
      const newChatId = await remixProject(
        user.uid,
        project,
        user.displayName || user.email || "Anonymous",
      );
      // Load the remixed project into the workspace
      useChatStore.getState().setCurrentChatId(newChatId);
      useChatStore.getState().setMessages(project.messages || []);
      useProjectStore.getState().setCurrentContent(project.content);
      toast.success("Project remixed! Opening workspace…");
      setTimeout(() => navigate(`/nexostudio/${newChatId}`), 800);
    } catch {
      toast.error("Failed to remix. Try again.");
    } finally {
      setRemixing(false);
    }
  };

  const handleOpenInWorkspace = () => {
    if (!project) return;
    if (project.permission !== "write") {
      toast.error("This project is read-only. Remix it to make changes.");
      return;
    }
    const user = auth.currentUser;
    if (!user) { toast.error("Sign in to edit."); return; }
    useChatStore.getState().setCurrentChatId(project.chatId);
    useChatStore.getState().setMessages(project.messages || []);
    useProjectStore.getState().setCurrentContent(project.content);
    navigate(`/nexostudio/${project.chatId}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f7f7f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#e8e8e8] border-t-[#0ea5e9] rounded-full animate-spin" />
          <span className="text-xs text-[#888] font-medium">Loading shared project…</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f7f7f7]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f3f3f3] border border-[#e8e8e8] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-[#aaa]" />
          </div>
          <h2 className="text-sm font-semibold text-[#111]">Project not found</h2>
          <p className="text-xs text-[#888]">This link may have expired or been removed.</p>
          <button onClick={() => navigate("/")} className="text-xs text-[#0ea5e9] hover:underline flex items-center gap-1 mx-auto">
            <ArrowLeft className="w-3 h-3" /> Back to home
          </button>
        </div>
      </div>
    );
  }

  // Build preview HTML from content files
  const files = project.content?.files || {};
  const previewHtml = files["/index.html"] || files["index.html"] || Object.values(files)[0] || "";

  return (
    <div className="h-screen w-full flex flex-col bg-[#f7f7f7] font-sans overflow-hidden">
      <Toaster position="bottom-right" toastOptions={{ style: { background: "#111", color: "#fff", fontSize: "12px", borderRadius: "12px" } }} />

      {/* Header */}
      <header className="h-[52px] bg-white border-b border-[#e8e8e8] flex items-center justify-between px-5 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-[#888] hover:text-[#111] text-xs font-medium transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Home
          </button>
          <div className="h-4 w-px bg-[#e8e8e8]" />
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#0ea5e9]" />
            <span className="text-sm font-semibold text-[#111] truncate max-w-[200px]">{project.title}</span>
          </div>
          {/* Permission badge */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            project.permission === "write"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-[#f3f3f3] text-[#888] border-[#e8e8e8]"
          }`}>
            {project.permission === "write" ? <Pencil className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            {project.permission === "write" ? "Editable" : "Read-only"}
          </div>
          {project.ownerName && (
            <span className="text-[10px] text-[#aaa]">by {project.ownerName}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] border border-[#e8e8e8] transition-all"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? "Copied!" : "Copy Link"}
          </button>

          {project.permission === "write" && (
            <button
              onClick={handleOpenInWorkspace}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#555] hover:text-[#111] hover:bg-[#f3f3f3] border border-[#e8e8e8] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in Workspace
            </button>
          )}

          <button
            onClick={handleRemix}
            disabled={remixing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#111] hover:bg-[#333] transition-all disabled:opacity-50"
          >
            <GitFork className="w-3.5 h-3.5" />
            {remixing ? "Forking…" : "Remix"}
          </button>
        </div>
      </header>

      {/* Bot restrictions notice */}
      {project.botRestrictions && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center gap-2 text-xs text-amber-800 shrink-0">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span><strong>Bot restrictions:</strong> The AI cannot modify — {project.botRestrictions}</span>
        </div>
      )}

      {/* Main: Preview + Chat side by side */}
      <main className="flex-1 flex overflow-hidden min-h-0 p-3 gap-3">
        {/* Left: Preview */}
        <div className="flex-1 bg-white rounded-xl border border-[#e8e8e8] shadow-sm overflow-hidden flex flex-col">
          <div className="h-10 border-b border-[#e8e8e8] flex items-center px-3 gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-[10px] text-[#aaa] font-medium ml-2">Live Preview</span>
          </div>
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className="flex-1 w-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin"
              title="Shared Project Preview"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="space-y-2">
                <Sparkles className="w-8 h-8 text-[#ddd] mx-auto" />
                <p className="text-xs text-[#bbb]">No preview available</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat history */}
        <div className="w-80 shrink-0 bg-white rounded-xl border border-[#e8e8e8] shadow-sm overflow-hidden flex flex-col">
          <div className="h-10 border-b border-[#e8e8e8] flex items-center px-3 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#0ea5e9] mr-2" />
            <span className="text-xs font-semibold text-[#111]">Chat History</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {(project.messages || []).length === 0 ? (
              <p className="text-xs text-[#bbb] text-center py-8">No messages yet.</p>
            ) : (
              project.messages.map((msg: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#111] text-white rounded-br-sm"
                      : "bg-[#f3f3f3] border border-[#e8e8e8] text-[#111] rounded-bl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* CTA at bottom */}
          <div className="border-t border-[#e8e8e8] p-3">
            <button
              onClick={handleRemix}
              disabled={remixing}
              className="w-full py-2 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
            >
              <GitFork className="w-3.5 h-3.5" />
              {remixing ? "Forking…" : "Remix this project"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedProjectPage;
