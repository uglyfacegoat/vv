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

const importSteps = [
  {
    icon: FileUp,
    title: "Загрузка данных",
    desc: "CSV, Excel или прямой импорт из 1С: Предприятие через API-коннектор.",
    tags: ["CSV", "XLSX", "1С:API"],
  },
  {
    icon: ShieldCheck,
    title: "Валидация",
    desc: "Автоматическая проверка структуры, форматов, дубликатов и аномалий.",
    tags: ["Проверка", "Очистка", "Маппинг"],
  },
  {
    icon: RefreshCw,
    title: "Синхронизация",
    desc: "Данные обновляются по расписанию или при каждом изменении в источнике.",
    tags: ["Авто", "Расписание", "Webhook"],
  },
  {
    icon: Bell,
    title: "Уведомления",
    desc: "Мгновенные оповещения при критических отклонениях по email и Telegram.",
    tags: ["Email", "Telegram", "Push"],
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
            Импорт и контроль
          </span>
          <h2
            className={`text-[2.2rem] md:text-[3rem] tracking-tight leading-[1.1] mb-5 ${dark ? "text-white" : ""}`}
            style={{ fontWeight: 800 }}
          >
            Данные{" "}
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
              без усилий
            </span>
          </h2>
          <p className={`text-[1.1rem] max-w-xl mx-auto ${dark ? "text-gray-400" : "text-gray-500"}`}>
            От загрузки до аналитики за минуты. Автоматическая валидация
            и контроль качества данных.
          </p>
        </motion.div>

        {/* Steps flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {importSteps.map((step, i) => (
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
                  Статус импорта
                </div>
                <div className={`text-[0.85rem] ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  Последняя синхронизация: 2 минуты назад
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${dark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200/60"}`}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[0.8rem] text-emerald-600" style={{ fontWeight: 500 }}>
                  Активен
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  source: "1С: Бухгалтерия",
                  status: "Синхронизировано",
                  records: "12,847",
                  icon: Database,
                  ok: true,
                },
                {
                  source: "1С: ЗУП",
                  status: "Синхронизировано",
                  records: "3,215",
                  icon: Database,
                  ok: true,
                },
                {
                  source: "CSV (Маркетинг)",
                  status: "Обработка...",
                  records: "824",
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
                      {item.records} записей
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
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
