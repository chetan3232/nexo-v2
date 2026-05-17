export const NEXO_MOTION_PRESETS = {
  apple_spring: {
    type: "spring",
    stiffness: 260,
    damping: 20,
  },
  smooth_fade: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  stagger_container: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};

export const ANIMATION_PROMPT_INJECTION = `
When the user asks for 'Apple-level animations' or high-quality motion:
1. Use Framer Motion (import { motion, AnimatePresence } from 'framer-motion').
2. Use Spring Physics: transition={{ type: "spring", stiffness: 260, damping: 20 }}.
3. Apply Stagger Effects for lists: staggerChildren: 0.1.
4. Ensure Layout Transitions: layoutId for shared elements.
5. Use smooth Easing: ease: [0.22, 1, 0.36, 1].
`.trim();
