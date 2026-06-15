import path from 'path';
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
                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        status: 'success',
                        text: "I have updated the project styles and layout components for you.",
                      }));
                    } else if (req.url === '/api/deploy') {
                      res.statusCode = 200;
                      res.end(JSON.stringify({
                        status: 'success',
                        deployUrl: 'https://nexo-deployed-sandbox.app',
                        logs: ['Starting compiler build', 'Resolving static paths', 'Push finished successfully']
                      }));
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
