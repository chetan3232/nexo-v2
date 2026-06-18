export const SAAS_TEMPLATES = {
  Auth: `import React, { useState } from 'react';
import { Mail, Lock, Loader2, Chrome, Sparkles, CheckCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (email: string) => void;
}

export default function SaaSAuth({ onLogin }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(email);
    }, 1500);
  };

  return (
    <div className="min-h-[500px] flex items-center justify-center bg-[#09090b] text-white p-4 rounded-2xl border border-stone-850">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-2.5 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {mode === 'login' ? 'Sign in to workspace' : 'Create developer account'}
          </h2>
          <p className="text-xs text-stone-400">
            Get instant sandbox credentials and API access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full bg-black/40 border border-stone-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Password</label>
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
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_30px_rgba(79,70,229,0.2)] flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Connect' : 'Sign Up'}</span>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-stone-850" />
          <span className="relative px-3 bg-[#09090b] text-[9px] font-mono font-bold text-stone-500 uppercase">Or</span>
        </div>

        <button 
          onClick={() => onLogin("google-oauth@nexo.ai")}
          className="w-full py-2.5 bg-stone-900 border border-stone-850 hover:bg-stone-850 text-stone-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2"
        >
          <Chrome className="w-4 h-4 text-indigo-400" />
          <span>OAuth Google SSO</span>
        </button>

        <div className="text-center text-[11px] text-stone-400">
          {mode === 'login' ? (
            <span>New user? <button onClick={() => setMode('signup')} className="text-indigo-400 font-bold hover:underline">Create account</button></span>
          ) : (
            <span>Already have an account? <button onClick={() => setMode('login')} className="text-indigo-400 font-bold hover:underline">Sign in</button></span>
          )}
        </div>
      </div>
    </div>
  );
}`,

  Billing: `import React, { useState } from 'react';
import { Check, Sparkles, Loader2, CreditCard } from 'lucide-react';

interface BillingProps {
  currentPlan: 'Free' | 'Pro';
  onUpgrade: () => void;
}

export default function SaaSBilling({ currentPlan, onUpgrade }: BillingProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  const plans = [
    { name: "Starter", price: billingCycle === 'monthly' ? "$0" : "$0", desc: "For builders and prototyping", features: ["1 active container sandbox", "10 generation requests / day", "Standard community support"], tier: 'Free' },
    { name: "Pro Platform", price: billingCycle === 'monthly' ? "$29" : "$19", desc: "For developers and squads", features: ["Unlimited sandboxes", "Unlimited AI code requests", "Pro GPU failovers", "24/7 dedicated support"], tier: 'Pro' }
  ];

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      setShowCheckout(false);
      onUpgrade();
    }, 2000);
  };

  return (
    <div className="space-y-8 text-white p-4">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight">Flexible SaaS Subscription</h2>
        <p className="text-xs text-stone-400 max-w-sm mx-auto">Get dedicated container resources and bypass rate limits instantly.</p>
        
        <div className="inline-flex bg-stone-900 border border-stone-850 p-1 rounded-xl mx-auto mt-2">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={\`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all \${billingCycle === 'monthly' ? "bg-indigo-600 text-white" : "text-stone-400 hover:text-stone-200"}\`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={\`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all \${billingCycle === 'annual' ? "bg-indigo-600 text-white" : "text-stone-400 hover:text-stone-200"}\`}
          >
            Annual (-20%)
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {plans.map((p, i) => {
          const isActive = currentPlan === p.tier;
          return (
            <div 
              key={i} 
              className={\`bg-stone-950/60 border rounded-2xl p-5 flex flex-col justify-between transition-all relative \${
                p.tier === 'Pro' 
                  ? "border-indigo-500 shadow-[0_12px_30px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/30" 
                  : "border-stone-800 hover:border-stone-750"
              }\`}
            >
              {p.tier === 'Pro' && (
                <div className="absolute top-[-11px] right-4 inline-flex items-center gap-1 bg-indigo-600 text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Popular</span>
                </div>
              )}

              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-sm font-bold tracking-tight">{p.name}</h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">{p.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black font-mono">{p.price}</span>
                  <span className="text-[9px] text-stone-500 font-medium">/ month</span>
                </div>

                <div className="h-px bg-stone-900" />

                <ul className="space-y-2 text-[11px] text-stone-300">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => p.tier === 'Pro' && !isActive ? setShowCheckout(true) : null}
                disabled={isActive}
                className={\`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition-all border \${
                  isActive
                    ? "bg-stone-900 border-stone-800 text-stone-500 cursor-not-allowed"
                    : p.tier === 'Pro'
                      ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10"
                      : "bg-transparent border-stone-800 text-stone-300 hover:text-white"
                }\`}
              >
                {isActive ? "Active Plan" : "Upgrade to Pro"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-850 rounded-2xl w-full max-w-sm p-6 space-y-4 text-left relative">
            <div>
              <h3 className="text-base font-bold">Secure Stripe Checkout</h3>
              <p className="text-[11px] text-stone-400">Complete payment cycle setup for Pro Platform</p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\\D/g, '').substring(0, 16))}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-black/40 border border-stone-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Expiry</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    className="w-full bg-black/40 border border-stone-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">CVC</label>
                  <input
                    type="password"
                    required
                    placeholder="•••"
                    className="w-full bg-black/40 border border-stone-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all font-mono text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing payment...</span>
                  </>
                ) : (
                  <span>Pay $29.00</span>
                )}
              </button>
            </form>

            <button 
              onClick={() => setShowCheckout(false)}
              className="absolute top-2.5 right-4 text-stone-500 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}`,

  Dashboard: `import React from 'react';
import { AreaChart, Users, DollarSign, Cpu, ArrowUpRight, TrendingUp, HelpCircle } from 'lucide-react';

interface DashboardProps {
  userEmail: string;
  userPlan: 'Free' | 'Pro';
}

export default function SaaSDashboard({ userEmail, userPlan }: DashboardProps) {
  const cards = [
    { label: "MRR", val: userPlan === 'Pro' ? "$29.00" : "$0.00", trend: "+100% upgrade status", icon: DollarSign, color: "text-emerald-500" },
    { label: "Connected Sandbox", val: "localhost:5173", trend: "100% uptime", icon: Cpu, color: "text-indigo-500" },
    { label: "Request Credits", val: userPlan === 'Pro' ? "Unlimited" : "10 remaining", trend: "Refreshes in 12h", icon: Users, color: "text-amber-500" }
  ];

  return (
    <div className="space-y-6 text-white p-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 to-stone-900 border border-stone-800/80 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Active Portal: {userEmail}</h2>
          <p className="text-xs text-stone-400">Manage sandbox tokens, deployments, and Stripe billing logs</p>
        </div>
        <span className={\`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border \${
          userPlan === 'Pro' 
            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-lg shadow-indigo-500/5" 
            : "bg-stone-900 text-stone-500 border-stone-850"
        }\`}>
          {userPlan} Tier
        </span>
      </div>

      {/* Grid widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-stone-950/60 border border-stone-900 rounded-2xl p-4.5 flex items-start gap-4">
              <div className="p-2.5 bg-stone-900 border border-stone-850 rounded-xl shrink-0">
                <Icon className={\`w-4 h-4 \${c.color}\`} />
              </div>
              <div className="space-y-1 text-left">
                <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">{c.label}</div>
                <div className="text-lg font-bold text-white font-mono leading-none">{c.val}</div>
                <div className="text-[8px] font-medium text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  <span>{c.trend}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* API credentials box */}
      <div className="bg-stone-950/60 border border-stone-900 rounded-2xl p-5 text-left space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white tracking-tight uppercase tracking-wider">Access Credentials</h3>
          <span className="text-[8px] bg-stone-900 px-2 py-0.5 rounded border border-stone-850 text-stone-500">Read-Only key</span>
        </div>
        <div className="bg-black/60 border border-stone-900 rounded-xl p-3 font-mono text-[10px] text-stone-400 break-all select-all select-text">
          sk_nexo_live_key_a8d7fc91b3ee429fb59f2026_mrr_platform
        </div>
      </div>
    </div>
  );
}`,

  Settings: `import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Key, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SaaSSettings() {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security' | 'webhooks'>('profile');
  const [saved, setSaved] = useState(false);

  const handleSaveSettings = () => {
    setSaved(true);
    toast.success("Settings updated successfully!");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-stone-950/40 border border-stone-850 rounded-2xl p-5 text-white flex flex-col md:flex-row gap-5 text-left">
      {/* Local Sidebar */}
      <div className="w-full md:w-36 flex md:flex-col gap-1 select-none shrink-0 border-b md:border-b-0 md:border-r border-stone-900 pb-3 md:pb-0 md:pr-3">
        {[
          { id: 'profile', name: 'Profile Settings', icon: User },
          { id: 'security', name: 'Security & Access', icon: Shield },
          { id: 'webhooks', name: 'Webhooks & API', icon: Key },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={\`px-3 py-2 flex items-center gap-2 rounded-lg text-[10px] font-bold transition-all text-left \${
                activeSubTab === t.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/50"
              }\`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Local Forms */}
      <div className="flex-1 space-y-4">
        {activeSubTab === 'profile' && (
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Profile Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">First Name</label>
                <input type="text" placeholder="John" className="w-full bg-black/40 border border-stone-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider">Last Name</label>
                <input type="text" placeholder="Doe" className="w-full bg-black/40 border border-stone-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Organization</label>
              <input type="text" placeholder="Nexo Labs Inc" className="w-full bg-black/40 border border-stone-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
            </div>
          </div>
        )}

        {activeSubTab === 'security' && (
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Security & Keys</h3>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Change Password</label>
              <input type="password" placeholder="New Password" className="w-full bg-black/40 border border-stone-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500 mb-1" />
              <input type="password" placeholder="Confirm Password" className="w-full bg-black/40 border border-stone-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500" />
            </div>
          </div>
        )}

        {activeSubTab === 'webhooks' && (
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Webhooks</h3>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Event URL Endpoint</label>
              <input type="text" placeholder="https://api.yourdomain.com/nexo-webhooks" className="w-full bg-black/40 border border-stone-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-indigo-500 font-mono" />
            </div>
          </div>
        )}

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold tracking-wider transition-all flex items-center gap-1 shadow-md shadow-indigo-600/10 ml-auto"
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : null}
          <span>Apply Changes</span>
        </button>
      </div>
    </div>
  );
}`,

  Onboarding: `import React, { useState } from 'react';
import { ArrowRight, Sparkles, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function SaaSOnboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Welcome to NEXO SaaS Portal",
      desc: "Get ready to build subscription-backed application backends with authentication, credit limits, and mock Stripe checkouts in seconds.",
      details: "This app runs in your browser's local sandbox, executing Live WebContainer Node servers."
    },
    {
      title: "Choose Auth Providers",
      desc: "NEXO automatically scaffolding setup codes for Firebase Auth and OAuth endpoints. Your application dashboard is locked by default.",
      details: "Check out the SaaSAuth.tsx file to review full connection routines."
    },
    {
      title: "Confirm Stripe Invoicing",
      desc: "Configure pricing plans, billing thresholds, and checkout sessions. Users get upgraded instantly upon credit card mock validation.",
      details: "Stripe forms are structured with custom tailwind UI overlays."
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const currentSlide = slides[step];

  return (
    <div className="min-h-[400px] flex items-center justify-center bg-[#09090b] text-white p-6 rounded-2xl border border-stone-850 select-none">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono">
          <span>SaaS Setup Guide</span>
          <span>Slide {step + 1} of {slides.length}</span>
        </div>

        <div className="space-y-3.5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mx-auto shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white">{currentSlide.title}</h3>
          <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">{currentSlide.desc}</p>
        </div>

        <div className="bg-stone-950/60 border border-stone-900 rounded-xl p-3 text-[10px] text-stone-500 text-left font-mono">
          {currentSlide.details}
        </div>

        {/* Stepper progress dots */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={\`h-1 rounded-full transition-all \${i === step ? "w-6 bg-indigo-500" : "w-1.5 bg-stone-800"}\`} 
              />
            ))}
          </div>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-indigo-600/10"
          >
            <span>{step === slides.length - 1 ? 'Launch Portal' : 'Next Slide'}</span>
            {step === slides.length - 1 ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}`,

  App: `import React, { useState } from 'react';
import SaaSOnboarding from './components/SaaSOnboarding';
import SaaSAuth from './components/SaaSAuth';
import SaaSDashboard from './components/SaaSDashboard';
import SaaSBilling from './components/SaaSBilling';
import SaaSSettings from './components/SaaSSettings';
import { Home, CreditCard, Settings, LogOut, Sparkles } from 'lucide-react';

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<'Free' | 'Pro'>('Free');
  const [activeView, setActiveView] = useState<'dashboard' | 'billing' | 'settings'>('dashboard');

  const handleLogin = (email: string) => {
    setUserEmail(email);
  };

  const handleUpgrade = () => {
    setUserPlan('Pro');
  };

  const handleLogout = () => {
    setUserEmail(null);
    setUserPlan('Free');
    setActiveView('dashboard');
  };

  // 1. Onboarding Flow
  if (!onboarded) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center p-4">
        <SaaSOnboarding onComplete={() => setOnboarded(true)} />
      </div>
    );
  }

  // 2. Authentication Flow
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center p-4">
        <SaaSAuth onLogin={handleLogin} />
      </div>
    );
  }

  // 3. SaaS Dashboard Portal View
  return (
    <div className="min-h-screen bg-[#070709] text-stone-200 font-sans flex flex-col">
      {/* Main Header */}
      <header className="bg-stone-950 border-b border-stone-900 px-6 py-4 flex justify-between items-center select-none shrink-0">
        <div className="flex items-center gap-2.5 text-white font-extrabold tracking-wide">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-[10px] shadow-lg shadow-indigo-600/20">N</div>
          <span>NEXO Portal</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] text-stone-400 hidden sm:inline-block">Logged as: <strong className="text-white">{userEmail}</strong></span>
          <button 
            onClick={handleLogout}
            className="p-1.5 hover:bg-stone-900 rounded-lg text-stone-500 hover:text-white transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-48 bg-stone-950 border-b md:border-b-0 md:border-r border-stone-900/60 p-4.5 flex md:flex-col gap-1.5 shrink-0 select-none">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: Home },
            { id: 'billing', name: 'Stripe Billing', icon: CreditCard },
            { id: 'settings', name: 'App Settings', icon: Settings }
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeView === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveView(t.id as any)}
                className={\`px-3 py-2.5 flex items-center gap-2.5 rounded-xl text-xs font-semibold tracking-wide text-left transition-all border \${
                  isActive 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/10" 
                    : "bg-transparent border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30"
                }\`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Dynamic Portal Contents */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 bg-stone-900/15">
          <div className="max-w-4xl mx-auto">
            {activeView === 'dashboard' && (
              <SaaSDashboard userEmail={userEmail} userPlan={userPlan} />
            )}
            {activeView === 'billing' && (
              <SaaSBilling currentPlan={userPlan} onUpgrade={handleUpgrade} />
            )}
            {activeView === 'settings' && (
              <SaaSSettings />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}`
};
