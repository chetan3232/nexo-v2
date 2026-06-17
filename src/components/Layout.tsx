import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Download, Share2, Sparkles, User, LogOut, Sun, Moon } from "lucide-react";
import logoV2 from "../assets/NEXO-V2.png";
import { auth, signInWithGoogle, logout, onAuthStateChanged } from "../services/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { CommandPalette } from "./chat/CommandPalette";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const isDemo = location.pathname === "/demo";
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "light";
  });

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) =>
    location.pathname === path
      ? "text-[#111] font-semibold bg-white shadow-sm"
      : "text-[#666] hover:text-[#111]";

  return (
    <div
      className={`flex flex-col font-sans bg-[#f7f7f7] text-[#111] selection:bg-blue-100 selection:text-blue-900 ${
        isDemo ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      <CommandPalette />

      {/* ── Top Navigation Bar ── */}
      {!isDemo && (
        <header className="fixed top-0 w-full z-40 bg-white border-b border-[#e8e8e8]">
          <div className="max-w-full px-5 h-[52px] flex items-center justify-between gap-4">

            {/* Left: Logo + Brand */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                <img src={logoV2} alt="Nexo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-[15px] tracking-tight text-[#111]">Nexo v2</span>
            </Link>

            {/* Center: Pill navigation */}
            <nav className="flex items-center gap-0.5 bg-[#f3f3f3] p-1 rounded-full border border-[#e8e8e8]">
              <Link
                to="/"
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${isActive("/")}`}
              >
                Home
              </Link>
              <Link
                to="/demo"
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${isActive("/demo")}`}
              >
                Workspace
              </Link>
              <Link
                to="/build"
                className={`px-4 py-1.5 rounded-full text-sm transition-all ${isActive("/build")}`}
              >
                Guide
              </Link>
            </nav>

            {/* Right: Actions + User */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-[#666] hover:text-[#111] hover:bg-[#f3f3f3] transition-colors border border-transparent hover:border-[#e8e8e8] flex items-center justify-center shrink-0"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>

              {/* User area */}
              {user ? (
                <div className="flex items-center gap-2 bg-[#f7f7f7] pl-1.5 pr-3 py-1.5 rounded-full border border-[#e8e8e8]">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="User"
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white text-[10px] font-bold">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-[#333] max-w-[80px] truncate">
                    {user.displayName
                      ? user.displayName.split(" ")[0]
                      : user.email?.split("@")[0]}
                  </span>
                  <button
                    onClick={logout}
                    className="text-[#aaa] hover:text-[#e55] transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[#f3f3f3] hover:bg-[#ebebeb] text-[#333] rounded-full text-xs font-semibold transition-all border border-[#e8e8e8]"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}

              {!isDemo && (
                <Link
                  to="/demo"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#111] text-white rounded-full text-sm font-semibold hover:bg-[#333] transition-all shadow-sm hover:-translate-y-px"
                >
                  Launch
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── Page Content ── */}
      <main
        className={`flex-grow ${
          isDemo
            ? "h-screen pt-0 overflow-hidden flex flex-col"
            : "pt-20 px-4"
        }`}
      >
        {children}
      </main>

      {/* ── Footer (non-demo pages only) ── */}
      {!isDemo && (
        <footer className="border-t border-[#e8e8e8] py-16 bg-white mt-12">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-bold text-xl">
                <div className="w-6 h-6 rounded-md overflow-hidden">
                  <img src={logoV2} alt="Nexo" className="w-full h-full object-cover" />
                </div>
                Nexo v2
              </div>
              <p className="text-[#888] text-sm leading-relaxed">
                Autonomous AI software engineering — from prompt to production
                in seconds. Open source and powerful.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-[#111]">Project</h4>
              <ul className="space-y-3 text-sm text-[#888] font-medium">
                <li>
                  <Link to="/demo" className="hover:text-[#111] transition-colors">
                    Web Demo
                  </Link>
                </li>
                <li>
                  <Link to="/build" className="hover:text-[#111] transition-colors">
                    Hardware Spec
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-[#111] transition-colors">
                    Source Code
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-[#111]">Community</h4>
              <ul className="space-y-3 text-sm text-[#888] font-medium">
                <li>
                  <a href="#" className="hover:text-[#111] transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#111] transition-colors">
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#111] transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-[#111]">Powered By</h4>
              <div className="space-y-2 text-sm text-[#888]">
                <div className="flex items-center gap-2 bg-[#f7f7f7] p-2.5 rounded-xl border border-[#e8e8e8]">
                  Nexo AI Engine
                </div>
                <div className="flex items-center gap-2 bg-[#f7f7f7] p-2.5 rounded-xl border border-[#e8e8e8]">
                  Google Gemini API
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
