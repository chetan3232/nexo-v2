import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Code,
  Zap,
  Globe,
  Sparkles,
  Layers,
  Bot,
  Mic,
  GitBranch,
  Shield,
  Rocket,
  Eye,
  Palette,
  Terminal,
  Brain,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const Home: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-32 pb-24 px-4 sm:px-6">
      {/* ── Hero Section ── */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center mt-0">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[5%] left-[50%] -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-br from-indigo-200/40 via-purple-100/30 to-sky-100/20 rounded-full blur-3xl opacity-70 animate-pulse-slow"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-gradient-to-tr from-emerald-200/30 to-teal-100/20 rounded-full blur-3xl opacity-50"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 max-w-4xl mx-auto relative z-10"
        >
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-stone-200 px-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-stone-600">
              Nexo V2.5 — Autonomous Engine Live
            </span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-stone-900 leading-[0.95]">
            Describe it.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-orange-600 to-sky-500">
              Build it. Ship it.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-stone-500 max-w-2xl mx-auto leading-relaxed font-light">
            An autonomous AI software engineer in your browser. Turn natural
            language into complete, running applications — instantly.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/demo"
              className="group bg-stone-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-stone-800 transition-all flex items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 text-lg"
            >
              Start Building{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/build"
              className="px-8 py-4 rounded-full font-semibold border border-stone-200 hover:border-stone-400 transition-all bg-white text-stone-700 hover:bg-stone-50 text-lg"
            >
              How It Works
            </Link>
          </div>
        </motion.div>

        {/* Floating Architecture Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 w-full max-w-4xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#f7f7f7] to-transparent z-10 h-24 bottom-0 w-full pointer-events-none"></div>

          {/* Mini Architecture Diagram */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl p-6 md:p-8 overflow-hidden">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-stone-100">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <span className="text-xs font-mono text-stone-400 ml-3">nexo-workspace</span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Brain, label: "Planner Agent", color: "text-indigo-500 bg-indigo-50", status: "Planning..." },
                { icon: Code, label: "Code Agent", color: "text-purple-500 bg-purple-50", status: "Writing App.tsx" },
                { icon: Terminal, label: "Runtime", color: "text-emerald-500 bg-emerald-50", status: "npm install" },
                { icon: Eye, label: "Preview", color: "text-sky-500 bg-sky-50", status: "localhost:3000" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.15 }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-stone-100 ${item.color.split(' ')[1]}`}
                >
                  <item.icon className={`w-6 h-6 ${item.color.split(' ')[0]}`} />
                  <span className="text-[11px] font-bold text-stone-700 text-center">{item.label}</span>
                  <span className="text-[10px] font-mono text-stone-400">{item.status}</span>
                </motion.div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ delay: 1, duration: 2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 12-Phase Flow Showcase ── */}
      <section className="px-4">
        <motion.div {...fadeUp} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-indigo-500 mb-4">
            <Sparkles className="w-4 h-4" /> 12-Phase Cinematic Flow
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
            From prompt to production
          </h2>
          <p className="text-lg text-stone-500 mt-4 max-w-xl mx-auto">
            Four autonomous stages. Twelve intelligent phases. Zero manual setup.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            {
              stage: "A",
              title: "Intent & Design",
              phases: ["Intent Extraction", "Concept Selection", "Design Editor"],
              color: "from-blue-500 to-indigo-600",
              bg: "bg-blue-50",
              icon: Palette,
            },
            {
              stage: "B",
              title: "Blueprint",
              phases: ["Blueprint Gen", "Customization", "Confirmation"],
              color: "from-purple-500 to-violet-600",
              bg: "bg-purple-50",
              icon: Layers,
            },
            {
              stage: "C",
              title: "Generation",
              phases: ["Scaffolding", "Deep Code Gen", "Live Compile"],
              color: "from-amber-500 to-orange-600",
              bg: "bg-amber-50",
              icon: Zap,
            },
            {
              stage: "D",
              title: "Ship & Audit",
              phases: ["Quality Audit", "Deployment", "Live Preview"],
              color: "from-emerald-500 to-teal-600",
              bg: "bg-emerald-50",
              icon: Rocket,
            },
          ].map((stage, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              className={`group p-6 ${stage.bg} rounded-2xl border border-stone-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <stage.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-1">
                Stage {stage.stage}
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-4">{stage.title}</h3>
              <ul className="space-y-2">
                {stage.phases.map((phase, pIdx) => (
                  <li key={pIdx} className="flex items-center gap-2 text-sm text-stone-600">
                    <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${stage.color} flex items-center justify-center text-[10px] font-bold text-white`}>
                      {idx * 3 + pIdx + 1}
                    </span>
                    {phase}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {[
          {
            icon: Bot,
            title: "Multi-Agent Engine",
            desc: "16 specialized AI agents collaborate in parallel — Planner, PM, Frontend, Backend, DevOps, QA, Security, and more.",
            color: "text-indigo-500",
            bg: "bg-indigo-50",
          },
          {
            icon: Code,
            title: "Live Code Streaming",
            desc: "Watch files generate in real-time via Server-Sent Events. Code streams character by character into the editor.",
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
          {
            icon: Globe,
            title: "WebContainer Runtime",
            desc: "Full Node.js environment inside the browser via StackBlitz WebContainers. Zero cloud servers needed.",
            color: "text-emerald-500",
            bg: "bg-emerald-50",
          },
          {
            icon: Mic,
            title: "Voice-to-App",
            desc: "Speak your app idea. Real-time speech transcription feeds directly into the generation pipeline.",
            color: "text-sky-500",
            bg: "bg-sky-50",
          },
          {
            icon: Shield,
            title: "Self-Healing Loop",
            desc: "Runtime errors are auto-detected and patched. 10 error patterns trigger autonomous debug cycles.",
            color: "text-amber-500",
            bg: "bg-amber-50",
          },
          {
            icon: GitBranch,
            title: "One-Click Deploy",
            desc: "Push to GitHub, export as ZIP, or deploy live — all from the workspace toolbar in one click.",
            color: "text-rose-500",
            bg: "bg-rose-50",
          },
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
            className="group p-8 bg-white rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:border-stone-200 transition-all duration-300 hover:-translate-y-2"
          >
            <div
              className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`}
            >
              <feature.icon className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-stone-900">
              {feature.title}
            </h3>
            <p className="text-stone-500 leading-relaxed text-lg">
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </section>

      {/* ── Big Feature Block ── */}
      <section className="relative rounded-[3rem] overflow-hidden bg-stone-900 text-white shadow-2xl mx-4">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500 to-purple-600 opacity-30 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-20 blur-[80px] rounded-full"></div>

        <div className="relative z-10 grid md:grid-cols-2 gap-12 p-12 md:p-24 items-center">
          <div className="space-y-8">

            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your AI
              <br />
              engineering team.
            </h2>
            <p className="text-lg text-stone-300 leading-relaxed max-w-md">
              Nexo V2 orchestrates 16 AI agents that plan, code, test, debug,
              and deploy — all running live inside a WebContainer sandbox in
              your browser.
            </p>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 bg-white text-stone-900 px-6 py-3 rounded-xl font-bold hover:bg-stone-100 transition-colors"
            >
              Launch Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Agent Activity Mock */}
          <div className="bg-stone-800/50 rounded-2xl p-6 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs font-mono text-stone-400 ml-2">
                agent-orchestrator.log
              </span>
            </div>
            <div className="font-mono text-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-400">[Planner]</span>
                <span className="text-stone-300">Generated 8 tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                <span className="text-purple-400">[Frontend]</span>
                <span className="text-stone-300">Writing App.tsx...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                <span className="text-sky-400">[Backend]</span>
                <span className="text-stone-300">Creating /api/users</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-amber-400">[DevOps]</span>
                <span className="text-stone-300">Configuring package.json</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="w-2 h-2 rounded-full bg-stone-500"></span>
                <span className="text-stone-500">[QA]</span>
                <span className="text-stone-500">Waiting for build...</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="w-2 h-2 rounded-full bg-stone-500"></span>
                <span className="text-stone-500">[Security]</span>
                <span className="text-stone-500">Queued</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack Strip ── */}
      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl border border-stone-200 p-8 md:p-12 text-center shadow-sm"
        >
          <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-stone-400 mb-8">
            Built With
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {[
              "React 19",
              "TypeScript",
              "Vite",
              "WebContainers",
              "Gemini AI",
              "Firebase",
              "Zustand",
              "Monaco Editor",
              "Framer Motion",
            ].map((tech) => (
              <span
                key={tech}
                className="text-sm md:text-base font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-default"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
