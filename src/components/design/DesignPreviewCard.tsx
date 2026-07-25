import React from "react";
import { Maximize2, Check, Edit3, Type, Palette } from "lucide-react";
import { DesignConcept } from "../../types/designConcept";
import { useGenerationWorkflowStore } from "../../stores/generationWorkflowStore";

interface DesignPreviewCardProps {
  concept: DesignConcept;
  projectMode: "frontend" | "fullstack";
  onSelect: () => void;
  onEdit: () => void;
  onFullscreen: () => void;
}

// Build a self-contained preview iframe document from concept previewFiles
function buildConceptSrcDoc(files: Record<string, string>, projectMode: "frontend" | "fullstack"): string {
  if (!files || Object.keys(files).length === 0) {
    return `<html><body><p style="font-family:sans-serif;color:#888;padding:20px;">No preview files generated</p></body></html>`;
  }

  // 1. Find HTML file
  const htmlKey = Object.keys(files).find(k => k.endsWith(".html"));
  let htmlContent = htmlKey ? files[htmlKey] : "";

  // 2. Find CSS file(s)
  const cssBundle = Object.entries(files)
    .filter(([path]) => path.endsWith(".css"))
    .map(([, content]) => content)
    .join("\n");

  if (projectMode === "frontend") {
    if (!htmlContent) {
      // Fallback
      return `<!DOCTYPE html><html><head><style>${cssBundle}</style></head><body><p>Preview fallback</p></body></html>`;
    }

    // Inject CSS bundle inside html
    if (htmlContent.includes("</head>")) {
      htmlContent = htmlContent.replace("</head>", `<style>${cssBundle}</style></head>`);
    } else {
      htmlContent = `<style>${cssBundle}</style>` + htmlContent;
    }
    return htmlContent;
  } else {
    // Fullstack mode (React preview compilation using esm.sh)
    const appTsx = files["src/App.tsx"] || files["App.tsx"] || files["src/App.jsx"] || files["App.jsx"] || Object.values(files)[0];
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background-color: #fcfbf9; }
    ${cssBundle}
  </style>
  <!-- Load React and Babel for runtime compilation -->
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo } = React;
    
    // Fallback compiler for simple App component
    try {
      ${appTsx.replace(/import\s+.*from\s+['"].*['"];?/g, "") // Remove static imports
              .replace(/export\s+default/g, "")}
              
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    } catch (e) {
      document.getElementById('root').innerHTML = \`
        <div style="padding: 20px; font-family: sans-serif; color: #ef4444;">
          <h3>Preview Rendering Error</h3>
          <pre style="background: #fee2e2; padding: 10px; border-radius: 8px;">\${e.message}</pre>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
  }
}

export const DesignPreviewCard: React.FC<DesignPreviewCardProps> = ({
  concept,
  projectMode,
  onSelect,
  onEdit,
  onFullscreen,
}) => {
  const srcDoc = buildConceptSrcDoc(concept.previewFiles, projectMode);
  const history = useGenerationWorkflowStore((s) => s.designHistory[concept.id] || []);
  const restoreVersion = useGenerationWorkflowStore((s) => s.restoreDesignVersion);

  const currentVersionIdx = history.findIndex((h) => h === concept);

  return (
    <div className="flex flex-col bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex-1">
      {/* Visual Frame wrapper */}
      <div className="relative aspect-[4/3] bg-stone-50 border-b border-stone-100 overflow-hidden select-none">
        <iframe
          srcDoc={srcDoc}
          title={concept.name}
          className="w-full h-full border-none pointer-events-none scale-[0.8] origin-center"
          sandbox="allow-scripts"
        />
        {/* Hover overlay controls */}
        <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
          <button
            onClick={onFullscreen}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Inspect Fullscreen
          </button>
        </div>
      </div>

      {/* Info & Metadata */}
      <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-stone-900 text-lg group-hover:text-indigo-600 transition-colors">
              {concept.name}
            </h4>
            <span className="text-[9px] font-black uppercase tracking-widest bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full border border-stone-200">
              {concept.id.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2 font-medium leading-relaxed">
            {concept.description}
          </p>
        </div>

        {/* Version Selector */}
        {history.length > 1 && (
          <div className="flex items-center justify-between bg-indigo-50/50 px-4 py-2.5 rounded-2xl border border-indigo-100/50">
            <span className="text-[10px] font-bold text-indigo-950 uppercase tracking-wider">
              Version History
            </span>
            <select
              value={currentVersionIdx !== -1 ? currentVersionIdx : history.length - 1}
              onChange={(e) => restoreVersion(concept.id, parseInt(e.target.value))}
              className="bg-white border border-indigo-200 text-indigo-950 font-bold py-1 px-2.5 rounded-xl cursor-pointer text-xs focus:outline-none shadow-sm"
            >
              {history.map((_, idx) => (
                <option key={idx} value={idx}>
                  Version {idx + 1} {idx === history.length - 1 ? "(Latest)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Characteristics Grid */}
        <div className="grid grid-cols-2 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100 text-[10px]">
          <div>
            <div className="flex items-center gap-1 font-extrabold text-stone-700 uppercase tracking-wider mb-1">
              <Palette className="w-3 h-3 text-stone-500" /> Colors
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-3.5 h-3.5 rounded-full border border-stone-200 shadow-sm"
                style={{ backgroundColor: concept.colorSystem.primary }}
                title={`Primary: ${concept.colorSystem.primary}`}
              />
              <span
                className="w-3.5 h-3.5 rounded-full border border-stone-200 shadow-sm"
                style={{ backgroundColor: concept.colorSystem.accent }}
                title={`Accent: ${concept.colorSystem.accent}`}
              />
              <span
                className="w-3.5 h-3.5 rounded-full border border-stone-200 shadow-sm"
                style={{ backgroundColor: concept.colorSystem.background }}
                title={`Background: ${concept.colorSystem.background}`}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 font-extrabold text-stone-700 uppercase tracking-wider mb-1">
              <Type className="w-3 h-3 text-stone-500" /> Typography
            </div>
            <span className="font-mono text-stone-500 font-semibold text-[9px] truncate block max-w-[120px]">
              {concept.typography.fontFamily.split(",")[0]}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 px-4 py-3 border border-stone-200 hover:border-stone-900 hover:bg-stone-50 rounded-2xl text-stone-600 hover:text-stone-900 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Refine
          </button>
          <button
            onClick={onSelect}
            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-stone-900 hover:bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 shadow-md active:translate-y-0"
          >
            <Check className="w-3.5 h-3.5" />
            Select Design
          </button>
        </div>
      </div>
    </div>
  );
};
