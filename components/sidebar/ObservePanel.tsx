import React, { useState, useEffect } from 'react';
import { Globe, Loader2, Sparkles, CheckCircle, Zap, ShieldAlert, Laptop, ArrowRight } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useRuntimeStore } from '../../stores/runtimeStore';
import { useTeamStore } from '../../stores/teamStore';
import { CloningAgent } from '../../agents/CloningAgent';
import { extractCodeFromText } from '../../utils/parser';

interface ObservePanelProps {
  onCloneSuccess: () => void;
}

export const ObservePanel: React.FC<ObservePanelProps> = ({ onCloneSuccess }) => {
  const [url, setUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [clonedLogs, setClonedLogs] = useState<string[]>([]);
  const [clonedSuccess, setClonedSuccess] = useState(false);

  const updateFile = useProjectStore((state) => state.updateFile);
  const setFiles = useProjectStore((state) => state.setFiles);
  const setSelectedFileName = useProjectStore((state) => state.setSelectedFileName);
  const addLog = useRuntimeStore((state) => state.addLog);
  const setAgentStatus = useTeamStore((state) => state.setAgentStatus);

  const cloningSteps = [
    { title: 'Analyzing Layout Grids & DOM Nodes', desc: 'Computer vision parses structural nodes, padding matrices, and alignment coordinates.' },
    { title: 'Extracting Typography & Color Palettes', desc: 'Syncing font families, styling tokens, and primary accent color schemes.' },
    { title: 'Generating Modular React Components', desc: 'Creating clean code blocks with Tailwind utility definitions.' },
    { title: 'Deploying Virtual Workspace Runtime', desc: 'Writing files to the StackBlitz WebContainer and booting devServer.' }
  ];

  const handleClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsCloning(true);
    setCurrentStep(0);
    setClonedSuccess(false);
    setClonedLogs([]);
    addLog(`🌐 [Observe Mode] Init clone request for target URL: ${url}`);
    setAgentStatus('Planner', 'Thinking');

    // Simulate cinematic cloning sequence step-by-step
    const stepIntervals = [1200, 1500, 1800, 1000];
    
    for (let i = 0; i < cloningSteps.length; i++) {
      setCurrentStep(i);
      setClonedLogs(prev => [...prev, `⏳ ${cloningSteps[i].title}...`]);
      await new Promise(r => setTimeout(r, stepIntervals[i]));
    }

    try {
      const agent = new CloningAgent();
      const rawResponse = await agent.clone(url);
      const parsed = extractCodeFromText(rawResponse);

      if (parsed.website && parsed.website.files) {
        // Re-write workspace files with cloned layout
        setFiles(parsed.website.files);
        const main = parsed.website.mainFile || 'App.tsx';
        setSelectedFileName(main);
        
        addLog(`🌐 [Observe Mode] Reconstructed target website layout views:`);
        Object.keys(parsed.website.files).forEach((f) => {
          addLog(`  -> [Created Cloned File] ${f}`);
        });

        setClonedSuccess(true);
        setAgentStatus('Planner', 'Idle');
        addLog("🚀 [Sandbox] Hot compile complete. Side-by-side Workspace Studio view loaded.");
        
        // Auto trigger navigate to Live Preview
        setTimeout(() => {
          setIsCloning(false);
          onCloneSuccess();
        }, 1200);
      } else {
        throw new Error("Failed to parse cloned React layouts.");
      }
    } catch (err: any) {
      console.error(err);
      setClonedLogs(prev => [...prev, `❌ Error: ${err.message}`]);
      setIsCloning(false);
      setAgentStatus('Planner', 'Idle');
      addLog(`❌ [Observe Mode Error] Cloning failed: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 bg-[#09090b] text-stone-200 p-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-stone-800 pb-2 flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400" /> Observe Mode Website Cloning
          </span>
          <span className="text-[8px] font-mono text-stone-600 font-bold uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
            V2.2 Vision
          </span>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-stone-400 leading-relaxed space-y-1">
          <p className="font-semibold text-stone-300">Clone UI designs directly from URL targets.</p>
          <p>
            Nexo's <span className="text-indigo-400 font-bold">Observe Mode</span> captures design tokens, responsive typography hierarchies, element layouts, and color rules, converting them instantly into clean, editable React views.
          </p>
        </div>

        {!isCloning && !clonedSuccess && (
          <form onSubmit={handleClone} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Target Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
                <input
                  type="url"
                  placeholder="https://example.com"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#121214] border border-stone-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-3 py-2 text-[11px] text-white placeholder-stone-600 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Clone Target Website Layout</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        )}

        {isCloning && (
          <div className="space-y-4">
            {/* Step list UI */}
            <div className="space-y-2.5">
              {cloningSteps.map((step, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-indigo-600/5 border-indigo-500/30'
                        : isCompleted
                        ? 'bg-white/5 border-white/5 opacity-60'
                        : 'border-transparent opacity-30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isCompleted ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-stone-600 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-[10px] font-bold text-stone-200">{step.title}</h4>
                        {isActive && <p className="text-[9px] text-stone-400 mt-0.5 font-medium leading-relaxed">{step.desc}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Glowing active screen mock panel */}
            <div className="bg-[#121214] border border-white/5 rounded-xl p-3 flex flex-col items-center justify-center min-h-[110px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent animate-pulse" />
              <Laptop className="w-6 h-6 text-stone-600 mb-1.5 relative z-10" />
              <span className="text-[8px] font-mono text-stone-400 font-bold uppercase tracking-widest relative z-10 animate-pulse">
                {currentStep < 3 ? 'Capturing Layout Elements...' : 'Scaffolding React Components...'}
              </span>
            </div>
          </div>
        )}

        {clonedSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] rounded-xl flex flex-col items-center gap-2 text-center font-mono">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <h3 className="font-bold text-xs text-green-300 mb-0.5">Cloning Successful!</h3>
              <p className="text-[9px] text-green-400/80 leading-relaxed">
                App.tsx modular component code reconstructed successfully. Loading live preview...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObservePanel;
