import { motion } from "motion/react";
import { useTheme } from "./ThemeProvider";

export function GlobalFlowLines() {
  const { dark } = useTheme();

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id="flow-violet-blue-a" gradientUnits="userSpaceOnUse" x1="-8" y1="90" x2="110" y2="1040">
            <stop offset="0%" stopColor="#f59eb9" stopOpacity="0" />
            <stop offset="16%" stopColor="#f59eb9" stopOpacity="1" />
            <stop offset="52%" stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="84%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flow-amber-rose-a" gradientUnits="userSpaceOnUse" x1="108" y1="120" x2="-6" y2="1088">
            <stop offset="0%" stopColor="#fcd34d" stopOpacity="0" />
            <stop offset="16%" stopColor="#fcd34d" stopOpacity="1" />
            <stop offset="50%" stopColor="#fca5a5" stopOpacity="1" />
            <stop offset="84%" stopColor="#f97316" stopOpacity="1" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flow-violet-blue-b" gradientUnits="userSpaceOnUse" x1="50" y1="-40" x2="66" y2="1090">
            <stop offset="0%" stopColor="#f59eb9" stopOpacity="0" />
            <stop offset="14%" stopColor="#f59eb9" stopOpacity="1" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
            <stop offset="84%" stopColor="#60a5fa" stopOpacity="1" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flow-cyan-teal-b" gradientUnits="userSpaceOnUse" x1="50" y1="-20" x2="34" y2="1090">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
            <stop offset="14%" stopColor="#22d3ee" stopOpacity="1" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="84%" stopColor="#14b8a6" stopOpacity="1" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flow-fade-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="10%" stopColor="white" stopOpacity="1" />
            <stop offset="64%" stopColor="white" stopOpacity="1" />
            <stop offset="80%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="flow-fade-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="1000">
            <rect x="0" y="0" width="100" height="1000" fill="url(#flow-fade-grad)" />
          </mask>
        </defs>

        <g mask="url(#flow-fade-mask)">
          <motion.g
            animate={{ y: [0, 14, 0], opacity: [0.55, 0.85, 0.55] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            style={{ opacity: dark ? 0.22 : 0.28 }}
          >
            <path
              d="M-8 90 C20 120 34 180 22 250 C10 320 14 390 42 450 C68 510 92 580 76 660 C64 720 26 780 20 850 C14 930 44 985 110 1040"
              fill="none"
              stroke="url(#flow-violet-blue-a)"
              strokeWidth="0.35"
              strokeLinecap="round"
            />
            <path
              d="M108 120 C82 165 72 235 82 300 C94 380 86 455 58 520 C30 588 8 650 20 730 C30 800 72 860 80 930 C88 990 62 1035 -6 1088"
              fill="none"
              stroke="url(#flow-amber-rose-a)"
              strokeWidth="0.35"
              strokeLinecap="round"
            />
          </motion.g>

          <motion.g
            animate={{ y: [0, -10, 0], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            style={{ opacity: dark ? 0.2 : 0.24 }}
          >
            <path
              d="M50 -40 C50 70 22 110 22 200 C22 290 50 330 50 430 C50 520 78 560 78 660 C78 750 46 790 46 900 C46 980 66 1035 66 1090"
              fill="none"
              stroke="url(#flow-violet-blue-b)"
              strokeWidth="0.32"
              strokeLinecap="round"
            />
            <path
              d="M50 -20 C50 65 78 110 78 200 C78 290 50 330 50 430 C50 520 22 560 22 660 C22 750 54 790 54 900 C54 980 34 1035 34 1090"
              fill="none"
              stroke="url(#flow-cyan-teal-b)"
              strokeWidth="0.28"
              strokeLinecap="round"
            />
          </motion.g>
        </g>

      </svg>
    </div>
  );
}
