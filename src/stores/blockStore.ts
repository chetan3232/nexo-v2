import { create } from "zustand";

export interface LayoutBlock {
  id: string;
  name: string;
  category: "Hero" | "Auth" | "Dashboard" | "Pricing" | "Footer";
  description: string;
  code: string;
  isCustom?: boolean;
}

const PRESET_BLOCKS: LayoutBlock[] = [
  {
    id: "hero-glassmorphism",
    name: "Glassmorphism Hero",
    category: "Hero",
    description: "Premium glassmorphic hero block with bold typography and gradient glow mesh backdrops.",
    code: `import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-[#0c0c0e] text-white px-6">
      {/* Background Mesh Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-semibold tracking-wider text-indigo-400">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>V2.5 Autonomous Platform</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] bg-clip-text text-transparent bg-gradient-to-r from-white via-stone-200 to-stone-400">
          Describe it. Build it.<br />
          <span className="text-indigo-400">Ship it in seconds.</span>
        </h1>
        
        <p className="text-base sm:text-lg text-stone-400 max-w-xl mx-auto leading-relaxed">
          NEXO is the elite autonomous software engineer in your browser, generating production-grade layouts and logic from plain text.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_8px_30px_rgba(79,70,229,0.4)] hover:scale-102">
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all backdrop-blur-md">
            Watch Blueprint
          </button>
        </div>
      </div>
    </div>
  );
}`
  },
  {
    id: "auth-glassmorphic",
    name: "Glassmorphic Auth Card",
    category: "Auth",
    description: "Sleek login/signup card with glowing inputs, modern OAuth button, and clean border accents.",
    code: `import React, { useState } from 'react';
import { Mail, Lock, Loader2, Chrome } from 'lucide-react';

export default function AuthCard() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="w-full max-w-md bg-stone-900/40 border border-stone-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

        <div className="space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome back</h2>
            <p className="text-xs text-stone-400">Access your cloud runtime dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full bg-black/40 border border-stone-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition-all font-sans"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block">Password</label>
                <a href="#" className="text-[10px] text-indigo-400 font-bold hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-stone-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_30px_rgba(79,70,229,0.2)] hover:scale-101 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-x-0 h-px bg-stone-800/80" />
            <span className="relative px-3 bg-[#09090b] text-[10px] font-mono font-bold text-stone-500 uppercase">Or continue with</span>
          </div>

          <button className="w-full py-2.5 bg-stone-900 border border-stone-850 hover:bg-stone-850 text-stone-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2">
            <Chrome className="w-4 h-4" />
            Google Workspace
          </button>
        </div>
      </div>
    </div>
  );
}`
  },
  {
    id: "dashboard-sass",
    name: "SaaS Admin Dashboard",
    category: "Dashboard",
    description: "Fully featured admin dashboard dashboard layout featuring metric cards, sidebar, and mock charts.",
    code: `import React from 'react';
import { AreaChart, TrendingUp, Users, ArrowUpRight, DollarSign } from 'lucide-react';

export default function DashboardLayout() {
  const cards = [
    { label: "Active Revenue", val: "$45,231.89", trend: "+20.1% from last month", icon: DollarSign, color: "text-emerald-500" },
    { label: "Subscribers", val: "+2,350", trend: "+180.1% from last month", icon: Users, color: "text-indigo-500" },
    { label: "Compute Util", val: "89.2%", trend: "+19% from yesterday", icon: AreaChart, color: "text-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-[#08080a] text-stone-200 font-sans p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-900 pb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Workspace Overview</h1>
            <p className="text-xs text-stone-400">Metrics aggregated in real-time</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/15">
            <span>Export Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-stone-950/60 border border-stone-900 rounded-2xl p-5 flex items-start gap-4 hover:border-stone-850 transition-colors">
                <div className="p-3 bg-stone-900 rounded-xl border border-stone-850 shrink-0">
                  <Icon className={\`w-5 h-5 \${c.color}\`} />
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{c.label}</div>
                  <div className="text-xl font-bold text-white font-mono leading-none">{c.val}</div>
                  <div className="text-[9px] font-medium text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>{c.trend}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Console Box & Mock List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-stone-950/60 border border-stone-900 rounded-2xl p-5 md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight">Recent Deployments</h3>
            <div className="h-44 rounded-xl border border-stone-900 bg-black/60 p-4 font-mono text-[11px] text-stone-400 flex flex-col gap-2 overflow-y-auto">
              <div className="flex gap-2 text-stone-500"><span className="text-indigo-500">$</span> npm run build:sandbox</div>
              <div className="text-stone-300">✓ Compiled client bundle in 1.4s</div>
              <div className="text-stone-300">✓ Exported statically routed deployment targets</div>
              <div className="text-emerald-400">✓ Active at: https://nexo-deployed-live.sh</div>
            </div>
          </div>
          <div className="bg-stone-950/60 border border-stone-900 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              <h3 className="text-sm font-bold text-white tracking-tight">Squad Roles</h3>
              <div className="space-y-2.5">
                {[
                  { name: "Gemini 2.5 Pro", r: "Architect", status: "Active" },
                  { name: "Qwen 3 Coder", r: "Developer", status: "Idle" },
                  { name: "QA Assertions", r: "Auditor", status: "Active" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-300">{s.name}</span>
                    <span className="text-[10px] text-indigo-400 font-bold">{s.r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-stone-500 leading-relaxed pt-3 border-t border-stone-900">
              Agent status syncs automatically via WebSockets SSE streaming interfaces.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}`
  },
  {
    id: "pricing-tier",
    name: "Responsive Pricing Tier",
    category: "Pricing",
    description: "Responsive 3-tier SaaS pricing block highlighting a recommended pricing option.",
    code: `import React, { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    { name: "Starter", desc: "For builders and hobbyists", price: billingCycle === 'monthly' ? "$19" : "$14", tag: "per month", popular: false, features: ["5 active projects", "2 team members", "Community support"] },
    { name: "Pro Platform", desc: "For growing teams and startups", price: billingCycle === 'monthly' ? "$49" : "$39", tag: "per month", popular: true, features: ["Unlimited active projects", "10 team members", "GPU AI agent instances", "24/7 dedicated support"] },
    { name: "Enterprise", desc: "For high security compliance", price: "Custom", tag: "annual billing", popular: false, features: ["Self-hosted container runtimes", "Enterprise SSO controls", "Custom LLM integrations"] },
  ];

  return (
    <div className="min-h-screen bg-[#070709] text-stone-200 px-6 py-12 flex flex-col justify-center">
      <div className="max-w-5xl mx-auto space-y-10 text-center w-full">
        
        {/* Toggle */}
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none">Transparent pricing tiers</h2>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">Get absolute power and sandbox runtime capabilities on any device.</p>
          <div className="inline-flex bg-stone-950 border border-stone-900 p-1 rounded-xl mx-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={\`px-4 py-1.5 rounded-lg text-xs font-bold transition-all \${billingCycle === 'monthly' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-stone-400 hover:text-stone-200"}\`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={\`px-4 py-1.5 rounded-lg text-xs font-bold transition-all \${billingCycle === 'annual' ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-stone-400 hover:text-stone-200"}\`}
            >
              Annual billing (20% off)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
          {plans.map((p, i) => (
            <div 
              key={i} 
              className={\`bg-stone-950/60 border rounded-3xl p-6 flex flex-col justify-between transition-all relative \${
                p.popular 
                  ? "border-indigo-500 shadow-[0_12px_40px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/50" 
                  : "border-stone-900 hover:border-stone-850"
              }\`}
            >
              {p.popular && (
                <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  <span>Recommended</span>
                </div>
              )}

              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">{p.name}</h3>
                  <p className="text-[10px] text-stone-500 leading-relaxed">{p.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">{p.price}</span>
                  <span className="text-[10px] text-stone-500 font-medium">{p.tag}</span>
                </div>

                <div className="h-px bg-stone-900" />

                <ul className="space-y-2.5 text-xs text-stone-300">
                  {p.features.map((feat, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="truncate">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button className={\`w-full mt-8 py-3 rounded-xl text-xs font-bold tracking-wide transition-all border \${
                p.popular 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-700" 
                  : "bg-transparent border-stone-850 hover:border-stone-700 text-stone-300 hover:text-white"
              }\`}>
                Activate subscription
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}`
  },
  {
    id: "footer-modern",
    name: "Modern Multi-column Footer",
    category: "Footer",
    description: "Responsive 4-column footer with newsletter signup and glassmorphism styling.",
    code: `import React from 'react';
import { Send, Github, Twitter, Linkedin } from 'lucide-react';

export default function FooterBlock() {
  return (
    <footer className="bg-[#09090b] border-t border-stone-900 text-stone-400 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Company Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white font-extrabold tracking-wide">
            <span className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-[10px]">N</span>
            <span>NEXO V2</span>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed">
            The self-assembling layout software machine running live sandbox runtimes inside browser frames.
          </p>
          <div className="flex items-center gap-3">
            {[Github, Twitter, Linkedin].map((Icon, idx) => (
              <a key={idx} href="#" className="p-2 bg-stone-900 border border-stone-850 rounded-lg text-stone-500 hover:text-white hover:border-stone-700 transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Features</h4>
          <ul className="space-y-2 text-xs">
            {["Agent Squads", "Visual Editor", "WebContainers", "Deploy Host"].map((item, idx) => (
              <li key={idx}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
            ))}
          </ul>
        </div>

        {/* Links Column 2 */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Starters</h4>
          <ul className="space-y-2 text-xs">
            {["React Boilerplate", "Tailwind Template", "Next.js Integration", "Express APIs"].map((item, idx) => (
              <li key={idx}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
            ))}
          </ul>
        </div>

        {/* Newsletter Column */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Stay updated</h4>
          <p className="text-[11px] text-stone-500 leading-relaxed">Subscribe to receive monthly engine release notes.</p>
          <form onSubmit={(e) => e.preventDefault()} className="relative mt-2">
            <input 
              type="email" 
              placeholder="developer@company.com" 
              className="w-full bg-stone-950 border border-stone-900 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs outline-none text-white placeholder-stone-600 transition-all font-sans"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
      <div className="max-w-6xl mx-auto border-t border-stone-900/60 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-[10px] text-stone-600 select-none">
        <span>© 2026 Nexo Autonomous Systems. All rights reserved.</span>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-stone-400">Terms of Use</a>
          <a href="#" className="hover:text-stone-400">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}`
  }
];

interface BlockStore {
  blocks: LayoutBlock[];
  searchQuery: string;
  selectedCategory: string;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  addCustomBlock: (block: Omit<LayoutBlock, "id" | "isCustom">) => void;
  deleteBlock: (id: string) => void;
}

export const useBlockStore = create<BlockStore>((set) => {
  // Load custom blocks from localStorage on init if available
  let initialBlocks = [...PRESET_BLOCKS];
  try {
    const custom = localStorage.getItem("nexo_custom_blocks");
    if (custom) {
      const parsed = JSON.parse(custom) as LayoutBlock[];
      initialBlocks = [...PRESET_BLOCKS, ...parsed];
    }
  } catch (e) {
    console.error("Failed to parse custom blocks:", e);
  }

  return {
    blocks: initialBlocks,
    searchQuery: "",
    selectedCategory: "All",
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
    addCustomBlock: (newBlock) =>
      set((state) => {
        const blockObj: LayoutBlock = {
          ...newBlock,
          id: `custom-${Date.now()}`,
          isCustom: true,
        };
        const updated = [...state.blocks, blockObj];
        
        // Save only custom blocks to localStorage
        const customOnly = updated.filter((b) => b.isCustom);
        localStorage.setItem("nexo_custom_blocks", JSON.stringify(customOnly));
        
        return { blocks: updated };
      }),
    deleteBlock: (id) =>
      set((state) => {
        const updated = state.blocks.filter((b) => b.id !== id);
        
        // Save only custom blocks to localStorage
        const customOnly = updated.filter((b) => b.isCustom);
        localStorage.setItem("nexo_custom_blocks", JSON.stringify(customOnly));
        
        return { blocks: updated };
      }),
  };
});
