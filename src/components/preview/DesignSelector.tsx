import React from "react";
import { motion } from "framer-motion";
import { Palette, Sparkles, Layout, Zap, Monitor, Activity, Layers, Moon } from "lucide-react";

interface DesignSelectorProps {
  onSelect: (designName: string) => void;
}

export const DesignSelector: React.FC<DesignSelectorProps> = ({ onSelect }) => {
  const designs = [
    {
      id: "minimalist-glass",
      name: "Minimalist Glassmorphism",
      description: "Clean, elegant UI with frosted glass effects and subtle blur backgrounds.",
      icon: <Layers className="w-8 h-8 text-blue-400" />,
      gradient: "from-blue-500/20 to-purple-500/20",
      border: "border-blue-500/30",
    },
    {
      id: "neon-cyberpunk",
      name: "Neon Cyberpunk",
      description: "Dark mode aesthetic with glowing neon accents and high-contrast typography.",
      icon: <Zap className="w-8 h-8 text-pink-500" />,
      gradient: "from-pink-500/20 to-purple-600/20",
      border: "border-pink-500/30",
    },
    {
      id: "neobrutalism",
      name: "Playful Neobrutalism",
      description: "Bold colors, hard shadows, thick borders, and high-energy layouts.",
      icon: <Palette className="w-8 h-8 text-yellow-500" />,
      gradient: "from-yellow-400/20 to-orange-500/20",
      border: "border-yellow-500/30",
    },
    {
      id: "elegant-corporate",
      name: "Sleek Corporate",
      description: "Professional, trustworthy design with crisp typography and subtle shadows.",
      icon: <Activity className="w-8 h-8 text-emerald-400" />,
      gradient: "from-emerald-500/20 to-teal-500/20",
      border: "border-emerald-500/30",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#f7f7f7] dark:bg-[#111] overflow-y-auto p-8 relative">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-studio-accent/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-studio-accent/10 rounded-full mb-4">
            <Monitor className="w-8 h-8 text-studio-accent" />
          </div>
          <h1 className="text-4xl font-black text-studio-text mb-4 tracking-tight">Select Your Aesthetic</h1>
          <p className="text-studio-muted text-lg max-w-2xl mx-auto">
            Before we generate your application, pick a design system. Our AI will automatically adapt the layout, colors, and components to match your vision perfectly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {designs.map((design, idx) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <button
                onClick={() => onSelect(design.name)}
                className={`w-full text-left p-6 rounded-3xl border bg-studio-card/80 backdrop-blur-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${design.border}`}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${design.gradient} transition-opacity duration-500`} />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-4 bg-studio-bg rounded-2xl shadow-inner">
                      {design.icon}
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border border-studio-border text-studio-muted group-hover:bg-studio-accent group-hover:text-white group-hover:border-transparent transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-studio-text mb-2">{design.name}</h3>
                  <p className="text-studio-muted leading-relaxed">
                    {design.description}
                  </p>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
