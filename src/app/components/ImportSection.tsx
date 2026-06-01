import { motion, useInView } from "motion/react";
import { useRef } from "react";
import {
  FileUp,
  CheckCircle2,
  Bell,
  Database,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLandingI18n } from "./landingI18n";

const importSteps = [
  {
    icon: FileUp,
    title: "Загрузка CSV",
    desc: "Проект принимает четыре файла: cost_centers, items, plan и fact.",
    tags: ["4 CSV", "plan/fact", "справочники"],
  },
  {
    icon: ShieldCheck,
    title: "Валидация",
    desc: "Автоматическая проверка структуры, форматов, дубликатов и аномалий.",
    tags: ["Проверка", "Очистка", "Маппинг"],
  },
  {
    icon: RefreshCw,
    title: "Проверка полноты",
    desc: "После загрузки можно сверить периоды, связи между справочниками и пропуски plan/fact.",
    tags: ["Периоды", "Связи", "Пропуски"],
  },
  {
    icon: Bell,
    title: "Уведомления",
    desc: "После импорта интерфейс показывает статусы файлов, напоминания и результаты проверок.",
    tags: ["Статусы", "Напоминания", "Журнал"],
  },
];

export function ImportSection({
  forceInView = false,
}: {
  forceInView?: boolean;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const observedInView = useInView(ref, { once: true, margin: "-100px" });
  const isInView = forceInView || observedInView;
  const { dark } = useTheme();
  const { copy } = useLandingI18n();
  const translatedSteps = importSteps.map((step, index) => ({
    ...step,
    title: copy.import.steps[index][0],
    desc: copy.import.steps[index][1],
    tags: copy.import.steps[index][2],
  }));

  return (
    <section
      id={forceInView ? undefined : "import"}
      className={`relative min-h-screen flex items-center py-24 md:py-32 overflow-hidden ${dark ? "bg-gray-950" : ""}`}
      style={!dark ? { background: "linear-gradient(180deg, #fafafe 0%, #f0fdf4 30%, #ecfeff 60%, #fafafe 100%)" } : undefined}
    >
      <div className="relative z-10 max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className={`inline-block px-4 py-1.5 rounded-full text-[0.85rem] mb-6 ${dark ? "bg-teal-500/15 text-teal-400" : "bg-teal-100/80 text-teal-600"}`} style={{ fontWeight: 500 }}>
            {copy.import.badge}
          </span>
          <h2
            className={`text-[2.2rem] md:text-[3rem] tracking-tight leading-[1.1] mb-5 ${dark ? "text-white" : ""}`}
            style={{ fontWeight: 800 }}
          >
            {copy.import.title}{" "}
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              {copy.import.accent}
            </span>
          </h2>
          <p className={`text-[1.1rem] max-w-xl mx-auto ${dark ? "text-gray-400" : "text-gray-500"}`}>
            {copy.import.subtitle}
          </p>
        </motion.div>

        {/* Steps flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {translatedSteps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="group relative"
            >
              <div className={`relative p-6 rounded-2xl backdrop-blur-sm border shadow-sm transition-all duration-500 ${
                dark
                  ? "bg-gray-900/70 border-gray-800/60 hover:border-teal-500/30 hover:shadow-xl hover:shadow-teal-500/5"
                  : "bg-white/70 border-gray-200/60 hover:border-teal-200/80 hover:shadow-xl hover:shadow-teal-500/8"
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${dark ? "bg-teal-500/10 border-teal-500/20" : "bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100/50"}`}>
                    <step.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`text-[1.05rem] mb-1.5 ${dark ? "text-white" : "text-gray-900"}`}
                      style={{ fontWeight: 700 }}
                    >
                      {step.title}
                    </h3>
                    <p className={`text-[0.9rem] leading-relaxed mb-3 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                      {step.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {step.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2.5 py-0.5 rounded-full text-[0.72rem] ${dark ? "bg-teal-500/10 text-teal-400" : "bg-teal-50 text-teal-600"}`}
                          style={{ fontWeight: 500 }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integration visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className={`rounded-2xl backdrop-blur-sm border p-6 md:p-8 ${dark ? "bg-gray-900/60 border-gray-800/60" : "bg-white/60 border-gray-200/60"}`}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <div className={`text-[1rem] ${dark ? "text-white" : ""}`} style={{ fontWeight: 600 }}>
                  {copy.import.statusTitle}
                </div>
                <div className={`text-[0.85rem] ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  {copy.import.statusSubtitle}
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${dark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200/60"}`}>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[0.8rem] text-emerald-600" style={{ fontWeight: 500 }}>
                  {copy.import.demoMode}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  source: "cost_centers.csv",
                  status: copy.import.rows[0][0],
                  records: copy.import.rows[0][1],
                  unit: copy.import.rows[0][2],
                  icon: Database,
                  ok: true,
                },
                {
                  source: "items.csv",
                  status: copy.import.rows[1][0],
                  records: copy.import.rows[1][1],
                  unit: copy.import.rows[1][2],
                  icon: Database,
                  ok: true,
                },
                {
                  source: "plan.csv",
                  status: copy.import.rows[2][0],
                  records: copy.import.rows[2][1],
                  unit: copy.import.rows[2][2],
                  icon: FileUp,
                  ok: false,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.source}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${dark ? "bg-gray-800/50 border-gray-700/60" : "bg-gray-50/80 border-gray-100"}`}
                >
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${dark ? "bg-gray-900 border-gray-700/60" : "bg-white border-gray-200/60"}`}>
                    <item.icon className={`w-5 h-5 ${dark ? "text-gray-500" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[0.9rem] ${dark ? "text-white" : ""}`} style={{ fontWeight: 600 }}>
                      {item.source}
                    </div>
                    <div className={`text-[0.8rem] ${dark ? "text-gray-500" : "text-gray-400"}`}>
                      {item.records} {item.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                    )}
                    <span
                      className={`text-[0.8rem] ${item.ok ? "text-emerald-500" : "text-amber-500"}`}
                      style={{ fontWeight: 500 }}
                    >
                      {item.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
