import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Terminal, Download, Sparkles, Globe, RefreshCw, ChevronDown, Trash2, Settings, X, FileCode, Monitor, CheckCircle, Key, AlertTriangle, Cpu, MessageCircle, FileText, ChevronRight, ArrowLeft } from 'lucide-react';
import JSZip from 'jszip';
import { Message, CompanionState, WebsiteContent } from '../types';
import Avatar from '../components/Avatar';
// Fixed the missing member error by ensuring geminiService now exports AVAILABLE_MODELS
import { generateResponse, AVAILABLE_MODELS, DEFAULT_SYSTEM_INSTRUCTION } from '../services/geminiService';
import { generateOpenRouterResponse, OPENROUTER_MODELS } from '../services/openRouterService';

const ChatInterface: React.FC = () => {
  const navigate = useNavigate();
  const [hasStarted, setHasStarted] = useState(() => localStorage.getItem('nexo_has_started') === 'true');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [state, setState] = useState<CompanionState>(CompanionState.IDLE);
  const [showSettings, setShowSettings] = useState(false);
  const [currentContent, setCurrentContent] = useState<WebsiteContent | null>(null);
  
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'chat'>('chat');
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-flash-preview');
  const [agentPipelineActive, setAgentPipelineActive] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, 'Thinking' | 'Coding' | 'Idle'>>({
    PM: 'Idle',
    Designer: 'Idle',
    DevOps: 'Idle',
    Frontend: 'Idle',
    Backend: 'Idle',
    QA: 'Idle',
    Security: 'Idle'
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentContent && !selectedFileName) {
        setSelectedFileName(currentContent.mainFile);
    }
  }, [currentContent]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages, state]);

  // Refactored to separate the logic from the UI event to allow retries with explicit history
  const processMessage = async (text: string, history: Message[]) => {
    if (!text.trim() || state !== CompanionState.IDLE) return;

    // Optimistically update UI
    setMessages(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
    setInputText('');
    if (!hasStarted) setHasStarted(true);
    
    setState(CompanionState.THINKING);
    setAgentPipelineActive(true);

    try {
      // Phase 1: Strategic Parallel Phase (PM, Designer, DevOps working)
      setAgentStatuses({
        PM: 'Thinking',
        Designer: 'Thinking',
        DevOps: 'Thinking',
        Frontend: 'Idle',
        Backend: 'Idle',
        QA: 'Idle',
        Security: 'Idle'
      });
      await new Promise(r => setTimeout(r, 1200));

      // Phase 2: Implementation Collaborative Phase (Frontend and Backend coding)
      setAgentStatuses({
        PM: 'Idle',
        Designer: 'Idle',
        DevOps: 'Idle',
        Frontend: 'Coding',
        Backend: 'Coding',
        QA: 'Idle',
        Security: 'Idle'
      });

      // Route dynamically based on selected model
      const isGemini = selectedModel.startsWith('gemini-');
      const response = isGemini
        ? await generateResponse(
            history,
            text,
            selectedModel,
            setState,
            DEFAULT_SYSTEM_INSTRUCTION
          )
        : await generateOpenRouterResponse(
            history, 
            text, 
            selectedModel, 
            setState,
            DEFAULT_SYSTEM_INSTRUCTION
          );

      // Phase 3: Verification Parallel Phase (QA and Security scanning)
      setAgentStatuses({
        PM: 'Idle',
        Designer: 'Idle',
        DevOps: 'Idle',
        Frontend: 'Idle',
        Backend: 'Idle',
        QA: 'Thinking',
        Security: 'Thinking'
      });
      await new Promise(r => setTimeout(r, 800));

      // Reset Pipeline
      setAgentStatuses({
        PM: 'Idle',
        Designer: 'Idle',
        DevOps: 'Idle',
        Frontend: 'Idle',
        Backend: 'Idle',
        QA: 'Idle',
        Security: 'Idle'
      });
      
      if (response.websiteContent) {
          setCurrentContent(response.websiteContent);
          setPreviewKey(k => k + 1);
          setActiveTab('preview');
      }

      setMessages(prev => [...prev, { 
          role: 'model', 
          text: response.text, 
          timestamp: Date.now(), 
          websiteContent: response.websiteContent,
          isError: response.isError 
      }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'model',
        text: `Error: ${err.message}`,
        timestamp: Date.now(),
        isError: true
      }]);
    }

    setAgentPipelineActive(false);
    setState(CompanionState.IDLE);
  };

  const handleSendMessage = () => {
      processMessage(inputText, messages);
  };

  const handleRetry = (index: number) => {
      // Logic:
      // 1. Identify the user message associated with this error (index - 1).
      // 2. Revert the state to before that user message.
      // 3. Re-send the user message.
      if (index > 0 && messages[index - 1].role === 'user') {
          const textToRetry = messages[index - 1].text;
          const cleanHistory = messages.slice(0, index - 1);
          
          // Reset messages to clean history (removing both User and Error)
          setMessages(cleanHistory);
          
          // Trigger process with the clean history
          processMessage(textToRetry, cleanHistory);
      }
  };

  const downloadZip = async () => {
    if (!currentContent) return;
    const zip = new JSZip();
    Object.entries(currentContent.files).forEach(([name, code]) => zip.file(name, code));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexo_project.zip";
    a.click();
  };

  const generatePreviewDoc = () => {
    if (!currentContent) return '';
    const files = currentContent.files;
    const isReact = Object.keys(files).some(f => f.endsWith('.tsx') || f.endsWith('.ts'));

    if (!isReact) {
        // Native Mode (HTML/JS/CSS)
        const html = files['index.html'] || '<html><body><h1>No index.html found</h1></body></html>';
        const css = files['styles.css'] || files['style.css'] || '';
        const js = files['script.js'] || files['main.js'] || '';
        
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>${css}</style>
                </head>
                <body>
                    ${html.includes('<body>') ? html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html : html}
                    <script>${js}</script>
                </body>
            </html>
        `;
    }

    // React Mode Handling
    // 1. Sort files so App.tsx is last (dependency heuristic)
    const componentFiles = Object.keys(files).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    componentFiles.sort((a, b) => {
        if (a === 'App.tsx') return 1;
        if (b === 'App.tsx') return -1;
        return a.localeCompare(b);
    });

    let combinedCode = '';
    let lucideImports = new Set<string>();

    componentFiles.forEach(filename => {
        let code = files[filename];

        // Capture Lucide imports
        const lucideMatch = code.match(/import\s+\{(.*?)\}\s+from\s+['"]lucide-react['"]/);
        if (lucideMatch) {
            lucideMatch[1].split(',').map(s => s.trim()).forEach(i => lucideImports.add(i));
        }

        // Strip Imports
        code = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
        
        // Handle Exports
        if (filename === 'App.tsx') {
            // Handle "export default function App" -> "function App"
            code = code.replace(/export\s+default\s+function\s+App/g, 'function App');
            // Handle "export default function Something" -> "function Something...; const App = Something;"
            code = code.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1($2) { return <$1 {...$2} /> }\nconst App = $1;');
            // Handle "export default App" -> "const App = ..." is handled by bottom catch-all often, 
            // but if it's "export default App;" at end, remove it.
            code = code.replace(/export\s+default\s+(\w+);?/g, 'const App = $1;');
        } else {
            // Remove exports for other files
            code = code.replace(/export\s+default\s+/g, '');
            code = code.replace(/export\s+/g, '');
        }

        combinedCode += `\n/* --- ${filename} --- */\n${code}\n`;
    });

    const lucideDestructuring = lucideImports.size > 0 
      ? `const { ${Array.from(lucideImports).join(', ')} } = window.lucideReact || window.LucideReact || {};` 
      : '';

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <script src="https://cdn.tailwindcss.com"></script>
                <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
                <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
                <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
                <script src="https://unpkg.com/lucide@latest"></script>
                <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
                <style>
                    body { font-family: 'Inter', sans-serif; background: #ffffff; color: #1c1917; }
                    ::-webkit-scrollbar { width: 6px; height: 6px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 3px; }
                    ::-webkit-scrollbar-thumb:hover { background: #d6d3d1; }
                </style>
            </head>
            <body>
                <div id="root"></div>
                <script type="text/babel" data-presets="react,typescript">
                    // Error Boundary
                    window.addEventListener('error', (e) => {
                        const root = document.getElementById('root');
                        root.innerHTML = '<div style="color:#ef4444; padding:20px; font-family:monospace; background:#fef2f2; border:1px solid #fee2e2; margin:20px; rounded:10px;"><strong>Preview Error:</strong><br/>' + e.message + '</div>';
                    });

                    const { useState, useEffect, useRef, useMemo, useCallback } = React;
                    const { motion, AnimatePresence } = FramerMotion;
                    
                    // Lucide Support
                    ${lucideDestructuring}

                    // Injected Component Code
                    ${combinedCode}

                    // Render Application
                    const root = ReactDOM.createRoot(document.getElementById('root'));
                    if (typeof App !== 'undefined') {
                        root.render(<App />);
                    } else {
                        root.render(<div className="p-4 text-red-500">Could not find App component. Please ensure one file is named App.tsx and exports a component.</div>);
                    }
                </script>
            </body>
        </html>
    `;
  };

  if (!hasStarted) {
    return (
      <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center text-white p-6 overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#09090b] to-[#09090b]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Back Button */}
        <button 
           onClick={() => navigate('/')} 
           className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-stone-400 hover:text-white transition-colors z-20 group"
        >
           <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
           </div>
           <span className="text-sm font-medium opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">Back to Home</span>
        </button>

        <div className="max-w-2xl w-full space-y-10 text-center animate-in fade-in zoom-in duration-700 relative z-10">
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] text-white selection:bg-indigo-500/30">
            Build projects <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-orange-300 animate-pulse-slow">at light speed.</span>
          </h1>
          
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-1.5 rounded-[2rem] shadow-2xl ring-1 ring-white/10 relative group">
            {/* Subtle glow border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-orange-500/30 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            
            <div className="relative bg-[#09090b]/90 rounded-[1.7rem] p-4 flex flex-col">
                <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="What are we building? (e.g., 'A landing page for a coffee shop')"
                    className="w-full bg-transparent border-none text-lg md:text-xl text-white placeholder-stone-500 focus:ring-0 resize-none h-32 p-2 font-light"
                />
                <div className="flex justify-between items-center pt-2 px-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/50"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30 border border-yellow-500/50"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/50"></div>
                         <span className="text-[10px] text-stone-500 font-mono ml-1 font-bold">NVIDIA Nemotron v3</span>
                    </div>
                    <button 
                      onClick={() => handleSendMessage()} 
                      className="bg-white text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-200 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]"
                    >
                        Generate <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col bg-gradient-to-br from-indigo-50/40 via-white to-orange-50/40 overflow-hidden font-sans">
      {/* Navbar */}
      <div className="h-16 bg-white/60 backdrop-blur-xl border-b border-stone-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => navigate('/')} 
                className="p-2 hover:bg-stone-100 rounded-xl text-stone-500 hover:text-stone-900 transition-colors"
                title="Back to Home"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-stone-200/50"></div>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white"><Terminal className="w-5 h-5" /></div>
            <div>
                <h2 className="text-sm font-black tracking-tight">NEXO WORKSPACE</h2>
                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${state === CompanionState.IDLE ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
                    {state}
                </div>
            </div>
            <div className="hidden sm:block h-6 w-px bg-stone-200/50"></div>
            <div className="hidden sm:flex items-center gap-2 bg-stone-100 px-3 py-1 rounded-xl border border-stone-200/60 shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-stone-500" />
                <select 
                    value={selectedModel} 
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-transparent border-none text-xs font-semibold text-stone-700 focus:outline-none focus:ring-0 cursor-pointer pr-1"
                >
                    <optgroup label="Google Gemini (Recommended)">
                        {AVAILABLE_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </optgroup>
                    <optgroup label="OpenRouter Models">
                        {OPENROUTER_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </optgroup>
                </select>
            </div>
        </div>
        
        <div className="hidden lg:flex bg-stone-100/50 p-1 rounded-xl border border-stone-200/50">
            {['code', 'chat', 'preview'].map((t) => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white shadow-sm text-black' : 'text-stone-400 hover:text-stone-600'}`}
                >
                    {t}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-3">
            <button onClick={downloadZip} className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-[10px] font-black uppercase transition-all">
                <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2.5 hover:bg-stone-100 rounded-xl text-stone-400"><Settings className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className={`flex-1 flex flex-col bg-white/50 transition-all duration-300 ${activeTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
            {activeTab === 'preview' ? (
                <div className="flex-1 flex flex-col">
                    <div className="h-10 bg-stone-50/50 border-b border-stone-200 flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
                            <Globe className="w-3.5 h-3.5" /> sandbox:3000
                        </div>
                        <button onClick={() => setPreviewKey(k => k + 1)} className="p-1 hover:bg-stone-200 rounded"><RefreshCw className="w-3.5 h-3.5 text-stone-400" /></button>
                    </div>
                    <iframe key={previewKey} title="Preview" className="flex-1 border-none" srcDoc={generatePreviewDoc()} />
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* File Explorer Sidebar */}
                    <div className="w-64 bg-stone-50/50 border-r border-stone-200 flex flex-col">
                        <div className="p-4 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-200">Files</div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {currentContent && Object.keys(currentContent.files).map(filename => (
                                <button 
                                    key={filename}
                                    onClick={() => setSelectedFileName(filename)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedFileName === filename ? 'bg-black text-white' : 'text-stone-600 hover:bg-stone-200'}`}
                                >
                                    <FileCode className="w-4 h-4 opacity-50" />
                                    {filename}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Code Editor */}
                    <div className="flex-1 bg-[#0d0d0d] relative">
                        <div className="absolute top-4 right-6 text-[10px] font-black text-white/20 uppercase tracking-widest">{selectedFileName}</div>
                        <textarea 
                            value={currentContent?.files[selectedFileName || ''] || ''}
                            readOnly
                            className="w-full h-full bg-transparent text-indigo-300/90 font-mono text-sm p-8 outline-none resize-none leading-relaxed"
                            spellCheck={false}
                        />
                    </div>
                </div>
            )}
        </div>

        {/* Chat Sidebar */}
        <div className={`w-full lg:w-[450px] bg-white/80 backdrop-blur-xl border-l border-stone-200 flex flex-col relative z-30 transition-transform ${activeTab === 'chat' ? 'translate-x-0' : 'lg:translate-x-0 translate-x-full absolute inset-0 lg:static'}`}>
            <div className="h-16 border-b border-stone-100 flex items-center justify-between px-6 shrink-0">
                <span className="font-bold text-sm">Builder Chat</span>
                <button onClick={() => setActiveTab('preview')} className="lg:hidden p-2"><X className="w-5 h-5 text-stone-400" /></button>
            </div>
            
            {/* Multi-Agent Squads Pipeline Dashboard */}
            {agentPipelineActive && (
              <div className="p-4 bg-stone-900 text-white border-b border-stone-800 space-y-3 animate-in fade-in duration-300">
                <div className="text-[10px] font-mono text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Multi-Agent Execution Pipeline
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'PM Agent (PRD)', status: agentStatuses.PM, icon: '📋' },
                    { name: 'Designer (Theme)', status: agentStatuses.Designer, icon: '🎨' },
                    { name: 'DevOps (Config)', status: agentStatuses.DevOps, icon: '📦' },
                    { name: 'Frontend (React)', status: agentStatuses.Frontend, icon: '⚡' },
                    { name: 'Backend (Routes)', status: agentStatuses.Backend, icon: '⚙️' },
                    { name: 'QA (Audit)', status: agentStatuses.QA, icon: '🔍' },
                    { name: 'Security (Scan)', status: agentStatuses.Security, icon: '🛡️' },
                  ].map((agent) => (
                    <div
                      key={agent.name}
                      className={`flex items-center justify-between p-2 rounded-xl border text-[9px] font-bold ${
                        agent.status === 'Thinking'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 animate-pulse'
                          : agent.status === 'Coding'
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                          : 'bg-black/25 border-white/5 text-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span>{agent.icon}</span>
                        <span className="truncate">{agent.name}</span>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider">{agent.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/30">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                        {msg.isError ? (
                             <div className="max-w-[90%] p-4 bg-red-50 border border-red-200 rounded-3xl rounded-tl-none text-red-800 space-y-3 shadow-sm">
                                 <div className="flex items-center gap-2 font-bold text-sm">
                                     <AlertTriangle className="w-4 h-4 text-red-600" />
                                     <span>Generation Failed</span>
                                 </div>
                                 <p className="text-sm leading-relaxed text-red-700/80">{msg.text}</p>
                                 <button 
                                     onClick={() => handleRetry(i)}
                                     className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-700 hover:bg-red-50 transition-colors shadow-sm"
                                 >
                                     <RefreshCw className="w-3 h-3" /> Retry Request
                                 </button>
                             </div>
                        ) : (
                            <div className={`max-w-[90%] p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-black text-white rounded-3xl rounded-tr-none' : 'bg-white text-stone-800 border border-stone-200 rounded-3xl rounded-tl-none'}`}>
                                {msg.text}
                            </div>
                        )}
                    </div>
                ))}
                {state === CompanionState.THINKING && (
                    <div className="flex justify-start items-center gap-3 text-stone-400 text-xs font-bold uppercase tracking-widest px-4">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                        Generating Files...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-6 bg-white border-t border-stone-100">
                <div className="flex items-center bg-stone-50 rounded-2xl border border-stone-200 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                    <textarea 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Change the button color to blue..."
                        className="w-full bg-transparent p-4 outline-none resize-none h-[60px] text-sm"
                        rows={1}
                    />
                    <button onClick={() => handleSendMessage()} className="p-3 mr-2 bg-black text-white rounded-xl hover:opacity-80 transition-opacity">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
