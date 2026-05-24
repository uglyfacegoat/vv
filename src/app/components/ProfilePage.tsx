import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Camera,
  Mail,
  Phone,
  Shield,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  Key,
  Activity,
  FileBarChart2,
  Upload,
  Download,
  LogOut,
  Building2,
} from "lucide-react";
import { roleLabels, rolePermissions, type UserSession } from "../auth";
import { toUserSessionFromAccount, updateProfile } from "../api";

const activityLog = [
  { time: "Сегодня, 14:32", action: "Экспорт CSV", detail: "Отчёт План-Факт, 2025-10 — 2025-12", icon: Download, color: "#6366f1" },
  { time: "Сегодня, 14:28", action: "Импорт fact.csv", detail: "580 строк, 0 ошибок", icon: Upload, color: "#10b981" },
  { time: "Сегодня, 14:25", action: "Импорт plan.csv", detail: "612 строк, 2 предупреждения", icon: Upload, color: "#f59e0b" },
  { time: "Вчера, 17:15", action: "Просмотр дашборда", detail: "Период 2025-07 — 2026-02", icon: FileBarChart2, color: "#06b6d4" },
  { time: "Вчера, 16:30", action: "Изменение порога", detail: "threshold: 10% → 12%", icon: Activity, color: "#8b5cf6" },
  { time: "18 фев, 11:20", action: "Экспорт CSV", detail: "Фильтр: ИТ, OPEX", icon: Download, color: "#6366f1" },
];

interface ProfilePageProps {
  user: UserSession;
  onUserChange: (user: UserSession) => void;
}

const roleAccent: Record<UserSession["role"], { color: string; bg: string; note: string }> = {
  controller: {
    color: "#ef4444",
    bg: "bg-[#ef4444]/10",
    note: "Полный доступ к системе: импорт, настройки и управление",
  },
  analyst: {
    color: "#06b6d4",
    bg: "bg-[#06b6d4]/10",
    note: "Полный доступ к данным и отчётам, импорт/экспорт доступны",
  },
  manager: {
    color: "#6366f1",
    bg: "bg-[#6366f1]/10",
    note: "Доступ ограничен назначенными ЦФО, без импорта и системных настроек",
  },
};

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "П";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function ProfilePage({ user, onUserChange }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [position, setPosition] = useState(user.position);
  const [department, setDepartment] = useState(user.department);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? "");
    setPosition(user.position);
    setDepartment(user.department);
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const account = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        position: position.trim(),
        department: department.trim(),
        avatar_url: user.avatarUrl ?? "",
      });
      const nextUser = toUserSessionFromAccount(account);
      onUserChange(nextUser);
      setEditing(false);
      toast.success("Профиль обновлён", { description: `${nextUser.name}, ${nextUser.position}` });
    } catch (error) {
      toast.error("Не удалось сохранить профиль", {
        description: error instanceof Error ? error.message : "Проверьте соединение с backend",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    setShowChangePassword(false);
    toast.info("Смена пароля", { description: "Для MVP используется вход через JWT; отдельный endpoint смены пароля будет добавлен следующим шагом" });
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-foreground tracking-[-0.02em]"
          style={{ fontSize: "24px", fontWeight: 600 }}
        >
          Профиль
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1 text-[14px]"
        >
          Управление учётной записью и персональные данные
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Main card */}
        <div className="space-y-6">
          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card border border-border overflow-hidden"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
          >
            {/* Cover */}
            <div className="h-[80px] bg-gradient-to-r from-[#6366f1] to-[#06b6d4] relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
            </div>

            {/* Avatar + Info */}
            <div className="px-6 pb-6">
              <div className="relative z-10 flex items-end gap-5 -mt-7">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center border-4 border-card">
                    <span className="text-white text-[24px]" style={{ fontWeight: 600 }}>{getInitials(name)}</span>
                  </div>
                  <button
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                    onClick={() => toast.info("Аватар", { description: "Сейчас сохраняются текстовые поля профиля; файл аватара вынесен в отдельный upload endpoint" })}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-between pb-1">
                  <div>
                    <h2 className="text-foreground text-[18px]" style={{ fontWeight: 600 }}>{name}</h2>
                    <p className="text-[13px] text-muted-foreground">{position}</p>
                  </div>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                      style={{ fontWeight: 500 }}
                    >
                      <Edit3 className="w-4 h-4" />
                      Редактировать
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-[13px] text-muted-foreground hover:text-foreground transition-all"
                        style={{ fontWeight: 500 }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563eb] text-white text-[13px] hover:bg-[#1d4ed8] hover:shadow-lg transition-all"
                        style={{ fontWeight: 500 }}
                      >
                        <Save className="w-4 h-4" />
                        {saving ? "Сохраняем..." : "Сохранить"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { icon: Mail, label: "Email", value: email, setter: setEmail, field: "email" },
                  { icon: Phone, label: "Телефон", value: phone, setter: setPhone, field: "phone" },
                  { icon: Building2, label: "Компания / Enterprise", value: user.enterprise ?? "Не задано", setter: () => {}, field: "enterprise" },
                  { icon: Shield, label: "Должность", value: position, setter: setPosition, field: "position" },
                  { icon: MapPin, label: "Подразделение", value: department, setter: setDepartment, field: "department" },
                ].map((f) => (
                  <div key={f.field}>
                    <label className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1.5" style={{ fontWeight: 500 }}>
                      <f.icon className="w-3 h-3" />
                      {f.label}
                    </label>
                    {editing && f.field !== "email" && f.field !== "enterprise" ? (
                      <input
                        type="text"
                        value={f.value}
                        onChange={(e) => f.setter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    ) : (
                      <p className="text-[13px] text-foreground px-3 py-2">{f.value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Role badge */}
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${roleAccent[user.role].bg}`}>
                  <Shield className="w-4 h-4" style={{ color: roleAccent[user.role].color }} />
                  <span className="text-[12px]" style={{ fontWeight: 500, color: roleAccent[user.role].color }}>
                    {roleLabels[user.role]}
                  </span>
                </div>
                <span className="text-[12px] text-muted-foreground">
                  {roleAccent[user.role].note}
                </span>
              </div>

              <div className="mt-3 rounded-xl bg-muted/30 border border-border px-3 py-3">
                <p className="text-[11px] text-muted-foreground mb-2" style={{ fontWeight: 500 }}>
                  Доступные ЦФО
                </p>
                <div className="flex flex-wrap gap-2">
                  {user.allowedCostCenters.map((cc) => (
                    <span
                      key={cc}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary"
                      style={{ fontWeight: 500 }}
                    >
                      {cc}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Разрешения: экспорт {rolePermissions[user.role].canExport ? "включён" : "отключён"}, импорт {rolePermissions[user.role].canImport ? "включён" : "отключён"}, настройки {rolePermissions[user.role].canSettings ? "включены" : "отключены"}.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-card border border-border p-6"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
          >
            <h3 className="text-foreground text-[15px] mb-4" style={{ fontWeight: 600 }}>Безопасность</h3>

            <div className="space-y-3">
              {/* Change password */}
              <div className="rounded-xl bg-muted/30 border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#6366f1]/10 flex items-center justify-center">
                      <Key className="w-4 h-4 text-[#6366f1]" />
                    </div>
                    <div>
                      <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Пароль</p>
                      <p className="text-[11px] text-muted-foreground">Последнее изменение: 15 января 2026</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="px-3 py-1.5 rounded-lg text-[12px] text-primary border border-primary/20 hover:bg-primary/5 transition-all"
                    style={{ fontWeight: 500 }}
                  >
                    Изменить
                  </button>
                </div>

                {showChangePassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-border space-y-3"
                  >
                    <input
                      type="password"
                      placeholder="Текущий пароль"
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="password"
                      placeholder="Новый пароль"
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="password"
                      placeholder="Подтвердите пароль"
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      onClick={handleChangePassword}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563eb] text-white text-[13px] hover:bg-[#1d4ed8] hover:shadow-lg transition-all"
                      style={{ fontWeight: 500 }}
                    >
                      <Save className="w-4 h-4" />
                      Сохранить пароль
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Sessions */}
              <div className="rounded-xl bg-muted/30 border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-[#10b981]" />
                    </div>
                    <div>
                      <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Активные сессии</p>
                      <p className="text-[11px] text-muted-foreground">2 устройства · Текущая: Chrome, MacOS</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.info("Все сессии завершены", { description: "Кроме текущей" })}
                    className="px-3 py-1.5 rounded-lg text-[12px] text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/5 transition-all"
                    style={{ fontWeight: 500 }}
                  >
                    <LogOut className="w-3.5 h-3.5 inline mr-1.5" />
                    Завершить все
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Activity sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-card border border-border p-5 flex flex-col lg:max-h-[calc(100vh-190px)]"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-foreground text-[15px]" style={{ fontWeight: 600 }}>Активность</h3>
          </div>

          <div className="space-y-1 overflow-y-auto pr-1">
            {activityLog.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex gap-3 py-3 border-b border-border/50 last:border-0"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${a.color}12` }}
                >
                  <a.icon className="w-4 h-4" style={{ color: a.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>{a.action}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{a.detail}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{a.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
