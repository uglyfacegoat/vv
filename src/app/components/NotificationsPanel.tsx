import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Check,
  Trash2,
  Upload,
  FileBarChart2,
  Shield,
  TrendingUp,
} from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: typeof Bell;
  color: string;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "success",
    title: "Импорт fact.csv завершён",
    description: "580 строк загружено, 0 ошибок. Данные обновлены в витрине.",
    time: "5 мин назад",
    read: false,
    icon: Upload,
    color: "#10b981",
  },
  {
    id: "2",
    type: "warning",
    title: "Перерасход: Коммерция → Командировки",
    description: "delta_pct = +35.6% (порог: 10%). Период 2025-10.",
    time: "12 мин назад",
    read: false,
    icon: AlertTriangle,
    color: "#f59e0b",
  },
  {
    id: "3",
    type: "error",
    title: "Ошибка валидации plan.csv",
    description: "Строка 45: cc_id=99 не найден в справочнике cost_centers.",
    time: "28 мин назад",
    read: false,
    icon: XCircle,
    color: "#ef4444",
  },
  {
    id: "4",
    type: "info",
    title: "Новый период доступен",
    description: "Данные за 2026-01 загружены. Дашборд обновлён.",
    time: "1 час назад",
    read: true,
    icon: TrendingUp,
    color: "#6366f1",
  },
  {
    id: "5",
    type: "success",
    title: "Экспорт CSV завершён",
    description: "Отчёт План-Факт: 24 строки, фильтр ИТ + OPEX.",
    time: "2 часа назад",
    read: true,
    icon: FileBarChart2,
    color: "#06b6d4",
  },
  {
    id: "6",
    type: "warning",
    title: "Неполные данные plan ↔ fact",
    description: "3 комбинации (period, cc_id, item_id) есть в plan, но нет в fact.",
    time: "3 часа назад",
    read: true,
    icon: Shield,
    color: "#8b5cf6",
  },
  {
    id: "7",
    type: "info",
    title: "Порог изменён",
    description: "threshold обновлён: 10% → 12%. Статусы пересчитаны.",
    time: "Вчера",
    read: true,
    icon: Info,
    color: "#64748b",
  },
];

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("Все уведомления прочитаны");
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast("Уведомление удалено");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("Все уведомления очищены");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-4 top-14 w-[420px] max-h-[560px] rounded-2xl bg-card border border-border z-50 overflow-hidden flex flex-col"
            style={{ boxShadow: "0 16px 64px rgba(0,0,0,0.15)" }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
                  Уведомления
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]" style={{ fontWeight: 600 }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="px-2 py-1 rounded-lg text-[11px] text-primary hover:bg-primary/5 transition-all"
                    style={{ fontWeight: 500 }}
                  >
                    <Check className="w-3 h-3 inline mr-1" />
                    Прочитать все
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="px-5 py-2 border-b border-border flex items-center gap-1 shrink-0">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${
                    filter === f
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {f === "all" ? `Все (${notifications.length})` : `Непрочитанные (${unreadCount})`}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-[13px] text-muted-foreground" style={{ fontWeight: 500 }}>
                    {filter === "unread" ? "Нет непрочитанных" : "Нет уведомлений"}
                  </p>
                </div>
              ) : (
                <div>
                  {filtered.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex gap-3 px-5 py-3.5 border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer ${
                        !n.read ? "bg-primary/[0.02]" : ""
                      }`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${n.color}12` }}
                      >
                        <n.icon className="w-4 h-4" style={{ color: n.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] text-foreground truncate" style={{ fontWeight: n.read ? 400 : 500 }}>
                            {n.title}
                          </p>
                          {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
                <span className="text-[11px] text-muted-foreground">
                  {notifications.length} уведомлений
                </span>
                <button
                  onClick={clearAll}
                  className="text-[11px] text-muted-foreground hover:text-[#ef4444] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  Очистить все
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
