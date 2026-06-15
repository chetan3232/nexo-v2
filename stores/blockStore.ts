import { create } from 'zustand';

interface SavedBlock {
  id: string;
  name: string;
  category: string;
  code: string;
}

interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  techStack: 'react' | 'web' | 'node' | 'python';
}

interface BlockState {
  savedBlocks: SavedBlock[];
  templates: StarterTemplate[];
  saveBlock: (name: string, category: string, code: string) => void;
  deleteBlock: (id: string) => void;
}

export const useBlockStore = create<BlockState>((set) => ({
  savedBlocks: [
    {
      id: 'block-hero',
      name: 'Glassmorphic Hero Banner',
      category: 'Marketing',
      code: `export function Hero() { return <section className="p-12 text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl">...</section> }`
    },
    {
      id: 'block-auth',
      name: 'Secure Sign-In Form',
      category: 'Auth',
      code: `export function AuthForm() { return <form className="max-w-md mx-auto space-y-4">...</form> }`
    }
  ],
  templates: [
    { id: 'tpl-react', name: 'React 19 Vite Studio', description: 'React SPA scaffold configured with PostCSS and Tailwind CSS.', techStack: 'react' },
    { id: 'tpl-next', name: 'Next.js 15 App Router', description: 'Next.js app router structure supported by WebContainer compiles.', techStack: 'node' },
    { id: 'tpl-express', name: 'Node.js Express Server', description: 'Simple REST backend controllers and routers schema setup.', techStack: 'node' },
    { id: 'tpl-flask', name: 'Python Flask API', description: 'Python logic server stub with routing capabilities.', techStack: 'python' },
    { id: 'tpl-vanilla', name: 'Vanilla HTML5 & CSS3', description: 'Ultra-fast loading static html, css styling and native scripts.', techStack: 'web' },
  ],
  saveBlock: (name, category, code) =>
    set((state) => ({
      savedBlocks: [
        ...state.savedBlocks,
        {
          id: `block-${Date.now()}`,
          name,
          category,
          code,
        },
      ],
    })),
  deleteBlock: (id) =>
    set((state) => ({
      savedBlocks: state.savedBlocks.filter((b) => b.id !== id),
    })),
}));

export default useBlockStore;
