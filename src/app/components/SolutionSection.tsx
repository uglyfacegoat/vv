import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Zap, BarChart3, Upload, Target, Shield, Layers } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLandingI18n } from "./landingI18n";

const features = [
  { icon: Zap, title: "План-факт расчёты", desc: "Проект считает delta, delta_% и сводные KPI по учебным данным." },
  { icon: Upload, title: "Импорт 4 CSV-файлов", desc: "Загрузка справочников ЦФО и статей затрат, а также plan и fact." },
  { icon: BarChart3, title: "KPI и дашборды", desc: "На экранах есть карточки метрик, графики и сводный обзор по подразделениям." },
  { icon: Target, title: "Статусы отклонений", desc: "Поддерживаются статусы IN_NORM, OVERSPEND, SAVING и NO_PLAN." },
  { icon: Shield, title: "Проверка данных", desc: "Интерфейс показывает ошибки формата, дубли, пропуски и несоответствия справочникам." },
  { icon: Layers, title: "Документация и сценарии", desc: "В проекте есть страницы с формулами расчёта, процессом использования и демо-сценариями." },
];

export function SolutionSection({
  forceInView = false,
}: {
  forceInView?: boolean;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const observedInView = useInView(ref, { once: true, margin: "-100px" });
  const isInView = forceInView || observedInView;
  const { dark } = useTheme();
  const { copy } = useLandingI18n();
  const translatedFeatures = features.map((feature, index) => ({
    ...feature,
    title: copy.solution.features[index][0],
    desc: copy.solution.features[index][1],
  }));

  return (
    <section
      id={forceInView ? undefined : "features"}
      className={`relative min-h-screen flex items-center py-24 md:py-32 overflow-hidden ${dark ? "bg-gray-950" : ""}`}
      style={!dark ? { background: "linear-gradient(180deg, #fafafe 0%, #f5f3ff 40%, #eff6ff 70%, #fafafe 100%)" } : undefined}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className={`inline-block px-4 py-1.5 rounded-full text-[0.85rem] mb-6 ${dark ? "bg-violet-500/15 text-violet-400" : "bg-violet-100/80 text-violet-600"}`} style={{ fontWeight: 500 }}>{copy.solution.badge}</span>
          <h2 className={`text-[2.2rem] md:text-[3rem] tracking-tight leading-[1.1] mb-5 ${dark ? "text-white" : ""}`} style={{ fontWeight: 800 }}>
            {copy.solution.title}{" "}<span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">{copy.solution.accent}</span>
          </h2>
          <p className={`text-[1.1rem] max-w-xl mx-auto ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {copy.solution.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {translatedFeatures.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className={`group relative p-6 rounded-2xl backdrop-blur-md border shadow-sm transition-all duration-500 hover:-translate-y-1 ${
                dark
                  ? "bg-gray-900/60 border-gray-800/80 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10"
                  : "bg-white/60 border-white/80 hover:border-violet-200/80 hover:shadow-xl hover:shadow-violet-500/10"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/30 transition-shadow">
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className={`text-[1.1rem] mb-2 ${dark ? "text-white" : "text-gray-900"}`} style={{ fontWeight: 700 }}>{f.title}</h3>
              <p className={`text-[0.95rem] leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}>{f.desc}</p>
              <span className={`absolute top-5 right-5 text-[0.75rem] ${dark ? "text-gray-700" : "text-violet-300"}`} style={{ fontWeight: 600 }}>0{i + 1}</span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
