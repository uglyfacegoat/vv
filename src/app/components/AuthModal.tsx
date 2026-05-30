import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  Chrome,
  Check,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import {
  ALL_COST_CENTERS,
  type UserRole,
  type UserSession,
  saveApiToken,
} from "../auth";
import { login, register, toUserSession } from "../api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onSuccess?: (user: UserSession) => void;
}

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "analyst", label: "Финансовый аналитик" },
  { value: "manager", label: "Руководитель подразделения" },
  { value: "controller", label: "Контролёр планирования" },
];

const costCenterOptions = [...ALL_COST_CENTERS];

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onSuccess,
}: AuthModalProps) {
  const { dark } = useTheme();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "analyst" as UserRole,
    costCenter: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSuccess(false);
      setLoading(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setFormError(null);
      const rememberedEmail = localStorage.getItem("budgetiq.remember.email") ?? "";
      const remembered = localStorage.getItem("budgetiq.remember.enabled") !== "false";
      setRememberMe(remembered);
      setFormData({
        email: remembered ? rememberedEmail : "",
        password: "",
        confirmPassword: "",
        role: "analyst",
        costCenter: "",
      });
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const email = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setFormError("Введите логин или email.");
      return;
    }
    if (mode === "register" && !emailRegex.test(email)) {
      setFormError("Укажите корректный email.");
      return;
    }
    if (!formData.password) {
      setFormError("Введите пароль.");
      return;
    }
    if (mode === "register") {
      if (formData.password.length < 8) {
        setFormError("Пароль должен содержать минимум 8 символов.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError("Пароли не совпадают.");
        return;
      }
    }
    setLoading(true);
    try {
      const costCenterIndex = ALL_COST_CENTERS.findIndex((cc) => cc === formData.costCenter);
      const response = mode === "login"
        ? await login(email, formData.password)
        : await register({
            email,
            password: formData.password,
            role: formData.role,
            cc_id: formData.role === "manager" && costCenterIndex >= 0 ? costCenterIndex + 1 : null,
          });
      saveApiToken(response.token);
      if (rememberMe) {
        localStorage.setItem("budgetiq.remember.enabled", "true");
        localStorage.setItem("budgetiq.remember.email", email);
      } else {
        localStorage.setItem("budgetiq.remember.enabled", "false");
        localStorage.removeItem("budgetiq.remember.email");
      }
      const session = toUserSession(response);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        onSuccess?.(session);
      }, 800);
    } catch (error) {
      setLoading(false);
      setFormError(error instanceof Error ? error.message : "Ошибка авторизации.");
    }
  };

  const resetAndSwitch = (newMode: "login" | "register") => {
    setMode(newMode);
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormError(null);
  };

  const fieldClass = `w-full pl-11 pr-4 py-3 rounded-xl border text-[0.9rem] placeholder:text-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10 transition-all ${
    dark
      ? "border-gray-700 bg-gray-800/70 text-gray-100 focus:bg-gray-800"
      : "border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white"
  }`;
  const serviceVersion = (import.meta.env.VITE_APP_VERSION ?? "1.0.0").toString();
  const serviceCommit = (import.meta.env.VITE_GIT_COMMIT ?? "local-dev").toString().slice(0, 10);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          onClick={onClose}
        >
          <div className={`absolute inset-0 backdrop-blur-sm ${dark ? "bg-black/75" : "bg-gray-950/60"}`} />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[440px] max-h-[calc(100vh-32px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`absolute -inset-[1px] rounded-3xl blur-[1px] ${
                dark
                  ? "bg-gradient-to-br from-violet-500/40 via-blue-500/30 to-teal-500/35"
                  : "bg-gradient-to-br from-violet-500/30 via-blue-500/20 to-teal-500/30"
              }`}
            />
            <div
              className={`absolute -inset-4 rounded-[2rem] blur-3xl ${
                dark
                  ? "bg-gradient-to-r from-violet-500/20 via-blue-500/15 to-teal-500/20"
                  : "bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-teal-500/10"
              }`}
            />

            <div
              className={`relative rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl max-h-[calc(100vh-32px)] overflow-y-auto ${
                dark
                  ? "bg-gray-900/95 shadow-violet-500/20 border border-gray-800/80"
                  : "bg-white/95 shadow-violet-500/10"
              }`}
            >
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center transition-colors z-10 ${
                  dark ? "bg-gray-800/80 hover:bg-gray-700/80" : "bg-gray-100/80 hover:bg-gray-200/80"
                }`}
              >
                <X className={`w-4 h-4 ${dark ? "text-gray-300" : "text-gray-500"}`} />
              </button>

              <div className="p-6 pt-6">
                <div className="text-center mb-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <h2
                        className={`text-[1.5rem] mb-1 ${dark ? "text-white" : "text-gray-900"}`}
                        style={{ fontWeight: 800 }}
                      >
                        {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
                      </h2>
                      <p className={`text-[0.9rem] ${dark ? "text-gray-400" : "text-gray-500"}`}>
                        {mode === "login"
                          ? "Войдите в BudgetIQ для управления бюджетами"
                          : "Регистрация в системе план-факт бюджета"}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center z-20 rounded-3xl ${
                        dark ? "bg-gray-900/98" : "bg-white/98"
                      }`}
                    >
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 12 }}
                          className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/25"
                        >
                          <svg
                            className="w-10 h-10 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <motion.path
                              d="M5 13l4 4L19 7"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            />
                          </svg>
                        </motion.div>
                        <p className={`text-[1.1rem] ${dark ? "text-white" : "text-gray-900"}`} style={{ fontWeight: 700 }}>
                          {mode === "login" ? "Вход выполнен!" : "Аккаунт создан!"}
                        </p>
                        <p className={`text-[0.85rem] mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                          Перенаправляем в дашборд...
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border transition-all duration-300 group ${
                      dark
                        ? "border-gray-700 hover:border-violet-500/50 bg-gray-800/70 hover:bg-violet-900/20"
                        : "border-gray-200 hover:border-violet-200 bg-white hover:bg-violet-50/30"
                    }`}
                  >
                    <Chrome
                      className={`w-4.5 h-4.5 transition-colors ${
                        dark ? "text-gray-400 group-hover:text-violet-400" : "text-gray-400 group-hover:text-violet-500"
                      }`}
                    />
                    <span
                      className={`text-[0.85rem] transition-colors ${
                        dark ? "text-gray-300 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      Google
                    </span>
                  </button>

                  <button
                    className={`flex items-center justify-center gap-2.5 py-3 rounded-xl border transition-all duration-300 group ${
                      dark
                        ? "border-gray-700 hover:border-violet-500/50 bg-gray-800/70 hover:bg-violet-900/20"
                        : "border-gray-200 hover:border-violet-200 bg-white hover:bg-violet-50/30"
                    }`}
                  >
                    <svg
                      className={`w-4.5 h-4.5 transition-colors ${
                        dark ? "text-gray-400 group-hover:text-violet-400" : "text-gray-400 group-hover:text-violet-500"
                      }`}
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span
                      className={`text-[0.85rem] transition-colors ${
                        dark ? "text-gray-300 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      GitHub
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className={`flex-1 h-px ${dark ? "bg-gray-700" : "bg-gray-200"}`} />
                  <span className={`text-[0.78rem] ${dark ? "text-gray-500" : "text-gray-400"}`} style={{ fontWeight: 500 }}>
                    {mode === "login" ? "или по логину" : "или по email"}
                  </span>
                  <div className={`flex-1 h-px ${dark ? "bg-gray-700" : "bg-gray-200"}`} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label
                      className={`block text-[0.82rem] mb-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}
                      style={{ fontWeight: 600 }}
                    >
                      {mode === "login" ? "Логин / email" : "Email"}
                    </label>
                    <div className="relative">
                      <Mail
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${
                          dark ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type="text"
                        placeholder={mode === "login" ? "123 или name@company.ru" : "name@company.ru"}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {mode === "register" && (
                      <motion.div
                        key="role-field"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <label
                          className={`block text-[0.82rem] mb-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}
                          style={{ fontWeight: 600 }}
                        >
                          Роль
                        </label>
                        <div className="relative">
                          <User
                            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${
                              dark ? "text-gray-500" : "text-gray-400"
                            }`}
                          />
                          <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, costCenter: e.target.value === "manager" ? formData.costCenter : "" })}
                            className={`${fieldClass} appearance-none cursor-pointer`}
                          >
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {mode === "register" && formData.role === "manager" && (
                      <motion.div
                        key="cost-center-field"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <label
                          className={`block text-[0.82rem] mb-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}
                          style={{ fontWeight: 600 }}
                        >
                          ЦФО (опционально)
                        </label>
                        <div className="relative">
                          <Building2
                            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${
                              dark ? "text-gray-500" : "text-gray-400"
                            }`}
                          />
                          <select
                            value={formData.costCenter}
                            onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                            className={`${fieldClass} appearance-none cursor-pointer`}
                          >
                            <option value="">Выберите ЦФО</option>
                            {costCenterOptions.map((cc) => (
                              <option key={cc} value={cc}>
                                {cc}
                              </option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label
                      className={`block text-[0.82rem] mb-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}
                      style={{ fontWeight: 600 }}
                    >
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${
                          dark ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={mode === "login" ? "Введите пароль" : "Минимум 8 символов"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`${fieldClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                          dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {mode === "register" && (
                      <motion.div
                        key="confirm-password-field"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <label
                          className={`block text-[0.82rem] mb-1.5 ${dark ? "text-gray-300" : "text-gray-600"}`}
                          style={{ fontWeight: 600 }}
                        >
                          Подтверждение пароля
                        </label>
                        <div className="relative">
                          <Lock
                            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${
                              dark ? "text-gray-500" : "text-gray-400"
                            }`}
                          />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Повторите пароль"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`${fieldClass} pr-12`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className={`absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                              dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {mode === "login" && (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center hover:border-violet-400 transition-colors ${
                            rememberMe
                              ? "border-violet-500 bg-violet-500"
                              : dark ? "border-gray-600 bg-gray-800" : "border-gray-300 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="sr-only"
                          />
                          {rememberMe && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-[0.82rem] ${dark ? "text-gray-400" : "text-gray-500"}`}>Запомнить меня</span>
                      </label>
                      <button
                        type="button"
                        className={`text-[0.82rem] transition-colors ${
                          dark ? "text-violet-400 hover:text-violet-300" : "text-violet-600 hover:text-violet-700"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        Забыли пароль?
                      </button>
                    </div>
                  )}

                  {formError && (
                    <div
                      className={`rounded-xl px-3 py-2 text-[0.8rem] border ${
                        dark
                          ? "bg-red-500/10 border-red-500/20 text-red-300"
                          : "bg-red-50 border-red-200 text-red-600"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-[#2563eb] text-white text-[0.95rem] shadow-xl shadow-blue-500/20 hover:bg-[#1d4ed8] hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:hover:translate-y-0"
                    style={{ fontWeight: 700 }}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : mode === "login" ? (
                      "Войти"
                    ) : (
                      "Создать аккаунт"
                    )}
                  </button>
                </form>

                <div className={`text-center mt-6 pt-5 border-t ${dark ? "border-gray-800" : "border-gray-100"}`}>
                  <span className={`text-[0.85rem] ${dark ? "text-gray-400" : "text-gray-500"}`}>
                    {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                  </span>
                  <button
                    onClick={() => resetAndSwitch(mode === "login" ? "register" : "login")}
                    className={`text-[0.85rem] transition-colors ${
                      dark ? "text-violet-400 hover:text-violet-300" : "text-violet-600 hover:text-violet-700"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {mode === "login" ? "Зарегистрируйтесь" : "Войти"}
                  </button>
                </div>

                {mode === "register" && (
                  <p className={`text-[0.75rem] text-center mt-4 leading-relaxed ${dark ? "text-gray-500" : "text-gray-400"}`}>
                    Нажимая «Создать аккаунт», вы соглашаетесь с{" "}
                    <a href="#" className={`${dark ? "text-violet-400" : "text-violet-500"} hover:underline`}>
                      Условиями использования
                    </a>{" "}
                    и{" "}
                    <a href="#" className={`${dark ? "text-violet-400" : "text-violet-500"} hover:underline`}>
                      Политикой конфиденциальности
                    </a>
                  </p>
                )}

                <div className={`mt-4 pt-3 border-t text-center ${dark ? "border-gray-800" : "border-gray-100"}`}>
                  <p className={`text-[0.72rem] ${dark ? "text-gray-500" : "text-gray-400"}`}>
                    Powered by 1C:Предприятие | Версия {serviceVersion} | Git commit: {serviceCommit}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
