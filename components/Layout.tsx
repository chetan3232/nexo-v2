import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Github, Cpu, MessageCircle, Menu } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isDemo = location.pathname === '/demo';

  const isActive = (path: string) => location.pathname === path ? 'text-stone-900 font-semibold bg-stone-100' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50';

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fbf9f6] text-stone-800 selection:bg-orange-100 selection:text-orange-900">
      {!isDemo && (
        <header className="fixed top-0 w-full z-40 transition-all duration-300 bg-[#fbf9f6]/80 backdrop-blur-xl border-b border-stone-200/50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-stone-800 to-black rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                 <Heart className="w-4 h-4 text-white fill-current animate-pulse-slow" />
              </div>
              <span className="font-bold text-lg tracking-tight text-stone-900">Nexo v2</span>
            </Link>

            <nav className="hidden md:flex items-center gap-2 text-sm font-medium bg-white/50 p-1.5 rounded-full border border-stone-200/50 backdrop-blur-md shadow-sm">
              <Link to="/" className={`px-4 py-1.5 rounded-full transition-all ${isActive('/')}`}>Home</Link>
              <Link to="/demo" className={`px-4 py-1.5 rounded-full transition-all ${isActive('/demo')}`}>Workspace</Link>
              <Link to="/build" className={`px-4 py-1.5 rounded-full transition-all ${isActive('/build')}`}>Guide</Link>
            </nav>

            <div className="flex items-center gap-3">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-500 hover:text-black">
                <Github className="w-5 h-5" />
              </a>
              <Link to="/demo" className="hidden sm:flex items-center gap-2 bg-stone-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                <span>Launch</span>
              </Link>
              <button className="md:hidden p-2 text-stone-600">
                  <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-grow ${isDemo ? 'pt-0 px-0 h-screen overflow-hidden' : 'pt-24 px-4'}`}>
        {children}
      </main>

      {!isDemo && (
        <footer className="border-t border-stone-200 py-16 bg-white mt-12">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2 font-bold text-xl">
                <div className="w-6 h-6 bg-stone-900 rounded-md flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white fill-current" />
                </div>
                Nexo v2
                </div>
                <p className="text-stone-500 text-sm leading-relaxed">
                Making emotional intelligence accessible, open, and powerful for everyone. Built with love and code.
                </p>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-stone-900">Project</h4>
                <ul className="space-y-3 text-sm text-stone-500 font-medium">
                <li><Link to="/demo" className="hover:text-stone-900 transition-colors">Web Demo</Link></li>
                <li><Link to="/build" className="hover:text-stone-900 transition-colors">Hardware Spec</Link></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Source Code</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-stone-900">Community</h4>
                <ul className="space-y-3 text-sm text-stone-500 font-medium">
                <li><a href="#" className="hover:text-stone-900 transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Blog</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold mb-6 text-stone-900">Powered By</h4>
                <div className="flex items-center gap-3 text-stone-500 text-sm bg-stone-50 p-3 rounded-xl border border-stone-100">
                <Cpu className="w-5 h-5 text-indigo-500" />
                <span className="font-medium">Google Gemini 2.0</span>
                </div>
            </div>
            </div>
        </footer>
      )}
    </div>
  );
};