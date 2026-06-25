import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Palette, 
  Layers, 
  Cpu, 
  Check, 
  Sliders, 
  Play, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  Plus,
  X,
  Pencil,
  ChevronRight,
  Zap,
  Database,
  Lock,
  Server,
  Globe,
  RotateCcw,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

interface DesignExplorationProps {
  prompt: string;
  onConfirm: (enrichedPrompt: string) => void;
  onCancel: () => void;
}

// ─── Inline Editable Item ──────────────────────────────────────────────────────
const EditableItem: React.FC<{
  value: string;
  onEdit: (v: string) => void;
  onDelete: () => void;
  color?: string;
}> = ({ value, onEdit, onDelete, color = "#0ea5e9" }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    if (draft.trim()) onEdit(draft.trim());
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-1.5 group">
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className="flex-1 text-xs bg-white border border-[#0ea5e9] rounded-lg px-2 py-1 outline-none"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className="flex-1 text-xs text-[#333] cursor-pointer hover:text-[#111] leading-snug"
        >
          {value}
        </span>
      )}
      <button
        onClick={() => { setEditing(true); setDraft(value); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-[#aaa] hover:text-[#555]"
      >
        <Pencil className="w-2.5 h-2.5" />
      </button>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-[#aaa] hover:text-red-500"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};

// ─── Blueprint Section ─────────────────────────────────────────────────────────
const BlueprintSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: string[];
  onUpdate: (items: string[]) => void;
  color: string;
}> = ({ title, icon, items, onUpdate, color }) => {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");
  const addRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) addRef.current?.focus();
  }, [adding]);

  const addItem = () => {
    if (newItem.trim()) {
      onUpdate([...items, newItem.trim()]);
      setNewItem("");
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{icon}</span>
          <h5 className="text-[10px] font-bold text-[#888] uppercase tracking-wider">{title}</h5>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="text-[#aaa] hover:text-[#555] transition-colors"
          title="Add item"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <EditableItem
              value={item}
              onEdit={(v) => { const next = [...items]; next[i] = v; onUpdate(next); }}
              onDelete={() => onUpdate(items.filter((_, idx) => idx !== i))}
              color={color}
            />
          </div>
        ))}

        {adding && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1 h-1 rounded-full shrink-0 bg-[#ddd]" />
            <input
              ref={addRef}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onBlur={() => { addItem(); setAdding(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
                if (e.key === "Escape") { setNewItem(""); setAdding(false); }
              }}
              placeholder="Type and press Enter..."
              className="flex-1 text-xs bg-white border border-[#e8e8e8] focus:border-[#0ea5e9] rounded-lg px-2 py-1 outline-none"
            />
          </div>
        )}

        {items.length === 0 && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[10px] text-[#aaa] hover:text-[#555] italic text-left"
          >
            + Add {title.toLowerCase()} item
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Concept Card ──────────────────────────────────────────────────────────────
const ConceptCard: React.FC<{
  concept: any;
  selected: boolean;
  onClick: () => void;
}> = ({ concept, selected, onClick }) => {
  const s = concept.styles || {};
  const moodColors: Record<string, string> = {
    professional: "#6366f1", minimal: "#64748b", corporate: "#0369a1",
    elegant: "#7c3aed", bold: "#ef4444", playful: "#f59e0b",
    creative: "#ec4899", vibrant: "#10b981", energetic: "#f97316",
  };
  const moodColor = moodColors[concept.mood] || "#0ea5e9";
  const styleColors: Record<string, string> = {
    flat: "#64748b", glassmorphism: "#6366f1", neumorphic: "#8b5cf6"
  };

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" }}
      onClick={onClick}
      className={`relative p-4 rounded-2xl cursor-pointer transition-all border-2 overflow-hidden ${
        selected
          ? "border-[#0ea5e9] shadow-lg shadow-[#0ea5e9]/10"
          : "border-[#e8e8e8] hover:border-[#c8c8c8] bg-white"
      }`}
      style={{ background: selected ? s.backgroundColor || "#fff" : "#fff" }}
    >
      {/* Selected checkmark */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#0ea5e9] flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-white" />
        </motion.div>
      )}

      {/* Concept ID badge */}
      <div
        className="absolute top-3 left-3 w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
        style={{ backgroundColor: s.primaryColor || "#0ea5e9" }}
      >
        {concept.id}
      </div>

      {/* Color strip */}
      <div className="flex gap-1 mt-7 mb-3">
        {[s.primaryColor, s.accentColor, s.backgroundColor, s.cardColor, s.textColor].filter(Boolean).map((c, i) => (
          <div
            key={i}
            className="flex-1 h-6 rounded-md border border-white/20"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {/* Title & description */}
      <h4 className="text-sm font-bold text-[#111] mb-1 pr-6">{concept.title}</h4>
      <p className="text-[11px] text-[#666] leading-relaxed mb-3">{concept.description}</p>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        {concept.mood && (
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: moodColor + "15", color: moodColor }}
          >
            {concept.mood}
          </span>
        )}
        {concept.componentStyle && (
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: (styleColors[concept.componentStyle] || "#64748b") + "15", color: styleColors[concept.componentStyle] || "#64748b" }}
          >
            {concept.componentStyle}
          </span>
        )}
        {concept.darkMode && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
            Dark Mode
          </span>
        )}
        {concept.gradients && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-500">
            Gradients
          </span>
        )}
      </div>

      {/* Mock UI preview */}
      <div
        className="mt-3 rounded-xl p-2.5 overflow-hidden"
        style={{ backgroundColor: s.cardColor || "#f7f7f7", border: `1px solid ${s.primaryColor}22` }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.primaryColor }} />
          <div className="h-1.5 w-12 rounded-full opacity-40" style={{ backgroundColor: s.textColor || "#111" }} />
          <div className="ml-auto">
            <div className="h-1.5 w-6 rounded-full" style={{ backgroundColor: s.primaryColor }} />
          </div>
        </div>
        <div className="space-y-1 mb-2">
          <div className="h-2 rounded-full w-3/4 opacity-20" style={{ backgroundColor: s.textColor || "#111" }} />
          <div className="h-1.5 rounded-full w-full opacity-10" style={{ backgroundColor: s.textColor || "#111" }} />
          <div className="h-1.5 rounded-full w-4/5 opacity-10" style={{ backgroundColor: s.textColor || "#111" }} />
        </div>
        <button
          className="text-[8px] font-bold text-white px-2 py-1 w-full mt-1"
          style={{
            backgroundColor: s.primaryColor,
            borderRadius: parseInt(s.borderRadius || "8") * 0.6 + "px"
          }}
        >
          Get Started
        </button>
      </div>

      {/* Font */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[9px] text-[#aaa]" style={{ fontFamily: `'${s.typography}', sans-serif` }}>
          Aa — {s.typography || "Inter"}
        </span>
        <span className="text-[9px] text-[#aaa]">r: {s.borderRadius}</span>
      </div>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const DesignExploration: React.FC<DesignExplorationProps> = ({ prompt, onConfirm, onCancel }) => {
  const [phase, setPhase] = useState<"thinking" | "concepts" | "editor" | "blueprint" | "final_approval">("thinking");
  const [exploreData, setExploreData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [selectedConcept, setSelectedConcept] = useState<any>(null);

  // Design editor state
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9");
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [cardColor, setCardColor] = useState("#f7f7f7");
  const [textColor, setTextColor] = useState("#111111");
  const [borderRadius, setBorderRadius] = useState("12px");
  const [typography, setTypography] = useState("Inter");
  const [animation, setAnimation] = useState("Normal");
  const [themeMode, setThemeMode] = useState<"Light" | "Dark" | "Auto" | "Custom">("Custom");
  const [componentStyle, setComponentStyle] = useState<"flat" | "glassmorphism" | "neumorphic">("flat");
  const [darkMode, setDarkMode] = useState(false);
  const [gradients, setGradients] = useState(false);

  // Blueprint state
  const [blueprintData, setBlueprintData] = useState<{
    pages: string[];
    backend: string[];
    integrations: string[];
    features?: string[];
  } | null>(null);
  const [blueprintLoading, setBlueprintLoading] = useState(false);

  // Clarification state
  const [blockingAnswer, setBlockingAnswer] = useState("");
  const [blockingSubmitting, setBlockingSubmitting] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  // Animated thinking steps
  const thinkingSteps = [
    "Parsing your prompt and extracting intent...",
    "Classifying app type and target audience...",
    "Identifying pages, features, and scope...",
    "Detecting backend, auth & database requirements...",
    "Generating 2 distinct design concepts in parallel...",
    "Building implementation blueprint...",
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setThinkingStep((s) => (s < thinkingSteps.length - 1 ? s + 1 : s));
      }, 900);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Single /studio-init call fires everything in parallel
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/ai/studio-init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, mode: "fullstack" }),
        });

        if (!res.ok) throw new Error("Studio init failed");
        const json = await res.json();

        setExploreData(json.explore);
        setAnalysisData(json.analysis);

        // Auto-advance to concepts if ready
        if (json.analysis?.ready_for_design !== false) {
          setPhase("concepts");
        } else {
          setPhase("thinking"); // show blocking question
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to initialize NexoStudio");
        onCancel();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [prompt]);

  const handleSubmitBlockingAnswer = async () => {
    if (!blockingAnswer.trim() || !analysisData?.blocking_question) return;
    setBlockingSubmitting(true);
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: prompt },
      { role: "assistant", content: JSON.stringify(analysisData) },
      { role: "user", content: `Answer: "${blockingAnswer}"` },
    ];
    setConversationHistory(updatedHistory);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_prompt: prompt, mode: "fullstack", conversation_history: updatedHistory }),
      });
      const newAnalysis = await res.json();
      setAnalysisData(newAnalysis);
      setBlockingAnswer("");
      if (newAnalysis?.ready_for_design !== false) {
        setPhase("concepts");
        toast.success("Requirements resolved! Proceeding to design.");
      }
    } catch {
      toast.error("Failed to re-analyze. Try again.");
    } finally {
      setBlockingSubmitting(false);
    }
  };

  const handleSelectConcept = (concept: any) => {
    setSelectedConcept(concept);
    const s = concept.styles || {};
    setPrimaryColor(s.primaryColor || "#0ea5e9");
    setAccentColor(s.accentColor || "#6366f1");
    setBgColor(s.backgroundColor || "#ffffff");
    setCardColor(s.cardColor || "#f7f7f7");
    setTextColor(s.textColor || "#111111");
    setBorderRadius(s.borderRadius || "12px");
    setTypography(s.typography || "Inter");
    setAnimation(s.animation || "Normal");
    setDarkMode(concept.darkMode || false);
    setGradients(concept.gradients || false);
    setComponentStyle(concept.componentStyle || "flat");
    setThemeMode(concept.darkMode ? "Dark" : "Light");
    setPhase("editor");
  };

  const handleGenerateBlueprint = () => {
    setPhase("blueprint");
    const plan = analysisData?.project_plan;
    if (plan) {
      const needsBackend = analysisData?.build_metadata?.needs_backend ?? true;
      setBlueprintData({
        pages: plan.pages_or_screens?.map((p: any) => `${p.id} — ${p.purpose}`) || [],
        backend: needsBackend
          ? plan.key_features?.filter((f: any) => f.requires_backend).map((f: any) => `${f.name} (${f.complexity})`) || []
          : [],
        integrations: plan.key_features?.filter((f: any) => !f.requires_backend).map((f: any) => f.name) || [],
        features: plan.key_features?.map((f: any) => f.name) || [],
      });
    } else {
      setBlueprintLoading(true);
      fetch("/api/ai/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
        .then((r) => r.json())
        .then((json) => setBlueprintData(json))
        .catch(() => toast.error("Failed to generate blueprint"))
        .finally(() => setBlueprintLoading(false));
    }
  };

  const handleFinalize = () => {
    const meta = analysisData?.build_metadata || {};
    const enrichedPrompt = `${prompt}

=== NEXO STUDIO DESIGN CONSTRAINTS ===
Concept: ${selectedConcept?.title || "Default"}
Mood: ${selectedConcept?.mood || "professional"}
Component Style: ${componentStyle}
Theme Mode: ${themeMode}
Dark Mode: ${darkMode}
Gradients: ${gradients}
Primary Color: ${primaryColor}
Accent Color: ${accentColor}
Background: ${bgColor}
Card Color: ${cardColor}
Text Color: ${textColor}
Border Radius: ${borderRadius}
Typography: ${typography}
Animation Level: ${animation}

=== IMPLEMENTATION BLUEPRINT ===
Pages: ${blueprintData?.pages?.join(", ") || "Default"}
Backend: ${blueprintData?.backend?.join(", ") || "None"}
Integrations: ${blueprintData?.integrations?.join(", ") || "None"}

=== BUILD METADATA ===
Project Mode: ${meta.frontend_only ? "frontend" : "fullstack"}
Needs Backend: ${meta.needs_backend ?? true}
Needs Auth: ${meta.needs_auth ?? false}
Needs Database: ${meta.needs_database ?? false}
Overall Complexity: ${meta.overall_complexity || "medium"}
Suggested Stack: ${JSON.stringify(meta.suggested_stack || {})}
================================`;
    onConfirm(enrichedPrompt);
  };

  const meta = analysisData?.build_metadata;
  const isFrontendOnly = meta?.frontend_only === true;

  // ── PHASE: THINKING / LOADING ──────────────────────────────────────────────
  const renderThinking = () => (
    <motion.div
      key="thinking"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col gap-4 bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
        <div className="flex items-center gap-2 text-[#0ea5e9] text-xs font-bold uppercase tracking-wider">
          <Cpu className="w-4 h-4 animate-pulse" />
          <span>🧠 NexoStudio — Thinking</span>
        </div>
        {analysisData?.project_plan && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase border border-emerald-100">
            {analysisData.project_plan.project_name}
          </span>
        )}
      </div>

      {/* Animated thinking steps */}
      {loading && (
        <div className="flex flex-col gap-2.5 py-2">
          {thinkingSteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= thinkingStep ? 1 : 0.2, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-2.5 text-xs ${i === thinkingStep ? "text-[#0ea5e9] font-semibold" : i < thinkingStep ? "text-[#aaa] line-through" : "text-[#ddd]"}`}
            >
              {i < thinkingStep ? (
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : i === thinkingStep ? (
                <span className="flex gap-0.5 shrink-0">
                  {[0,1,2].map(j => (
                    <span key={j} className="w-1 h-1 bg-[#0ea5e9] rounded-full animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />
                  ))}
                </span>
              ) : (
                <div className="w-3 h-3 rounded-full border border-[#ddd] shrink-0" />
              )}
              {step}
            </motion.div>
          ))}
        </div>
      )}

      {/* Analysis results */}
      {!loading && analysisData && (
        <div className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1">
          {/* Thinking summary */}
          {analysisData.thinking_summary && (
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3 flex gap-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0ea5e9] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#0369a1] leading-relaxed italic">{analysisData.thinking_summary}</p>
            </div>
          )}

          {/* Build metadata chips */}
          {meta && (
            <div className="flex flex-wrap gap-2">
              <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isFrontendOnly ? "bg-sky-50 text-sky-600 border border-sky-200" : "bg-violet-50 text-violet-600 border border-violet-200"}`}>
                <Globe className="w-2.5 h-2.5" />
                {isFrontendOnly ? "Frontend Only" : "Fullstack"}
              </span>
              {meta.needs_backend && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <Server className="w-2.5 h-2.5" />Backend
                </span>
              )}
              {meta.needs_auth && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                  <Lock className="w-2.5 h-2.5" />Auth
                </span>
              )}
              {meta.needs_database && (
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  <Database className="w-2.5 h-2.5" />Database
                </span>
              )}
              <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                meta.overall_complexity === "simple" ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : meta.overall_complexity === "medium" ? "bg-blue-50 text-blue-600 border border-blue-200"
                : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                <Zap className="w-2.5 h-2.5" />
                {meta.overall_complexity} · {meta.estimated_build_time}
              </span>
            </div>
          )}

          {/* Flags */}
          {analysisData.flags?.length > 0 && (
            <div className="flex flex-col gap-2">
              {analysisData.flags.map((flag: any, i: number) => (
                <div key={i} className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold capitalize">{flag.type?.replace("_", " ")}: </strong>
                    {flag.message}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Restated goal */}
          <div className="bg-[#fcfcfc] border border-[#e8e8e8] rounded-xl p-3.5 space-y-2">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Restated Goal</div>
            <h4 className="text-sm font-bold text-stone-850 leading-snug">{analysisData.requirement_analysis?.restated_request}</h4>
            <p className="text-xs text-stone-500">
              <strong>Purpose: </strong>{analysisData.project_plan?.core_purpose}<br />
              <strong>For: </strong>{analysisData.project_plan?.target_audience}
            </p>
          </div>

          {/* Pages & Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-[#e8e8e8] rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pages / Screens</div>
              <div className="flex flex-wrap gap-1.5">
                {analysisData.project_plan?.pages_or_screens?.map((page: any, i: number) => (
                  <div key={i} className="flex items-center gap-1 bg-stone-50 border border-[#e8e8e8] px-2 py-1 rounded-lg text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${page.priority === "core" ? "bg-indigo-500" : "bg-stone-400"}`} />
                    <span className="font-semibold text-stone-800">{page.id}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#e8e8e8] rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Suggested Stack</div>
              {meta?.suggested_stack && (
                <div className="flex flex-col gap-1">
                  {Object.entries(meta.suggested_stack).filter(([,v]) => v && v !== "null").map(([k, v]: any) => (
                    <div key={k} className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#aaa] w-16 capitalize">{k}:</span>
                      <span className="font-semibold text-[#333]">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Blocking question */}
          {analysisData.ready_for_design === false && analysisData.blocking_question && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
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
                  placeholder="Type your answer..."
                  value={blockingAnswer}
                  onChange={(e) => setBlockingAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmitBlockingAnswer()}
                  disabled={blockingSubmitting}
                  className="flex-1 bg-white border border-[#e8e8e8] focus:border-[#0ea5e9] rounded-lg px-3 py-2 text-xs outline-none"
                />
                <button
                  onClick={handleSubmitBlockingAnswer}
                  disabled={blockingSubmitting || !blockingAnswer.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all"
                >
                  {blockingSubmitting ? "..." : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!loading && analysisData && (
        <div className="flex justify-end pt-2.5 border-t border-[#e8e8e8]">
          {analysisData.ready_for_design !== false ? (
            <button
              onClick={() => setPhase("concepts")}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              Proceed to Design Concepts
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onCancel} className="px-4 py-2 text-stone-500 hover:text-stone-700 text-xs font-bold">
              Cancel Build
            </button>
          )}
        </div>
      )}
    </motion.div>
  );

  // ── PHASE: CONCEPTS ────────────────────────────────────────────────────────
  const renderConcepts = () => (
    <motion.div
      key="concepts"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider">
          <Palette className="w-4 h-4" />
          <span>Select Your Design Concept</span>
        </div>
        <button
          onClick={() => setPhase("thinking")}
          className="text-[10px] text-[#aaa] hover:text-[#555] font-bold uppercase flex items-center gap-1"
        >
          <ChevronRight className="w-3 h-3 rotate-180" />Back
        </button>
      </div>

      {exploreData?.concepts?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {exploreData.concepts.map((concept: any, idx: number) => (
            <ConceptCard
              key={idx}
              concept={concept}
              selected={selectedConcept?.id === concept.id}
              onClick={() => handleSelectConcept(concept)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-stone-400">
          <Cpu className="w-8 h-8 animate-spin" />
          <span className="text-xs">Generating design concepts...</span>
        </div>
      )}
    </motion.div>
  );

  // ── PHASE: EDITOR ──────────────────────────────────────────────────────────
  const renderEditor = () => {
    const previewBg = themeMode === "Dark" ? "#0f0f0f"
      : themeMode === "Light" ? "#ffffff"
      : bgColor;
    const previewCard = themeMode === "Dark" ? "#1c1c1c"
      : themeMode === "Light" ? "#f7f7f7"
      : cardColor;
    const previewText = themeMode === "Dark" ? "#f0f0f0"
      : themeMode === "Light" ? "#111111"
      : textColor;

    const getCardStyle = () => {
      if (componentStyle === "glassmorphism") return {
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(12px)",
        border: `1px solid rgba(255,255,255,0.2)`,
      };
      if (componentStyle === "neumorphic") return {
        background: previewCard,
        boxShadow: `4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.6)`,
        border: "none",
      };
      return { background: previewCard, border: `1px solid ${primaryColor}22` };
    };

    return (
      <motion.div
        key="editor"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="flex flex-col gap-4 bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#111] text-sm font-bold">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>Design Editor — {selectedConcept?.title}</span>
          </div>
          <button onClick={() => setPhase("concepts")} className="text-[10px] text-[#888] hover:text-[#111] font-bold uppercase underline">
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
          {/* Controls */}
          <div className="flex flex-col gap-3.5">
            {/* Theme mode */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Theme Mode</label>
              <div className="flex gap-1.5">
                {["Light", "Dark", "Auto", "Custom"].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode as any)}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                      themeMode === mode ? "bg-indigo-500 text-white" : "bg-[#f3f3f3] text-[#555] hover:bg-[#e8e8e8]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Component style */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Component Style</label>
              <div className="flex gap-1.5">
                {(["flat", "glassmorphism", "neumorphic"] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => setComponentStyle(style)}
                    className={`flex-1 px-2 py-1.5 text-[9px] font-semibold rounded-lg transition-all capitalize ${
                      componentStyle === style ? "bg-violet-500 text-white" : "bg-[#f3f3f3] text-[#555] hover:bg-[#e8e8e8]"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Primary", value: primaryColor, set: setPrimaryColor },
                { label: "Accent", value: accentColor, set: setAccentColor },
                ...(themeMode === "Custom" ? [
                  { label: "Background", value: bgColor, set: setBgColor },
                  { label: "Card", value: cardColor, set: setCardColor },
                  { label: "Text", value: textColor, set: setTextColor },
                ] : []),
              ].map(({ label, value, set }) => (
                <div key={label} className="space-y-1">
                  <label className="text-[9px] font-bold text-[#555] uppercase tracking-wider">{label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={value} onChange={e => set(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                    <span className="text-[10px] text-[#111] font-mono">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Toggles */}
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${darkMode ? "bg-indigo-500" : "bg-[#ddd]"}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${darkMode ? "left-4" : "left-0.5"}`} />
                </div>
                <span className="text-[10px] font-semibold text-[#555]">Dark Mode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setGradients(!gradients)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${gradients ? "bg-purple-500" : "bg-[#ddd]"}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${gradients ? "left-4" : "left-0.5"}`} />
                </div>
                <span className="text-[10px] font-semibold text-[#555]">Gradients</span>
              </label>
            </div>

            {/* Border radius */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Border Radius ({borderRadius})</label>
              <input
                type="range" min="0" max="32" step="4"
                value={parseInt(borderRadius)}
                onChange={e => setBorderRadius(`${e.target.value}px`)}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Typography */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Typography</label>
              <select value={typography} onChange={e => setTypography(e.target.value)} className="w-full text-xs p-2 border border-[#e8e8e8] rounded-lg outline-none focus:border-indigo-500">
                <option value="Inter">Inter (Clean)</option>
                <option value="Outfit">Outfit (Modern)</option>
                <option value="Space Grotesk">Space Grotesk (Tech)</option>
                <option value="Playfair Display">Playfair (Elegant)</option>
                <option value="DM Sans">DM Sans (Friendly)</option>
              </select>
            </div>

            {/* Animation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Animation Level</label>
              <select value={animation} onChange={e => setAnimation(e.target.value)} className="w-full text-xs p-2 border border-[#e8e8e8] rounded-lg outline-none focus:border-indigo-500">
                <option value="Minimal">Minimal</option>
                <option value="Normal">Normal</option>
                <option value="Premium">Premium (Bounce, Stagger)</option>
              </select>
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#555] uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3" /> Live Preview
              </label>
              <button
                onClick={() => handleSelectConcept(selectedConcept)}
                className="text-[9px] text-[#aaa] hover:text-[#555] flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />Reset
              </button>
            </div>

            <div
              className="flex-1 rounded-xl p-3 overflow-hidden min-h-[280px] transition-all duration-300"
              style={{ backgroundColor: previewBg, ...(gradients ? { background: `linear-gradient(135deg, ${previewBg}, ${primaryColor}18)` } : {}) }}
            >
              {/* Mock nav */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: primaryColor }} />
                  <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: previewText, opacity: 0.8 }} />
                </div>
                <div className="flex items-center gap-1.5">
                  {[0,1,2].map(i => <div key={i} className="h-1 w-5 rounded-full" style={{ backgroundColor: previewText, opacity: 0.3 }} />)}
                  <div className="h-4 w-10 rounded-md" style={{ backgroundColor: primaryColor }} />
                </div>
              </div>

              {/* Mock hero */}
              <div className="px-1 mb-3 space-y-1.5">
                <div className="h-3 w-3/4 rounded-full" style={{ backgroundColor: previewText, opacity: 0.8 }} />
                <div className="h-2 w-full rounded-full" style={{ backgroundColor: previewText, opacity: 0.3 }} />
                <div className="h-2 w-4/5 rounded-full" style={{ backgroundColor: previewText, opacity: 0.2 }} />
                <div className="flex gap-1.5 mt-2.5">
                  <button
                    className="px-3 py-1.5 text-[8px] font-bold text-white transition-all"
                    style={{
                      backgroundColor: gradients ? undefined : primaryColor,
                      background: gradients ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})` : undefined,
                      borderRadius: `calc(${borderRadius} * 0.7)`,
                    }}
                  >
                    Get Started
                  </button>
                  <button
                    className="px-3 py-1.5 text-[8px] font-bold"
                    style={{ backgroundColor: "transparent", color: primaryColor, border: `1px solid ${primaryColor}`, borderRadius: `calc(${borderRadius} * 0.7)` }}
                  >
                    Learn More
                  </button>
                </div>
              </div>

              {/* Mock card */}
              <div className="p-2.5 transition-all duration-300" style={{ borderRadius, ...getCardStyle() }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded-lg" style={{ backgroundColor: `${primaryColor}30` }}>
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                    </div>
                  </div>
                  <div className="h-2 w-16 rounded-full" style={{ backgroundColor: previewText, opacity: 0.6 }} />
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: previewText, opacity: 0.15 }} />
                  <div className="h-1.5 w-4/5 rounded-full" style={{ backgroundColor: previewText, opacity: 0.1 }} />
                </div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-[9px]" style={{ color: previewText, opacity: 0.4, fontFamily: `'${typography}', sans-serif` }}>
                  {typography} — {componentStyle} — r:{borderRadius}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#e8e8e8]">
          <button
            onClick={handleGenerateBlueprint}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            <Layers className="w-4 h-4" />
            Generate Blueprint
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  // ── PHASE: BLUEPRINT ───────────────────────────────────────────────────────
  const renderBlueprint = () => (
    <motion.div
      key="blueprint"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col gap-4 bg-white border border-[#e8e8e8] rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#111] text-sm font-bold">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Implementation Blueprint</span>
          {isFrontendOnly && (
            <span className="text-[9px] bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full font-bold uppercase">
              Frontend Only
            </span>
          )}
        </div>
        <button onClick={() => setPhase("editor")} className="text-[10px] text-[#888] hover:text-[#111] font-bold uppercase underline">
          Back to Design
        </button>
      </div>

      {/* Suggested stack */}
      {meta?.suggested_stack && (
        <div className="flex flex-wrap gap-2 p-3 bg-[#f7f7f7] rounded-xl border border-[#e8e8e8]">
          <span className="text-[9px] font-bold text-[#aaa] uppercase w-full mb-0.5">Suggested Stack</span>
          {Object.entries(meta.suggested_stack).filter(([,v]) => v && v !== "null").map(([k, v]: any) => (
            <span key={k} className="text-[9px] bg-white border border-[#e8e8e8] px-2 py-1 rounded-lg font-medium text-[#555]">
              <span className="text-[#aaa]">{k}: </span>{v}
            </span>
          ))}
        </div>
      )}

      {blueprintLoading && !blueprintData ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Cpu className="w-8 h-8 text-indigo-500 animate-pulse" />
          <span className="text-xs font-bold text-[#555] uppercase tracking-wider">Architecting Blueprint...</span>
        </div>
      ) : blueprintData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {blueprintLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          )}

          <BlueprintSection
            title="Pages"
            icon={<Globe className="w-3 h-3" />}
            items={blueprintData.pages || []}
            onUpdate={(items) => setBlueprintData(d => d ? { ...d, pages: items } : d)}
            color="#6366f1"
          />

          {!isFrontendOnly && (
            <BlueprintSection
              title="Backend"
              icon={<Server className="w-3 h-3" />}
              items={blueprintData.backend || []}
              onUpdate={(items) => setBlueprintData(d => d ? { ...d, backend: items } : d)}
              color="#f59e0b"
            />
          )}

          <BlueprintSection
            title="Features"
            icon={<Zap className="w-3 h-3" />}
            items={blueprintData.integrations || []}
            onUpdate={(items) => setBlueprintData(d => d ? { ...d, integrations: items } : d)}
            color="#10b981"
          />
        </div>
      ) : null}

      <div className="flex justify-between items-center pt-2 border-t border-[#e8e8e8]">
        <span className="text-[10px] text-[#aaa]">Click any item to edit · + to add · × to remove</span>
        <button
          onClick={() => setPhase("final_approval")}
          disabled={blueprintLoading || !blueprintData}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          Confirm & Build
        </button>
      </div>
    </motion.div>
  );

  // ── PHASE: FINAL APPROVAL ──────────────────────────────────────────────────
  const renderFinalApproval = () => (
    <motion.div
      key="final_approval"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-col gap-4 bg-white border border-[#e8e8e8] rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 text-[#111] text-sm font-bold">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <span>Ready to Build</span>
      </div>

      {/* Design summary strip */}
      <div className="flex gap-2 p-3 bg-[#f7f7f7] rounded-xl border border-[#e8e8e8]">
        <div className="flex gap-1.5 flex-1 items-center">
          {[primaryColor, accentColor, bgColor, cardColor, textColor].map((c, i) => (
            <div key={i} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
          ))}
          <div className="ml-2 flex flex-col">
            <span className="text-[10px] font-bold text-[#333]">{selectedConcept?.title}</span>
            <span className="text-[9px] text-[#aaa]">{typography} · {componentStyle} · r:{borderRadius}</span>
          </div>
        </div>
        <button onClick={() => setPhase("editor")} className="text-[9px] text-[#aaa] hover:text-[#555] underline shrink-0">
          Edit
        </button>
      </div>

      {/* Summary checklist */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Design Concept Selected", done: !!selectedConcept },
          { label: "Theme & Colors Set", done: true },
          { label: "Pages Defined", done: (blueprintData?.pages?.length || 0) > 0 },
          { label: `Mode: ${isFrontendOnly ? "Frontend Only" : "Fullstack"}`, done: true },
          { label: `Complexity: ${meta?.overall_complexity || "medium"}`, done: true },
          { label: `Build: ${meta?.estimated_build_time || "~1min"}`, done: true },
        ].map(({ label, done }, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-100" : "bg-stone-100"}`}>
              {done ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <X className="w-2.5 h-2.5 text-stone-400" />}
            </div>
            <span className="text-[10px] font-semibold text-[#555]">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-[#e8e8e8]">
        <button
          onClick={() => setPhase("blueprint")}
          className="flex-1 py-2.5 border border-[#e8e8e8] hover:bg-[#f3f3f3] text-[#555] rounded-xl text-xs font-bold transition-all"
        >
          Edit Blueprint
        </button>
        <button
          onClick={handleFinalize}
          className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          Generate App
        </button>
      </div>
    </motion.div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col gap-4 py-4 px-2 select-none">
      {/* Progress indicator */}
      <div className="flex items-center gap-1.5 px-1">
        {(["thinking", "concepts", "editor", "blueprint", "final_approval"] as const).map((p, i) => (
          <React.Fragment key={p}>
            <div
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                phase === p ? "bg-indigo-500"
                : ["thinking", "concepts", "editor", "blueprint", "final_approval"].indexOf(phase) > i
                  ? "bg-emerald-400"
                  : "bg-[#e8e8e8]"
              }`}
            />
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {(phase === "thinking" || loading) && renderThinking()}
        {phase === "concepts" && !loading && renderConcepts()}
        {phase === "editor" && !loading && renderEditor()}
        {phase === "blueprint" && !loading && renderBlueprint()}
        {phase === "final_approval" && !loading && renderFinalApproval()}
      </AnimatePresence>
    </div>
  );
};
