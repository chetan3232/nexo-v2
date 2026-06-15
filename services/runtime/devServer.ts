import { WebsiteContent } from '../../types';
import { useRuntimeStore } from '../../stores/runtimeStore';
import { discoverDependencies } from '../../utils/deps';

export class DevServerService {
  /**
   * Emulates npm install inside the virtual sandbox.
   */
  public static async install(files: Record<string, string>): Promise<Record<string, string>> {
    const store = useRuntimeStore.getState();
    store.addLog("📦 [Sandbox] Running package installer: npm install");
    store.addLog("📦 [Sandbox] Scanning imports for dependency auto-discovery...");
    
    // Auto-discover imports
    const discovered = discoverDependencies(files);
    const discoveredList = Object.keys(discovered);
    store.addLog(`📦 [Sandbox] Discovered imports to install: ${JSON.stringify(discoveredList)}`);
    
    // Update package.json dependency declarations
    let pkgJson: any = {};
    try {
      pkgJson = JSON.parse(files['package.json'] || '{}');
    } catch (e) {
      pkgJson = {};
    }
    
    pkgJson.dependencies = {
      ...(pkgJson.dependencies || {}),
      ...discovered
    };
    
    files['package.json'] = JSON.stringify(pkgJson, null, 2);
    
    store.addLog("📦 [Sandbox] Resolving dependency graph tree from virtual npm registry...");
    for (const pkg of discoveredList) {
      store.addLog(`📦 [Sandbox] Resolving: ${pkg}@${discovered[pkg]} - Success`);
      await new Promise((res) => setTimeout(res, 100));
    }
    
    store.addLog(`📦 [Sandbox] Installed ${discoveredList.length} packages successfully.`);
    return files;
  }

  /**
   * Bundles workspace files into an injectable HTML document that runs standard React or Native layouts.
   */
  public static compilePreview(content: WebsiteContent): string {
    const { files } = content;
    const isReact = Object.keys(files).some(f => f.endsWith('.tsx') || f.endsWith('.ts'));

    if (!isReact) {
      // Native Mode (HTML/JS/CSS)
      const html = files['index.html'] || '<html><body><h1>No index.html found</h1></body></html>';
      const css = files['styles.css'] || files['style.css'] || '';
      const js = files['script.js'] || files['main.js'] || '';
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>${css}</style>
          </head>
          <body>
            ${html.includes('<body>') ? html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html : html}
            <script>${js}</script>
          </body>
        </html>
      `;
    }

    // React Mode Compilation (similar to Babel standalone compiler in ChatInterface)
    const componentFiles = Object.keys(files).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    componentFiles.sort((a, b) => {
      if (a === 'App.tsx') return 1;
      if (b === 'App.tsx') return -1;
      return a.localeCompare(b);
    });

    let combinedCode = '';
    const lucideImports = new Set<string>();

    componentFiles.forEach(filename => {
      let code = files[filename];

      // Extract Lucide icons
      const lucideMatch = code.match(/import\s+\{(.*?)\}\s+from\s+['"]lucide-react['"]/);
      if (lucideMatch) {
        lucideMatch[1].split(',').map(s => s.trim()).forEach(i => lucideImports.add(i));
      }

      // Strip import declarations
      code = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
      
      // Clean export keywords
      if (filename === 'App.tsx') {
        let appName = 'App';
        const funcMatch = code.match(/export\s+default\s+function\s+(\w+)/);
        const classMatch = code.match(/export\s+default\s+class\s+(\w+)/);
        const constMatch = code.match(/export\s+default\s+(\w+)/);
        
        if (funcMatch) {
          appName = funcMatch[1];
          code = code.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
        } else if (classMatch) {
          appName = classMatch[1];
          code = code.replace(/export\s+default\s+class\s+(\w+)/g, 'class $1');
        } else if (constMatch) {
          appName = constMatch[1];
          code = code.replace(/export\s+default\s+(\w+);?/g, '/* export default $1 */');
        }
        
        if (appName !== 'App') {
          code += `\nconst App = ${appName};\n`;
        } else {
          code += `\nif (typeof App === 'undefined' && typeof ${appName} !== 'undefined') { var App = ${appName}; }\n`;
        }
      } else {
        code = code.replace(/export\s+default\s+/g, '');
        code = code.replace(/export\s+/g, '');
      }

      combinedCode += `\n/* --- ${filename} --- */\n${code}\n`;
    });

    const lucideDestructuring = lucideImports.size > 0 
      ? `const { ${Array.from(lucideImports).join(', ')} } = window.lucideReact || window.LucideReact || {};` 
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
          <script src="https://unpkg.com/lucide@latest"></script>
          <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              background: #09090b;
              color: #ffffff;
              margin: 0;
              padding: 0;
              overflow-x: hidden;
            }
            /* Visual edit mode selector highlights */
            body.visual-edit-active * {
              outline: 1px dashed rgba(99, 102, 241, 0.35) !important;
              cursor: pointer !important;
              transition: outline 0.15s ease;
            }
            body.visual-edit-active *:hover {
              outline: 2px solid #6366f1 !important;
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel" data-presets="react,typescript">
            // Error Boundary & Logger
            window.addEventListener('error', (e) => {
              // Send error to Host Studio Parent frame for self-healing loops
              window.parent.postMessage({ type: 'CONSOLE_ERROR', message: e.message }, '*');
              const root = document.getElementById('root');
              root.innerHTML = \`
                <div style="color:#ef4444; padding:24px; font-family:monospace; background:#180808; border:1px solid #3c1414; margin:24px; border-radius:16px;">
                  <strong style="font-size:16px;">🚨 Preview Runtime Crash Detected</strong><br/>
                  <div style="margin-top:12px; font-size:13px; color:#f87171;">\${e.message}</div>
                  <div style="margin-top:20px; font-size:11px; color:#a1a1aa;">NEXO Self-Healing Agent will automatically patch this crash in a few seconds...</div>
                </div>
              \`;
            });

            // Capture logs
            const originalLog = console.log;
            console.log = (...args) => {
              originalLog(...args);
              window.parent.postMessage({ type: 'CONSOLE_LOG', message: args.join(' ') }, '*');
            };

            const { useState, useEffect, useRef, useMemo, useCallback } = React;
            const { motion, AnimatePresence } = FramerMotion;
            
            // Listen for Host to Iframe postMessages
            window.addEventListener('message', (event) => {
              const { type, visualMode, id, styleClass } = event.data;
              
              if (type === 'SET_VISUAL_MODE') {
                if (visualMode) {
                  document.body.classList.add('visual-edit-active');
                  // Run ID tagging
                  let idCounter = 1;
                  const tagNode = (node) => {
                    if (node && node.nodeType === 1) {
                      if (!node.getAttribute('data-nexo-id')) {
                        node.setAttribute('data-nexo-id', 'nexo-' + idCounter++);
                      }
                      Array.from(node.childNodes).forEach(tagNode);
                    }
                  };
                  tagNode(document.getElementById('root'));
                } else {
                  document.body.classList.remove('visual-edit-active');
                }
              }
              
              if (type === 'UPDATE_STYLE') {
                const element = document.querySelector('[data-nexo-id="' + id + '"]');
                if (element) {
                  element.className = styleClass;
                  // Signal synchronization complete
                  window.parent.postMessage({ type: 'STYLE_SYNCED', id, className: styleClass }, '*');
                }
              }
            });

            // Inject Lucide React components
            ${lucideDestructuring}

            // Injected workspace code
            ${combinedCode}

            // Mount standard render loop
            try {
              const root = ReactDOM.createRoot(document.getElementById('root'));
              if (typeof App !== 'undefined') {
                // Attach click listener for visual color editor if enabled
                document.body.addEventListener('click', (e) => {
                  const target = e.target;
                  if (target && document.body.classList.contains('visual-edit-active')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const nexoId = target.getAttribute('data-nexo-id') || 'nexo-0';
                    window.parent.postMessage({
                      type: 'ELEMENT_SELECTED',
                      id: nexoId,
                      tagName: target.tagName,
                      className: target.className,
                      textContent: target.textContent || ''
                    }, '*');
                  }
                });

                root.render(<App />);
              } else {
                root.render(
                  <div className="p-8 text-red-500 font-mono">
                    Could not find default App component export. Make sure 'App.tsx' is available.
                  </div>
                );
              }
            } catch (err) {
              window.parent.postMessage({ type: 'CONSOLE_ERROR', message: err.message }, '*');
            }
          </script>
        </body>
      </html>
    `;
  }
}
export default DevServerService;
