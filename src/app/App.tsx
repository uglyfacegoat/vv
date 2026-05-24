import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "sonner";
import { BrowserRouter, useInRouterContext, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileBarChart2,
  Upload,
  ListChecks,
  BookOpen,
  PlayCircle,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bell,
  Search,
  User,
  LogOut,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { Report } from "./components/Report";
import { Import } from "./components/Import";
import { SettingsPage } from "./components/SettingsPage";
import { ProfilePage } from "./components/ProfilePage";
import { NotificationsPanel } from "./components/NotificationsPanel";
import { LandingPage } from "./components/LandingPage";
import { RemindersPage } from "./components/RemindersPage";
import { DocsPage } from "./components/DocsPage";
import { DemoPage } from "./components/DemoPage";
import { AdminPanel } from "./components/AdminPanel";
import { BudgetIQMark } from "./components/brand/BudgetIQMark";
import {
  clearStoredUser,
  hasApiToken,
  roleLabels,
  rolePermissions,
  type UserRole,
  type UserSession,
} from "./auth";
import { getAccount, toUserSessionFromAccount, updateAccountSettings, type UserSettings } from "./api";

// ── Custom BudgetIQ "B" Logo ──
function BudgetIQLogo({ size = 32 }: { size?: number }) {
  return <BudgetIQMark size={size} />;
}

type Page = "dashboard" | "report" | "import" | "reminders" | "docs" | "demo" | "settings" | "profile" | "admin";
type AuthMode = "login" | "register";

const defaultAccountSettings: UserSettings = {
  threshold: 10,
  overspend_threshold: 15,
  saving_threshold: 15,
  number_format: "ru",
  currency: "RUB",
  notify_import: true,
  notify_overspend: true,
  notify_weekly: false,
  email_notify: true,
  theme: "dark",
};

const publicAuthPaths = new Set(["/", "/login", "/register"]);
const pagePathMap: Record<Page, string> = {
  dashboard: "/visualizations",
  report: "/reports",
  import: "/import",
  reminders: "/reminders",  docs: "/docs",
  demo: "/demo",
  settings: "/settings",
  profile: "/profile",
  admin: "/ops-console",
};

function resolvePageFromPath(pathname: string): Page | null {
  if (pathname === "/dashboard" || pathname === "/visualizations") return "dashboard";
  if (pathname === "/report" || pathname === "/reports") return "report";
  if (pathname === "/import") return "import";
  if (pathname === "/reminders") return "reminders";
  if (pathname === "/workflow") return "reminders";
  if (pathname === "/docs") return "docs";
  if (pathname === "/demo") return "demo";
  if (pathname === "/settings") return "settings";
  if (pathname === "/profile") return "profile";
  if (pathname === "/ops-console") return "admin";
  return null;
}

function resolveAuthModeFromPath(pathname: string): AuthMode | null {
  if (pathname === "/login") return "login";
  if (pathname === "/register") return "register";
  return null;
}

const navItems: { page: Page; icon: typeof LayoutDashboard; label: string }[] = [
  { page: "dashboard", icon: LayoutDashboard, label: "Визуализации" },
  { page: "report", icon: FileBarChart2, label: "Отчёт План–Факт" },
  { page: "import", icon: Upload, label: "Импорт данных" },
  { page: "reminders", icon: ListChecks, label: "Напоминания" },  { page: "docs", icon: BookOpen, label: "Документация" },
  { page: "demo", icon: PlayCircle, label: "Демо-сценарий" },
];

function isPageAllowedForRole(page: Page, role: UserRole) {
  const perms = rolePermissions[role];
  if (page === "import") return perms.canImport;
  if (page === "settings") return perms.canSettings;
  if (page === "admin") return role === "controller";
  return true;
}

function getFallbackPageForRole(role: UserRole): Page {
  void role;
  return "dashboard";
}

function getInitials(fullName: string) {
  const parts = fullName.split(" ").map((v) => v.trim()).filter(Boolean);
  if (parts.length === 0) return "П";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [authUser, setAuthUser] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [accountSettings, setAccountSettings] = useState<UserSettings>(defaultAccountSettings);
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [threshold, setThreshold] = useState<number>(defaultAccountSettings.threshold);
  const mainRef = useRef<HTMLDivElement>(null);
  const page = useMemo(
    () => resolvePageFromPath(location.pathname) ?? "dashboard",
    [location.pathname],
  );
  const isAuthenticated = authUser !== null;
  const userRole = authUser?.role ?? "analyst";
  const userPermissions = rolePermissions[userRole];
  const defaultPage = authUser ? getFallbackPageForRole(authUser.role) : "dashboard";
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => isPageAllowedForRole(item.page, userRole)),
    [userRole],
  );
  const userInitials = useMemo(
    () => (authUser ? getInitials(authUser.name) : "П"),
    [authUser],
  );
  const requestedAuthMode = useMemo(
    () => resolveAuthModeFromPath(location.pathname),
    [location.pathname],
  );

  const applyAccount = (user: UserSession, settings?: Partial<UserSettings>) => {
    const mergedSettings = { ...defaultAccountSettings, ...settings };
    setAuthUser(user);
    setAccountSettings(mergedSettings);
    setThreshold(mergedSettings.threshold);
    setDark(mergedSettings.theme === "dark");
  };

  useEffect(() => {
    if (!hasApiToken()) {
      setAuthChecked(true);
      return;
    }
    getAccount()
      .then((account) => {
        applyAccount(toUserSessionFromAccount(account), account.user.settings);
      })
      .catch(() => {
        clearStoredUser();
        setAuthUser(null);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredUser();
      setAuthUser(null);
      setAuthChecked(true);
      navigate("/login", { replace: true });
    };
    window.addEventListener("budgetiq:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("budgetiq:unauthorized", handleUnauthorized);
  }, [navigate]);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const handleScroll = () => setScrolled(main.scrollTop > 20);
    main.addEventListener("scroll", handleScroll);
    return () => main.removeEventListener("scroll", handleScroll);
  }, [isAuthenticated]);

  useEffect(() => {
    const resolvedPage = resolvePageFromPath(location.pathname);
    const isPublicPath = publicAuthPaths.has(location.pathname);
    if (!authChecked) return;
    if (!authUser) {
      if (!isPublicPath) {
        navigate("/", { replace: true });
      }
      return;
    }

    if (!hasApiToken()) {
      setAuthUser(null);
      clearStoredUser();
      navigate("/login", { replace: true });
      toast.error("Нужно войти заново", { description: "Для защищённых разделов нужен актуальный JWT-токен" });
      return;
    }

    if (isPublicPath || !resolvedPage) {
      navigate(pagePathMap[defaultPage], { replace: true });
      return;
    }

    if (!isPageAllowedForRole(resolvedPage, authUser.role)) {
      navigate(pagePathMap[defaultPage], { replace: true });
    }
  }, [authChecked, authUser, defaultPage, location.pathname, navigate]);

  const handleNavigate = (p: Page) => {
    if (authUser && !isPageAllowedForRole(p, authUser.role)) {
      toast.error("Недостаточно прав", { description: "Раздел недоступен для выбранной роли" });
      return;
    }
    navigate(pagePathMap[p]);
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);
  };

  const handleThemeToggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    setAccountSettings((prev) => {
      const next = { ...prev, theme: nextDark ? "dark" : "light" } as UserSettings;
      updateAccountSettings(next).catch(() => undefined);
      return next;
    });
    toast(dark ? "Светлая тема" : "Тёмная тема", {
      description: dark ? "Переключено на светлый режим" : "Переключено на тёмный режим",
      icon: dark ? <Sun className="w-4 h-4 text-[#f59e0b]" /> : <Moon className="w-4 h-4 text-[#6366f1]" />,
    });
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setReportSearchQuery(searchQuery.trim());
      navigate(pagePathMap.report);
      toast.info(`Поиск: "${searchQuery.trim()}"`, { description: "Фильтр применён в отчёте План-Факт" });
    }
  };

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    setAuthUser(null);
    navigate("/", { replace: true });
    clearStoredUser();
    toast("Выход из системы", { description: "Сессия завершена", icon: <LogOut className="w-4 h-4" /> });
  };

  const handleAuthSuccess = (user: UserSession) => {
    applyAccount(user);
    getAccount()
      .then((account) => applyAccount(toUserSessionFromAccount(account), account.user.settings))
      .catch(() => undefined);
    navigate(pagePathMap[getFallbackPageForRole(user.role)], { replace: true });
  };

  /* ── Landing view ── */
  if (!authChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: "16px", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", fontFamily: "'Inter', sans-serif", fontSize: "13px" } }} theme={dark ? "dark" : "light"} richColors />
        <LandingPage
          onAuthSuccess={handleAuthSuccess}
          initialAuthMode={requestedAuthMode}
          onAuthRouteChange={(mode) => navigate(mode === "login" ? "/login" : "/register")}
          onAuthRequestClose={() => {
            if (location.pathname === "/login" || location.pathname === "/register") {
              navigate("/", { replace: true });
            }
          }}
        />
      </>
    );
  }

  /* ── Dashboard app view ── */
  return (
    <>
      {/* Sonner Toaster */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: "16px",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
          },
        }}
        theme={dark ? "dark" : "light"}
        richColors
      />

      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* ── Sidebar ── */}
        <motion.aside
          animate={{ width: collapsed ? 72 : 260 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex flex-col border-r border-border bg-card shrink-0"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 cursor-pointer"
              onClick={() => handleNavigate("dashboard")}
            >
              <BudgetIQLogo size={28} />
            </motion.div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <span
                    className="text-[15px] tracking-[-0.01em] text-foreground whitespace-nowrap cursor-pointer"
                    style={{ fontWeight: 600 }}
                    onClick={() => handleNavigate("dashboard")}
                  >
                    BudgetIQ
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = page === item.page;
              return (
                <motion.button
                  key={item.page}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigate(item.page)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left ${
                    isActive
                      ? "bg-[#eef2ff] text-[#2563eb] dark:bg-[#1e293b] dark:text-[#93c5fd]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? "text-[#6366f1] dark:text-[#818cf8]" : ""
                    }`}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[13px] whitespace-nowrap"
                        style={{ fontWeight: isActive ? 500 : 400 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-3 border-t border-border space-y-1">
            <motion.button
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleThemeToggle}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              {dark ? <Sun className="w-[18px] h-[18px] shrink-0" /> : <Moon className="w-[18px] h-[18px] shrink-0" />}
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px]" style={{ fontWeight: 400 }}>
                    {dark ? "Светлая тема" : "Тёмная тема"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {userPermissions.canSettings && (
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavigate("settings")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200 ${
                  page === "settings"
                    ? "bg-[#eef2ff] text-[#2563eb] dark:bg-[#1e293b] dark:text-[#93c5fd]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Settings className={`w-[18px] h-[18px] shrink-0 ${page === "settings" ? "text-[#6366f1] dark:text-[#818cf8]" : ""}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px]" style={{ fontWeight: page === "settings" ? 500 : 400 }}>
                      Настройки
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>

          {/* Collapse toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-md transition-all duration-200 z-10"
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </motion.button>
        </motion.aside>

        {/* ── Main area ── */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <motion.header
            animate={{ height: scrolled ? 52 : 64 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center justify-between px-6 border-b border-border shrink-0 z-20 transition-shadow duration-200 ${
              scrolled ? "shadow-sm bg-card/95 backdrop-blur-xl" : "bg-card/80 backdrop-blur-xl"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по ЦФО, статьям..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={`pl-9 pr-4 py-2 rounded-xl bg-muted/50 border text-[13px] w-64 focus:outline-none transition-all placeholder:text-muted-foreground/60 ${
                    searchFocused ? "border-primary/30 ring-2 ring-primary/10 w-80" : "border-transparent"
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted">Esc</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications bell */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileDropdownOpen(false); }}
                  className={`relative p-2 rounded-xl transition-all ${
                    notificationsOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Bell className="w-[18px] h-[18px]" />
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                    className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ef4444] rounded-full"
                  />
                </motion.button>
              </div>

              <div className="w-px h-6 bg-border mx-2" />

              {/* Profile avatar */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotificationsOpen(false); }}
                  className={`flex items-center gap-3 px-2 py-1.5 rounded-xl transition-all ${
                    profileDropdownOpen || page === "profile" ? "bg-primary/5" : "hover:bg-muted"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center">
                    <span className="text-white text-[11px]" style={{ fontWeight: 600 }}>{userInitials}</span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{authUser?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{authUser?.position} · {authUser ? roleLabels[authUser.role] : ""}</p>
                  </div>
                </motion.button>

                {/* Profile dropdown */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-56 rounded-xl bg-card border border-border z-50 overflow-hidden"
                        style={{ boxShadow: "0 12px 48px rgba(0,0,0,0.12)" }}
                      >
                        <div className="p-3 border-b border-border">
                          <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{authUser?.name}</p>
                          <p className="text-[11px] text-muted-foreground">{authUser?.email}</p>
                        </div>
                        <div className="p-1.5">
                          <button
                            onClick={() => handleNavigate("profile")}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-foreground hover:bg-muted transition-all text-left"
                            style={{ fontWeight: 400 }}
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                            Профиль
                          </button>
                          {userPermissions.canSettings && (
                            <button
                              onClick={() => handleNavigate("settings")}
                              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-foreground hover:bg-muted transition-all text-left"
                              style={{ fontWeight: 400 }}
                            >
                              <Settings className="w-4 h-4 text-muted-foreground" />
                              Настройки
                            </button>
                          )}
                        </div>
                        <div className="p-1.5 border-t border-border">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] text-[#ef4444] hover:bg-[#ef4444]/5 transition-all text-left"
                            style={{ fontWeight: 400 }}
                          >
                            <LogOut className="w-4 h-4" />
                            Выйти
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.header>

          {/* Notifications panel */}
          <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

          {/* Page content */}
          <main ref={mainRef} className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={page}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {page === "dashboard" && (
                  <Dashboard
                    userRole={authUser!.role}
                    allowedCostCenters={authUser!.allowedCostCenters}
                    externalSearchQuery={reportSearchQuery}
                  />
                )}
                {page === "report" && (
                  <Report
                    threshold={threshold}
                    onThresholdChange={setThreshold}
                    userRole={authUser!.role}
                    allowedCostCenters={authUser!.allowedCostCenters}
                  />
                )}
                {page === "import" && <Import />}
                {page === "reminders" && <RemindersPage user={authUser!} />}
                {page === "docs" && <DocsPage />}
                {page === "demo" && <DemoPage />}
                {page === "settings" && (
                  <SettingsPage
                    threshold={threshold}
                    onThresholdChange={(value) => {
                      setThreshold(value);
                      setAccountSettings((prev) => ({ ...prev, threshold: value }));
                    }}
                    accountSettings={accountSettings}
                    onAccountSettingsChange={(settings) => {
                      const merged = { ...defaultAccountSettings, ...settings };
                      setAccountSettings(merged);
                      setThreshold(merged.threshold);
                      setDark(merged.theme === "dark");
                    }}
                    userRole={authUser!.role}
                    onOpenAdmin={() => handleNavigate("admin")}
                  />
                )}
                {page === "profile" && (
                  <ProfilePage
                    user={authUser!}
                    onUserChange={(user) => setAuthUser(user)}
                  />
                )}
                {page === "admin" && <AdminPanel />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
}

function App() {
  const inRouterContext = useInRouterContext();

  if (inRouterContext) {
    return <AppContent />;
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
