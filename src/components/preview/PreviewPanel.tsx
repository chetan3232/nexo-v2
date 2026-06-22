import React, { useRef, useEffect, useMemo } from "react";
import { Monitor, Loader2, Zap, Code2 } from "lucide-react";
import { useRuntimeStore } from "../../stores/runtimeStore";
import { useProjectStore } from "../../stores/projectStore";
import { VisualDesignPanel } from "../editor/VisualDesignPanel";
import { DesignSelector } from "./DesignSelector";

interface PreviewPanelProps {
  isVisualMode: boolean;
  setIsVisualMode?: (val: boolean) => void;
  onDesignSelect?: (designName: string) => void;
}

/**
 * Build a self-contained HTML document from the project files.
 * This is the fallback preview when WebContainer is not booted.
 * Supports: plain HTML, HTML+CSS+JS, and React (via esm.sh CDN).
 */
function buildSrcdocFromFiles(
  files: Record<string, string>
): string | null {
  if (!files || Object.keys(files).length === 0) return null;

  const indexHtml = files["index.html"] || files["/index.html"];

  // ── Case 1: React project (has src/App.tsx, src/App.jsx, App.tsx, App.jsx, index.tsx, index.jsx) ──
  const appTsx = files["src/App.tsx"] || files["src/App.jsx"] || files["App.tsx"] || files["App.jsx"] ||
                 files["src/index.tsx"] || files["src/index.jsx"] || files["index.tsx"] || files["index.jsx"];
  
  const cssBundle = Object.entries(files)
    .filter(([path]) => path.endsWith(".css"))
    .map(([, content]) => content)
    .join("\n");

  if (appTsx) {
    // Generate window.defineModule calls for all JS/TS/JSX/TSX files
    const allModulesDefinitions = Object.entries(files)
      .filter(([path]) => path.endsWith(".tsx") || path.endsWith(".ts") || path.endsWith(".jsx") || path.endsWith(".js"))
      .map(([path, content]) => {
        return `window.defineModule(${JSON.stringify(path)}, ${JSON.stringify(content)});`;
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    ${cssBundle}
  </style>
  <script>
    window.modules = {};
    window.defineModule = (name, code) => {
      window.modules[name] = {
        exports: {},
        code,
        factory: null,
        loaded: false
      };
    };
  </script>
</head>
<body>
  <div id="root"></div>
  <script src="https://esm.sh/react@19?bundle"><\/script>
  <script src="https://esm.sh/react-dom@19/client?bundle"><\/script>
  <script src="https://esm.sh/@babel/standalone"><\/script>
  <script>
    ${allModulesDefinitions}
  </script>
  <script type="text/babel">
    const { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, createContext, Fragment } = React;

    // ── Inline lucide-react stubs ──
    const LucideIcon = ({ name, className, size = 24, ...props }) => {
      return React.createElement('span', { 
        className: className,
        style: { display: 'inline-flex', width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        ...props 
      }, '⬡');
    };
    
    // Create a proxy for lucide-react icons
    const lucideProxy = new Proxy({}, {
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return (props) => LucideIcon({ name: prop, ...props });
        }
        return undefined;
      }
    });

    // ── Inline framer-motion stubs ──
    const motion = new Proxy({}, {
      get: (_, tag) => React.forwardRef((props, ref) => {
        const { initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, layout, ...rest } = props;
        return React.createElement(tag, { ...rest, ref });
      })
    });
    const AnimatePresence = ({ children }) => React.createElement(Fragment, null, children);

    const require = (name) => {
      const cleanName = name.replace(/^react-dom\/client$/, 'react-dom').replace(/^\.\//, "").replace(/^\.\.\//, "");
      
      if (cleanName === 'react') return React;
      if (cleanName === 'react-dom') return { ...ReactDOM, createRoot: ReactDOM.createRoot || (ReactDOM.client && ReactDOM.client.createRoot) };
      if (cleanName === 'lucide-react') return lucideProxy;
      if (cleanName === 'framer-motion') return { motion, AnimatePresence };

      const foundKey = Object.keys(window.modules).find(k => {
        const cleanK = k.replace(/^\.\//, "").replace(/^\.\.\//, "");
        return cleanK.endsWith(cleanName) || cleanName.endsWith(cleanK) || cleanK.includes(cleanName) || cleanName.includes(cleanK);
      });

      if (!foundKey) {
        console.warn("Module not found:", name);
        return {};
      }

      const mod = window.modules[foundKey];
      if (!mod.loaded) {
        mod.loaded = true;
        try {
          // Transpile with Babel Standalone
          const transpiled = Babel.transform(mod.code, {
            presets: ['react', ['env', { modules: 'commonjs' }]]
          }).code;
          
          mod.factory = new Function("require", "exports", "module", transpiled);
        } catch (err) {
          console.error("Transpilation error in " + foundKey + ":", err);
          throw err;
        }
        mod.factory(require, mod.exports, mod);
      }
      return mod.exports;
    };

    try {
      // Find entrypoint: App.tsx or App.jsx or index.tsx or main.tsx
      const entryKey = Object.keys(window.modules).find(k => 
        k.endsWith("App.tsx") || k.endsWith("App.jsx") || k.endsWith("App.js") || k.endsWith("App.ts") ||
        k.endsWith("index.tsx") || k.endsWith("index.jsx") || k.endsWith("main.tsx")
      );
      
      if (!entryKey) {
        throw new Error("Could not find React entrypoint (App.tsx or index.tsx)");
      }

      const entry = require(entryKey);
      const App = entry.default || entry.App || entry;

      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } catch (err) {
      document.getElementById('root').innerHTML = '<div style="padding:24px;font-family:monospace;color:#ef4444;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;margin:16px;"><strong>⚠️ Preview Error:</strong><pre style="margin-top:8px;white-space:pre-wrap;">' + err.message + '</pre></div>';
      console.error('Preview render error:', err);
    }
  <\/script>
</body>
</html>`;
  }

  // ── Case 2: Plain HTML file ──
  if (indexHtml) {
    let html = indexHtml;

    // Inline referenced CSS files
    const cssLinkRegex = /<link\s+[^>]*?href=["']([^"']+\.css)["'][^>]*?>/gi;
    let match;
    while ((match = cssLinkRegex.exec(indexHtml)) !== null) {
      const href = match[1].replace(/^\.?\//, "");
      const cssContent = files[href] || files["/" + href] || files["src/" + href];
      if (cssContent) {
        html = html.replace(match[0], `<style>\n${cssContent}\n</style>`);
      }
    }

    // Inline referenced JS files (local only)
    const scriptRegex = /<script\s+[^>]*?src=["']([^"']+\.(?:js|ts|tsx|jsx))["'][^>]*?>\s*<\/script>/gi;
    while ((match = scriptRegex.exec(indexHtml)) !== null) {
      const src = match[1];
      if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) continue;
      const normalizedSrc = src.replace(/^\.?\//, "");
      const jsContent = files[normalizedSrc] || files["/" + normalizedSrc] || files["src/" + normalizedSrc];
      if (jsContent) {
        html = html.replace(match[0], `<script>\n${jsContent}\n<\/script>`);
      }
    }

    return html;
  }

  // ── Case 3: Single file (CSS only, or a code file) ──
  const allFiles = Object.entries(files);
  if (allFiles.length === 1) {
    const [name, content] = allFiles[0];
    if (name.endsWith(".html") || name.endsWith(".htm")) return content;
    if (name.endsWith(".css")) {
      return `<!DOCTYPE html><html><head><style>${content}</style></head><body><p style="padding:20px;font-family:sans-serif;color:#888;">CSS-only preview</p></body></html>`;
    }
  }

  return null;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  isVisualMode,
  setIsVisualMode,
  onDesignSelect,
}) => {
  const { url, isBooted } = useRuntimeStore();
  const { previewKey, currentContent, buildPhase } = useProjectStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentUrl = url || "http://localhost:5173/";

  // Keep track of the last stable srcdoc to avoid constantly reloading the iframe during generation
  const [srcdocHtml, setSrcdocHtml] = React.useState<string | null>(null);

  useEffect(() => {
    // Only update the srcdoc when we are not actively generating/planning/building/fixing
    const isGenerating = ["planning", "generating", "building", "fixing"].includes(buildPhase);
    if (!isGenerating && currentContent?.files) {
      const html = buildSrcdocFromFiles(currentContent.files);
      setSrcdocHtml(html);
    }
  }, [currentContent?.files, buildPhase, previewKey]);

  // Sync visual mode state to iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_VISUAL_MODE", enabled: isVisualMode },
        "*",
      );
    }
  }, [isVisualMode, previewKey]);

  // Determine what to show
  const hasWebContainerPreview = isBooted && url;
  const hasFallbackPreview = !hasWebContainerPreview && srcdocHtml;
  const isLoading = isBooted && !url;
  const isEmpty = !isBooted && !srcdocHtml;

  return (
    <div className="h-full w-full relative overflow-hidden bg-white">
      {/* Premium Glassmorphic Overlay during code updates */}
      {["planning", "generating", "building", "fixing"].includes(buildPhase) && srcdocHtml && (
        <div className="absolute inset-0 bg-white/40 dark:bg-stone-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 z-30 select-none animate-in fade-in duration-300">
          <div className="bg-white/80 dark:bg-stone-900/90 border border-stone-200/50 dark:border-stone-800/80 px-4.5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-studio-accent animate-spin" />
            <span className="text-xs font-bold text-studio-muted">
              Generating updates...
            </span>
          </div>
        </div>
      )}
      {/* Design Selection Phase */}
      {buildPhase === "design_selection" && onDesignSelect && (
        <div className="absolute inset-0 z-50 bg-white">
          <DesignSelector onSelect={onDesignSelect} />
        </div>
      )}

      {/* Priority 1: WebContainer live iframe */}
      {hasWebContainerPreview && buildPhase !== "design_selection" && (
        <>
          <iframe
            key={`wc-${previewKey}`}
            ref={iframeRef}
            src={url}
            className="w-full h-full border-none bg-white"
            title="Preview"
          />
          {/* Live indicator */}
          <div className="absolute bottom-3 right-3 bg-white/90 border border-[#e8e8e8] py-1 px-2.5 rounded-full text-[9px] text-emerald-600 font-semibold flex items-center gap-1.5 shadow-sm select-none z-10">
            <Zap className="w-2.5 h-2.5 text-emerald-500" />
            Live
          </div>
        </>
      )}

      {/* Priority 2: Fallback srcdoc preview from generated code */}
      {hasFallbackPreview && buildPhase !== "design_selection" && (
        <>
          <iframe
            key={`srcdoc-${previewKey}`}
            ref={iframeRef}
            srcDoc={srcdocHtml!}
            className="w-full h-full border-none bg-white"
            title="Code Preview"
            sandbox="allow-scripts allow-modals allow-popups allow-same-origin"
          />
          {/* Inline preview indicator */}
          <div className="absolute bottom-3 right-3 bg-white/90 border border-[#e8e8e8] py-1 px-2.5 rounded-full text-[9px] text-sky-600 font-semibold flex items-center gap-1.5 shadow-sm select-none z-10">
            <Code2 className="w-2.5 h-2.5 text-sky-500" />
            Inline Preview
          </div>
          {/* Show booting message subtly if WC is still loading */}
          {isBooted && (
            <div className="absolute top-2 right-2 bg-amber-50 border border-amber-200 py-0.5 px-2 rounded-full text-[8px] text-amber-600 font-medium flex items-center gap-1 shadow-sm select-none z-10">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              WebContainer booting...
            </div>
          )}
        </>
      )}

      {/* Loading: WebContainer booted but dev server URL not ready yet */}
      {isLoading && !hasFallbackPreview && buildPhase !== "design_selection" && (
        <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white">
          <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
          <span className="text-[10px] font-bold text-[#bbb] uppercase tracking-[0.25em]">
            Starting Dev Server...
          </span>
        </div>
      )}

      {/* Empty: Nothing to show at all */}
      {isEmpty && buildPhase !== "design_selection" && (
        <div className="h-full w-full flex flex-col items-center justify-center gap-5 bg-white">
          <div className="relative">
            <div className="absolute inset-0 bg-sky-100 rounded-2xl blur-xl opacity-40" />
            <div className="relative bg-gradient-to-br from-sky-50 to-indigo-50 p-5 rounded-2xl border border-sky-100">
              <Monitor className="w-10 h-10 text-sky-300" strokeWidth={1.2} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#999] uppercase tracking-[0.2em]">
              Preview
            </span>
            <span className="text-[10px] text-[#bbb] font-medium max-w-[200px] text-center leading-relaxed">
              Generate code to see the live preview here
            </span>
          </div>
        </div>
      )}

      {isVisualMode && buildPhase !== "design_selection" && <VisualDesignPanel />}
    </div>
  );
};
