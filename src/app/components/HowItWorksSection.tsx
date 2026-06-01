import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight, Database, FileBarChart, LayoutDashboard, UserPlus } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLandingI18n } from "./landingI18n";

const ghostPanels = [
  { left: 0, top: 0, width: 358, height: 294 },
  { left: 746.67, top: 9.99, width: 282, height: 284 },
  { left: 746.67, top: 316.99, width: 357, height: 259 },
  { left: 466.67, top: 763.99, width: 263, height: 317 },
  { left: 0, top: 803.99, width: 450, height: 252 },
] as const;

const steps = [
  {
    icon: UserPlus,
    num: "01",
    title: "Вход в проект",
    desc: "После входа открывается учебный контур с дашбордом, импортом, отчётом и документацией.",
    detail: "Email и роль",
    accent: "linear-gradient(135deg, rgb(142, 81, 255) 0%, rgb(173, 70, 255) 100%)",
    glow: "linear-gradient(141.22deg, rgb(142, 81, 255) 0%, rgb(173, 70, 255) 100%)",
    frame: { left: 373.67, top: 6.99, width: 357, height: 287 },
    content: { left: 24, top: 24, width: 308 },
    titleSize: 18.88,
    titleWidth: 308,
    descWidth: 270,
    descTop: 12,
    tagWidth: 181.292,
    tagTop: 222.33,
  },
  {
    icon: Database,
    num: "02",
    title: "Импорт CSV",
    desc: "Загрузите четыре файла: ЦФО, статьи затрат, plan и fact. Проект показывает ошибки формата и связей.",
    detail: "4 CSV-файла",
    accent: "linear-gradient(135deg, rgb(43, 127, 255) 0%, rgb(97, 95, 255) 100%)",
    glow: "linear-gradient(130.86deg, rgb(43, 127, 255) 0%, rgb(97, 95, 255) 100%)",
    frame: { left: 0, top: 316.99, width: 451, height: 471 },
    content: { left: 32, top: 32, width: 385.33 },
    titleSize: 22.72,
    titleWidth: 339.083,
    descWidth: 284,
    descTop: 36.53,
    tagWidth: 146.052,
    tagTop: 394.33,
  },
  {
    icon: LayoutDashboard,
    num: "03",
    title: "Проверка дашборда",
    desc: "Сверьте KPI, план-факт графики и статусы отклонений по подразделениям и периодам.",
    detail: "KPI и фильтры",
    accent: "linear-gradient(135deg, rgb(0, 184, 219) 0%, rgb(0, 187, 167) 100%)",
    glow: "linear-gradient(121.9deg, rgb(0, 184, 219) 0%, rgb(0, 187, 167) 100%)",
    frame: { left: 465.67, top: 316.99, width: 264, height: 422 },
    content: { left: 24.33, top: 24.33, width: 214.67 },
    titleSize: 18.88,
    titleWidth: 214,
    descWidth: 177,
    descTop: 68.33,
    tagWidth: 151.771,
    tagTop: 347,
  },
  {
    icon: FileBarChart,
    num: "04",
    title: "Итоговый отчёт",
    desc: "Соберите сводный результат, проверьте напоминания и при необходимости выгрузите CSV.",
    detail: "Отчёт и экспорт",
    accent: "linear-gradient(135deg, rgb(0, 188, 125) 0%, rgb(0, 201, 80) 100%)",
    glow: "linear-gradient(132.78deg, rgb(0, 188, 125) 0%, rgb(0, 201, 80) 100%)",
    frame: { left: 746.67, top: 594.99, width: 357.33, height: 386 },
    content: { left: 24, top: 24, width: 308 },
    titleSize: 18.88,
    titleWidth: 308,
    descWidth: 290,
    descTop: 12,
    tagWidth: 156.469,
    tagTop: 304.98,
  },
] as const;

export function HowItWorksSection({
  forceInView = false,
}: {
  forceInView?: boolean;
} = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const observedInView = useInView(ref, { once: true, margin: "-100px" });
  const isInView = forceInView || observedInView;
  const { dark } = useTheme();
  const { copy } = useLandingI18n();
  const translatedSteps = steps.map((step, index) => ({
    ...step,
    title: copy.how.steps[index][0],
    desc: copy.how.steps[index][1],
    detail: copy.how.steps[index][2],
  }));

  return (
    <section
      id={forceInView ? undefined : "how-it-works"}
      className={`relative overflow-hidden py-28 md:py-32 ${dark ? "bg-gray-950" : ""}`}
      style={
        !dark
          ? {
              background:
                "linear-gradient(180deg, #fafafe 0%, #f0f9ff 30%, #f5f3ff 60%, #fafafe 100%)",
            }
          : undefined
      }
    >
      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-[1152px] text-center md:mb-20"
        >
          <span
            className={`inline-flex h-8 items-center rounded-full px-[18px] text-[13.6px] ${
              dark ? "bg-[#2b7fff26] text-[#51a2ff]" : "bg-blue-100/80 text-blue-600"
            }`}
            style={{ fontWeight: 500, lineHeight: "20.4px" }}
          >
            {copy.how.badge}
          </span>
          <h2
            className={`mt-6 text-[2.2rem] leading-[1.08] tracking-[-0.025em] md:text-[48px] ${
              dark ? "text-white" : "text-slate-950"
            }`}
            style={{ fontWeight: 800 }}
          >
            {copy.how.title}{" "}
            <span className="bg-gradient-to-r from-[#8e51ff] via-[#2b7fff] to-[#00bba7] bg-clip-text text-transparent">
              {copy.how.accent}
            </span>
          </h2>
          <p
            className={`mx-auto mt-5 max-w-[540px] text-[17.6px] leading-[26.4px] ${
              dark ? "text-[#99a1af]" : "text-slate-500"
            }`}
          >
            {copy.how.subtitle}
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute bottom-0 left-6 top-0 w-px md:hidden">
            <motion.div
              className="h-full w-full bg-gradient-to-b from-violet-500/40 via-blue-500/40 to-emerald-500/40"
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.5, delay: 0.3 }}
              style={{ transformOrigin: "top" }}
            />
          </div>

          <div className="hidden xl:block">
            <div className="relative mx-auto h-[1190px] w-[1152px]">
              {ghostPanels.map((panel) => (
                <div
                  key={`${panel.left}-${panel.top}`}
                  className={dark ? "absolute rounded-[28px] border border-white/[0.06] bg-white/[0.02]" : "absolute rounded-[28px] border border-slate-900/6 bg-white/50"}
                  style={{
                    left: panel.left,
                    top: panel.top,
                    width: panel.width,
                    height: panel.height,
                  }}
                />
              ))}

              {translatedSteps.map((step, index) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 28 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: 0.22 + index * 0.12 }}
                  className={dark ? "absolute overflow-hidden rounded-[30px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(24,29,43,0.9),rgba(18,22,34,0.82))]" : "absolute overflow-hidden rounded-[30px] border border-slate-900/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,255,0.92))]"}
                  style={{
                    left: step.frame.left,
                    top: step.frame.top,
                    width: step.frame.width,
                    height: step.frame.height,
                    boxShadow: dark ? "0 18px 55px rgba(5, 8, 18, 0.35)" : "0 16px 45px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute opacity-[0.06]"
                    style={{
                      inset: 0,
                      borderRadius: 30,
                      backgroundImage: step.glow,
                    }}
                  />

                  <div
                    className="absolute"
                    style={{
                      left: step.content.left,
                      top: step.content.top,
                      width: step.content.width,
                      height: step.frame.height - step.content.top - 24,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundImage: step.accent }}
                      >
                        <step.icon className="h-5 w-5 text-white" strokeWidth={2.1} />
                      </div>
                      <span
                        className={dark ? "text-[13.6px] text-white/[0.22]" : "text-[13.6px] text-slate-400"}
                        style={{ fontWeight: 700, lineHeight: "20.4px", letterSpacing: "2.448px" }}
                      >
                        {step.num}
                      </span>
                    </div>

                    <div className="mt-5">
                      <h3
                        className={dark ? "text-white" : "text-slate-950"}
                        style={{
                          fontWeight: 700,
                          fontSize: step.titleSize,
                          lineHeight: step.num === "02" ? "24.54px" : "20.39px",
                          width: step.titleWidth,
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={dark ? "mt-3 text-[#99a1af]" : "mt-3 text-slate-500"}
                        style={{
                          fontSize: 15.68,
                          lineHeight: "23.52px",
                          width: step.descWidth,
                        }}
                      >
                        {step.desc}
                      </p>
                    </div>

                    <div
                      className={dark ? "absolute rounded-full bg-white/[0.06]" : "absolute rounded-full bg-slate-100"}
                      style={{
                        left: 0,
                        top: step.tagTop,
                        width: step.tagWidth,
                        height: 31.688,
                      }}
                    >
                      <span
                        className={dark ? "absolute left-[14px] top-[5.33px] text-[#d1d5dc]" : "absolute left-[14px] top-[5.33px] text-slate-500"}
                        style={{ fontWeight: 500, fontSize: 13.12, lineHeight: "19.68px" }}
                      >
                        {step.detail}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mx-auto hidden max-w-[980px] lg:block xl:hidden">
            <div className="grid grid-cols-2 gap-5">
              {translatedSteps.map((step, index) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 22 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: 0.18 + index * 0.1 }}
                  className={`overflow-hidden rounded-[28px] border ${
                    dark
                      ? "border-white/[0.08] bg-[linear-gradient(180deg,rgba(24,29,43,0.9),rgba(18,22,34,0.82))]"
                      : "border-slate-900/8 bg-white/90"
                  } ${step.num === "02" ? "row-span-2 min-h-[420px]" : "min-h-[280px]"}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-2xl"
                        style={{ backgroundImage: step.accent }}
                      >
                        <step.icon className="h-5 w-5 text-white" strokeWidth={2.1} />
                      </div>
                      <span
                        className={dark ? "text-[13.6px] text-white/[0.22]" : "text-[13.6px] text-slate-400"}
                        style={{ fontWeight: 700, lineHeight: "20.4px", letterSpacing: "2.448px" }}
                      >
                        {step.num}
                      </span>
                    </div>
                    <h3 className={`mt-5 ${dark ? "text-white" : "text-slate-950"}`} style={{ fontWeight: 700, fontSize: step.num === "02" ? 22.72 : 18.88, lineHeight: step.num === "02" ? "24.54px" : "20.39px" }}>
                      {step.title}
                    </h3>
                    <p className={`mt-3 max-w-[290px] text-[15.68px] leading-[23.52px] ${dark ? "text-[#99a1af]" : "text-slate-500"}`}>
                      {step.desc}
                    </p>
                    <span className={`mt-6 inline-flex rounded-full px-3.5 py-1.5 text-[13.12px] ${dark ? "bg-white/[0.06] text-[#d1d5dc]" : "bg-slate-100 text-slate-500"}`} style={{ fontWeight: 500, lineHeight: "19.68px" }}>
                      {step.detail}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-12 lg:hidden">
            {translatedSteps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.2 }}
                className="relative flex items-start gap-6"
              >
                <div className="relative z-10 shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundImage: step.accent }}>
                    <step.icon className="h-6 w-6 text-white" strokeWidth={2.1} />
                  </div>
                </div>

                <div className="flex-1">
                  <div
                    className={`rounded-2xl border p-5 ${
                      dark ? "border-gray-800/80 bg-gray-900/70" : "border-gray-200/60 bg-white/70"
                    }`}
                  >
                    <h3 className={`mb-2 text-[1.05rem] ${dark ? "text-white" : "text-gray-900"}`} style={{ fontWeight: 700 }}>
                      {step.title}
                    </h3>
                    <p className={`mb-2 text-[0.9rem] leading-relaxed ${dark ? "text-gray-400" : "text-gray-500"}`}>
                      {step.desc}
                    </p>
                    <span
                      className={`inline-block rounded-md px-2.5 py-0.5 text-[0.75rem] ${
                        dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      {step.detail}
                    </span>
                  </div>
                </div>

                {i < steps.length - 1 && (
                  <div className="absolute left-6 -bottom-6">
                    <ArrowRight className={`h-4 w-4 rotate-90 ${dark ? "text-gray-700" : "text-gray-300"}`} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
