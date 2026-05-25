import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cpu,
  Heart,
  Code,
  Zap,
  Globe,
  Sparkles,
} from "lucide-react";
import Avatar from "../components/Avatar";
import { CompanionState } from "../types";

const Home: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-32 pb-24 px-4 sm:px-6">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center mt-0">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-orange-100/50 via-blue-100/30 to-sky-100/30 rounded-full blur-3xl opacity-60"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 max-w-4xl mx-auto relative z-10"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-stone-200 px-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition-shadow cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-stone-600">
              Nexo v2 is live
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-stone-900 leading-[0.95]">
            Build your friend.
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600">
              Design your world.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-stone-500 max-w-2xl mx-auto leading-relaxed font-light">
            An open-source AI companion that codes, chats, and cares. Bring
            emotional intelligence to your desktop.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/demo"
              className="group bg-stone-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-stone-800 transition-all flex items-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1 text-lg"
            >
              Try the Demo{" "}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/build"
              className="px-8 py-4 rounded-full font-semibold border border-stone-200 hover:border-stone-400 transition-all bg-white text-stone-700 hover:bg-stone-50 text-lg"
            >
              Hardware Guide
            </Link>
          </div>
        </motion.div>

        {/* Floating Avatar Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#fbf9f6] to-transparent z-10 h-32 bottom-0 w-full"></div>
          <Avatar state={CompanionState.IDLE} />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {[
          {
            icon: Heart,
            title: "Emotional Core",
            desc: "Powered by Nexo 2.0, Nexo understands nuance, tone, and empathy better than ever.",
            color: "text-red-500",
            bg: "bg-red-50",
          },
          {
            icon: Code,
            title: "Self-Building",
            desc: "Ask Nexo to write Python scripts or generate React websites instantly in the sandbox.",
            color: "text-blue-500",
            bg: "bg-blue-50",
          },
          {
            icon: Globe,
            title: "Open Platform",
            desc: "100% open source hardware and software. Modify, hack, and extend your companion.",
            color: "text-green-500",
            bg: "bg-green-50",
          },
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
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

      {/* Big Feature Block */}
      <section className="relative rounded-[3rem] overflow-hidden bg-stone-900 text-white shadow-2xl mx-4">
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-sky-500 to-blue-600 opacity-30 blur-[100px] rounded-full"></div>

        <div className="relative z-10 grid md:grid-cols-2 gap-12 p-12 md:p-24 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full text-sm font-medium text-sky-200">
              <Sparkles className="w-4 h-4" />
              <span>New Feature</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
              Code with a friend. Not a bot.
            </h2>
            <p className="text-lg text-stone-300 leading-relaxed max-w-md">
              Nexo v2 isn'it just a chatbot. It has a built-in E2B sandbox
              environment to run Python code and a web previewer for React apps.
              It builds while you chat.
            </p>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 bg-white text-stone-900 px-6 py-3 rounded-xl font-bold hover:bg-stone-100 transition-colors"
            >
              Start Coding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-stone-800/50 rounded-2xl p-6 border border-white/10 backdrop-blur-md rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-xs font-mono text-stone-400 ml-2">
                main.py
              </span>
            </div>
            <div className="font-mono text-sm space-y-2">
              <p className="text-sky-400">
                def <span className="text-blue-400">create_happiness</span>():
              </p>
              <p className="text-stone-300 pl-4">
                mood = <span className="text-green-400">"amazing"</span>
              </p>
              <p className="text-stone-300 pl-4">
                print(f
                <span className="text-green-400">
                  "Nexo is feeling {"{mood}"}!"
                </span>
                )
              </p>
              <p className="text-stone-500 pl-4">
                # AI that actually runs code
              </p>
              <p className="text-blue-400">create_happiness()</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
