import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Palette, Layers, Cpu, Check, Sliders, Play, Move, MousePointer2 } from "lucide-react";
import toast from "react-hot-toast";

interface DesignExplorationProps {
  prompt: string;
  onConfirm: (enrichedPrompt: string) => void;
  onCancel: () => void;
}

export const DesignExploration: React.FC<DesignExplorationProps> = ({ prompt, onConfirm, onCancel }) => {
  const [phase, setPhase] = useState<"intent" | "concepts" | "editor">("intent");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);

  // Editor states
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9");
  const [borderRadius, setBorderRadius] = useState("12px");
  const [typography, setTypography] = useState("Inter");
  const [animation, setAnimation] = useState("Normal");

  useEffect(() => {
    const fetchExploration = async () => {
      try {
        const res = await fetch("/api/ai/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        });
        if (!res.ok) throw new Error("Failed to explore design");
        const json = await res.json();
        setData(json);
        
        // Emulate thinking time
        setTimeout(() => setPhase("concepts"), 2000);
      } catch (err) {
        console.error(err);
        toast.error("Failed to extract intent");
        onCancel();
      } finally {
        setLoading(false);
      }
    };
    fetchExploration();
  }, [prompt, onCancel]);

  const handleSelectConcept = (concept: any) => {
    setSelectedConcept(concept);
    setPrimaryColor(concept.styles.primaryColor);
    setBorderRadius(concept.styles.borderRadius);
    setTypography(concept.styles.typography);
    setAnimation(concept.styles.animation);
    setPhase("editor");
  };

  const handleConfirm = () => {
    const enrichedPrompt = `${prompt}
    
=== DESIGN CONSTRAINTS ===
Concept: ${selectedConcept.title}
Primary Color: ${primaryColor}
Border Radius: ${borderRadius}
Typography: ${typography}
Animation Level: ${animation}
=========================`;
    onConfirm(enrichedPrompt);
  };

  return (
    <div className="w-full flex flex-col gap-4 py-4 px-2 select-none">
      <AnimatePresence mode="wait">
        
        {/* PHASE 1: INTENT */}
        {(phase === "intent" || loading) && (
          <motion.div
            key="intent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-[#0ea5e9] text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-4 h-4 animate-pulse" />
              <span>{loading ? "🧠 Understanding requirements..." : "🧠 Analyzing application type..."}</span>
            </div>
            
            {data?.intent && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-[#111] text-stone-300 p-4 rounded-xl text-xs font-mono overflow-x-auto shadow-xl"
              >
                <pre>{JSON.stringify(data.intent, null, 2)}</pre>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* PHASE 2: CONCEPTS */}
        {phase === "concepts" && data?.concepts && (
          <motion.div
            key="concepts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider">
              <Palette className="w-4 h-4" />
              <span>Select a Design Concept</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.concepts.map((concept: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => handleSelectConcept(concept)}
                  className="relative p-4 bg-white border border-[#e8e8e8] rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col gap-2"
                >
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full border border-stone-300 group-hover:border-indigo-500" />
                  <h4 className="text-sm font-bold text-[#111]">{concept.title}</h4>
                  <p className="text-xs text-[#666] leading-relaxed mb-2">{concept.description}</p>
                  
                  {/* Miniature palette preview */}
                  <div className="flex items-center gap-1.5 mt-auto">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: concept.styles.primaryColor }} />
                    <span className="text-[10px] text-[#aaa] font-medium">Radius: {concept.styles.borderRadius}</span>
                    <span className="text-[10px] text-[#aaa] font-medium ml-1">Font: {concept.styles.typography}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* PHASE 3: DESIGN EDITOR */}
        {phase === "editor" && selectedConcept && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#111] text-sm font-bold">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Design Editor: {selectedConcept.title}</span>
              </div>
              <button onClick={() => setPhase("concepts")} className="text-[10px] text-[#888] hover:text-[#111] font-bold uppercase underline">
                Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              {/* Controls */}
              <div className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                    <span className="text-xs text-[#111] font-mono">{primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Border Radius ({borderRadius})</label>
                  <input 
                    type="range" min="0" max="32" step="4" 
                    value={parseInt(borderRadius)} 
                    onChange={e => setBorderRadius(`${e.target.value}px`)} 
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Typography</label>
                  <select value={typography} onChange={e => setTypography(e.target.value)} className="w-full text-xs p-2 border border-[#e8e8e8] rounded-lg outline-none focus:border-indigo-500">
                    <option value="Inter">Inter (Clean)</option>
                    <option value="Outfit">Outfit (Modern)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech)</option>
                    <option value="Playfair Display">Playfair (Elegant)</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Animation Level</label>
                  <select value={animation} onChange={e => setAnimation(e.target.value)} className="w-full text-xs p-2 border border-[#e8e8e8] rounded-lg outline-none focus:border-indigo-500">
                    <option value="Minimal">Minimal</option>
                    <option value="Normal">Normal</option>
                    <option value="Premium">Premium (Bounce, Stagger)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Live Component Preview</label>
                <div className="flex-1 bg-[#f7f7f7] rounded-xl border border-[#e8e8e8] flex items-center justify-center p-4">
                  
                  {/* Dynamic Mock Component */}
                  <div 
                    className="bg-white shadow-lg p-5 w-full max-w-[200px] flex flex-col gap-3 transition-all duration-300"
                    style={{ 
                      borderRadius, 
                      fontFamily: typography === "Outfit" ? "'Outfit', sans-serif" : typography === "Space Grotesk" ? "'Space Grotesk', sans-serif" : "sans-serif"
                    }}
                  >
                    <div className="h-4 w-2/3 bg-stone-200 rounded" />
                    <div className="h-2 w-full bg-stone-100 rounded mt-2" />
                    <div className="h-2 w-4/5 bg-stone-100 rounded" />
                    
                    <button 
                      className="mt-4 py-2 w-full text-white text-xs font-bold transition-all hover:opacity-90"
                      style={{ backgroundColor: primaryColor, borderRadius: parseInt(borderRadius) > 8 ? `${parseInt(borderRadius) - 4}px` : borderRadius }}
                    >
                      Get Started
                    </button>
                  </div>

                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#e8e8e8] mt-2">
              <button 
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
              >
                <Check className="w-4 h-4" />
                Generate App
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
