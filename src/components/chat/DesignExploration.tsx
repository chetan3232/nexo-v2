import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Palette, 
  Layers, 
  Cpu, 
  Check, 
  Sliders, 
  Play, 
  Move, 
  MousePointer2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight 
} from "lucide-react";
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

  // Nexo Analyst states
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [blockingAnswer, setBlockingAnswer] = useState("");
  const [blockingSubmitting, setBlockingSubmitting] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const fetchAnalysis = async (currentPrompt: string, history: any[] = []) => {
    setAnalysisLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_prompt: currentPrompt,
          mode: "fullstack",
          conversation_history: history
        })
      });
      if (!res.ok) throw new Error("Failed to analyze requirements");
      const json = await res.json();
      setAnalysisData(json);
      return json;
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze requirements");
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // Trigger both in parallel
        const explorePromise = fetch("/api/ai/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt })
        }).then(res => {
          if (!res.ok) throw new Error("Failed to explore design");
          return res.json();
        });

        const [exploreJson, analyzeJson] = await Promise.all([
          explorePromise,
          fetchAnalysis(prompt)
        ]);

        setData(exploreJson);
      } catch (err) {
        console.error(err);
        onCancel();
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [prompt, onCancel]);

  const handleSubmitBlockingAnswer = async () => {
    if (!blockingAnswer.trim() || !analysisData?.blocking_question) return;
    
    setBlockingSubmitting(true);
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: prompt },
      { role: "assistant", content: JSON.stringify(analysisData) },
      { role: "user", content: `Answer to blocking question: "${blockingAnswer}"` }
    ];
    setConversationHistory(updatedHistory);
    
    try {
      const newAnalysis = await fetchAnalysis(prompt, updatedHistory);
      setBlockingAnswer("");
      if (newAnalysis?.ready_for_design !== false) {
        toast.success("Requirements resolved! Ready for design.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBlockingSubmitting(false);
    }
  };

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
    if (analysisData?.project_plan) {
      const plan = analysisData.project_plan;
      const initialBlueprint = {
        pages: plan.pages_or_screens?.map((p: any) => p.id + " - " + p.purpose) || [],
        backend: plan.key_features?.filter((f: any) => f.requires_backend).map((f: any) => f.name + " (" + f.complexity + ")") || [],
        integrations: plan.key_features?.filter((f: any) => !f.requires_backend && f.complexity === "high").map((f: any) => f.name) || ["Standard Integration"]
      };
      setBlueprintData(initialBlueprint);
    } else {
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
Concept: ${selectedConcept?.title || "Default"}
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
        
        {/* PHASE 1: INTENT & SPECIFICATION */}
        {(phase === "intent" || loading || analysisLoading) && (
          <motion.div
            key="intent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-4 bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-2.5">
              <div className="flex items-center gap-2 text-[#0ea5e9] text-xs font-bold uppercase tracking-wider">
                <Cpu className="w-4 h-4 animate-pulse" />
                <span>🧠 Nexo Analyst: Requirement & Project Plan</span>
              </div>
              {analysisData?.project_plan && (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase border border-emerald-100">
                  {analysisData.project_plan.project_name}
                </span>
              )}
            </div>

            {/* Loading states */}
            {(loading || analysisLoading) && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-stone-500">
                <Cpu className="w-8 h-8 text-[#0ea5e9] animate-spin" />
                <span className="text-xs font-semibold animate-pulse">Running pipeline requirement analysis & intent extraction...</span>
              </div>
            )}

            {/* Display Analysis Data */}
            {!loading && !analysisLoading && analysisData && (
              <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1">
                {/* Flags / Alerts */}
                {analysisData.flags && analysisData.flags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {analysisData.flags.map((flag: any, i: number) => (
                      <div key={i} className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold capitalize">{flag.type.replace("_", " ")}: </strong>
                          {flag.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Restated Request & Goals */}
                <div className="bg-[#fcfcfc] border border-[#e8e8e8] rounded-xl p-3.5 space-y-2">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Restated Goal & Target</div>
                  <h4 className="text-sm font-bold text-stone-850 leading-snug">{analysisData.requirement_analysis?.restated_request}</h4>
                  <p className="text-xs text-stone-500 leading-normal">
                    <strong>Core Purpose: </strong>{analysisData.project_plan?.core_purpose}
                    <br />
                    <strong>Target Audience: </strong>{analysisData.project_plan?.target_audience}
                  </p>
                </div>

                {/* Requirements Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-[#e8e8e8] rounded-xl p-3 space-y-2">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Explicit Requirements</div>
                    <ul className="space-y-1.5">
                      {analysisData.requirement_analysis?.explicit_requirements?.map((req: string, i: number) => (
                        <li key={i} className="text-xs text-stone-750 flex gap-2">
                          <span className="text-emerald-550 font-bold shrink-0">✓</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-[#e8e8e8] rounded-xl p-3 space-y-2">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Implied & Assumptions</div>
                    <ul className="space-y-1.5">
                      {analysisData.requirement_analysis?.implied_requirements?.map((req: string, i: number) => (
                        <li key={i} className="text-xs text-stone-600 flex gap-2">
                          <span className="text-[#0ea5e9] font-bold shrink-0">✦</span>
                          <span className="italic">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Screens & Execution Order */}
                <div className="border border-[#e8e8e8] rounded-xl p-3 space-y-3">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Proposed Architecture ({analysisData.project_plan?.mode})</div>
                  
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-stone-700">Pages / Screens:</div>
                    <div className="flex flex-wrap gap-2">
                      {analysisData.project_plan?.pages_or_screens?.map((page: any, i: number) => (
                        <div key={i} className="bg-stone-50 border border-[#e8e8e8] px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${page.priority === "core" ? "bg-indigo-500" : "bg-stone-400"}`} />
                          <span className="font-semibold text-stone-850">{page.id}</span>
                          <span className="text-[10px] text-stone-450">({page.purpose})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-[#f0f0f0]">
                    <div className="text-xs font-bold text-stone-700">Planned Milestones & Steps:</div>
                    <div className="space-y-1.5">
                      {analysisData.project_plan?.execution_order?.map((step: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs text-stone-650">
                          <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 shrink-0">{i + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Blocking Question Clarification */}
                {analysisData.ready_for_design === false && analysisData.blocking_question && (
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3 mt-1 shrink-0">
                    <div className="flex items-center gap-2 text-sky-850 font-semibold text-xs">
                      <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Clarification Needed Before Building</span>
                    </div>
                    <p className="text-xs text-sky-700 font-medium leading-relaxed bg-white/70 p-2.5 rounded-lg border border-sky-100">
                      {analysisData.blocking_question}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your answer here..."
                        value={blockingAnswer}
                        onChange={(e) => setBlockingAnswer(e.target.value)}
                        disabled={blockingSubmitting}
                        className="flex-1 bg-white border border-[#e8e8e8] focus:border-[#0ea5e9] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                      <button
                        onClick={handleSubmitBlockingAnswer}
                        disabled={blockingSubmitting || !blockingAnswer.trim()}
                        className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all shrink-0"
                      >
                        {blockingSubmitting ? "Submitting..." : "Submit Answer"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer triggers */}
            {!loading && !analysisLoading && analysisData && (
              <div className="flex justify-end pt-2.5 border-t border-[#e8e8e8] mt-1">
                {analysisData.ready_for_design !== false ? (
                  <button
                    onClick={() => setPhase("concepts")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                  >
                    Proceed to Design Style Cards
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 text-stone-500 hover:text-stone-700 text-xs font-bold"
                  >
                    Cancel Build
                  </button>
                )}
              </div>
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
