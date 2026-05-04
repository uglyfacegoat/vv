import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  FileText,
  Info,
  Database,
  Users,
  ShieldCheck,
  ListChecks,
  ArrowRight,
  ChevronRight,
  Zap,
  Shield,
} from "lucide-react";
import { checkCompleteness as checkCompletenessApi, uploadCsvWithOptions } from "../api";

// ── Types matching spec: 4 CSV types ──
type CsvKind = "cost_centers" | "items" | "plan" | "fact";

interface ImportError {
  row: number;
  message: string;
}

interface FileUpload {
  id: string;
  name: string;
  size: string;
  kind: CsvKind;
  status: "uploading" | "processing" | "validating" | "success" | "error";
  progress: number;
  inserted?: number;
  updated?: number;
  autoCreated?: number;
  errors?: ImportError[];
}

const csvKindConfig: Record<CsvKind, { label: string; description: string; columns: string; icon: typeof Database; color: string; gradient: string }> = {
  cost_centers: {
    label: "Справочник ЦФО",
    description: "cost_centers.csv",
    columns: "cc_id, name",
    icon: Users,
    color: "#6366f1",
    gradient: "from-[#6366f1]/10 to-[#8b5cf6]/10",
  },
  items: {
    label: "Статьи затрат",
    description: "items.csv",
    columns: "item_id, name, type (OPEX|CAPEX)",
    icon: ListChecks,
    color: "#8b5cf6",
    gradient: "from-[#8b5cf6]/10 to-[#a78bfa]/10",
  },
  plan: {
    label: "Плановые данные",
    description: "plan.csv",
    columns: "period, cc_id, item_id, amount_plan",
    icon: FileSpreadsheet,
    color: "#06b6d4",
    gradient: "from-[#06b6d4]/10 to-[#22d3ee]/10",
  },
  fact: {
    label: "Фактические данные",
    description: "fact.csv",
    columns: "period, cc_id, item_id, amount_fact",
    icon: FileText,
    color: "#10b981",
    gradient: "from-[#10b981]/10 to-[#34d399]/10",
  },
};

const uploadOrder: CsvKind[] = ["cost_centers", "items", "plan", "fact"];

export function Import() {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [dragOverKind, setDragOverKind] = useState<CsvKind | null>(null);
  const [autoCreateRefs, setAutoCreateRefs] = useState(false);
  const [completenessCheck, setCompletenessCheck] = useState<{
    checked: boolean;
    missingInFact: number;
    missingInPlan: number;
    periodMismatch: string[];
  } | null>(null);

  const handleUpload = useCallback(async (file: File, kind: CsvKind) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const newFile: FileUpload = {
      id,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      kind,
      status: "uploading",
      progress: 0,
    };
    setFiles((prev) => [newFile, ...prev]);
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "validating", progress: 100 } : f)));
    try {
      const result = await uploadCsvWithOptions(kind, file, { autoCreateRefs });
      const hasErrors = result.errors.length > 0;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: hasErrors ? "error" : "success",
                errors: hasErrors ? result.errors : undefined,
                inserted: result.inserted,
                updated: result.updated,
                autoCreated: result.auto_created,
              }
            : f
        )
      );
      if (hasErrors) {
        toast.warning(`${csvKindConfig[kind].label}: загружено с ошибками`, {
          description: `inserted: ${result.inserted}, errors: ${result.errors.length}`,
        });
      } else {
        toast.success(`${csvKindConfig[kind].label}: успешно загружено`, {
          description: `inserted: ${result.inserted}, updated: ${result.updated}, auto: ${result.auto_created}`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка загрузки";
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, status: "error", errors: [{ row: 0, message }] } : f
        )
      );
      toast.error(`${csvKindConfig[kind].label}: ошибка загрузки`, { description: message });
    }
  }, [autoCreateRefs]);

  const handleDrop = useCallback(
    (e: React.DragEvent, kind: CsvKind) => {
      e.preventDefault();
      setDragOverKind(null);
      const droppedFiles = Array.from(e.dataTransfer.files);
      droppedFiles.forEach((file) => handleUpload(file, kind));
    },
    [handleUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, kind: CsvKind) => {
      if (e.target.files) {
        Array.from(e.target.files).forEach((file) => handleUpload(file, kind));
      }
      e.target.value = "";
    },
    [handleUpload]
  );

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const checkCompleteness = async () => {
    try {
      const result = await checkCompletenessApi();
      setCompletenessCheck({
        checked: true,
        missingInFact: result.missing_in_fact,
        missingInPlan: result.missing_in_plan,
        periodMismatch: result.period_mismatch,
      });
      if (result.missing_in_fact === 0 && result.missing_in_plan === 0 && result.period_mismatch.length === 0) {
        toast.success("Проверка полноты: OK");
      } else {
        toast.warning("Проверка полноты: обнаружены пропуски", {
          description: `${result.missing_in_fact} отсутствуют в fact, ${result.missing_in_plan} в plan`,
        });
      }
    } catch (error) {
      toast.error("Не удалось проверить полноту", {
        description: error instanceof Error ? error.message : "Ошибка API",
      });
    }
  };

  const hasPlanAndFact = files.some((f) => f.kind === "plan" && (f.status === "success" || f.status === "error")) &&
    files.some((f) => f.kind === "fact" && (f.status === "success" || f.status === "error"));

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
          Импорт данных
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mt-1 text-[14px]"
        >
          Загрузите 4 CSV-файла из 1С: справочники и данные plan/fact
        </motion.p>
      </div>

      {/* ── Visual Pipeline: порядок загрузки ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl bg-card border border-border p-6 overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1]/10 to-[#06b6d4]/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#6366f1]" />
          </div>
          <div>
            <p className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
              Порядок загрузки
            </p>
            <p className="text-[11px] text-muted-foreground">
              CSV ; UTF-8 ; макс. 10 МБ · 8 автоматических проверок
            </p>
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="flex items-stretch gap-0">
          {uploadOrder.map((kind, idx) => {
            const config = csvKindConfig[kind];
            const Icon = config.icon;
            const isLast = idx === uploadOrder.length - 1;
            const hasUploaded = files.some((f) => f.kind === kind && (f.status === "success" || f.status === "error"));

            return (
              <motion.div
                key={kind}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.1, ease: [0.4, 0, 0.2, 1] }}
                className="flex items-stretch flex-1 min-w-0"
              >
                {/* Step card */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`relative rounded-xl border p-3.5 transition-all duration-300 h-full ${
                      hasUploaded
                        ? "border-[#10b981]/30 bg-[#10b981]/5"
                        : "border-border bg-gradient-to-b from-muted/30 to-transparent hover:border-primary/20"
                    }`}
                  >
                    {/* Step number badge */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: hasUploaded
                            ? "linear-gradient(135deg, #10b981, #34d399)"
                            : `linear-gradient(135deg, ${config.color}, ${config.color}cc)`,
                        }}
                      >
                        {hasUploaded ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <span className="text-[10px] text-white" style={{ fontWeight: 700 }}>
                            {idx + 1}
                          </span>
                        )}
                      </div>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}12` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                      </div>
                    </div>

                    {/* Label */}
                    <p className="text-[12px] text-foreground truncate" style={{ fontWeight: 600 }}>
                      {config.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate" style={{ fontFamily: "monospace" }}>
                      {config.description}
                    </p>

                    {/* Columns preview */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {config.columns.split(", ").map((col) => (
                        <span
                          key={col}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground"
                          style={{ fontFamily: "monospace", fontWeight: 500 }}
                        >
                          {col}
                        </span>
                      ))}
                    </div>

                    {/* Dependency hint */}
                    {idx >= 2 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Shield className="w-2.5 h-2.5 text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground/50">
                          ссылается на {idx === 2 || idx === 3 ? "①②" : "①"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector arrow */}
                {!isLast && (
                  <div className="flex items-center px-1.5 shrink-0">
                    <div className="flex flex-col items-center gap-0.5">
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Bottom hint bar */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4]" />
            Ожидает загрузки
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            Загружено
          </div>
          <div className="flex-1" />
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoCreateRefs}
              onChange={(e) => setAutoCreateRefs(e.target.checked)}
              className="accent-[#6366f1]"
            />
            Автосоздавать отсутствующие ЦФО/статьи
          </label>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
            <Info className="w-3 h-3" />
            Справочники ① ② загружаются первыми — plan и fact ссылаются на них
          </div>
        </div>
      </motion.div>

      {/* 4 Upload cards — matching spec */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {uploadOrder.map((kind, idx) => {
          const config = csvKindConfig[kind];
          const Icon = config.icon;
          const isOver = dragOverKind === kind;
          const inputId = `input-${kind}`;
          const uploadedCount = files.filter((f) => f.kind === kind).length;

          return (
            <motion.div
              key={kind}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.08 }}
              onDragOver={(e) => { e.preventDefault(); setDragOverKind(kind); }}
              onDragLeave={() => setDragOverKind(null)}
              onDrop={(e) => handleDrop(e, kind)}
              onClick={() => document.getElementById(inputId)?.click()}
              className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 cursor-pointer group ${
                isOver
                  ? `border-[${config.color}] bg-[${config.color}]/5 scale-[1.01]`
                  : "border-border hover:border-primary/30 bg-card"
              }`}
              style={{
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
                borderColor: isOver ? config.color : undefined,
                backgroundColor: isOver ? `${config.color}08` : undefined,
              }}
            >
              <input
                id={inputId}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileInput(e, kind)}
              />
              <div className="flex flex-col items-center">
                {/* Step number */}
                <div className="absolute top-3 left-3 w-6 h-6 rounded-lg bg-muted/80 flex items-center justify-center">
                  <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 600 }}>
                    {idx + 1}
                  </span>
                </div>

                {/* Uploaded badge */}
                {uploadedCount > 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#10b981]/10 text-[#10b981]" style={{ fontWeight: 500 }}>
                      {uploadedCount} загр.
                    </span>
                  </div>
                )}

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br ${config.gradient} transition-all`}
                >
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <p className="text-[14px] text-foreground mb-0.5" style={{ fontWeight: 500 }}>
                  {config.label}
                </p>
                <p className="text-[12px] text-muted-foreground mb-1">
                  {config.description}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mb-3">
                  Колонки: {config.columns}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); document.getElementById(inputId)?.click(); }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-white text-[12px] hover:shadow-lg transition-all"
                  style={{ fontWeight: 500, background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)` }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Загрузить CSV
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Completeness check button (spec: validation #7, #8) */}
      {hasPlanAndFact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button
            onClick={checkCompleteness}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] text-white text-[13px] hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-500/20 transition-all"
            style={{ fontWeight: 500 }}
          >
            <ShieldCheck className="w-4 h-4" />
            Проверить полноту plan ↔ fact
          </button>

          {completenessCheck && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {completenessCheck.missingInFact === 0 && completenessCheck.missingInPlan === 0 ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10b981]/10 text-[#10b981] text-[12px]" style={{ fontWeight: 500 }}>
                  <CheckCircle2 className="w-4 h-4" />
                  Полнота OK — все ключи совпадают
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] text-[12px]" style={{ fontWeight: 500 }}>
                  <AlertTriangle className="w-4 h-4" />
                  Пропуски: {completenessCheck.missingInFact} в fact, {completenessCheck.missingInPlan} в plan
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Completeness details */}
      {completenessCheck && completenessCheck.periodMismatch.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {completenessCheck.periodMismatch.map((msg, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-xl bg-[#f59e0b]/5 border border-[#f59e0b]/10 px-3 py-2.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] mt-0.5 shrink-0" />
              <span className="text-[12px] text-muted-foreground">{msg}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Upload history */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h3 className="text-foreground text-[15px]" style={{ fontWeight: 500 }}>
              История загрузок
            </h3>

            {files.map((file) => {
              const kindCfg = csvKindConfig[file.kind];
              const KindIcon = kindCfg.icon;

              return (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl bg-card border border-border p-4 overflow-hidden"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${kindCfg.color}15` }}
                    >
                      <KindIcon className="w-5 h-5" style={{ color: kindCfg.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] text-foreground truncate" style={{ fontWeight: 500 }}>
                          {file.name}
                        </p>
                        <span
                          className="shrink-0 text-[10px] px-2 py-0.5 rounded-md"
                          style={{ fontWeight: 600, backgroundColor: `${kindCfg.color}15`, color: kindCfg.color }}
                        >
                          {file.kind.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {file.size}
                        {file.inserted !== undefined && ` · inserted: ${file.inserted}`}
                        {file.updated !== undefined && ` · updated: ${file.updated}`}
                        {file.autoCreated !== undefined && file.autoCreated > 0 && ` · auto-created: ${file.autoCreated}`}
                        {file.errors && ` · errors: ${file.errors.length}`}
                      </p>

                      {/* Progress bar */}
                      {(file.status === "uploading" || file.status === "processing" || file.status === "validating") && (
                        <div className="mt-2">
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                background:
                                  file.status === "validating"
                                    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                                    : `linear-gradient(90deg, ${kindCfg.color}, ${kindCfg.color}cc)`,
                              }}
                              initial={{ width: 0 }}
                              animate={{
                                width: file.status === "validating" ? ["90%", "95%", "90%"] : `${file.progress}%`,
                              }}
                              transition={
                                file.status === "validating"
                                  ? { repeat: Infinity, duration: 1.5 }
                                  : { duration: 0.3 }
                              }
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {file.status === "validating"
                              ? "Валидация данных (8 проверок)..."
                              : `Загрузка ${Math.round(file.progress)}%`}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      {file.status === "success" && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10b981]/10">
                          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                          <span className="text-[12px] text-[#10b981]" style={{ fontWeight: 500 }}>
                            Успешно
                          </span>
                        </div>
                      )}
                      {file.status === "error" && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f59e0b]/10">
                          <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
                          <span className="text-[12px] text-[#f59e0b]" style={{ fontWeight: 500 }}>
                            С ошибками
                          </span>
                        </div>
                      )}
                      {(file.status === "uploading" || file.status === "processing") && (
                        <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                      {file.status === "validating" && (
                        <RefreshCw className="w-4 h-4 text-[#f59e0b] animate-spin" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Validation errors (spec: row + message) */}
                  <AnimatePresence>
                    {file.errors && file.errors.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3 pt-3 border-t border-border space-y-2"
                      >
                        {file.errors.map((err, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2 rounded-xl bg-[#f59e0b]/5 border border-[#f59e0b]/10 px-3 py-2.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b] mt-0.5 shrink-0" />
                            <span className="text-[12px] text-muted-foreground">
                              <span style={{ fontWeight: 500 }}>Строка {err.row}:</span> {err.message}
                            </span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {files.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Database className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-[14px] text-muted-foreground" style={{ fontWeight: 500 }}>
            Файлы ещё не загружены
          </p>
          <p className="text-[13px] text-muted-foreground/60 mt-1">
            Загрузите CSV-выгрузки из 1С для начала анализа
          </p>
        </motion.div>
      )}
    </div>
  );
}
