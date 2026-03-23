import { motion } from "motion/react";
import { BookOpen, Database, Sigma, ShieldCheck } from "lucide-react";

const formulaRows = [
  {
    name: "delta",
    formula: "fact - plan",
    description: "Абсолютное отклонение факта от плана.",
  },
  {
    name: "delta_%",
    formula: "(fact - plan) / plan * 100%",
    description: "Процентное отклонение при наличии плана.",
  },
  {
    name: "share_in_norm",
    formula: "IN_NORM / все строки c plan > 0",
    description: "Доля строк, попадающих в рабочий порог.",
  },
  {
    name: "mean_abs_delta_%",
    formula: "среднее(|delta_%|)",
    description: "Среднее абсолютное отклонение по выборке.",
  },
];

const statusRows = [
  { label: "IN_NORM", ru: "В норме", rule: "|delta_%| <= threshold", color: "#10b981" },
  { label: "OVERSPEND", ru: "Перерасход", rule: "delta_% > threshold", color: "#ef4444" },
  { label: "SAVING", ru: "Экономия", rule: "delta_% < -threshold", color: "#6366f1" },
  { label: "NO_PLAN", ru: "Нет плана", rule: "plan = 0 и fact > 0", color: "#94a3b8" },
];

export function DocsPage() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-foreground tracking-[-0.02em]"
          style={{ fontSize: "24px", fontWeight: 600 }}
        >
          Документация
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className="text-muted-foreground mt-1 text-[14px]"
        >
          Формулы, статусы, структура данных и логика демо-процесса
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Sigma className="w-4 h-4 text-primary" />
            <h3 className="text-[15px] text-foreground" style={{ fontWeight: 600 }}>
              Формулы расчёта
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {formulaRows.map((row) => (
              <div key={row.name} className="rounded-xl bg-muted/30 border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] text-foreground" style={{ fontWeight: 600 }}>
                    {row.name}
                  </p>
                  <code className="text-[12px] text-primary bg-primary/10 px-2 py-1 rounded-lg">
                    {row.formula}
                  </code>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1">{row.description}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <h3 className="text-[15px] text-foreground" style={{ fontWeight: 600 }}>
              Классификация статусов
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {statusRows.map((row) => (
              <div key={row.label} className="rounded-xl bg-muted/30 border border-border p-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px]" style={{ color: row.color, fontWeight: 600 }}>
                    {row.ru}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{row.label}</p>
                </div>
                <code className="text-[11px] text-muted-foreground bg-muted/70 px-2 py-1 rounded-lg">
                  {row.rule}
                </code>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Database className="w-4 h-4 text-[#06b6d4]" />
            <h3 className="text-[15px] text-foreground" style={{ fontWeight: 600 }}>
              Структура данных
            </h3>
          </div>
          <div className="p-4 text-[12px] text-muted-foreground space-y-2">
            <p><span className="text-foreground" style={{ fontWeight: 600 }}>cost_centers:</span> `cc_id`, `cc_name`</p>
            <p><span className="text-foreground" style={{ fontWeight: 600 }}>items:</span> `item_id`, `item_name`, `type`</p>
            <p><span className="text-foreground" style={{ fontWeight: 600 }}>plan:</span> `period`, `cc_id`, `item_id`, `amount_plan`</p>
            <p><span className="text-foreground" style={{ fontWeight: 600 }}>fact:</span> `period`, `cc_id`, `item_id`, `amount_fact`</p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-card border border-border overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
        >
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8b5cf6]" />
            <h3 className="text-[15px] text-foreground" style={{ fontWeight: 600 }}>
              Процесс использования
            </h3>
          </div>
          <div className="p-4 text-[12px] text-muted-foreground space-y-3">
            <p><span className="text-foreground" style={{ fontWeight: 600 }}>1.</span> Загрузить CSV в разделе импорта.</p>
            <p><span className="text-foreground" style={{ fontWeight: 600 }}>2.</span> Проверить отчёт План–Факт и KPI.</p>
            <p><span className="text-foreground" style={{ fontWeight: 600 }}>3.</span> Зафиксировать отклонения и напоминания.</p>
            <p><span className="text-foreground" style={{ fontWeight: 600 }}>4.</span> Выгрузить финальный CSV для руководства.</p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

