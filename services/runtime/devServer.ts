import { WebsiteContent } from '../../types';

export class DevServerService {
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
        code = code.replace(/export\s+default\s+function\s+App/g, 'function App');
        code = code.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1($2) { return <$1 {...$2} /> }\nconst App = $1;');
        code = code.replace(/export\s+default\s+(\w+);?/g, 'const App = $1;');
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
            .visual-editable-element {
              outline: 1px dashed rgba(99, 102, 241, 0.4);
              cursor: pointer;
              transition: outline 0.15s ease;
            }
            .visual-editable-element:hover {
              outline: 2px solid #6366f1;
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
                  if (target) {
                    window.parent.postMessage({
                      type: 'ELEMENT_CLICKED',
                      tagName: target.tagName,
                      className: target.className,
                      textContent: target.textContent
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
