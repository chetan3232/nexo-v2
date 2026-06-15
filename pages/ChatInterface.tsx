import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Download, Settings, Github, RefreshCw, ChevronRight, ArrowLeft, Play, LayoutGrid } from 'lucide-react';
import JSZip from 'jszip';

// Zustand stores
import { useProjectStore } from '../stores/projectStore';
import { useChatStore } from '../stores/chatStore';
import { useAgentStore } from '../stores/agentStore';
import { useRuntimeStore } from '../stores/runtimeStore';
import { useTeamStore } from '../stores/teamStore';
import { useMemoryStore } from '../stores/memoryStore';

// Overlays components
import { InitialOverlay } from '../components/chat/InitialOverlay';
import { DesignExploration } from '../components/chat/DesignExploration';
import { AgentWorkflowOverlay } from '../components/chat/AgentWorkflowOverlay';
import { QualityReviewOverlay } from '../components/chat/QualityReviewOverlay';
import { PreviewTransferOverlay } from '../components/chat/PreviewTransferOverlay';
import { SettingsModal } from '../components/ui/SettingsModal';

// Workspace panels
import { WorkspaceSidebar } from '../components/sidebar/WorkspaceSidebar';
import { EditorPanel } from '../components/editor/EditorPanel';
import { PreviewPanel } from '../components/preview/PreviewPanel';
import { ChatPanel } from '../components/chat/ChatPanel';
import { ObservePanel } from '../components/sidebar/ObservePanel';
import { ProductionScanner } from '../components/sidebar/ProductionScanner';

// Services and helpers
import { Orchestrator } from '../agents/Orchestrator';
import { generateResponse, DEFAULT_SYSTEM_INSTRUCTION } from '../services/geminiService';
import { generateOpenRouterResponse } from '../services/openRouterService';
import { ContextManager } from '../utils/ContextManager';
import { BrainService } from '../services/brainService';
import { CompanionState } from '../types';

export const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const orchestratorRef = useRef(new Orchestrator());

  // Zustand Store States
  const files = useProjectStore((state) => state.files);
  const buildPhase = useProjectStore((state) => state.buildPhase);
  const setBuildPhase = useProjectStore((state) => state.setBuildPhase);
  const concepts = useProjectStore((state) => state.concepts);
  const blueprintTasks = useProjectStore((state) => state.blueprintTasks);
  const resetProject = useProjectStore((state) => state.resetProject);

  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const clearMessages = useChatStore((state) => state.clearMessages);
  const companionState = useChatStore((state) => state.companionState);

  const selectedModel = useAgentStore((state) => state.selectedModel);
  const setSelectedModel = useAgentStore((state) => state.setSelectedModel);

  const terminalLogs = useRuntimeStore((state) => state.logs);
  const addLog = useRuntimeStore((state) => state.addLog);
  const clearLogs = useRuntimeStore((state) => state.clearLogs);

  const preferences = useMemoryStore((state) => state.preferences);

  // Component local states
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'preview' | 'team' | 'observe' | 'scanner'>('code');
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Load Brain settings on mount
  useEffect(() => {
    const initBrain = async () => {
      await BrainService.getInstance().loadBrain();
    };
    initBrain();
  }, []);

  // Set default model on load
  useEffect(() => {
    if (!selectedModel) {
      setSelectedModel('gemini-3-flash-preview');
    }
  }, [selectedModel, setSelectedModel]);

  // Phase 1: Triggers initial build flow
  const handleStartWorkflow = async (prompt: string) => {
    setCurrentPrompt(prompt);
    clearLogs();
    clearMessages();
    
    // Add user message
    useChatStore.getState().addMessage({
      role: 'user',
      text: prompt,
      timestamp: Date.now()
    });

    setBuildPhase(1);
    addLog("⚡ [Strategic] Starting Intent Extraction and Scaffolding Analyzer...");
    
    try {
      await orchestratorRef.current.runIntentExtraction(prompt);
    } catch (e: any) {
      console.error(e);
      addLog(`❌ [Strategic Error] Intent analysis failed: ${e.message}`);
      setBuildPhase(0);
    }
  };

  // Phase 4: Confirms selected concept design variables and generates checklist blueprint
  const handleConfirmDesign = async () => {
    setBuildPhase(4);
    addLog("⚡ [Strategic] Selected concept applied. Compiling custom blueprint Checklist...");
    
    try {
      const activeConcept = useProjectStore.getState().activeConcept || concepts[0];
      await orchestratorRef.current.generateBlueprint(currentPrompt, activeConcept);
    } catch (e: any) {
      console.error(e);
      addLog(`❌ [Strategic Error] Blueprint checklist failed: ${e.message}`);
      setBuildPhase(3);
    }
  };

  // Phase 7: Trigger Sequential multi-agent build process
  const handleStartCodeGeneration = async () => {
    setBuildPhase(7);
    addLog("⚡ [Implementation] Triggering collaborative parallel squads scaffold build...");
    
    try {
      await orchestratorRef.current.buildProject(currentPrompt, blueprintTasks);
    } catch (e: any) {
      console.error(e);
      addLog(`❌ [Build Error] Scaffold compilation failed: ${e.message}`);
      setBuildPhase(5);
    }
  };

  // Phase 11: Launch Sandbox build redirect
  const handleConfirmAudits = () => {
    setBuildPhase(11);
  };

  // Complete Phase 11 Sandbox boot
  const handleCompleteSandboxBoot = () => {
    setBuildPhase(12);
    addLog("🚀 [Sandbox] Hot compile complete. Side-by-side Workspace Studio view loaded.");
    setActiveTab('preview');
  };

  // Chat message submission inside running Workspace Studio (Phase 12)
  const handleSendWorkspaceMessage = async (text: string, fileAttachment?: { name: string; content: string }) => {
    const chatStore = useChatStore.getState();
    const projectStore = useProjectStore.getState();
    const agentStore = useAgentStore.getState();
    const runtimeStore = useRuntimeStore.getState();

    let fullPrompt = text;
    if (fileAttachment) {
      fullPrompt = `[Attached File: ${fileAttachment.name}]\nContent:\n${fileAttachment.content}\n\nUser Prompt: ${text}`;
    }

    chatStore.addMessage({ role: 'user', text: fullPrompt, timestamp: Date.now() });
    chatStore.setCompanionState(CompanionState.THINKING);
    runtimeStore.addLog(`User requested styling/code tweak: "${text}"`);

    try {
      // 1. Summarize History for context window limits
      const compressedHistory = ContextManager.summarizeHistory(chatStore.messages);

      // 2. Load latest user behavioral settings from brain
      const brainService = BrainService.getInstance();
      const brainFiles = await brainService.loadBrain();
      let behavior: any = {};
      try {
        behavior = JSON.parse(brainFiles['user-behavior.json'] || '{}');
      } catch (jsonErr) {}

      // 3. Inject constraints into system instructions
      const systemInstruction = brainService.injectContext(DEFAULT_SYSTEM_INSTRUCTION, behavior);

      const isGemini = agentStore.selectedModel.startsWith('gemini-');
      const response = isGemini
        ? await generateResponse(
            compressedHistory,
            fullPrompt,
            agentStore.selectedModel,
            (s) => chatStore.setCompanionState(s),
            systemInstruction
          )
        : await generateOpenRouterResponse(
            compressedHistory,
            fullPrompt,
            agentStore.selectedModel,
            (s) => chatStore.setCompanionState(s),
            systemInstruction
          );

      if (response.websiteContent) {
        // Merge code additions back into project files
        Object.entries(response.websiteContent.files).forEach(([name, code]) => {
          projectStore.updateFile(name, code);
        });
        runtimeStore.addLog("⚡ [Sandbox] Applying hot reload styles and component patches...");
      }

      chatStore.addMessage({
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        websiteContent: response.websiteContent,
        isError: response.isError
      });

      // 4. Trigger Post-Build preferences analysis
      if (response.websiteContent) {
        await brainService.postBuildAnalysis(text, projectStore.files);
      }
    } catch (err: any) {
      console.error(err);
      chatStore.addMessage({
        role: 'model',
        text: `Error: ${err.message}`,
        timestamp: Date.now(),
        isError: true
      });
    } finally {
      chatStore.setCompanionState(CompanionState.IDLE);
    }
  };

  // Re-run failed prompt
  const handleRetryWorkspaceMessage = async (index: number) => {
    const chatStore = useChatStore.getState();
    const messagesList = chatStore.messages;
    if (index > 0 && messagesList[index - 1].role === 'user') {
      const textToRetry = messagesList[index - 1].text;
      const cleanHistory = messagesList.slice(0, index - 1);
      chatStore.setMessages(cleanHistory);
      await handleSendWorkspaceMessage(textToRetry);
    }
  };

  // Zip and export virtual workspace files
  const downloadZip = async () => {
    const zip = new JSZip();

    // Prepare package.json with Clerk and Stripe
    let pkgJson = files['package.json'] || '{}';
    try {
      const parsed = JSON.parse(pkgJson);
      if (!parsed.dependencies) parsed.dependencies = {};
      parsed.dependencies['@clerk/clerk-react'] = '^5.22.0';
      parsed.dependencies['@stripe/stripe-js'] = '^5.6.0';
      pkgJson = JSON.stringify(parsed, null, 2);
    } catch (e) {
      pkgJson = JSON.stringify({
        name: "nexo-workspace-project",
        version: "1.0.0",
        dependencies: {
          "react": "^19.2.1",
          "react-dom": "^19.2.1",
          "@clerk/clerk-react": "^5.22.0",
          "@stripe/stripe-js": "^5.6.0"
        }
      }, null, 2);
    }

    // Clerk auth store stub
    const authCode = `import { create } from 'zustand';

interface AuthState {
  user: { email: string; name: string } | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (email) => set({ user: { email, name: email.split('@')[0] }, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
`;

    // Stripe elements checkout stub
    const stripeCode = `export const loadStripe = async (publishableKey: string) => {
  console.log('[Stripe] Loading Elements with Publishable Key:', publishableKey);
  return {
    redirectToCheckout: async (options: { sessionId: string }) => {
      console.log('[Stripe] Redirecting to Session:', options.sessionId);
      alert('Stripe Checkout Redirect: Session ' + options.sessionId);
      return { error: null };
    }
  };
};

export const createCheckoutSession = async (priceId: string) => {
  console.log('[Stripe API] Initiating checkout for price:', priceId);
  return { sessionId: 'sess_nexo_' + Date.now() };
};
`;

    // Dashboard MRR widget stub
    const dashboardCode = `import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-8 bg-stone-950 text-white min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-stone-800 pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">SaaS Operations Dashboard</h1>
            <p className="text-xs text-stone-500 font-mono mt-0.5">NEXO V2 GENERATED METRICS</p>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <h3 className="text-xs text-stone-500 font-bold uppercase tracking-wider font-mono">Monthly Recurring Revenue (MRR)</h3>
            <p className="text-3xl font-black text-indigo-400 mt-2">$24,850</p>
            <span className="text-[10px] text-green-400 font-mono font-bold mt-1 inline-block">↑ +14.2% from last month</span>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <h3 className="text-xs text-stone-500 font-bold uppercase tracking-wider font-mono">Active Subscriptions</h3>
            <p className="text-3xl font-black text-purple-400 mt-2">1,248</p>
            <span className="text-[10px] text-green-400 font-mono font-bold mt-1 inline-block">↑ +8.5% weekly user growth</span>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
            <h3 className="text-xs text-stone-500 font-bold uppercase tracking-wider font-mono">Churn Rate</h3>
            <p className="text-3xl font-black text-pink-400 mt-2">1.8%</p>
            <span className="text-[10px] text-green-400 font-mono font-bold mt-1 inline-block">↓ -0.4% from last quarter</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
`;

    // Add all existing files except original package.json
    Object.entries(files).forEach(([name, code]) => {
      if (name === 'package.json') {
        zip.file(name, pkgJson);
      } else {
        zip.file(name, code);
      }
    });

    // Write SaaS templates if not defined by the user
    if (!files['services/auth.ts']) zip.file('services/auth.ts', authCode);
    if (!files['services/stripe.ts']) zip.file('services/stripe.ts', stripeCode);
    if (!files['components/Dashboard.tsx']) zip.file('components/Dashboard.tsx', dashboardCode);
    if (!files['package.json']) zip.file('package.json', pkgJson);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexo_workspace_project.zip';
    a.click();
  };

  // One-Click Background GitHub export push
  const handleGithubPush = async () => {
    const runtimeStore = useRuntimeStore.getState();
    if (!preferences.githubToken || !preferences.repoUrl) {
      alert("GitHub settings are not configured. Please add repository details inside Settings modal.");
      setShowSettings(true);
      return;
    }

    runtimeStore.addLog("🐙 [GitHub] Deploying sandbox background push...");
    runtimeStore.addLog(`🐙 [GitHub] Accessing remote repo: ${preferences.repoUrl}...`);

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: preferences.githubToken,
          repo: preferences.repoUrl,
          branch: preferences.branchName || 'main',
          files
        })
      });

      if (!response.ok) throw new Error("API call failed");
      const data = await response.json();
      
      runtimeStore.addLog("🐙 [GitHub] Sandbox deployment push finished successfully.");
      runtimeStore.addLog(`🐙 [GitHub] Deployed URL: ${data.deployUrl}`);
      alert("Project exported to GitHub successfully!");
    } catch (e: any) {
      console.error(e);
      runtimeStore.addLog(`❌ [GitHub Error] Push failed: ${e.message}`);
      alert(`GitHub push failed: ${e.message}`);
    }
  };

  // Render Overlay screens based on active Build Phase (1-11)
  if (buildPhase === 0) {
    return <InitialOverlay onStart={handleStartWorkflow} />;
  }

  if (buildPhase >= 1 && buildPhase <= 3) {
    return <DesignExploration prompt={currentPrompt} onConfirm={handleConfirmDesign} />;
  }

  if (buildPhase >= 4 && buildPhase <= 9) {
    return <AgentWorkflowOverlay onStartCodeGeneration={handleStartCodeGeneration} />;
  }

  if (buildPhase === 10) {
    return <QualityReviewOverlay onConfirm={handleConfirmAudits} />;
  }

  if (buildPhase === 11) {
    return <PreviewTransferOverlay onComplete={handleCompleteSandboxBoot} />;
  }

  // Phase 12: Main Side-by-Side Workspace Layout
  return (
    <div className="h-screen w-screen bg-[#0d0d0f] flex flex-col overflow-hidden text-stone-200">
      
      {/* Navbar header */}
      <header className="h-12 bg-[#09090b] border-b border-stone-900 flex items-center justify-between px-4 shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetProject();
              setBuildPhase(0);
            }}
            className="p-1.5 hover:bg-white/5 rounded-lg text-stone-500 hover:text-white transition-colors"
            title="Reset Workspace"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="h-5 w-px bg-stone-800"></div>
          <div className="w-7 h-7 bg-indigo-600/10 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-[11px] font-black tracking-wider uppercase text-white">Nexo Workspace</h2>
            <div className="text-[8px] text-stone-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <span className={`w-1 h-1 rounded-full ${companionState === CompanionState.IDLE ? 'bg-green-500' : 'bg-indigo-500 animate-pulse'}`}></span>
              <span>{companionState}</span>
            </div>
          </div>
        </div>

        {/* Coder Model parameters selection */}
        <div className="flex items-center gap-3 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Model:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as any)}
            className="bg-transparent border-none text-[11px] font-bold text-stone-300 focus:outline-none focus:ring-0 cursor-pointer pr-1"
          >
            <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
            <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
            <option value="nvidia/nemotron-3-super-120b-a12b:free">Nemotron 3 Super</option>
            <option value="google/gemma-4-31b-it:free">Gemma 4 Free</option>
          </select>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGithubPush}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-black uppercase text-indigo-400 transition-all"
            title="GitHub One-Click Export"
          >
            <Github className="w-3.5 h-3.5" /> Github
          </button>
          
          <button
            onClick={downloadZip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase text-stone-300 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Zip
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-stone-500 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Body: Sidebar + Panels Container + Right Chat Panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Workspace navigation sidebar */}
        <WorkspaceSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setShowSettings(true)}
          onExit={() => {
            resetProject();
            setBuildPhase(0);
          }}
        />

        {/* Left Side Active Panel (Editor / Previewer) */}
        <div className="flex-1 flex overflow-hidden bg-[#0d0d0f] border-r border-stone-900">
          {activeTab === 'preview' ? (
            <PreviewPanel />
          ) : activeTab === 'scanner' ? (
            <ProductionScanner />
          ) : activeTab === 'observe' ? (
            <ObservePanel onCloneSuccess={() => setActiveTab('preview')} />
          ) : (
            <EditorPanel />
          )}
        </div>

        {/* Right Side Chat assistant */}
        <div className="w-72 md:w-[350px] shrink-0 h-full">
          <ChatPanel
            onSendMessage={handleSendWorkspaceMessage}
            onRetryMessage={handleRetryWorkspaceMessage}
          />
        </div>

      </div>

      {/* Configuration modal overlay */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

    </div>
  );
};

export default ChatInterface;
