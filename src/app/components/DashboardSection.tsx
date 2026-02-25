import { motion, useInView } from "motion/react";
import { useRef } from "react";
import {
  TrendingUp,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function DashboardSection({
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
      id={forceInView ? undefined : "dashboards"}
      className={`relative min-h-screen flex items-center py-24 md:py-32 overflow-hidden ${dark ? "bg-gray-950" : ""}`}
      style={!dark ? { background: "linear-gradient(180deg, #fafafe 0%, #f0f4ff 50%, #fafafe 100%)" } : undefined}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className={`inline-block px-4 py-1.5 rounded-full text-[0.85rem] mb-6 ${dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-100/80 text-blue-600"}`} style={{ fontWeight: 500 }}>
            Аналитика
          </span>
          <h2
            className={`text-[2.2rem] md:text-[3rem] tracking-tight leading-[1.1] mb-5 ${dark ? "text-white" : ""}`}
            style={{ fontWeight: 800 }}
          >
            Дашборды, которые{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              говорят сами
            </span>
          </h2>
          <p className={`text-[1.1rem] max-w-xl mx-auto ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Интерактивные графики и метрики в реальном времени. Видите всё —
            от общей картины до деталей каждого ЦФО.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className={`relative mx-auto max-w-5xl rounded-3xl border backdrop-blur-xl p-6 md:p-8 shadow-2xl ${dark ? "border-gray-800/60 bg-gray-900/80 shadow-violet-500/5" : "border-gray-200/60 bg-white/80 shadow-blue-500/8"}`}>
            {/* Top metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: "Общий бюджет",
                  value: "₽248.5M",
                  change: "+15.2%",
                  up: true,
                  icon: TrendingUp,
                },
                {
                  label: "Исполнение",
                  value: "76.3%",
                  change: "+3.1%",
                  up: true,
                  icon: Activity,
                },
                {
                  label: "Отклонения",
                  value: "₽12.8M",
                  change: "-8.4%",
                  up: false,
                  icon: PieChart,
                },
                {
                  label: "Экономия",
                  value: "₽18.2M",
                  change: "+22.7%",
                  up: true,
                  icon: TrendingUp,
                },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                  className={`rounded-2xl border p-4 ${dark ? "bg-gradient-to-b from-gray-900 to-gray-800/80 border-gray-700/60" : "bg-gradient-to-b from-white to-gray-50/80 border-gray-100"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[0.78rem] ${dark ? "text-gray-500" : "text-gray-400"}`}>{m.label}</span>
                    <m.icon className={`w-4 h-4 ${dark ? "text-gray-600" : "text-gray-300"}`} />
                  </div>
                  <div className={`text-[1.5rem] mb-1 ${dark ? "text-white" : ""}`} style={{ fontWeight: 800 }}>{m.value}</div>
                  <div className="flex items-center gap-1">
                    {m.up ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span
                      className={`text-[0.8rem] ${m.up ? "text-emerald-500" : "text-red-400"}`}
                      style={{ fontWeight: 600 }}
                    >
                      {m.change}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main chart */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 }}
                className={`md:col-span-2 rounded-2xl border p-5 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className={`text-[0.95rem] ${dark ? "text-white" : ""}`} style={{ fontWeight: 600 }}>
                      План-факт по месяцам
                    </div>
                    <div className={`text-[0.8rem] ${dark ? "text-gray-500" : "text-gray-400"}`}>
                      Янв — Дек 2025
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                      <span className="text-[0.75rem] text-gray-400">
                        План
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-[0.75rem] text-gray-400">
                        Факт
                      </span>
                    </div>
                  </div>
                </div>

                <svg
                  viewBox="0 0 500 180"
                  className="w-full"
                  style={{ height: 180 }}
                >
                  {/* Grid lines */}
                  {[0, 45, 90, 135, 180].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="500"
                      y2={y}
                      stroke="rgba(0,0,0,0.04)"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Bar groups */}
                  {[
                    { m: "Янв", p: 120, f: 110 },
                    { m: "Фев", p: 100, f: 95 },
                    { m: "Мар", p: 130, f: 125 },
                    { m: "Апр", p: 115, f: 120 },
                    { m: "Май", p: 140, f: 130 },
                    { m: "Июн", p: 125, f: 118 },
                    { m: "Июл", p: 135, f: 140 },
                    { m: "Авг", p: 145, f: 138 },
                    { m: "Сен", p: 150, f: 142 },
                    { m: "Окт", p: 155, f: 148 },
                    { m: "Ноя", p: 160, f: 150 },
                    { m: "Дек", p: 165, f: 158 },
                  ].map((d, i) => {
                    const x = 20 + i * 40;
                    return (
                      <g key={d.m}>
                        <motion.rect
                          x={x}
                          y={180 - d.p}
                          width={14}
                          height={d.p}
                          rx={4}
                          fill="url(#barPlan)"
                          initial={{ height: 0, y: 180 }}
                          animate={isInView ? { height: d.p, y: 180 - d.p } : {}}
                          transition={{
                            duration: 0.6,
                            delay: 0.8 + i * 0.05,
                          }}
                        />
                        <motion.rect
                          x={x + 16}
                          y={180 - d.f}
                          width={14}
                          height={d.f}
                          rx={4}
                          fill="url(#barFact)"
                          initial={{ height: 0, y: 180 }}
                          animate={isInView ? { height: d.f, y: 180 - d.f } : {}}
                          transition={{
                            duration: 0.6,
                            delay: 0.9 + i * 0.05,
                          }}
                        />
                        <text
                          x={x + 15}
                          y={176}
                          textAnchor="middle"
                          className="text-[8px]"
                          fill="rgba(0,0,0,0.3)"
                        >
                          {d.m}
                        </text>
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient
                      id="barPlan"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <linearGradient
                      id="barFact"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Side panels */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="space-y-4"
              >
                {/* Donut chart */}
                <div className={`rounded-2xl border p-5 ${dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
                  <div className={`text-[0.9rem] mb-3 ${dark ? "text-white" : ""}`} style={{ fontWeight: 600 }}>
                    Структура расходов
                  </div>
                  <svg
                    viewBox="0 0 100 100"
                    className="w-24 h-24 mx-auto mb-3"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="12"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="url(#donutGrad)"
                      strokeWidth="12"
                      strokeDasharray="251.2"
                      strokeDashoffset="251.2"
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      animate={isInView ? { strokeDashoffset: 60 } : {}}
                      transition={{ duration: 1.5, delay: 1 }}
                    />
                    <defs>
                      <linearGradient id="donutGrad">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <text
                      x="50"
                      y="50"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-[14px]"
                      fill={dark ? "#e5e7eb" : "#1f2937"}
                      fontWeight="700"
                    >
                      76%
                    </text>
                  </svg>
                  <div className="space-y-2">
                    {[
                      { label: "ФОТ", pct: 42, color: "bg-violet-500" },
                      { label: "ИТ", pct: 24, color: "bg-blue-500" },
                      { label: "Маркетинг", pct: 18, color: "bg-cyan-500" },
                      { label: "Прочее", pct: 16, color: "bg-gray-300" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className={`text-[0.78rem] flex-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                          {item.label}
                        </span>
                        <span className={`text-[0.78rem] ${dark ? "text-gray-300" : "text-gray-700"}`} style={{ fontWeight: 600 }}>
                          {item.pct}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick KPI */}
                <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 p-5 text-white">
                  <div className="text-[0.85rem] text-violet-200 mb-1">
                    KPI исполнения
                  </div>
                  <div className="text-[2rem]" style={{ fontWeight: 800 }}>
                    92.1%
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                    <span className="text-[0.85rem] text-emerald-300" style={{ fontWeight: 500 }}>
                      +4.2% к прошлому кварталу
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Glow behind */}
            <div className={`absolute -inset-6 rounded-[2rem] blur-3xl -z-10 ${dark ? "bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10" : "bg-gradient-to-r from-violet-200/20 via-blue-200/20 to-cyan-200/20"}`} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
