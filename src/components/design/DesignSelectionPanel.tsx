import React, { useState } from "react";
import { Sparkles, Eye, X, ZoomIn } from "lucide-react";
import { useGenerationWorkflowStore } from "../../stores/generationWorkflowStore";
import { useAgentStore } from "../../stores/agentStore";
import { DesignPreviewCard } from "./DesignPreviewCard";
import { DesignFeedbackEditor } from "./DesignFeedbackEditor";
import { DesignConcept } from "../../types/designConcept";

export const DesignSelectionPanel: React.FC = () => {
  const { designConcepts, selectDesign } = useGenerationWorkflowStore();
  const { projectMode } = useAgentStore();

  const [activeFeedbackDesign, setActiveFeedbackDesign] = useState<{ id: string; name: string } | null>(null);
  const [fullscreenDesign, setFullscreenDesign] = useState<DesignConcept | null>(null);

  if (!designConcepts || designConcepts.length < 2) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-stone-50/50 p-6 select-none">
        <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
        <p className="text-sm font-bold text-stone-500 uppercase tracking-widest animate-pulse">
          Generating Design Concepts...
        </p>
      </div>
    );
  }

  const [designA, designB] = designConcepts;

  return (
    <div className="h-full w-full flex flex-col overflow-y-auto no-scrollbar bg-stone-50 p-6 space-y-6 relative">
      {/* Page Header */}
      <div className="text-center space-y-2 shrink-0 select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 font-bold text-[10px] uppercase tracking-wider">
          <Eye className="w-3.5 h-3.5 animate-pulse" /> Design Exploration Phase
        </div>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight uppercase">
          Choose Your Design Concept
        </h2>
        <p className="text-xs text-stone-400 font-bold max-w-lg mx-auto uppercase tracking-wide leading-relaxed">
          Compare Design A and Design B side-by-side. Inspect layouts, color palettes, and interactive previews before selecting.
        </p>
      </div>

      {/* Main Grid: side-by-side on desktop, vertical on mobile */}
      <div className="flex-grow flex flex-col md:flex-row gap-6 max-w-5xl mx-auto w-full items-stretch">
        <DesignPreviewCard
          concept={designA}
          projectMode={projectMode}
          onSelect={() => selectDesign(designA.id)}
          onEdit={() => setActiveFeedbackDesign({ id: designA.id, name: designA.name })}
          onFullscreen={() => setFullscreenDesign(designA)}
        />
        <DesignPreviewCard
          concept={designB}
          projectMode={projectMode}
          onSelect={() => selectDesign(designB.id)}
          onEdit={() => setActiveFeedbackDesign({ id: designB.id, name: designB.name })}
          onFullscreen={() => setFullscreenDesign(designB)}
        />
      </div>

      {/* Refine / Feedback Modal */}
      {activeFeedbackDesign && (
        <DesignFeedbackEditor
          designId={activeFeedbackDesign.id}
          designName={activeFeedbackDesign.name}
          onClose={() => setActiveFeedbackDesign(null)}
        />
      )}

      {/* Fullscreen Inspector Modal */}
      {fullscreenDesign && (
        <FullscreenPreviewModal
          concept={fullscreenDesign}
          projectMode={projectMode}
          onClose={() => setFullscreenDesign(null)}
          onSelect={() => {
            selectDesign(fullscreenDesign.id);
            setFullscreenDesign(null);
          }}
        />
      )}
    </div>
  );
};

interface FullscreenPreviewModalProps {
  concept: DesignConcept;
  projectMode: "frontend" | "fullstack";
  onClose: () => void;
  onSelect: () => void;
}

const FullscreenPreviewModal: React.FC<FullscreenPreviewModalProps> = ({
  concept,
  projectMode,
  onClose,
  onSelect,
}) => {
  // Build a self-contained preview document
  const cssBundle = Object.entries(concept.previewFiles)
    .filter(([path]) => path.endsWith(".css"))
    .map(([, content]) => content)
    .join("\n");

  const htmlKey = Object.keys(concept.previewFiles).find(k => k.endsWith(".html"));
  let htmlContent = htmlKey ? concept.previewFiles[htmlKey] : "";

  let srcDoc = "";
  if (projectMode === "frontend") {
    if (htmlContent.includes("</head>")) {
      srcDoc = htmlContent.replace("</head>", `<style>${cssBundle}</style></head>`);
    } else {
      srcDoc = `<style>${cssBundle}</style>` + htmlContent;
    }
  } else {
    // React TSX compilation fallback
    const appTsx = concept.previewFiles["src/App.tsx"] || concept.previewFiles["App.tsx"] || concept.previewFiles["src/App.jsx"] || concept.previewFiles["App.jsx"] || Object.values(concept.previewFiles)[0];
    srcDoc = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #fcfbf9; }
    ${cssBundle}
  </style>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo } = React;
    try {
      ${appTsx.replace(/import\s+.*from\s+['"].*['"];?/g, "").replace(/export\s+default/g, "")}
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    } catch (e) {
      document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#fbf9f6] flex flex-col animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="h-[60px] border-b border-stone-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <ZoomIn className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-stone-900 text-sm">{concept.name}</h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Fullscreen Inspector</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSelect}
            className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            Select Design
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Fullscreen Iframe */}
      <div className="flex-grow bg-white">
        <iframe
          srcDoc={srcDoc}
          title="Fullscreen preview"
          className="w-full h-full border-none"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
};
