import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
} from "lucide-react";

type ReminderStatus = "planned" | "done";
type ReminderPriority = "low" | "medium" | "high";
type UserRole = "controller" | "analyst" | "manager";
type WorkflowStatus = "planned" | "in_progress" | "published" | "done";

interface ReminderItem {
  id: string;
  title: string;
  note: string;
  dueDate: string;
  dueTime: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  createdAt: number;
}

interface ReminderTemplate {
  id: string;
  label: string;
  value: string;
}

interface WorkflowTaskRaw {
  id: string;
  role: UserRole;
  assignee: string;
  title: string;
  cadence: "weekly" | "monthly" | "quarterly";
  deadline: string;
  status: WorkflowStatus;
  note: string;
}

interface AssignedTask {
  id: string;
  title: string;
  note: string;
  dueDate: string;
  priority: ReminderPriority;
  status: WorkflowStatus;
  assignedBy: string;
  assignedByRole: UserRole;
}

const STORAGE_KEY = "budgetiq.reminders.v1";
const WORKFLOW_TASKS_STORAGE_KEY = "budgetiq.workflow.tasks.v1";
const USER_SESSION_KEY = "budgetiq.user.session.v1";

const templates: ReminderTemplate[] = [
  { id: "plan", label: "Импорт Plan", value: "Загрузить plan CSV за текущий период" },
  { id: "fact", label: "Импорт Fact", value: "Загрузить fact CSV и проверить ошибки валидации" },
  { id: "check", label: "Проверка отклонений", value: "Проверить отклонения выше порога и зафиксировать причины" },
  { id: "report", label: "Сформировать отчёт", value: "Собрать финальный отчёт План–Факт и экспортировать CSV" },
];

const workflowStatusMeta: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  planned: { label: "Запланировано", color: "#64748b", bg: "bg-[#64748b]/10" },
  in_progress: { label: "В работе", color: "#f59e0b", bg: "bg-[#f59e0b]/10" },
  published: { label: "На проверке", color: "#8b5cf6", bg: "bg-[#8b5cf6]/10" },
  done: { label: "Подтверждено", color: "#10b981", bg: "bg-[#10b981]/10" },
};

const roleMeta: Record<UserRole, { label: string; color: string; bg: string }> = {
  controller: { label: "Контролёр", color: "#ef4444", bg: "bg-[#ef4444]/10" },
  analyst: { label: "Аналитик", color: "#06b6d4", bg: "bg-[#06b6d4]/10" },
  manager: { label: "Руководитель", color: "#6366f1", bg: "bg-[#6366f1]/10" },
};

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}

function toInputDate(now: Date) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDueAt(item: ReminderItem) {
  return new Date(`${item.dueDate}T${item.dueTime || "23:59"}:00`);
}

function getPriorityMeta(priority: ReminderPriority) {
  if (priority === "high") return { label: "Высокий", color: "#ef4444", bg: "bg-[#ef4444]/10" };
  if (priority === "medium") return { label: "Средний", color: "#f59e0b", bg: "bg-[#f59e0b]/10" };
  return { label: "Низкий", color: "#10b981", bg: "bg-[#10b981]/10" };
}

function toPriorityFromCadence(cadence: WorkflowTaskRaw["cadence"]): ReminderPriority {
  if (cadence === "weekly") return "high";
  if (cadence === "monthly") return "medium";
  return "low";
}

function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return value === "planned" || value === "in_progress" || value === "published" || value === "done";
}

function isUserRole(value: unknown): value is UserRole {
  return value === "controller" || value === "analyst" || value === "manager";
}

export function RemindersPage() {
  const [nowTs, setNowTs] = useState(Date.now());
  const [reminders, setReminders] = useState<ReminderItem[]>([]);

  const [template, setTemplate] = useState(templates[0].id);
  const [customText, setCustomText] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState(toInputDate(new Date()));
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<ReminderPriority>("medium");
  const [currentUserName, setCurrentUserName] = useState("Мария Жданова");
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("analyst");

  useEffect(() => {
    const interval = window.setInterval(() => setNowTs(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { name?: string; role?: UserRole };
      if (typeof parsed.name === "string" && parsed.name.trim()) {
        setCurrentUserName(parsed.name.trim());
      }
      if (isUserRole(parsed.role)) {
        setCurrentUserRole(parsed.role);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ReminderItem[];
      if (Array.isArray(parsed)) setReminders(parsed);
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch {
      // ignore storage errors
    }
  }, [reminders]);

  const todayStr = useMemo(() => toInputDate(new Date(nowTs)), [nowTs]);

  const withComputed = useMemo(
    () =>
      reminders.map((item) => {
        const dueAt = getDueAt(item);
        const isOverdue = item.status !== "done" && dueAt.getTime() < nowTs;
        return { ...item, dueAt, isOverdue };
      }),
    [reminders, nowTs],
  );

  const overdueItems = useMemo(
    () => withComputed.filter((i) => i.status !== "done" && i.isOverdue).sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime()),
    [withComputed],
  );
  const todayItems = useMemo(
    () => withComputed.filter((i) => i.status !== "done" && !i.isOverdue && i.dueDate === todayStr).sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime()),
    [withComputed, todayStr],
  );
  const upcomingItems = useMemo(
    () => withComputed.filter((i) => i.status !== "done" && !i.isOverdue && i.dueDate > todayStr).sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime()),
    [withComputed, todayStr],
  );
  const doneItems = useMemo(
    () => withComputed.filter((i) => i.status === "done").sort((a, b) => b.createdAt - a.createdAt),
    [withComputed],
  );

  const assignedTasks = useMemo(() => {
    const fallbackByRole: Record<UserRole, AssignedTask[]> = {
      analyst: [
        {
          id: "assigned-analyst-1",
          title: "Сверить план/факт по своему блоку",
          note: "Проверить отклонения выше порога и подготовить комментарии",
          dueDate: todayStr,
          priority: "high",
          status: "in_progress",
          assignedBy: "Контролёр планирования",
          assignedByRole: "controller",
        },
      ],
      manager: [
        {
          id: "assigned-manager-1",
          title: "Подтвердить комментарии по отклонениям ЦФО",
          note: "Подтверждение закрытия выполняется назначившим",
          dueDate: todayStr,
          priority: "medium",
          status: "planned",
          assignedBy: "Контролёр планирования",
          assignedByRole: "controller",
        },
      ],
      controller: [
        {
          id: "assigned-controller-1",
          title: "Проверить корректность публикации отчёта",
          note: "После проверки закрытие фиксируется руководителем программы",
          dueDate: todayStr,
          priority: "medium",
          status: "published",
          assignedBy: "Руководитель программы",
          assignedByRole: "manager",
        },
      ],
    };

    try {
      const raw = localStorage.getItem(WORKFLOW_TASKS_STORAGE_KEY);
      if (!raw) return fallbackByRole[currentUserRole];
      const parsed = JSON.parse(raw) as WorkflowTaskRaw[];
      if (!Array.isArray(parsed)) return fallbackByRole[currentUserRole];

      const normalized = parsed
        .filter((task) => {
          if (!task || typeof task !== "object") return false;
          const byAssignee = typeof task.assignee === "string" && task.assignee.trim().toLowerCase() === currentUserName.trim().toLowerCase();
          const byRole = task.role === currentUserRole;
          return byAssignee || byRole;
        })
        .map<AssignedTask>((task) => {
          const assignedByRole: UserRole = task.role === "manager" ? "manager" : "controller";
          return {
            id: `assigned-${task.id}`,
            title: task.title,
            note: task.note,
            dueDate: task.deadline,
            priority: toPriorityFromCadence(task.cadence),
            status: isWorkflowStatus(task.status) ? task.status : "planned",
            assignedBy: assignedByRole === "manager" ? "Руководитель подразделения" : "Контролёр планирования",
            assignedByRole,
          };
        })
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

      return normalized.length > 0 ? normalized : fallbackByRole[currentUserRole];
    } catch {
      return fallbackByRole[currentUserRole];
    }
  }, [currentUserName, currentUserRole, todayStr]);

  const activeTemplate = templates.find((t) => t.id === template) ?? templates[0];

  const handleAddReminder = () => {
    const title = template === "custom" ? customText.trim() : activeTemplate.value;
    if (!title) {
      toast.error("Добавьте текст напоминания");
      return;
    }
    if (!dueDate) {
      toast.error("Выберите дату");
      return;
    }
    const nextReminder: ReminderItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      note: note.trim(),
      dueDate,
      dueTime,
      priority,
      status: "planned",
      createdAt: Date.now(),
    };
    setReminders((prev) => [nextReminder, ...prev]);
    setCustomText("");
    setNote("");
    setDueTime("");
    setPriority("medium");
    toast.success("Напоминание создано", {
      description: `${formatDateLabel(dueDate)}${dueTime ? ` в ${dueTime}` : ""}`,
    });
  };

  const handleToggleStatus = (id: string) => {
    setReminders((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "done" ? "planned" : "done" }
          : item,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setReminders((prev) => prev.filter((item) => item.id !== id));
    toast("Напоминание удалено");
  };

  const renderPersonalItem = (item: ReminderItem & { isOverdue: boolean }) => {
    const priorityMeta = getPriorityMeta(item.priority);
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-3 bg-card transition-colors ${
          item.isOverdue ? "border-[#ef4444]/30" : "border-border"
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => handleToggleStatus(item.id)}
            className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
            aria-label="toggle reminder status"
          >
            {item.status === "done" ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={`text-[13px] ${
                item.status === "done"
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
              style={{ fontWeight: 500 }}
            >
              {item.title}
            </p>
            {item.note && (
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {item.note}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-muted/60 text-muted-foreground">
                <CalendarClock className="w-3.5 h-3.5" />
                {formatDateLabel(item.dueDate)}
                {item.dueTime ? `, ${item.dueTime}` : ""}
              </span>
              <span
                className={`text-[11px] px-2 py-1 rounded-lg ${priorityMeta.bg}`}
                style={{ color: priorityMeta.color, fontWeight: 500 }}
              >
                {priorityMeta.label}
              </span>
              {item.isOverdue && (
                <span className="text-[11px] px-2 py-1 rounded-lg bg-[#ef4444]/10 text-[#ef4444]" style={{ fontWeight: 500 }}>
                  Просрочено
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleDelete(item.id)}
            className="text-muted-foreground hover:text-[#ef4444] transition-colors"
            aria-label="delete reminder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderAssignedItem = (task: AssignedTask) => {
    const priorityMeta = getPriorityMeta(task.priority);
    const statusMeta = workflowStatusMeta[task.status];
    const byMeta = roleMeta[task.assignedByRole];

    return (
      <motion.div
        key={task.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card px-3 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
              {task.title}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{task.note}</p>
          </div>
          <span className={`text-[11px] px-2 py-1 rounded-lg ${statusMeta.bg}`} style={{ color: statusMeta.color, fontWeight: 500 }}>
            {statusMeta.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-muted/60 text-muted-foreground">
            <CalendarClock className="w-3.5 h-3.5" />
            {formatDateLabel(task.dueDate)}
          </span>
          <span
            className={`text-[11px] px-2 py-1 rounded-lg ${priorityMeta.bg}`}
            style={{ color: priorityMeta.color, fontWeight: 500 }}
          >
            {priorityMeta.label}
          </span>
          <span className={`text-[11px] px-2 py-1 rounded-lg ${byMeta.bg}`} style={{ color: byMeta.color, fontWeight: 500 }}>
            Назначил: {task.assignedBy}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-foreground tracking-[-0.02em]"
            style={{ fontSize: "24px", fontWeight: 600 }}
          >
            Напоминания
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="text-muted-foreground mt-1 text-[14px]"
          >
            Личный чек-лист и назначенные задачи от руководителя
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card border border-border p-5 space-y-4"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <h3 className="text-[16px] text-foreground" style={{ fontWeight: 600 }}>
            Новое напоминание
          </h3>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
              Шаблон
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              {templates.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
              <option value="custom">Свой текст</option>
            </select>
          </div>

          {template === "custom" ? (
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                Текст напоминания
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Например: сверить план с отделом закупок"
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          ) : (
            <div className="rounded-xl bg-muted/40 border border-border px-3 py-2">
              <p className="text-[12px] text-muted-foreground">Текст</p>
              <p className="text-[13px] text-foreground mt-0.5" style={{ fontWeight: 500 }}>
                {activeTemplate.value}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                Дата
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                Время (опционально)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
              Приоритет
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "low", label: "Низкий", color: "#10b981" },
                { key: "medium", label: "Средний", color: "#f59e0b" },
                { key: "high", label: "Высокий", color: "#ef4444" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPriority(item.key as ReminderPriority)}
                  className={`px-3 py-2 rounded-xl border text-[12px] transition-colors ${
                    priority === item.key ? "border-transparent" : "border-border hover:border-primary/30"
                  }`}
                  style={{
                    fontWeight: 500,
                    backgroundColor: priority === item.key ? `${item.color}14` : undefined,
                    color: priority === item.key ? item.color : undefined,
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
              Комментарий
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Необязательно"
              className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleAddReminder}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[13px] hover:shadow-lg hover:shadow-[#6366f1]/20 transition-all"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Добавить напоминание
          </button>
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="rounded-2xl bg-card border border-border p-4"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
          >
            <div className="flex items-center justify-between mb-3 gap-3">
              <div>
                <h3 className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
                  Назначено мне
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Эти задачи назначены руководителем/контролёром. Статус меняет только назначивший.
                </p>
              </div>
              <span className="text-[11px] px-2 py-1 rounded-lg bg-[#6366f1]/10 text-[#6366f1]" style={{ fontWeight: 500 }}>
                Только чтение
              </span>
            </div>

            {assignedTasks.length > 0 ? (
              <div className="space-y-2">
                {assignedTasks.map((task) => renderAssignedItem(task))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-3 py-4 text-[12px] text-muted-foreground text-center">
                Назначенных задач пока нет
              </div>
            )}
          </motion.div>

          {[
            { title: "Просрочено", items: overdueItems, empty: "Просроченных задач нет", tone: "danger" },
            { title: "Сегодня", items: todayItems, empty: "На сегодня задач нет", tone: "default" },
            { title: "Дальше по плану", items: upcomingItems, empty: "Будущих задач пока нет", tone: "default" },
            { title: "Выполнено", items: doneItems, empty: "Завершённых задач пока нет", tone: "success" },
          ].map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.04 }}
              className="rounded-2xl bg-card border border-border p-4"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
                  {section.title}
                </h3>
                <span
                  className={`text-[11px] px-2 py-1 rounded-lg ${
                    section.tone === "danger"
                      ? "bg-[#ef4444]/10 text-[#ef4444]"
                      : section.tone === "success"
                        ? "bg-[#10b981]/10 text-[#10b981]"
                        : "bg-muted/60 text-muted-foreground"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {section.items.length}
                </span>
              </div>

              {section.items.length > 0 ? (
                <div className="space-y-2">
                  {section.items.map((item) => renderPersonalItem(item))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-3 py-4 text-[12px] text-muted-foreground text-center">
                  {section.empty}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
