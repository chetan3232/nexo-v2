import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, FolderPlus, FileCode, CheckCircle2, ChevronRight, Terminal, Plus, Trash } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useTeamStore } from '../../stores/teamStore';
import { useRuntimeStore } from '../../stores/runtimeStore';
import { BuildTask } from '../../types';

interface AgentWorkflowOverlayProps {
  onStartCodeGeneration: (checklist: BuildTask[]) => void;
}

export const AgentWorkflowOverlay: React.FC<AgentWorkflowOverlayProps> = ({ onStartCodeGeneration }) => {
  const buildPhase = useProjectStore((state) => state.buildPhase);
  const setBuildPhase = useProjectStore((state) => state.setBuildPhase);
  const blueprintTasks = useProjectStore((state) => state.blueprintTasks);
  const setBlueprintTasks = useProjectStore((state) => state.setBlueprintTasks);
  const agentStatuses = useTeamStore((state) => state.agentStatuses);
  const runtimeLogs = useRuntimeStore((state) => state.logs);
  const files = useProjectStore((state) => state.files);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const [newTasks, setNewTasks] = useState<string>('');

  // Scroll to bottom of terminal log window
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [runtimeLogs]);

  const handleAddTask = () => {
    if (!newTasks.trim()) return;
    const task: BuildTask = {
      id: `task-${Date.now()}`,
      label: newTasks,
      status: 'pending',
      agent: 'Frontend'
    };
    setBlueprintTasks([...blueprintTasks, task]);
    setNewTasks('');
  };

  const handleDeleteTask = (id: string) => {
    setBlueprintTasks(blueprintTasks.filter((t) => t.id !== id));
  };

  const handleConfirmTasks = () => {
    setBuildPhase(6); // Progress to Structure Confirmation screen
  };

  const handleStartGeneration = () => {
    onStartCodeGeneration(blueprintTasks);
  };

  // Agent Pipeline badges
  const pipelineAgents = [
    { name: 'Planner', icon: '🧠', status: agentStatuses.Planner },
    { name: 'PM', icon: '📋', status: agentStatuses.PM },
    { name: 'Designer', icon: '🎨', status: agentStatuses.Designer },
    { name: 'Frontend', icon: '⚡', status: agentStatuses.Frontend },
    { name: 'Backend', icon: '⚙️', status: agentStatuses.Backend },
    { name: 'DevOps', icon: '📦', status: agentStatuses.DevOps },
    { name: 'QA', icon: '🔍', status: agentStatuses.QA },
    { name: 'Security', icon: '🛡️', status: agentStatuses.Security },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b]/95 backdrop-blur-md text-white p-6 overflow-y-auto flex flex-col items-center justify-center font-sans">
      <div className="max-w-4xl w-full space-y-6 relative z-10 py-8">
        
        {/* PHASE 4: Blueprint Generation */}
        {buildPhase === 4 && (
          <div className="text-center space-y-6 max-w-xl mx-auto py-12">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold tracking-tight">Phase 4: Blueprint Generation...</h2>
            <p className="text-stone-400 font-light">Creating custom files checklists and component specs templates...</p>
          </div>
        )}

        {/* PHASE 5: Blueprint Customization */}
        {buildPhase === 5 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Phase 5</span>
              <h2 className="text-3xl font-black">Customize App Checklist</h2>
              <p className="text-stone-400 text-sm">Review, delete, or append tasks before code gets written.</p>
            </div>

            <div className="grid md:grid-cols-12 gap-8 items-stretch pt-4">
              
              {/* Task Items List */}
              <div className="md:col-span-7 bg-stone-900/50 border border-white/10 rounded-[2rem] p-6 space-y-4 shadow-xl">
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  <AnimatePresence>
                    {blueprintTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border border-stone-700 flex items-center justify-center text-xs font-bold bg-[#141416] text-stone-500">
                            {task.agent.slice(0, 1)}
                          </div>
                          <span className="text-xs text-stone-200">{task.label}</span>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 hover:bg-red-500/10 rounded text-stone-500 hover:text-red-400 transition-colors">
                          <Trash className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add task bar */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newTasks}
                    onChange={(e) => setNewTasks(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="Add custom task (e.g. 'Add Google Auth API')"
                    className="flex-1 bg-black/40 border border-white/5 px-4 py-2 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                  <button onClick={handleAddTask} className="p-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Specs and trigger column */}
              <div className="md:col-span-5 bg-stone-900/40 border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between shadow-xl">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold font-mono text-stone-400 uppercase tracking-wider">Plan Overview</h3>
                  <p className="text-xs text-stone-400 leading-relaxed font-light">
                    The autonomous squads will build files and install package scripts to achieve the tasks on this list.
                  </p>
                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-xs font-mono space-y-2">
                    <div><span className="text-indigo-400">Total Tasks:</span> {blueprintTasks.length}</div>
                    <div><span className="text-indigo-400">Target Environment:</span> WebContainer Node VM</div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmTasks}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors mt-6 shadow-lg shadow-indigo-500/10"
                >
                  Confirm Plan <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PHASE 6: Structure Confirmation */}
        {buildPhase === 6 && (
          <div className="max-w-md mx-auto bg-stone-900/60 border border-white/10 rounded-[2rem] p-8 space-y-6 text-center shadow-xl">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
              <FolderPlus className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Workspace confirmation</h2>
              <p className="text-stone-400 text-xs font-light">Ready to spawn files tree and launch background builders. Review workspace components.</p>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-left font-mono text-xs text-stone-300 space-y-1">
              <div>📁 workspace/</div>
              <div>├── 📄 package.json</div>
              <div>├── 📄 tsconfig.json</div>
              <div>├── 📁 src/</div>
              <div>│   ├── 📄 App.tsx</div>
              <div>│   └── 📄 index.css</div>
              <div>└── 📄 prd.md</div>
            </div>

            <button
              onClick={handleStartGeneration}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/10"
            >
              Start Build Scaffolding <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PHASE 7-9: Build Progress, Code Stream, sandbox compiled */}
        {buildPhase >= 7 && buildPhase <= 9 && (
          <div className="grid md:grid-cols-12 gap-6 items-stretch">
            
            {/* Left side: Agents and logs */}
            <div className="md:col-span-8 space-y-4">
              
              {/* Agent Pipeline */}
              <div className="bg-stone-900/60 border border-white/10 rounded-2xl p-4 shadow-xl">
                <div className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-widest mb-3">Agent Workspace Queue</div>
                <div className="grid grid-cols-4 gap-2">
                  {pipelineAgents.map((agent) => (
                    <div
                      key={agent.name}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition-all ${
                        agent.status === 'Thinking'
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 animate-pulse'
                          : agent.status === 'Coding'
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                          : 'bg-black/20 border-white/5 text-stone-500'
                      }`}
                    >
                      <span>{agent.icon}</span>
                      <span className="truncate">{agent.name}</span>
                      {agent.status === 'Thinking' && <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Console logs */}
              <div className="bg-black border border-white/10 rounded-2xl p-4 h-[250px] flex flex-col font-mono text-xs text-stone-300 shadow-2xl relative overflow-hidden">
                <div className="absolute top-2 right-4 flex items-center gap-1.5 text-[9px] text-stone-600 font-bold tracking-widest uppercase">
                  <Terminal className="w-3 h-3" /> Console logs
                </div>
                <div className="flex-grow overflow-y-auto space-y-1.5 pt-4 scrollbar-thin">
                  {runtimeLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed whitespace-pre-wrap select-text">
                      <span className="text-indigo-400 mr-2">&gt;</span>{log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>

            </div>

            {/* Right side: File structures */}
            <div className="md:col-span-4 bg-stone-900/40 border border-white/10 rounded-[2rem] p-6 flex flex-col justify-between shadow-xl">
              <div>
                <h3 className="text-xs font-bold font-mono text-stone-400 uppercase tracking-widest mb-4">Workspace filesystem</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {Object.keys(files).map((name) => (
                    <div key={name} className="flex items-center gap-2 text-xs text-stone-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      <FileCode className="w-4 h-4 text-indigo-400" />
                      <span className="truncate font-mono">{name}</span>
                      <Check className="w-3.5 h-3.5 text-green-400 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl mt-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  {buildPhase === 7 && 'Scaffolding Workspace Maps...'}
                  {buildPhase === 8 && 'Streaming Code Generation...'}
                  {buildPhase === 9 && 'Compiling Sandbox Runtime...'}
                </div>
                <div className="text-[10px] text-stone-500 font-mono">
                  {buildPhase === 8 ? 'Writing component styles...' : 'Executing npm run dev...'}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
export default AgentWorkflowOverlay;
