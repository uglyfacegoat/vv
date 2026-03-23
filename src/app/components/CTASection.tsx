import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { BarChart3 } from "lucide-react";
import badgeSparkle from "../../assets/cta-figma-2/badge-sparkle.svg";
import buttonArrow from "../../assets/cta-figma-2/button-arrow.svg";
import buttonChart from "../../assets/cta-figma-2/button-chart.svg";
import heroShape from "../../assets/cta-figma-2/hero-shape.png";
import patternArt from "../../assets/cta-figma-2/pattern.svg";
import { useTheme } from "./ThemeProvider";

interface CTASectionProps {
  onOpenAuth?: (mode: "login" | "register") => void;
}

export function CTASection({ onOpenAuth }: CTASectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { dark } = useTheme();
  const year = new Date().getFullYear();
  const sectionHeightClass = "min-h-[calc(100vh+100px)]";

  const sectionClass = `relative isolate ${sectionHeightClass} overflow-hidden ${
    dark ? "bg-[#030712]" : "bg-[#fafafe]"
  }`;

  const baseFillClass = dark
    ? "bg-[#030712]"
    : "bg-[linear-gradient(180deg,#fafafe_0%,#f3f6ff_46%,#f8f9ff_100%)]";

  const ambientGlowClass = dark
    ? "bg-[radial-gradient(circle_at_19%_40%,rgba(137,56,177,0.12),transparent_23%),radial-gradient(circle_at_24%_68%,rgba(35,63,199,0.08),transparent_28%),linear-gradient(180deg,rgba(3,7,18,0)_0%,rgba(3,7,18,0.12)_100%)]"
    : "bg-[radial-gradient(circle_at_19%_40%,rgba(168,85,247,0.08),transparent_23%),radial-gradient(circle_at_24%_68%,rgba(59,130,246,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(226,232,240,0.32)_100%)]";

  const patternClass = `absolute bottom-[-10%] right-[-20%] hidden h-[100%] max-w-none origin-center lg:block xl:bottom-[7%] xl:right-[-5%] xl:h-[100%] 2xl:bottom-[-5%] 2xl:right-[-5%] 2xl:h-[100%] ${
    dark ? "opacity-[0.94]" : "opacity-[0.28]"
  }`;

  const edgeFadeClass = dark
    ? "bg-[linear-gradient(90deg,rgba(3,7,18,0)_0%,rgba(3,7,18,0.08)_35%,rgba(3,7,18,0.26)_100%)]"
    : "bg-[linear-gradient(90deg,rgba(250,250,254,0)_0%,rgba(250,250,254,0.06)_35%,rgba(226,232,240,0.34)_100%)]";

  const badgeClass = dark
    ? "border border-[#8e51ff4d] bg-[#8e51ff1a]"
    : "border border-violet-400/30 bg-violet-100/85";

  const badgeTextClass = dark ? "text-[#c4b4ff]" : "text-violet-700";
  const headingTextClass = dark ? "text-white" : "text-slate-950";

  const footerClass = dark
    ? "border-t border-white/[0.04] text-white/70"
    : "border-t border-slate-900/8 text-slate-600";

  const brandTextClass = dark ? "text-white" : "text-slate-950";
  const descriptionTextClass = dark ? "text-[#667084]" : "text-slate-500";
  const copyrightTextClass = dark ? "text-[#4d596d]" : "text-slate-400";

  return (
    <section id="cta" className={sectionClass}>
      <div className={`absolute inset-0 ${baseFillClass}`} />
      <div aria-hidden className={`pointer-events-none absolute inset-0 ${ambientGlowClass}`} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <img src={patternArt} alt="" className={patternClass} />
        <div className={`absolute inset-y-0 right-0 w-[44%] ${edgeFadeClass}`} />
      </div>

      <div
        ref={ref}
        className={`relative z-10 mx-auto flex ${sectionHeightClass} w-full max-w-[1580px] flex-col px-5 pb-7 pt-16 sm:px-8 lg:px-12 lg:pb-8`}
      >
        <div className="grid w-full flex-1 items-center gap-8 lg:grid-cols-[minmax(520px,0.95fr)_minmax(330px,0.48fr)] lg:gap-0">
          <motion.div
            initial={{ opacity: 0, x: -36, scale: 0.96 }}
            animate={isInView ? { opacity: 1, x: 0, scale: 1 } : {}}
            transition={{ duration: 0.75, delay: 0.05 }}
            className="relative order-2 min-h-[320px] sm:min-h-[420px] lg:order-1 lg:min-h-[720px]"
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(123,63,202,0.16)_0%,rgba(45,62,156,0.1)_28%,transparent_62%)] blur-3xl" />
            <motion.img
              src={heroShape}
              alt="Glossy chromed torus"
              animate={isInView ? { y: [0, -8, 0], rotate: [-0.9, 1, -0.9], scale: [1, 1.01, 1] } : undefined}
              transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 w-[min(72vw,610px)] max-w-none -translate-x-[53%] -translate-y-[49%] object-contain drop-shadow-[0_30px_96px_rgba(5,8,16,0.72)] sm:w-[min(56vw,630px)] lg:left-[37%] lg:top-[50%] lg:w-[min(39vw,580px)]"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.14 }}
            className="order-1 flex justify-end lg:order-2"
          >
            <div className="relative w-full max-w-[405px] text-right lg:mr-12">
              <div className="lg:-translate-y-[18px]">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.2 }}
                  className={`ml-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 ${badgeClass}`}
                >
                  <img src={badgeSparkle} alt="" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className={`text-[11px] sm:text-[13.6px] ${badgeTextClass}`} style={{ fontWeight: 500 }}>
                    Начните за 5 минут
                  </span>
                </motion.div>

                <h2
                  className={`mt-11 text-[clamp(1.95rem,2.75vw,2.7rem)] leading-[0.97] tracking-[-0.04em] sm:mt-12 ${headingTextClass}`}
                  style={{ fontWeight: 800 }}
                >
                  Начните управлять
                  <br />
                  бюджетом как
                  <br />
                  <span className="bg-gradient-to-b from-[#a92fb0] via-[#b25cc0] to-[#c99cd4] bg-clip-text text-transparent">
                    продуктом
                  </span>
                  <br />
                  без усилий
                  <br />
                  без хаоса
                </h2>
              </div>

              <div className="mt-8 flex justify-end sm:mt-10">
                <button
                  onClick={() => onOpenAuth?.("register")}
                  className="group inline-flex h-[42px] items-center gap-3 rounded-[12px] bg-gradient-to-r from-[#7f22fe] to-[#155dfc] px-[18px] text-white shadow-[0_14px_42px_rgba(57,61,209,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_52px_rgba(34,93,252,0.34)] sm:h-[44px] sm:px-5"
                >
                  <img src={buttonChart} alt="" className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap text-[13px] sm:text-[14px]" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                    Попробовать BudgetIQ
                  </span>
                  <img
                    src={buttonArrow}
                    alt=""
                    className="ml-1 h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
          className={`relative z-20 mt-6 flex w-full items-center justify-between gap-4 pt-5 ${footerClass}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#8e51ff] to-[#2b7fff]">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className={`text-[16px] ${brandTextClass}`} style={{ fontWeight: 700 }}>
              BudgetIQ
            </span>
          </div>
          <div className={`flex-1 text-center text-[13px] ${descriptionTextClass}`}>
            Учебный проект ВУЗа по план-факт анализу бюджета подразделений.
          </div>
          <div className={`text-right text-[12px] ${copyrightTextClass}`}>
            © {year} BudgetIQ
          </div>
        </motion.div>
      </div>
    </section>
  );
}
