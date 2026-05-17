export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  files: Record<string, string>;
}

export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  "react-saas": {
    id: "react-saas",
    name: "SaaS Starter",
    description: "React + Tailwind + Lucide + Framer Motion",
    files: {
      "package.json": JSON.stringify(
        {
          name: "nexo-saas-app",
          private: true,
          version: "0.1.0",
          type: "module",
          dependencies: {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
            "framer-motion": "^12.0.0",
            "lucide-react": "^0.450.0",
            clsx: "^2.1.1",
            "tailwind-merge": "^2.5.4",
          },
          devDependencies: {
            vite: "^6.0.0",
            "@vitejs/plugin-react": "^4.3.4",
            autoprefixer: "^10.4.20",
            postcss: "^8.4.49",
            tailwindcss: "^3.4.15",
          },
        },
        null,
        2,
      ),
      "tailwind.config.js": `
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f5f3ff', 100: '#ede9fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' }
      }
    },
  },
  plugins: [],
}`,
      "src/App.tsx": `
import React from 'react';
import { Sparkles, ArrowRight, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <nav className="p-6 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          NEXO SAAS
        </div>
        <button className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-sm font-bold">Get Started</button>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-20 text-center">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl font-black tracking-tight mb-6">
          Build faster with <span className="text-indigo-600">Nexo AI</span>
        </motion.h1>
        <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto font-medium">
          The ultimate foundation for your next big idea. Fully responsive, clean code, and production ready.
        </p>
        <div className="flex justify-center gap-4">
          <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 flex items-center gap-2">
            Start Building <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>
    </div>
  );
}`,
    },
  },
  ecommerce: {
    id: "ecommerce",
    name: "E-commerce Store",
    description: "Modern storefront with cart and checkout",
    files: {
      "package.json": JSON.stringify(
        {
          name: "nexo-store",
          dependencies: {
            react: "^19.0.0",
            "lucide-react": "^0.450.0",
            "framer-motion": "^12.0.0",
          },
        },
        null,
        2,
      ),
      "src/App.tsx": `// E-commerce logic here`,
    },
  },
};
