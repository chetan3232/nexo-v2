import React, { useEffect, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { CompanionState } from '../types';

interface AvatarProps {
  state: CompanionState;
}

const Avatar: React.FC<AvatarProps> = ({ state }) => {
  const [blink, setBlink] = useState(false);

  // Random blink effect
  useEffect(() => {
    const blinkLoop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
      setTimeout(blinkLoop, Math.random() * 4000 + 2000);
    };
    const timer = setTimeout(blinkLoop, 3000);
    return () => clearTimeout(timer);
  }, []);

  const eyeVariants: Variants = {
    IDLE: { scaleY: 1, height: 80, transition: { type: 'spring', stiffness: 200 } },
    LISTENING: { scaleY: 1.2, height: 90, transition: { type: 'spring', stiffness: 300 } },
    THINKING: { translateY: [0, -10, 0], transition: { repeat: Infinity, duration: 1 } },
    CODING: { scaleX: [1, 1.2, 1], transition: { repeat: Infinity, duration: 0.2 } },
    BUILDING: { borderRadius: ["50%", "20%", "50%"], transition: { repeat: Infinity, duration: 1 } },
    SPEAKING: { height: [70, 100, 70], transition: { repeat: Infinity, duration: 0.3 } },
  };

  const containerVariants: Variants = {
    IDLE: { scale: 1 },
    LISTENING: { scale: 1.05 },
    THINKING: { rotate: [0, 5, -5, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    CODING: { x: [-2, 2, -2, 2], transition: { repeat: Infinity, duration: 0.1 } },
    BUILDING: { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0], transition: { repeat: Infinity, duration: 0.5 } },
    SPEAKING: { scale: 1.1 },
  };

  const isBlinking = blink && state === CompanionState.IDLE;

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow effect */}
      <motion.div 
        className={`absolute inset-0 rounded-full blur-3xl opacity-30 ${
            state === CompanionState.LISTENING ? 'bg-orange-400' :
            state === CompanionState.THINKING ? 'bg-blue-400' :
            state === CompanionState.CODING ? 'bg-purple-500' :
            state === CompanionState.BUILDING ? 'bg-indigo-500' :
            state === CompanionState.SPEAKING ? 'bg-green-400' : 'bg-gray-300'
        }`}
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      
      {/* Face Container */}
      <motion.div 
        className="relative w-48 h-48 bg-stone-900 rounded-[3rem] shadow-2xl flex items-center justify-center gap-6 border-4 border-stone-800"
        variants={containerVariants}
        animate={state}
      >
        {/* Left Eye */}
        <motion.div 
          className={`w-8 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] ${state === CompanionState.CODING ? 'bg-purple-200' : state === CompanionState.BUILDING ? 'bg-indigo-200' : ''}`}
          variants={eyeVariants}
          animate={isBlinking ? { scaleY: 0.1, height: 80 } : state}
        />
        
        {/* Right Eye */}
        <motion.div 
          className={`w-8 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] ${state === CompanionState.CODING ? 'bg-purple-200' : state === CompanionState.BUILDING ? 'bg-indigo-200' : ''}`}
          variants={eyeVariants}
          animate={isBlinking ? { scaleY: 0.1, height: 80 } : state}
        />
      </motion.div>
    </div>
  );
};

export default Avatar;