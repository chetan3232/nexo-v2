import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'nexo-api-middleware',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              if (req.url && req.url.startsWith('/api/')) {
                res.setHeader('Content-Type', 'application/json');
                
                // Parse Body helper
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                  try {
                    const parsedBody = body ? JSON.parse(body) : {};

                    if (req.url === '/api/ai/explore') {
                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        status: 'success',
                        appType: 'Dashboard Application',
                        targetUsers: 'Analytics Teams',
                        platform: 'Desktop / Responsive Web',
                        features: ['Responsive layouts grid', 'Real-time metrics widgets', 'Interactive charts']
                      }));
                    } else if (req.url === '/api/ai/blueprint') {
                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        status: 'success',
                        checklist: [
                          { id: '1', label: 'Setup project configs', agent: 'DevOps', status: 'pending' },
                          { id: '2', label: 'Draft prd.md constraints', agent: 'PM', status: 'pending' },
                          { id: '3', label: 'Define design system tokens', agent: 'Designer', status: 'pending' },
                          { id: '4', label: 'Generate React views layout', agent: 'Frontend', status: 'pending' },
                          { id: '5', label: 'Expose Express routers', agent: 'Backend', status: 'pending' },
                        ]
                      }));
                    } else if (req.url === '/api/chat') {
                      const { messages, model, systemInstruction } = parsedBody;
                      console.log(`[ViteApiMiddleware] Routing completions query for model: ${model}`);
                      
                      (async () => {
                        try {
                          if (model && model.startsWith('gemini-')) {
                            const apiKey = env.GEMINI_API_KEY || '';
                            if (!apiKey) {
                              res.statusCode = 200;
                              res.end(JSON.stringify({
                                status: 'success',
                                text: "Mock Gemini Response: I have successfully compiled the project layout views and updated style components.\n\n```tsx filename=\"App.tsx\"\nexport default function App() {\n  return (\n    <div className=\"min-h-screen bg-stone-950 text-white flex items-center justify-center\">\n      <div className=\"text-center space-y-4\">\n        <h1 className=\"text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent\">Nexo Application</h1>\n        <p className=\"text-stone-400 max-w-md\">This is a mock Gemini generated view. Connect your API keys to unlock autonomous builder squads.</p>\n      </div>\n    </div>\n  );\n}\n```",
                              }));
                              return;
                            }
                            
                            const { GoogleGenAI } = await import("@google/genai");
                            const ai = new GoogleGenAI({ apiKey });
                            const contents = messages.map(msg => ({
                              role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
                              parts: [{ text: msg.content || msg.text || "" }]
                            }));
                            
                            const response = await ai.models.generateContent({
                              model,
                              contents,
                              config: { systemInstruction }
                            });
                            
                            res.statusCode = 200;
                            res.end(JSON.stringify({
                              status: 'success',
                              text: response.text || "Successfully executed generation."
                            }));
                          } else {
                            const apiKey = env.OPENROUTER_API_KEY || '';
                            if (!apiKey) {
                              res.statusCode = 200;
                              res.end(JSON.stringify({
                                status: 'success',
                                text: "Mock OpenRouter Response: Applied visual style coordinates and synchronized workspace structures.\n\n```tsx filename=\"App.tsx\"\nexport default function App() {\n  return (\n    <div className=\"min-h-screen bg-stone-950 text-white flex items-center justify-center\">\n      <div className=\"text-center space-y-4\">\n        <h1 className=\"text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent\">Nexo Application</h1>\n        <p className=\"text-stone-400 max-w-md\">This is a mock OpenRouter generated view. Connect your API keys to unlock autonomous builder squads.</p>\n      </div>\n    </div>\n  );\n}\n```",
                              }));
                              return;
                            }
                            
                            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                              method: "POST",
                              headers: {
                                "Authorization": `Bearer ${apiKey}`,
                                "Content-Type": "application/json"
                              },
                              body: JSON.stringify({
                                model,
                                messages: messages.map(m => ({ role: m.role, content: m.content || m.text })),
                                temperature: 0.2
                              })
                            });
                            
                            const data = await response.json();
                            res.statusCode = 200;
                            res.end(JSON.stringify({
                              status: 'success',
                              text: data.choices[0].message.content || ""
                            }));
                          }
                        } catch (err) {
                          console.error("Vite completions routing error:", err);
                          res.statusCode = 200;
                          res.end(JSON.stringify({
                            status: 'error',
                            text: `Completions routing error: ${err.message}`
                          }));
                        }
                      })();
                    } else if (req.url === '/api/deploy') {
                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        status: 'success',
                        deployUrl: 'https://nexo-deployed-sandbox.app',
                        logs: ['Starting compiler build', 'Resolving static paths', 'Push finished successfully']
                      }));
                    } else if (req.url === '/api/brain/load') {
                      const brainDir = path.resolve(__dirname, 'project-brain');
                      const files: Record<string, string> = {};
                      if (fs.existsSync(brainDir)) {
                        const fileNames = fs.readdirSync(brainDir);
                        fileNames.forEach((name) => {
                          const filePath = path.join(brainDir, name);
                          if (fs.statSync(filePath).isFile()) {
                            files[name] = fs.readFileSync(filePath, 'utf-8');
                          }
                        });
                      }
                      res.statusCode = 200;
                      res.end(JSON.stringify({ status: 'success', files }));
                    } else if (req.url === '/api/brain/save') {
                      const { filename, content } = parsedBody;
                      if (!filename || content === undefined) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ error: 'Missing filename or content' }));
                      } else {
                        const brainDir = path.resolve(__dirname, 'project-brain');
                        if (!fs.existsSync(brainDir)) {
                          fs.mkdirSync(brainDir, { recursive: true });
                        }
                        const safeName = path.basename(filename);
                        const filePath = path.join(brainDir, safeName);
                        fs.writeFileSync(filePath, content, 'utf-8');
                        res.statusCode = 200;
                        res.end(JSON.stringify({ status: 'success' }));
                      }
                    } else {
                      res.statusCode = 404;
                      res.end(JSON.stringify({ error: 'Endpoint not found' }));
                    }

                  } catch (e: any) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: e.message }));
                  }
                });
              } else {
                next();
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
