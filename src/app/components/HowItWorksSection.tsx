import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { UserPlus, Database, LayoutDashboard, FileBarChart, ArrowRight } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const steps = [
  {
    icon: UserPlus,
    num: "01",
    title: "Регистрация",
    desc: "Создайте аккаунт за 2 минуты. Получите доступ к демо-данным и полному функционалу на 14 дней бесплатно.",
    detail: "Email + пароль или SSO",
    accent: "from-violet-500 to-purple-500",
    accentBg: "bg-violet-500",
  },
  {
    icon: Database,
    num: "02",
    title: "Подключение данных",
    desc: "Подключите 1С через API-коннектор или загрузите CSV/Excel. Автоматический маппинг полей и валидация.",
    detail: "1С, CSV, Excel, API",
    accent: "from-blue-500 to-indigo-500",
    accentBg: "bg-blue-500",
  },
  {
    icon: LayoutDashboard,
    num: "03",
    title: "Настройка дашбордов",
    desc: "Выберите готовые шаблоны или создайте свои. Настройте KPI, пороги отклонений и уведомления.",
    detail: "Шаблоны + кастом",
    accent: "from-cyan-500 to-teal-500",
    accentBg: "bg-cyan-500",
  },
  {
    icon: FileBarChart,
    num: "04",
    title: "Первый отчёт",
    desc: "Получите автоматический план-факт анализ. Видите отклонения, тренды и рекомендации в реальном времени.",
    detail: "Готово за < 5 минут",
    accent: "from-emerald-500 to-green-500",
    accentBg: "bg-emerald-500",
  },
];

export function HowItWorksSection({
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
      id={forceInView ? undefined : "how-it-works"}
      className={`relative min-h-screen flex items-center py-24 md:py-32 overflow-hidden ${
        dark ? "bg-gray-950" : ""
      }`}
      style={
        !dark
          ? {
              background:
                "linear-gradient(180deg, #fafafe 0%, #f0f9ff 30%, #f5f3ff 60%, #fafafe 100%)",
            }
          : undefined
      }
    >
      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-[0.85rem] mb-6 ${
              dark
                ? "bg-blue-500/15 text-blue-400"
                : "bg-blue-100/80 text-blue-600"
            }`}
            style={{ fontWeight: 500 }}
          >
            Как это работает
          </span>
          <h2
            className={`text-[2.2rem] md:text-[3rem] tracking-tight leading-[1.1] mb-5 ${
              dark ? "text-white" : ""
            }`}
            style={{ fontWeight: 800 }}
          >
            От регистрации до отчёта{" "}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 bg-clip-text text-transparent">
              за 5 минут
            </span>
          </h2>
          <p className={`text-[1.1rem] max-w-xl mx-auto ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Четыре простых шага — и вы получаете полный контроль над бюджетами
            подразделений
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line for mobile steps */}
          <div className="absolute left-6 top-0 bottom-0 w-px md:hidden">
            <motion.div
              className="w-full h-full bg-gradient-to-b from-violet-500/40 via-blue-500/40 to-emerald-500/40"
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.3 }}
              style={{ transformOrigin: "top" }}
            />
          </div>

          <div className="space-y-12 md:space-y-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.2 }}
                  className={`relative flex items-start gap-6 md:gap-0 ${
                    i > 0 ? "md:mt-8" : ""
                  }`}
                >
                  {/* Mobile: dot on left */}
                  <div className="md:hidden relative z-10 shrink-0">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center shadow-lg`}
                    >
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-[1fr_80px_1fr] w-full items-center">
                    {/* Left content */}
                    <div className={isLeft ? "" : "order-3"}>
                      <div
                        className={`p-6 rounded-2xl border transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${
                          dark
                            ? "bg-gray-900/70 backdrop-blur-md border-gray-800/80 hover:border-gray-700 hover:shadow-violet-500/5"
                            : "bg-white/70 backdrop-blur-md border-gray-200/60 hover:border-violet-200/80 hover:shadow-violet-500/8"
                        } ${isLeft ? "text-right" : "text-left"}`}
                      >
                        <div
                          className={`flex items-center gap-3 mb-3 ${
                            isLeft ? "justify-end" : ""
                          }`}
                        >
                          {!isLeft && (
                            <span
                              className={`text-[0.78rem] ${
                                dark ? "text-gray-600" : "text-gray-300"
                              }`}
                              style={{ fontWeight: 700 }}
                            >
                              {step.num}
                            </span>
                          )}
                          <h3
                            className={`text-[1.15rem] ${
                              dark ? "text-white" : "text-gray-900"
                            }`}
                            style={{ fontWeight: 700 }}
                          >
                            {step.title}
                          </h3>
                          {isLeft && (
                            <span
                              className={`text-[0.78rem] ${
                                dark ? "text-gray-600" : "text-gray-300"
                              }`}
                              style={{ fontWeight: 700 }}
                            >
                              {step.num}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[0.92rem] leading-relaxed mb-3 ${
                            dark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {step.desc}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-[0.78rem] ${
                            dark
                              ? "bg-gray-800 text-gray-400"
                              : "bg-gray-100 text-gray-500"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {step.detail}
                        </span>
                      </div>
                    </div>

                    {/* Center dot */}
                    <div className="flex justify-center order-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={isInView ? { scale: 1 } : {}}
                        transition={{
                          delay: 0.5 + i * 0.2,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="relative z-10"
                      >
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center shadow-xl`}
                        >
                          <step.icon className="w-6 h-6 text-white" />
                        </div>
                        {/* Glow */}
                        <div
                          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.accent} blur-lg opacity-30`}
                        />
                      </motion.div>
                    </div>

                    {/* Right content (empty for left-aligned cards, or vice versa) */}
                    <div className={isLeft ? "order-3" : ""}>
                      {!isLeft ? null : null}
                    </div>
                  </div>

                  {/* Mobile content */}
                  <div className="md:hidden flex-1">
                    <div
                      className={`p-5 rounded-2xl border ${
                        dark
                          ? "bg-gray-900/70 border-gray-800/80"
                          : "bg-white/70 border-gray-200/60"
                      }`}
                    >
                      <h3
                        className={`text-[1.05rem] mb-2 ${
                          dark ? "text-white" : "text-gray-900"
                        }`}
                        style={{ fontWeight: 700 }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`text-[0.9rem] leading-relaxed mb-2 ${
                          dark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {step.desc}
                      </p>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[0.75rem] ${
                          dark
                            ? "bg-gray-800 text-gray-400"
                            : "bg-gray-100 text-gray-500"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {step.detail}
                      </span>
                    </div>
                  </div>

                  {/* Connector arrow (mobile) */}
                  {i < steps.length - 1 && (
                    <div className="absolute left-6 -bottom-6 md:hidden">
                      <ArrowRight className={`w-4 h-4 rotate-90 ${dark ? "text-gray-700" : "text-gray-300"}`} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
