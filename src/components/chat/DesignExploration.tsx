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
  const [phase, setPhase] = useState<"intent" | "concepts" | "editor" | "blueprint" | "final_approval">("intent");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);

  // Editor & Theme states (Phase 3 & 4)
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9");
  const [borderRadius, setBorderRadius] = useState("12px");
  const [typography, setTypography] = useState("Inter");
  const [animation, setAnimation] = useState("Normal");
  const [themeMode, setThemeMode] = useState<"Dark" | "Light" | "Auto" | "Custom">("Custom");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [cardColor, setCardColor] = useState("#f7f7f7");
  const [textColor, setTextColor] = useState("#111111");

  // Blueprint states (Phase 5 & 6)
  const [blueprintData, setBlueprintData] = useState<any>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(false);
  const [blueprintInput, setBlueprintInput] = useState("");

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

  const handleGenerateBlueprint = async () => {
    setPhase("blueprint");
    setBlueprintLoading(true);
    try {
      const res = await fetch("/api/ai/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error("Failed to generate blueprint");
      const json = await res.json();
      setBlueprintData(json);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate blueprint");
    } finally {
      setBlueprintLoading(false);
    }
  };

  const handleUpdateBlueprint = async () => {
    if (!blueprintInput.trim()) return;
    setBlueprintLoading(true);
    try {
      const res = await fetch("/api/ai/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, modifications: blueprintInput, currentBlueprint: blueprintData })
      });
      if (!res.ok) throw new Error("Failed to update blueprint");
      const json = await res.json();
      setBlueprintData(json);
      setBlueprintInput("");
      toast.success("Blueprint updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update blueprint");
    } finally {
      setBlueprintLoading(false);
    }
  };

  const handleGoToFinalApproval = () => {
    setPhase("final_approval");
  };

  const handleFinalize = () => {
    const enrichedPrompt = `${prompt}
    
=== DESIGN CONSTRAINTS ===
Concept: ${selectedConcept.title}
Theme Mode: ${themeMode}
Primary Color: ${primaryColor}
Background: ${bgColor}
Card Color: ${cardColor}
Text Color: ${textColor}
Border Radius: ${borderRadius}
Typography: ${typography}
Animation Level: ${animation}

=== IMPLEMENTATION BLUEPRINT ===
Pages: ${blueprintData?.pages?.join(", ") || "Default"}
Backend: ${blueprintData?.backend?.join(", ") || "Default"}
Integrations: ${blueprintData?.integrations?.join(", ") || "Default"}
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
                {/* Theme Mode Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Theme Mode</label>
                  <div className="flex gap-2">
                    {["Light", "Dark", "Auto", "Custom"].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setThemeMode(mode as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          themeMode === mode ? "bg-indigo-500 text-white" : "bg-[#f3f3f3] text-[#555] hover:bg-[#e8e8e8]"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      <span className="text-xs text-[#111] font-mono">{primaryColor}</span>
                    </div>
                  </div>

                  {themeMode === "Custom" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Background</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      </div>
                    </div>
                  )}

                  {themeMode === "Custom" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Cards</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      </div>
                    </div>
                  )}

                  {themeMode === "Custom" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Text</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                      </div>
                    </div>
                  )}
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
                    className="shadow-lg p-5 w-full max-w-[200px] flex flex-col gap-3 transition-all duration-300"
                    style={{ 
                      borderRadius, 
                      backgroundColor: cardColor,
                      color: textColor,
                      fontFamily: typography === "Outfit" ? "'Outfit', sans-serif" : typography === "Space Grotesk" ? "'Space Grotesk', sans-serif" : "sans-serif"
                    }}
                  >
                    <div className="h-4 w-2/3 rounded opacity-70" style={{ backgroundColor: textColor }} />
                    <div className="h-2 w-full rounded mt-2 opacity-30" style={{ backgroundColor: textColor }} />
                    <div className="h-2 w-4/5 rounded opacity-30" style={{ backgroundColor: textColor }} />
                    
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
                onClick={handleGenerateBlueprint}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
              >
                Generate Blueprint
                <Move className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 5 & 6: BLUEPRINT & EDITOR */}
        {phase === "blueprint" && (
          <motion.div
            key="blueprint"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#111] text-sm font-bold">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Implementation Blueprint</span>
              </div>
              <button onClick={() => setPhase("editor")} className="text-[10px] text-[#888] hover:text-[#111] font-bold uppercase underline">
                Back to Design
              </button>
            </div>

            {blueprintLoading && !blueprintData ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Cpu className="w-8 h-8 text-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-[#555] uppercase tracking-wider">Architecting Blueprint...</span>
              </div>
            ) : blueprintData && (
              <div className="flex flex-col gap-5 mt-2">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pages */}
                  <div className="flex flex-col gap-2">
                    <h5 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Pages</h5>
                    <div className="flex flex-col gap-1.5">
                      {blueprintData.pages?.map((p: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-medium text-[#333]"><Check className="w-3.5 h-3.5 text-emerald-500" /> {p}</div>
                      ))}
                    </div>
                  </div>

                  {/* Backend */}
                  <div className="flex flex-col gap-2">
                    <h5 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Backend</h5>
                    <div className="flex flex-col gap-1.5">
                      {blueprintData.backend?.map((p: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-medium text-[#333]"><Check className="w-3.5 h-3.5 text-emerald-500" /> {p}</div>
                      ))}
                    </div>
                  </div>

                  {/* Integrations */}
                  <div className="flex flex-col gap-2">
                    <h5 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">Integrations</h5>
                    <div className="flex flex-col gap-1.5">
                      {blueprintData.integrations?.map((p: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-medium text-[#333]"><Check className="w-3.5 h-3.5 text-emerald-500" /> {p}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Blueprint Editor */}
                <div className="bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl p-3 flex flex-col gap-2 relative">
                   {blueprintLoading && (
                     <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
                       <Cpu className="w-5 h-5 text-indigo-500 animate-spin" />
                     </div>
                   )}
                   <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Edit Blueprint</label>
                   <div className="flex items-center gap-2">
                     <input 
                       type="text" 
                       placeholder="e.g. Remove Checkout, Add Wishlist, Add Admin Dashboard" 
                       value={blueprintInput}
                       onChange={e => setBlueprintInput(e.target.value)}
                       className="flex-1 bg-white border border-[#e8e8e8] rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                     />
                     <button 
                       onClick={handleUpdateBlueprint}
                       disabled={!blueprintInput.trim()}
                       className="px-4 py-2 bg-white border border-[#e8e8e8] hover:bg-[#f3f3f3] text-[#111] text-xs font-bold rounded-lg disabled:opacity-50 transition-all"
                     >
                       Update Plan
                     </button>
                   </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#e8e8e8] mt-2">
              <button 
                onClick={handleGoToFinalApproval}
                disabled={blueprintLoading || !blueprintData}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                <Play className="w-4 h-4 fill-white" />
                Confirm & Build Code
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 7: FINAL APPROVAL */}
        {phase === "final_approval" && (
          <motion.div
            key="final_approval"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-sm items-center text-center"
          >
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            
            <h3 className="text-lg font-bold text-[#111]">Final Approval</h3>
            <p className="text-xs text-[#666] mb-4">You are about to generate a full application.</p>
            
            <div className="flex flex-col gap-3 w-full max-w-[200px] text-left">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-[#333]">Design Selected</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-[#333]">Theme Selected</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-[#333]">Implementation Approved</span>
              </div>
            </div>

            <div className="w-full mt-4 pt-4 border-t border-[#e8e8e8]">
              <button 
                onClick={handleFinalize}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-[#111] hover:bg-[#333] text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
              >
                Generate App
                <Play className="w-4 h-4 fill-white" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
