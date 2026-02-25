import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight, BarChart3, Sparkles } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { FloatingElements } from "./FloatingElements";

interface CTASectionProps {
  onOpenAuth?: (mode: "login" | "register") => void;
}

export function CTASection({ onOpenAuth }: CTASectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { dark } = useTheme();

  return (
    <section
      id="cta"
      className={`relative min-h-screen flex items-center py-24 md:py-32 overflow-hidden ${dark ? "bg-gray-950" : ""}`}
      style={!dark ? { background: "linear-gradient(180deg, #fafafe 0%, #f5f3ff 40%, #eff6ff 70%, #fafafe 100%)" } : undefined}
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <FloatingElements count={5} interactive={false} animatePulse={false} motionScale={0.75} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center" ref={ref}>
        {/* Sparkle badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 ${dark ? "bg-violet-500/10 border-violet-500/30" : "bg-violet-100/60 border-violet-200/50"}`}
        >
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className={`text-[0.85rem] ${dark ? "text-violet-300" : "text-violet-600"}`} style={{ fontWeight: 500 }}>
            Начните за 5 минут
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className={`text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] tracking-tight leading-[1.08] mb-6 ${dark ? "text-white" : ""}`}
          style={{ fontWeight: 800 }}
        >
          Начните управлять
          <br />
          бюджетом{" "}
          <span className="bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
            как продуктом
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
          className={`text-[1.1rem] md:text-[1.2rem] max-w-2xl mx-auto mb-10 leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}
        >
          Подключите BudgetIQ и получите полный контроль над бюджетом
          подразделений уже сегодня. Бесплатный пробный период&nbsp;&mdash;
          14&nbsp;дней.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center mb-12"
        >
          <button
            onClick={() => onOpenAuth?.("register")}
            className="group relative px-10 py-5 text-white rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 hover:-translate-y-1 flex items-center gap-3 text-[1.05rem]"
          >
            <BarChart3 className="w-5 h-5" />
            <span style={{ fontWeight: 700 }}>Попробовать BudgetIQ</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className={`flex flex-wrap items-center justify-center gap-6 text-[0.85rem] ${dark ? "text-gray-500" : "text-gray-400"}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Бесплатный 14-дневный период</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Настройка за 5 минут</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Поддержка 24/7</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

