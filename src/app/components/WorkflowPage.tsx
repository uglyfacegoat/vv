import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CalendarClock,
  Filter,
  RefreshCcw,
  User,
} from "lucide-react";
import type { UserRole } from "../auth";

type WorkflowRole = "controller" | "analyst" | "manager";
type WorkflowStatus = "planned" | "in_progress" | "published" | "done";
type WorkflowCadence = "weekly" | "monthly" | "quarterly";

interface WorkflowTask {
  id: string;
  role: WorkflowRole;
  assignee: string;
  title: string;
  cadence: WorkflowCadence;
  deadline: string;
  status: WorkflowStatus;
  note: string;
  updatedAt: number;
}

interface WorkflowEvent {
  id: string;
  at: number;
  title: string;
  details: string;
}

const TASKS_STORAGE_KEY = "budgetiq.workflow.tasks.v1";
const EVENTS_STORAGE_KEY = "budgetiq.workflow.events.v1";

const roleMeta: Record<WorkflowRole, { label: string; color: string; bg: string }> = {
  controller: { label: "Контролёр", color: "#ef4444", bg: "bg-[#ef4444]/10" },
  analyst: { label: "Аналитик", color: "#06b6d4", bg: "bg-[#06b6d4]/10" },
  manager: { label: "Руководитель", color: "#6366f1", bg: "bg-[#6366f1]/10" },
};

const statusMeta: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  planned: { label: "Запланировано", color: "#64748b", bg: "bg-[#64748b]/10" },
  in_progress: { label: "В работе", color: "#f59e0b", bg: "bg-[#f59e0b]/10" },
  published: { label: "Опубликовано", color: "#8b5cf6", bg: "bg-[#8b5cf6]/10" },
  done: { label: "Подтверждено", color: "#10b981", bg: "bg-[#10b981]/10" },
};

const cadenceMeta: Record<WorkflowCadence, string> = {
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  quarterly: "Ежеквартально",
};

const statusFlow: Record<WorkflowStatus, WorkflowStatus> = {
  planned: "in_progress",
  in_progress: "published",
  published: "done",
  done: "in_progress",
};

function toDateInput(now: Date) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateStr: string, days: number) {
  const base = new Date(`${dateStr}T00:00:00`);
  base.setDate(base.getDate() + days);
  return toDateInput(base);
}

function formatDateLabel(dateStr: string) {
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildInitialTasks(today: string): WorkflowTask[] {
  return [
    {
      id: "wf-1",
      role: "controller",
      assignee: "Алексей Котов",
      title: "Обновить пороги отклонений на квартал",
      cadence: "quarterly",
      deadline: addDays(today, 10),
      status: "planned",
      note: "Проверить соответствие KPI и лимитов по ЦФО",
      updatedAt: Date.now() - 1000 * 60 * 60 * 8,
    },
    {
      id: "wf-2",
      role: "analyst",
      assignee: "Мария Жданова",
      title: "Загрузить plan/fact CSV за текущий месяц",
      cadence: "monthly",
      deadline: addDays(today, 2),
      status: "in_progress",
      note: "После загрузки зафиксировать предупреждения валидации",
      updatedAt: Date.now() - 1000 * 60 * 60 * 4,
    },
    {
      id: "wf-3",
      role: "analyst",
      assignee: "Мария Жданова",
      title: "Опубликовать отчёт План–Факт руководителям",
      cadence: "weekly",
      deadline: addDays(today, 1),
      status: "published",
      note: "Разослать ссылку и приложить CSV-выгрузку",
      updatedAt: Date.now() - 1000 * 60 * 60 * 2,
    },
    {
      id: "wf-4",
      role: "manager",
      assignee: "Иван Петров",
      title: "Подтвердить комментарии по отклонениям своего ЦФО",
      cadence: "weekly",
      deadline: addDays(today, 3),
      status: "planned",
      note: "Добавить причины отклонений выше порога",
      updatedAt: Date.now() - 1000 * 60 * 60,
    },
    {
      id: "wf-5",
      role: "manager",
      assignee: "Анна Смирнова",
      title: "Согласовать корректировку планов на следующий период",
      cadence: "monthly",
      deadline: addDays(today, -1),
      status: "in_progress",
      note: "Требуется подтверждение изменений CAPEX",
      updatedAt: Date.now() - 1000 * 60 * 30,
    },
  ];
}

interface WorkflowPageProps {
  userRole: UserRole;
}

export function WorkflowPage({ userRole }: WorkflowPageProps) {
  const today = toDateInput(new Date());
  const [tasks, setTasks] = useState<WorkflowTask[]>(() => buildInitialTasks(today));
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | WorkflowRole>(
    userRole === "manager" ? "manager" : "all",
  );
  const [statusFilter, setStatusFilter] = useState<"all" | WorkflowStatus>("all");
  const [cadenceFilter, setCadenceFilter] = useState<"all" | WorkflowCadence>("all");

  useEffect(() => {
    if (userRole === "manager" && roleFilter !== "manager") {
      setRoleFilter("manager");
    }
  }, [roleFilter, userRole]);

  useEffect(() => {
    try {
      const rawTasks = localStorage.getItem(TASKS_STORAGE_KEY);
      if (rawTasks) {
        const parsed = JSON.parse(rawTasks) as WorkflowTask[];
        if (Array.isArray(parsed)) setTasks(parsed);
      }
      const rawEvents = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (rawEvents) {
        const parsed = JSON.parse(rawEvents) as WorkflowEvent[];
        if (Array.isArray(parsed)) setEvents(parsed);
      } else {
        setEvents([
          {
            id: "wf-event-init",
            at: Date.now(),
            title: "Процессный контур активирован",
            details: "Шаблоны задач ролей загружены для текущего периода",
          },
        ]);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore storage errors
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch {
      // ignore storage errors
    }
  }, [events]);

  const effectiveRoleFilter = userRole === "manager" ? "manager" : roleFilter;

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const byRole = effectiveRoleFilter === "all" || task.role === effectiveRoleFilter;
        const byStatus = statusFilter === "all" || task.status === statusFilter;
        const byCadence = cadenceFilter === "all" || task.cadence === cadenceFilter;
        return byRole && byStatus && byCadence;
      }),
    [tasks, effectiveRoleFilter, statusFilter, cadenceFilter],
  );


  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => b.at - a.at).slice(0, 10),
    [events],
  );

  const handleMoveStatus = (task: WorkflowTask) => {
    const nextStatus = statusFlow[task.status];
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? { ...item, status: nextStatus, updatedAt: Date.now() }
          : item,
      ),
    );
    setEvents((prev) => [
      {
        id: `wf-event-${Date.now()}`,
        at: Date.now(),
        title: `${task.assignee}: ${statusMeta[task.status].label} -> ${statusMeta[nextStatus].label}`,
        details: task.title,
      },
      ...prev,
    ]);
    toast.success("Статус обновлён", {
      description: `${task.assignee} -> ${statusMeta[nextStatus].label}`,
    });
  };

  const handleResetFilters = () => {
    setRoleFilter(userRole === "manager" ? "manager" : "all");
    setStatusFilter("all");
    setCadenceFilter("all");
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
            Регламент работ
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="text-muted-foreground mt-1 text-[14px]"
          >
            Кто, что и когда должен сделать в процессе публикации План–Факт отчётов
          </motion.p>
        </div>
      </div>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border p-5 space-y-4"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-[16px] text-foreground" style={{ fontWeight: 600 }}>
                Процессные задачи
              </h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                Фронтовый workflow-контур: роли, дедлайны, статусы и публикация отчётов
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontWeight: 500 }}
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Сбросить фильтры
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>
                Роль
              </span>
              <select
                value={effectiveRoleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | WorkflowRole)}
                disabled={userRole === "manager"}
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
              >
                {userRole !== "manager" && <option value="all">Все роли</option>}
                {userRole !== "manager" && <option value="controller">Контролёр</option>}
                {userRole !== "manager" && <option value="analyst">Аналитик</option>}
                <option value="manager">Руководитель</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>
                Статус
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | WorkflowStatus)}
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Все статусы</option>
                <option value="planned">Запланировано</option>
                <option value="in_progress">В работе</option>
                <option value="published">Опубликовано</option>
                <option value="done">Подтверждено</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>
                Периодичность
              </span>
              <select
                value={cadenceFilter}
                onChange={(e) => setCadenceFilter(e.target.value as "all" | WorkflowCadence)}
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Любая</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Ежеквартально</option>
              </select>
            </label>
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {["Роль", "Исполнитель", "Что сделать", "Срок", "Периодичность", "Статус", "Действие"].map((col) => (
                      <th key={col} className="px-3 py-2.5 text-left text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const role = roleMeta[task.role];
                    const status = statusMeta[task.status];
                    const isOverdue = task.status !== "done" && task.deadline < today;
                    return (
                      <tr key={task.id} className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg ${role.bg}`} style={{ color: role.color, fontWeight: 500 }}>
                            <Filter className="w-3 h-3" />
                            {role.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[12px] text-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {task.assignee}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>{task.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{task.note}</p>
                        </td>
                        <td className="px-3 py-3 text-[12px]">
                          <span className={`inline-flex items-center gap-1.5 ${isOverdue ? "text-[#ef4444]" : "text-muted-foreground"}`}>
                            <CalendarClock className="w-3.5 h-3.5" />
                            {formatDateLabel(task.deadline)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[12px] text-muted-foreground">{cadenceMeta[task.cadence]}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[11px] px-2 py-1 rounded-lg ${status.bg}`} style={{ color: status.color, fontWeight: 500 }}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => handleMoveStatus(task)}
                            className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] hover:bg-primary/20 transition-colors"
                            style={{ fontWeight: 500 }}
                          >
                            Следующий статус
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredTasks.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
                По выбранным фильтрам задач нет
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card border border-border p-5 space-y-4"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div>
            <h3 className="text-[16px] text-foreground" style={{ fontWeight: 600 }}>
              Лента операций
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1">
              Последние изменения в регламентных шагах
            </p>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-3 min-w-max">
              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className="w-[280px] rounded-xl border border-border bg-muted/20 px-3 py-2.5 shrink-0"
                >
                  <p className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>{event.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{event.details}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-1">{formatDateTime(event.at)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#6366f1]/5 border border-[#6366f1]/10 px-3 py-3">
            <p className="text-[12px] text-muted-foreground">
              Этот экран закрывает frontend-часть процессного контура: фиксирует роли, дедлайны, статус публикации
              и подтверждение выполнения.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
