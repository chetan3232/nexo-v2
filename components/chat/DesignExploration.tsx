import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Paintbrush, Sliders, Layout, Monitor } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { AppConcept, DesignTokens } from '../../types';
import { analyzeIntent } from '../../utils/intentAnalyzer';

interface DesignExplorationProps {
  prompt: string;
  onConfirm: (tokens: DesignTokens) => void;
}

export const DesignExploration: React.FC<DesignExplorationProps> = ({ prompt, onConfirm }) => {
  const buildPhase = useProjectStore((state) => state.buildPhase);
  const setBuildPhase = useProjectStore((state) => state.setBuildPhase);
  const concepts = useProjectStore((state) => state.concepts);
  const setDesignTokens = useProjectStore((state) => state.setDesignTokens);

  const [intentData, setIntentData] = useState<any>(null);
  const [selectedConcept, setSelectedConcept] = useState<AppConcept | null>(null);
  
  // Design editor tokens
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'custom'>('dark');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [accentColor, setAccentColor] = useState('#f97316');
  const [borderRadius, setBorderRadius] = useState('lg');
  const [fontFamily, setFontFamily] = useState('Inter');

  // Phase 1 intent analyzer trigger
  useEffect(() => {
    if (buildPhase === 1) {
      setTimeout(() => {
        const analyzed = analyzeIntent(prompt);
        setIntentData(analyzed);
      }, 1500);
    }
  }, [buildPhase, prompt]);

  // Sync design editor values when user selects a concept
  const handleSelectConcept = (concept: AppConcept) => {
    setSelectedConcept(concept);
    setThemeMode(concept.designTokens.themeMode);
    setPrimaryColor(concept.designTokens.primaryColor);
    setAccentColor(concept.designTokens.accentColor);
    setBorderRadius(concept.designTokens.borderRadius);
    setFontFamily(concept.designTokens.fontFamily);
    setBuildPhase(3); // Progress to design editor customization
  };

  const handleApplyDesign = () => {
    const tokens: DesignTokens = {
      themeMode,
      primaryColor,
      accentColor,
      borderRadius,
      fontFamily,
    };
    setDesignTokens(tokens);
    onConfirm(tokens);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-white p-6 overflow-y-auto flex flex-col items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/10 via-stone-950 to-stone-950 -z-10"></div>

      <div className="max-w-4xl w-full space-y-8 relative z-10">
        
        {/* PHASE 1: Intent Extraction */}
        {buildPhase === 1 && (
          <div className="text-center space-y-6 max-w-xl mx-auto py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto"
            >
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight">Phase 1: Intent Extraction...</h2>
            <p className="text-stone-400 font-light">Analyzing requirements, extracting user journeys, platform limits and core components checklists.</p>
            
            {intentData ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3 font-mono text-sm"
              >
                <div><span className="text-indigo-400">Application:</span> {intentData.appType}</div>
                <div><span className="text-indigo-400">Target Audience:</span> {intentData.targetUsers}</div>
                <div><span className="text-indigo-400">Target Platform:</span> {intentData.platform}</div>
                <div>
                  <span className="text-indigo-400">Core Features:</span>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-stone-300">
                    {intentData.coreFeatures.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="text-xs font-mono text-stone-500 animate-pulse">Running semantic parsing model...</div>
            )}
          </div>
        )}

        {/* PHASE 2: Concept Selection */}
        {buildPhase === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Phase 2</span>
              <h2 className="text-3xl font-black">Choose a Concept Theme</h2>
              <p className="text-stone-400 max-w-md mx-auto text-sm">Select the visual foundations for your application. You can customize them in the next step.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4">
              {concepts.map((concept) => (
                <motion.div
                  key={concept.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-stone-900/60 border border-white/10 hover:border-indigo-500/50 p-6 rounded-[2rem] flex flex-col justify-between cursor-pointer group shadow-xl relative overflow-hidden transition-all"
                  onClick={() => handleSelectConcept(concept)}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                        <Paintbrush className="w-5 h-5 text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-mono text-stone-500 font-bold bg-white/5 px-2.5 py-1 rounded-full border border-white/5 uppercase">
                        {concept.designTokens.fontFamily}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold group-hover:text-indigo-300 transition-colors">{concept.name}</h3>
                    <p className="text-stone-400 text-xs leading-relaxed font-light">{concept.description}</p>
                    
                    <div className="flex gap-1.5 pt-2">
                      {concept.features.map((feat, i) => (
                        <span key={i} className="text-[10px] text-stone-300 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-medium">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: concept.designTokens.primaryColor }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: concept.designTokens.accentColor }} />
                    </div>
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Configure <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* PHASE 3: Design Editor */}
        {buildPhase === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">Phase 3</span>
              <h2 className="text-3xl font-black">Visual Design Editor</h2>
              <p className="text-stone-400 text-sm">Fine-tune styling, primary/accent colors, layouts and border systems.</p>
            </div>

            <div className="grid md:grid-cols-12 gap-8 pt-4 items-stretch">
              
              {/* Controls Column */}
              <div className="md:col-span-5 bg-stone-900/40 border border-white/10 rounded-[2rem] p-6 space-y-6 flex flex-col justify-between shadow-xl">
                <div className="space-y-6">
                  {/* Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold font-mono text-stone-400 uppercase tracking-wide">Theme Mode</label>
                    <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                      {(['dark', 'light'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setThemeMode(m)}
                          className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${themeMode === m ? 'bg-white text-black' : 'text-stone-400'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colors Section */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold font-mono text-stone-400 uppercase tracking-wide">Palette Colors</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-stone-500">Primary Color</span>
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-none bg-transparent" />
                          <span className="text-xs font-mono text-stone-300">{primaryColor}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-stone-500">Accent Color</span>
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-none bg-transparent" />
                          <span className="text-xs font-mono text-stone-300">{accentColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Borders Radius */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold font-mono text-stone-400 uppercase tracking-wide">Border Radius</label>
                    <div className="grid grid-cols-3 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                      {['md', 'lg', 'full'].map((r) => (
                        <button
                          key={r}
                          onClick={() => setBorderRadius(r)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all ${borderRadius === r ? 'bg-white text-black' : 'text-stone-400'}`}
                        >
                          {r.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography Font */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold font-mono text-stone-400 uppercase tracking-wide">Typography Font</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 px-3 py-2 rounded-xl text-xs text-stone-200 outline-none cursor-pointer"
                    >
                      {['Inter', 'Outfit', 'Geist'].map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleApplyDesign}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/10 mt-6"
                >
                  Apply & Confirm <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Rendering Mock Preview Column */}
              <div className="md:col-span-7 bg-[#0d0d0f] border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between min-h-[350px] shadow-xl relative overflow-hidden">
                <div className="absolute top-4 left-4 text-[10px] font-mono text-stone-600 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Monitor className="w-3.5 h-3.5" /> Component Mockup
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-6">
                  {/* Styled Dynamic Mock Component */}
                  <div
                    className="p-6 max-w-sm w-full space-y-4 border border-white/10 shadow-2xl transition-all"
                    style={{
                      borderRadius: borderRadius === 'md' ? '8px' : borderRadius === 'lg' ? '16px' : '9999px',
                      backgroundColor: themeMode === 'dark' ? '#1c1917' : '#ffffff',
                      color: themeMode === 'dark' ? '#ffffff' : '#1c1917',
                      fontFamily: fontFamily
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                        <Paintbrush className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">Theme Verification</div>
                        <div className="text-[10px] text-stone-400">Interactive live sandbox preview</div>
                      </div>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed font-light">
                      This element displays custom attributes configured inside the color picker and sidebar settings panel.
                    </p>
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        className="px-4 py-1.5 text-xs font-bold border border-stone-700 text-stone-400 hover:text-white transition-colors"
                        style={{ borderRadius: borderRadius === 'md' ? '4px' : borderRadius === 'lg' ? '8px' : '9999px' }}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-1.5 text-xs font-bold text-white transition-transform duration-200 active:scale-95"
                        style={{
                          backgroundColor: primaryColor,
                          borderRadius: borderRadius === 'md' ? '4px' : borderRadius === 'lg' ? '8px' : '9999px'
                        }}
                      >
                        Action
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-stone-500 text-center uppercase tracking-wider font-bold">
                  Updates reflect instantly in sandbox compiler
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default DesignExploration;
