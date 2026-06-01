import { motion } from "motion/react";
import { useTheme } from "./ThemeProvider";
import { useLandingI18n } from "./landingI18n";

export function HeroSection() {
  const { dark } = useTheme();
  const { copy } = useLandingI18n();

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-0 h-[220px] ${
          dark
            ? "bg-[linear-gradient(180deg,rgba(3,7,18,0.98)_0%,rgba(3,7,18,0.9)_22%,rgba(3,7,18,0.38)_62%,rgba(3,7,18,0)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(250,250,254,0.98)_0%,rgba(250,250,254,0.88)_22%,rgba(250,250,254,0.32)_62%,rgba(250,250,254,0)_100%)]"
        }`}
      />
      <div
        className={`pointer-events-none absolute left-1/2 top-[-42px] z-0 h-[120px] w-[72%] -translate-x-1/2 blur-3xl ${
          dark ? "bg-violet-500/8" : "bg-violet-300/18"
        }`}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32 text-center">
        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className={`text-[2.8rem] sm:text-[3.5rem] md:text-[4.2rem] lg:text-[4.8rem] tracking-tight leading-[1.05] mb-6 max-w-5xl mx-auto ${
            dark ? "text-white" : ""
          }`}
          style={{ fontWeight: 800 }}
        >
          <span className="block">{copy.hero.title[0]}</span>
          <span className="block bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
            {copy.hero.title[1]}
          </span>
          <span className="block">{copy.hero.title[2]}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`text-[1.1rem] md:text-[1.25rem] max-w-2xl mx-auto mb-10 leading-relaxed ${
            dark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {copy.hero.subtitle}
        </motion.p>


        {/* Floating mockup preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="mt-20 relative"
        >
          <div
            className={`relative mx-auto max-w-4xl rounded-2xl border p-1 shadow-2xl ${
              dark
                ? "border-gray-800/60 bg-gray-900/70 backdrop-blur-xl shadow-violet-500/10"
                : "border-gray-200/60 bg-white/70 backdrop-blur-xl shadow-violet-500/10"
            }`}
          >
            <div
              className={`rounded-xl overflow-hidden ${
                dark
                  ? "bg-gradient-to-b from-gray-900 to-gray-950"
                  : "bg-gradient-to-b from-slate-50 to-white"
              }`}
            >
              {/* Browser chrome */}
              <div
                className={`flex items-center gap-2 px-4 py-3 border-b ${
                  dark ? "border-gray-800" : "border-gray-100"
                }`}
              >
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div
                    className={`h-7 rounded-lg flex items-center px-3 ${
                      dark ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <span
                      className={`text-[0.75rem] ${
                        dark ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      app.budgetiq.ru/dashboard
                    </span>
                  </div>
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="p-4 md:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div
                      className={`h-5 w-32 md:w-48 rounded-md mb-2 ${
                        dark ? "bg-gray-800" : "bg-gray-200"
                      }`}
                    />
                    <div
                      className={`h-3 w-20 md:w-32 rounded-md ${
                        dark ? "bg-gray-800/60" : "bg-gray-100"
                      }`}
                    />
                  </div>
                  <div className="flex gap-2 hidden sm:flex">
                    <div className="h-9 w-24 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500" />
                    <div
                      className={`h-9 w-24 rounded-lg ${
                        dark ? "bg-gray-800" : "bg-gray-100"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: copy.hero.cards[0], value: "₽124.5M", pct: "+12.3%" },
                    { label: copy.hero.cards[1], value: "₽98.2M", pct: "78.7%" },
                    { label: copy.hero.cards[2], value: "₽26.3M", pct: "-21.3%" },
                    { label: copy.hero.cards[3], value: "92.1%", pct: "+4.2%" },
                  ].map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                      className={`rounded-xl border p-4 ${
                        dark
                          ? "border-gray-800 bg-gray-900"
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      <div
                        className={`text-[0.75rem] mb-1 ${
                          dark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        {card.label}
                      </div>
                      <div
                        className={`text-[1.3rem] ${dark ? "text-white" : ""}`}
                        style={{ fontWeight: 700 }}
                      >
                        {card.value}
                      </div>
                      <div
                        className={`text-[0.75rem] mt-1 ${
                          card.pct.startsWith("+")
                            ? "text-emerald-500"
                            : card.pct.startsWith("-")
                              ? "text-red-400"
                              : "text-blue-500"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {card.pct}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Chart area */}
                <div
                  className={`rounded-xl border p-4 ${
                    dark ? "border-gray-800 bg-gray-900" : "border-gray-100 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-4 w-36 rounded ${
                        dark ? "bg-gray-800" : "bg-gray-200"
                      }`}
                    />
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-violet-500" />
                        <span
                          className={`text-[0.7rem] ${
                            dark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {copy.hero.plan}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span
                          className={`text-[0.7rem] ${
                            dark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {copy.hero.fact}
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg viewBox="0 0 400 100" className="w-full h-24">
                    <motion.path
                      d="M0,70 C50,60 100,40 150,45 C200,50 250,30 300,25 C350,20 400,15 400,10"
                      fill="none"
                      stroke="url(#planGrad)"
                      strokeWidth="2.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1.2 }}
                    />
                    <motion.path
                      d="M0,75 C50,65 100,55 150,50 C200,55 250,40 300,35 C350,30 400,28 400,22"
                      fill="none"
                      stroke="url(#factGrad)"
                      strokeWidth="2.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1.5 }}
                    />
                    <motion.path
                      d="M0,70 C50,60 100,40 150,45 C200,50 250,30 300,25 C350,20 400,15 400,10 L400,100 L0,100 Z"
                      fill="url(#planArea)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.15 }}
                      transition={{ duration: 1, delay: 2 }}
                    />
                    <defs>
                      <linearGradient id="planGrad" x1="0" y1="0" x2="400" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                      <linearGradient id="factGrad" x1="0" y1="0" x2="400" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                      <linearGradient id="planArea" x1="0" y1="0" x2="0" y2="100">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Glow effect behind */}
          <div
            className={`absolute -inset-4 rounded-3xl blur-3xl -z-10 ${
              dark
                ? "bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-teal-500/10"
                : "bg-gradient-to-r from-violet-200/30 via-blue-200/30 to-teal-200/30"
            }`}
          />
        </motion.div>
      </div>
    </section>
  );
}

