import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/nvidia-api': {
          target: 'https://integrate.api.nvidia.com/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nvidia-api/, '')
        },
        '^/api/chat$': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, '/api/ai/chat')
        },
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true
        }
      }
    },
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('monaco-editor')) return 'vendor-monaco';
              if (id.includes('framer-motion')) return 'vendor-framer';
              if (id.includes('lucide-react')) return 'vendor-icons';
              if (id.includes('@webcontainer/api')) return 'vendor-runtime';
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
              if (id.includes('zustand')) return 'vendor-state';
              if (id.includes('@dnd-kit') || id.includes('@craftjs')) return 'vendor-editor-ui';
              return 'vendor-libs';
            }
          }
        }
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.API_KEY_2': JSON.stringify(env.GEMINI_API_KEY_2),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
