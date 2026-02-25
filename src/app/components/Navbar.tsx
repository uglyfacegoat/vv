import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { BarChart3, Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface NavbarProps {
  onOpenAuth?: (mode: "login" | "register") => void;
}

export function Navbar({ onOpenAuth }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useTheme();

  useEffect(() => {
    let ticking = false;

    const handler = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const next = window.scrollY > 50;
        setScrolled((prev) => (prev === next ? prev : next));
        ticking = false;
      });
    };

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          scrolled
            ? dark
              ? "bg-gray-950/80 backdrop-blur-xl shadow-[0_1px_40px_rgba(139,92,246,0.08)] border-b border-gray-800/50"
              : "bg-white/80 backdrop-blur-xl shadow-[0_1px_40px_rgba(139,92,246,0.08)] border-b border-violet-100/50"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span
              className={`text-[1.15rem] tracking-tight ${dark ? "text-white" : ""}`}
              style={{ fontWeight: 700 }}
            >
              BudgetIQ
            </span>
          </a>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggle}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                dark
                  ? "bg-gray-800 hover:bg-gray-700 text-yellow-400"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-500"
              }`}
              title={dark ? "Светлая тема" : "Тёмная тема"}
            >
              <motion.div
                key={dark ? "moon" : "sun"}
                initial={{ rotate: -90, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </button>

            <button
              onClick={() => onOpenAuth?.("login")}
              className={`px-4 py-2 text-[0.9rem] transition-colors ${
                dark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => onOpenAuth?.("register")}
              className="px-5 py-2.5 text-[0.9rem] text-white rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              Попробовать бесплатно
            </button>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggle}
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                dark ? "bg-gray-800 text-yellow-400" : "bg-gray-100 text-gray-500"
              }`}
              title={dark ? "Светлая тема" : "Тёмная тема"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? (
                <X className={`w-6 h-6 ${dark ? "text-white" : ""}`} />
              ) : (
                <Menu className={`w-6 h-6 ${dark ? "text-white" : ""}`} />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed inset-0 z-[99] backdrop-blur-xl pt-20 px-6 ${
            dark ? "bg-gray-950/95" : "bg-white/95"
          }`}
        >
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenAuth?.("login");
              }}
              className={`mt-2 w-full py-3.5 rounded-xl border ${
                dark ? "border-gray-700 text-white" : "border-gray-200 text-gray-700"
              }`}
              style={{ fontWeight: 500 }}
            >
              Войти
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenAuth?.("register");
              }}
              className="w-full py-3.5 text-white rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg"
              style={{ fontWeight: 600 }}
            >
              Попробовать бесплатно
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
