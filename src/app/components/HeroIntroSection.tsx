import { motion } from "motion/react";
import { ArrowRight, Play } from "lucide-react";
import gridBottom from "../../assets/hero/grid-bottom.svg";
import gridTop from "../../assets/hero/grid-top.svg";
import heroKnot from "../../assets/hero-knot.png";
import { useTheme } from "./ThemeProvider";

interface HeroIntroSectionProps {
  onOpenAuth?: (mode: "login" | "register") => void;
}

export function HeroIntroSection({ onOpenAuth }: HeroIntroSectionProps) {
  const { dark } = useTheme();

  return (
    <section
      id="home"
      className={`relative min-h-screen overflow-hidden ${
        dark ? "bg-gray-950" : "bg-[#fafafe]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <img
          src={gridTop}
          alt=""
          className="absolute left-1/2 top-0 h-[45vh] min-h-[290px] w-[132vw] max-w-none object-fill opacity-85"
          style={{ transform: "translateX(-50%) scaleX(1.08)" }}
        />
        <img
          src={gridBottom}
          alt=""
          className="absolute left-1/2 bottom-0 h-[42vh] min-h-[260px] w-[120vw] max-w-none object-fill opacity-85"
          style={{ transform: "translateX(-50%) scaleX(1.03)" }}
        />
        <div
          className={`absolute inset-x-0 bottom-0 h-[220px] ${
            dark
              ? "bg-[linear-gradient(180deg,rgba(3,7,18,0)_0%,rgba(3,7,18,0.72)_58%,rgba(3,7,18,0.98)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(250,250,254,0)_0%,rgba(250,250,254,0.78)_58%,rgba(250,250,254,0.98)_100%)]"
          }`}
        />
        <div
          className={`absolute inset-x-[8%] bottom-[-56px] h-[140px] blur-3xl ${
            dark ? "bg-violet-500/8" : "bg-violet-300/18"
          }`}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1320px] items-center px-6 pb-12 pt-[4rem] md:pb-16 md:pt-[5rem]">
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(380px,0.7fr)_minmax(500px,1.1fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="max-w-[448px] lg:-ml-12"
          >
            <div
              className={`uppercase tracking-[-0.048em] ${
                dark ? "text-white" : "text-slate-950"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, lineHeight: 0.92 }}
            >
              <div className="text-[clamp(1.95rem,3.2vw,2.95rem)]">
                <span className="block">Understand</span>
                <span className="block">Your</span>
              </div>
              <div
                className={`mt-[0.85rem] pl-0.5 text-[clamp(2.02rem,2.56vw,2.42rem)] normal-case ${
                  dark ? "text-white/96" : "text-slate-900"
                }`}
                style={{
                  fontFamily: "Mynerve, cursive",
                  fontWeight: 400,
                  lineHeight: 0.96,
                  letterSpacing: "-0.01em",
                  textTransform: "uppercase",
                }}
              >
                NUMBERS
              </div>
              <div className="mt-2 text-[clamp(1.95rem,3.2vw,2.95rem)]">
                <span className="block">Control Every</span>
                <span className="block">Movement</span>
              </div>
              <div className="mt-2 text-[clamp(1.95rem,3.2vw,2.95rem)]">
                <span className="block whitespace-nowrap">
                  See The{" "}
                  <span className="bg-gradient-to-r from-[#c963c9] via-[#b38fd7] to-[#9788dc] bg-clip-text text-transparent">
                    Business
                  </span>{" "}
                  As It
                </span>
                <span className="block">Really Is</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="mt-8 flex flex-row flex-nowrap gap-3"
            >
              <button
                onClick={() => onOpenAuth?.("register")}
                className="group inline-flex h-[56px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-600 to-cyan-500 px-6 text-[0.9rem] text-white shadow-[0_14px_40px_rgba(79,70,229,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_46px_rgba(34,211,238,0.2)]"
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 600 }}
              >
                <span className="whitespace-nowrap">Открыть проект</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`inline-flex h-[56px] items-center justify-center gap-2 rounded-2xl border px-6 text-[0.9rem] transition-all duration-300 ${
                  dark
                    ? "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.07] hover:text-white"
                    : "border-slate-900/8 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-950"
                }`}
                style={{ fontFamily: "Inter, sans-serif", fontWeight: 500 }}
              >
                <Play className="h-4 w-4" />
                <span className="whitespace-nowrap">Как устроен проект</span>
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 34, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.18 }}
            className="relative mx-auto w-full max-w-[540px] lg:max-w-[640px] lg:translate-x-40 lg:justify-self-end"
          >
            <motion.img
              src={heroKnot}
              alt="Glossy abstract loop"
              animate={{
                y: [0, -14, 0],
                rotate: [-1.2, 1.2, -1.2],
                scale: [1, 1.015, 1],
              }}
              transition={{
                duration: 8.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="relative z-10 mx-auto w-[84%] object-contain drop-shadow-[0_24px_72px_rgba(7,10,18,0.4)] will-change-transform lg:w-[92%]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
