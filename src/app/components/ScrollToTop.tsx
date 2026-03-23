import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ScrollToTop() {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);
  const { dark } = useTheme();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = v > 0.15;
    setVisible((prev) => (prev === next ? prev : next));
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-[90] w-12 h-12 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center justify-center group transition-all duration-300 hover:-translate-y-1 ${
            dark
              ? "bg-gray-900/80 border-gray-700/60 shadow-violet-500/10 hover:shadow-violet-500/20 hover:border-violet-500/50"
              : "bg-white/80 border-gray-200/60 shadow-violet-500/10 hover:shadow-violet-500/20 hover:border-violet-300"
          }`}
        >
          <ArrowUp className="w-5 h-5 text-gray-500 group-hover:text-violet-600 transition-colors" />
          {/* Circular progress */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 48 48"
          >
            <circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="rgba(139,92,246,0.1)"
              strokeWidth="2"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="url(#scrollGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 21}
              style={{
                strokeDashoffset: `calc(${2 * Math.PI * 21} - ${2 * Math.PI * 21} * var(--progress, 0))`,
              }}
            />
            <defs>
              <linearGradient id="scrollGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
