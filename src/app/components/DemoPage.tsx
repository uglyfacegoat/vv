import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FileBarChart2,
  ListChecks,
  RotateCcw,
  Upload,
} from "lucide-react";
import { getAccountState, saveAccountState } from "../api";

interface DemoStep {
  id: string;
  title: string;
  description: string;
  targetPath: string;
  targetLabel: string;
}

const demoSteps: DemoStep[] = [
  {
    id: "import",
    title: "Импортировать исходные данные",
    description: "Загрузите `plan` и `fact` (или demo-набор), проверьте результаты валидации.",
    targetPath: "/import",
    targetLabel: "Открыть импорт",
  },
  {
    id: "report",
    title: "Проверить отчёт План–Факт",
    description: "Откройте отчёт, проверьте KPI, фильтры и ключевые отклонения.",
    targetPath: "/reports",
    targetLabel: "Открыть отчёт",
  },
  {
    id: "reminders",
    title: "Зафиксировать задачи и дедлайны",
    description: "Добавьте follow-up действия в `Напоминания` для ответственных.",
    targetPath: "/reminders",
    targetLabel: "Открыть напоминания",
  },
  {
    id: "export",
    title: "Сформировать выгрузку",
    description: "Сделайте финальный экспорт CSV с выбранными фильтрами.",
    targetPath: "/reports",
    targetLabel: "Перейти к экспорту",
  },
];

const STORAGE_KEY = "demo.progress.v1";

export function DemoPage() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAccountState<Record<string, boolean>>(STORAGE_KEY)
      .then((saved) => setCompleted(saved ?? {}))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveAccountState(STORAGE_KEY, completed).catch(() => undefined);
  }, [completed, loaded]);

  const doneCount = useMemo(
    () => demoSteps.filter((step) => completed[step.id]).length,
    [completed],
  );

  const progress = Math.round((doneCount / demoSteps.length) * 100);

  const toggleStep = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetChecklist = () => {
    setCompleted({});
    toast("Чек-лист сброшен");
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-foreground tracking-[-0.02em]"
            style={{ fontSize: "24px", fontWeight: 600 }}
          >
            Демо-сценарий
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="text-muted-foreground mt-1 text-[14px]"
          >
            Пошаговый рабочий путь: импорт данных → анализ отчёта → фиксация действий → выгрузка
          </motion.p>
        </div>
        <button
          onClick={resetChecklist}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          style={{ fontWeight: 500 }}
        >
          <RotateCcw className="w-4 h-4" />
          Сбросить чек-лист
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card border border-border p-5"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
              Прогресс сценария
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Выполнено шагов: {doneCount} из {demoSteps.length}
            </p>
          </div>
          <span className="text-[24px] text-primary tabular-nums" style={{ fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div className="mt-4 h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-3"
      >
        {demoSteps.map((step, idx) => {
          const isDone = Boolean(completed[step.id]);
          const Icon = step.id === "import" ? Upload : step.id === "report" || step.id === "export" ? FileBarChart2 : ListChecks;
          return (
            <div
              key={step.id}
              className={`rounded-2xl border p-4 bg-card transition-colors ${
                isDone ? "border-[#10b981]/25" : "border-border"
              }`}
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.03)" }}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleStep(step.id)}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                  aria-label="toggle demo step"
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-[#10b981]" /> : <Circle className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className={`text-[13px] ${isDone ? "text-[#10b981]" : "text-foreground"}`} style={{ fontWeight: 600 }}>
                        Шаг {idx + 1}. {step.title}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{step.description}</p>
                    </div>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDone ? "bg-[#10b981]/15" : "bg-primary/10"}`}>
                      <Icon className={`w-4 h-4 ${isDone ? "text-[#10b981]" : "text-primary"}`} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(step.targetPath)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] hover:bg-primary/15 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      {step.targetLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {isDone && (
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-[#10b981]/10 text-[#10b981]" style={{ fontWeight: 500 }}>
                        Шаг отмечен как выполненный
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
