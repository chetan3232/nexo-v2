import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Play, Loader2, Sparkles } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useRuntimeStore } from '../../stores/runtimeStore';

export const ProductionScanner: React.FC = () => {
  const files = useProjectStore((state) => state.files);
  const updateFile = useProjectStore((state) => state.updateFile);
  const addLog = useRuntimeStore((state) => state.addLog);

  const [isScanning, setIsScanning] = useState(false);
  const [scores, setScores] = useState({
    seo: 80,
    accessibility: 75,
    performance: 85,
    security: 90
  });
  const [warnings, setWarnings] = useState<string[]>([]);

  // Function to run local static checks on files
  const runAudit = () => {
    setIsScanning(true);
    setTimeout(() => {
      const issues: string[] = [];
      let seoScore = 100;
      let accessScore = 100;
      let secScore = 100;
      
      const appCode = files['App.tsx'] || '';
      const htmlCode = files['index.html'] || '';

      // 1. Accessibility Checks: check for img tag without alt
      if (appCode.includes('<img') && !appCode.includes('alt=')) {
        issues.push("Accessibility: <img> elements lack descriptive 'alt' properties.");
        accessScore -= 30;
      }

      // 2. SEO Checks: check for meta description or title
      if (htmlCode && !htmlCode.includes('<title>')) {
        issues.push("SEO: Document lacks a descriptive page <title> header tag.");
        seoScore -= 20;
      }
      if (htmlCode && !htmlCode.includes('name="viewport"')) {
        issues.push("SEO: Missing responsive 'viewport' meta elements.");
        seoScore -= 20;
      }

      // 3. Security Checks: check for hardcoded secrets / keys
      if (appCode.match(/(?:key|password|token)\s*=\s*['"][a-zA-Z0-9_-]{16,}['"]/gi)) {
        issues.push("Security: Detected possible hardcoded authentication token inside code.");
        secScore -= 40;
      }

      setWarnings(issues);
      setScores({
        seo: seoScore,
        accessibility: accessScore,
        performance: 88,
        security: secScore
      });
      setIsScanning(false);
      addLog(`🛡️ [Scanner] Audit completed. Found ${issues.length} recommendation warnings.`);
    }, 1200);
  };

  useEffect(() => {
    runAudit();
  }, [files]);

  // AI Auto-Fix handler
  const handleAutoFix = () => {
    setIsScanning(true);
    addLog("🛡️ [Scanner] Spawning DevOps/QA Agent to patch audit warnings...");
    
    setTimeout(() => {
      let appCode = files['App.tsx'] || '';
      let htmlCode = files['index.html'] || '';

      // 1. Fix Accessibility: Inject alt to img tags
      if (appCode.includes('<img') && !appCode.includes('alt=')) {
        appCode = appCode.replace(/<img([^>]*)(>)/gi, '<img$1 alt="Nexo illustration image"$2');
        updateFile('App.tsx', appCode);
        addLog("🔧 [Scanner] Patched: Injected descriptive alt tag into App.tsx images.");
      }

      // 2. Fix SEO: Inject title and viewport to HTML
      if (htmlCode && !htmlCode.includes('<title>')) {
        htmlCode = htmlCode.replace(/<head>([\s\S]*?)<\/head>/i, '<head>$1\n  <title>Nexo Generated Application</title>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n</head>');
        updateFile('index.html', htmlCode);
        addLog("  [Scanner] Patched: Injected missing viewport metadata and page title to index.html.");
      }

      setIsScanning(false);
      runAudit();
    }, 1500);
  };

  return (
    <div className="flex-1 bg-[#09090b] text-stone-200 p-4 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-stone-800 pb-2 flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Production Scanner
          </span>
          <button
            onClick={runAudit}
            disabled={isScanning}
            className="p-1 hover:bg-white/5 rounded text-stone-500 hover:text-white text-[10px] font-mono font-bold"
            title="Re-run scans"
          >
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Scan'}
          </button>
        </div>

        {/* Meters */}
        <div className="space-y-3 bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="text-[9px] font-mono text-stone-500 font-bold uppercase tracking-wider mb-1">Audit Score Index</div>
          {[
            { label: 'SEO', val: scores.seo, color: 'text-yellow-400', barBg: 'bg-yellow-500' },
            { label: 'Accessibility', val: scores.accessibility, color: 'text-indigo-400', barBg: 'bg-indigo-500' },
            { label: 'Performance', val: scores.performance, color: 'text-green-400', barBg: 'bg-green-500' },
            { label: 'Security', val: scores.security, color: 'text-emerald-400', barBg: 'bg-emerald-500' }
          ].map((score) => (
            <div key={score.label} className="space-y-0.5">
              <div className="flex justify-between text-[9px] font-bold font-mono">
                <span className="text-stone-400">{score.label}</span>
                <span className={score.color}>{score.val}/100</span>
              </div>
              <div className="h-1 w-full bg-black/40 border border-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${score.barBg} transition-all duration-500`} style={{ width: `${score.val}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Warnings list */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">Audit Warnings</label>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {warnings.length === 0 ? (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] rounded-lg flex items-center gap-1.5 font-mono">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>All checks passed! No warnings.</span>
              </div>
            ) : (
              warnings.map((warn, i) => (
                <div key={i} className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-1.5 text-[9px] text-red-400 font-mono leading-relaxed">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {warnings.length > 0 && (
        <button
          onClick={handleAutoFix}
          disabled={isScanning}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-800 disabled:text-stone-600 text-white py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Applying patches...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Auto-Fix Warnings</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
export default ProductionScanner;
