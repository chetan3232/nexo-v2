import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, ChevronRight, Terminal, Sparkles, AlertCircle } from 'lucide-react';
import { useAgentStore } from '../../stores/agentStore';
import { useChatStore } from '../../stores/chatStore';

interface InitialOverlayProps {
  onStart: (prompt: string) => void;
}

export const InitialOverlay: React.FC<InitialOverlayProps> = ({ onStart }) => {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const selectedModel = useAgentStore((state) => state.selectedModel);
  const [recognition, setRecognition] = useState<any>(null);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            setPrompt((prev) => prev + ' ' + e.results[i][0].transcript);
          } else {
            interim += e.results[i][0].transcript;
          }
        }
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleSpeech = () => {
    if (!recognition) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    if (isListening && recognition) {
      recognition.stop();
    }
    onStart(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col items-center justify-center text-white p-6 overflow-hidden select-none">
      {/* Dynamic Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#09090b] to-[#09090b]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-3xl w-full space-y-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full shadow-lg">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-300">Nexo V2.5.0 Cinematic Studio</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95] text-white">
            Build applications <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-orange-300">
              at light speed.
            </span>
          </h1>

          <p className="text-stone-400 max-w-xl mx-auto font-light text-base md:text-lg">
            Say, type, or configure your ideas. Watch our autonomous multi-agent squads code, compile, and self-heal your workspace.
          </p>
        </motion.div>

        {/* Input Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white/5 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl relative group max-w-2xl mx-auto"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-orange-500/20 rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
          
          <div className="relative bg-[#0d0d0f]/90 rounded-[1.7rem] p-4 flex flex-col">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleGenerate())}
              placeholder="What are we building today? (e.g. 'A real-time crypto analytics dashboard')"
              className="w-full bg-transparent border-none text-white placeholder-stone-500 focus:ring-0 resize-none h-28 p-2 font-light text-lg outline-none"
            />
            
            <div className="flex justify-between items-center pt-3 px-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                    isListening
                      ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                      : 'bg-white/5 border-white/10 text-stone-400 hover:text-white'
                  }`}
                  title="Speak your prompt"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>ONLINE</span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] ${
                  prompt.trim()
                    ? 'bg-white text-black hover:bg-stone-200 hover:scale-[1.03]'
                    : 'bg-white/10 text-stone-500 cursor-not-allowed'
                }`}
              >
                Generate <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Dual Engine Side Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 text-xs font-mono"
        >
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
            <span className="text-yellow-400 font-bold">⚡ Fast:</span>
            <span className="text-stone-300">Gemini 2.5 Flash</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
            <span className="text-indigo-400 font-bold">🧠 Deep:</span>
            <span className="text-stone-300">
              {selectedModel.includes('nvidia') ? 'Nemotron-3 Super' : 'Gemma 4'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default InitialOverlay;
