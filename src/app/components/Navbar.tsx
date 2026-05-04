import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type MouseEvent } from "react";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { BudgetIQMark } from "./brand/BudgetIQMark";

interface NavbarProps {
  onOpenAuth?: (mode: "login" | "register") => void;
  showAfterId?: string;
  hideAtId?: string;
}

const navItems = [
  { label: "Как это работает", href: "#how-it-works" },
  { label: "Решение", href: "#features" },
  { label: "Дашборды", href: "#dashboards" },
  { label: "Импорт", href: "#import" },
];

export function Navbar({ onOpenAuth, showAfterId, hideAtId }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useTheme();

  useEffect(() => {
    let ticking = false;

    const handler = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const next = window.scrollY > 24;
        setScrolled((prev) => (prev === next ? prev : next));
        ticking = false;
      });
    };

    handler();
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [showAfterId, hideAtId]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNavigate = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMobileOpen(false);

    const targetId = href.replace("#", "");
    const target = targetId ? document.getElementById(targetId) : null;

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAuth = (mode: "login" | "register") => {
    setMobileOpen(false);
    onOpenAuth?.(mode);
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-[100] px-4 pt-4 transition-all duration-500 md:px-6"
    >
      <motion.nav
        initial={{ y: -96, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border backdrop-blur-2xl transition-all duration-500 ${
          dark
            ? scrolled
              ? "border-white/[0.08] bg-[#111827]/78 shadow-[0_22px_60px_rgba(2,6,23,0.48)]"
              : "border-white/[0.07] bg-[#111827]/64 shadow-[0_18px_46px_rgba(2,6,23,0.36)]"
            : scrolled
              ? "border-white/70 bg-white/76 shadow-[0_20px_60px_rgba(99,102,241,0.15)]"
              : "border-white/80 bg-white/62 shadow-[0_18px_40px_rgba(99,102,241,0.12)]"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-[1px] rounded-[27px] ${
            dark
              ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))]"
              : "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.45))]"
          }`}
        />

        <div className="relative flex h-[72px] items-center justify-between gap-3 px-4 sm:px-5">
          <a href="#home" onClick={handleNavigate("#home")} className="flex min-w-0 items-center gap-3">
            <BudgetIQMark size={34} />
            <div className="min-w-0">
              <div
                className={`truncate text-[1rem] tracking-tight ${
                  dark ? "text-white" : "text-slate-950"
                }`}
                style={{ fontWeight: 700 }}
              >
                BudgetIQ
              </div>
              <div
                className={`hidden text-[0.72rem] sm:block ${
                  dark ? "text-slate-500" : "text-slate-500"
                }`}
              >
                План-факт анализ бюджета
              </div>
            </div>
          </a>

          <div
            className={`hidden items-center gap-1 rounded-full border px-2 py-2 lg:flex ${
              dark
                ? "border-white/[0.06] bg-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "border-white/70 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
            }`}
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavigate(item.href)}
                className={`rounded-full px-4 py-2 text-[0.9rem] transition-all duration-300 ${
                  dark
                    ? "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-950"
                }`}
                style={{ fontWeight: 500 }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={toggle}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 ${
                dark
                  ? "border-white/[0.08] bg-white/[0.04] text-amber-300 hover:bg-white/[0.08]"
                  : "border-white/80 bg-white/70 text-slate-500 hover:bg-white"
              }`}
              title={dark ? "Светлая тема" : "Тёмная тема"}
            >
              <motion.div
                key={dark ? "sun" : "moon"}
                initial={{ rotate: -90, scale: 0.7, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </motion.div>
            </button>

            <button
              onClick={() => handleAuth("login")}
              className={`rounded-full px-4 py-2.5 text-[0.92rem] transition-colors ${
                dark
                  ? "text-slate-300 hover:text-white"
                  : "text-slate-600 hover:text-slate-950"
              }`}
              style={{ fontWeight: 500 }}
            >
              Войти
            </button>

            <button
              onClick={() => handleAuth("register")}
              className="group inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-[0.92rem] text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#1d4ed8] hover:shadow-[0_18px_44px_rgba(37,99,235,0.28)]"
              style={{ fontWeight: 600 }}
            >
              Открыть проект
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggle}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                dark
                  ? "border-white/[0.08] bg-white/[0.04] text-amber-300"
                  : "border-white/80 bg-white/70 text-slate-500"
              }`}
              title={dark ? "Светлая тема" : "Тёмная тема"}
            >
              {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                dark
                  ? "border-white/[0.08] bg-white/[0.04] text-white"
                  : "border-white/80 bg-white/70 text-slate-900"
              }`}
              aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.24 }}
            className={`relative mx-auto mt-3 max-w-6xl overflow-hidden rounded-[28px] border backdrop-blur-2xl md:hidden ${
              dark
                ? "border-white/[0.08] bg-[#111827]/84 shadow-[0_22px_60px_rgba(2,6,23,0.48)]"
                : "border-white/70 bg-white/82 shadow-[0_20px_60px_rgba(99,102,241,0.14)]"
            }`}
          >
            <div
              className={`absolute inset-[1px] rounded-[27px] ${
                dark
                  ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]"
                  : "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,255,255,0.52))]"
              }`}
            />
            <div className="relative space-y-2 p-4">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={handleNavigate(item.href)}
                  className={`block rounded-2xl px-4 py-3 text-[0.95rem] ${
                    dark
                      ? "bg-white/[0.03] text-slate-200"
                      : "bg-slate-950/[0.03] text-slate-700"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {item.label}
                </a>
              ))}

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={() => handleAuth("login")}
                  className={`rounded-2xl px-4 py-3 text-left text-[0.95rem] ${
                    dark
                      ? "bg-white/[0.03] text-white"
                      : "bg-slate-950/[0.03] text-slate-900"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  Войти
                </button>
                <button
                  onClick={() => handleAuth("register")}
                  className="inline-flex items-center justify-between rounded-2xl bg-[#2563eb] px-4 py-3 text-[0.95rem] text-white shadow-[0_14px_34px_rgba(37,99,235,0.24)]"
                  style={{ fontWeight: 600 }}
                >
                  Открыть проект
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
