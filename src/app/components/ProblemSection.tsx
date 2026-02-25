import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { FileSpreadsheet, AlertTriangle, Eye, Shuffle } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Таблицы в Excel",
    desc: "Десятки файлов, версий, ручных правок. Данные теряются, формулы ломаются.",
    bg: "bg-red-50",
    bgDark: "bg-red-500/10",
  },
  {
    icon: Shuffle,
    title: "Хаос в бюджетах",
    desc: "Каждое подразделение ведёт учёт по-своему. Консолидация занимает дни.",
    bg: "bg-amber-50",
    bgDark: "bg-amber-500/10",
  },
  {
    icon: Eye,
    title: "Нет единой картины",
    desc: "Руководство не видит реальных отклонений. Решения принимаются вслепую.",
    bg: "bg-orange-50",
    bgDark: "bg-orange-500/10",
  },
  {
    icon: AlertTriangle,
    title: "Потеря контроля",
    desc: "Отклонения обнаруживаются постфактум. Нет системы раннего предупреждения.",
    bg: "bg-rose-50",
    bgDark: "bg-rose-500/10",
  },
];

export function ProblemSection({
  forceInView = false,
}: {
  forceInView?: boolean;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const observedInView = useInView(ref, { once: true, margin: "-100px" });
  const isInView = forceInView || observedInView;
  const { dark } = useTheme();

  return (
    <section
      id={forceInView ? undefined : "problem"}
      className={`relative min-h-screen flex items-center py-24 md:py-32 overflow-hidden ${dark ? "bg-gray-950" : ""}`}
      style={
        !dark
          ? { background: "linear-gradient(180deg, #fafafe 0%, #fff5f5 30%, #fef2f2 60%, #fafafe 100%)" }
          : undefined
      }
    >
      <div className={`absolute top-0 left-0 right-0 h-32 ${dark ? "bg-gradient-to-b from-gray-950 to-transparent" : ""}`}
        style={!dark ? { background: "linear-gradient(180deg, #fafafe, transparent)" } : undefined}
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className={`inline-block px-4 py-1.5 rounded-full text-[0.85rem] mb-6 ${dark ? "bg-red-500/15 text-red-400" : "bg-red-100/80 text-red-600"}`} style={{ fontWeight: 500 }}>Знакомая проблема?</span>
          <h2 className={`text-[2.2rem] md:text-[3rem] tracking-tight leading-[1.1] mb-5 ${dark ? "text-white" : ""}`} style={{ fontWeight: 800 }}>
            Бюджет без системы&nbsp;&mdash;<br /><span className="text-red-500">это хаос</span>
          </h2>
          <p className={`text-[1.1rem] max-w-xl mx-auto ${dark ? "text-gray-400" : "text-gray-500"}`}>
            80% компаний теряют контроль над бюджетом из-за разрозненных данных и ручных процессов
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {problems.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className={`group relative p-6 rounded-2xl backdrop-blur-sm border shadow-sm transition-all duration-500 ${
                dark
                  ? "bg-gray-900/70 border-gray-800/80 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/5"
                  : "bg-white/70 border-gray-200/60 hover:border-red-200/80 hover:shadow-lg hover:shadow-red-500/5"
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${dark ? p.bgDark : p.bg}`}>
                <p.icon className="w-6 h-6 text-red-500/80" />
              </div>
              <h3 className={`text-[1.15rem] mb-2 ${dark ? "text-white" : "text-gray-900"}`} style={{ fontWeight: 700 }}>{p.title}</h3>
              <p className={`text-[0.95rem] leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}>{p.desc}</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
