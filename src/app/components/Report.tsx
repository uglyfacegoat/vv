import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  TrendingDown,
} from "lucide-react";
import type { UserRole } from "../auth";
import { exportReportCsv, getReport } from "../api";

// ── Types matching spec exactly ──
type Status = "IN_NORM" | "OVERSPEND" | "SAVING" | "NO_PLAN";
type ItemType = "OPEX" | "CAPEX";

interface ReportRow {
  id: number;
  period: string;       // YYYY-MM
  cc_id: number;
  cc_name: string;      // ЦФО
  item_id: number;
  item_name: string;    // Статья затрат
  type: ItemType;
  amount_plan: number;
  amount_fact: number;
  delta: number;        // fact - plan
  delta_pct: number | null;  // null when NO_PLAN
  status: Status;
}

// ── Status config matching spec ──
const statusConfig: Record<Status, { label: string; labelRu: string; color: string; bg: string; textColor: string; icon: typeof CheckCircle2 }> = {
  IN_NORM: {
    label: "IN_NORM",
    labelRu: "В норме",
    color: "#10b981",
    bg: "bg-[#10b981]/10",
    textColor: "text-[#10b981]",
    icon: CheckCircle2,
  },
  OVERSPEND: {
    label: "OVERSPEND",
    labelRu: "Перерасход",
    color: "#ef4444",
    bg: "bg-[#ef4444]/10",
    textColor: "text-[#ef4444]",
    icon: AlertCircle,
  },
  SAVING: {
    label: "SAVING",
    labelRu: "Экономия",
    color: "#6366f1",
    bg: "bg-[#6366f1]/10",
    textColor: "text-[#6366f1]",
    icon: TrendingDown,
  },
  NO_PLAN: {
    label: "NO_PLAN",
    labelRu: "Нет плана",
    color: "#94a3b8",
    bg: "bg-[#94a3b8]/10",
    textColor: "text-[#94a3b8]",
    icon: MinusCircle,
  },
};

function calcStatus(plan: number, fact: number, threshold: number): { delta: number; delta_pct: number | null; status: Status } {
  const delta = fact - plan;
  if (plan === 0) {
    return { delta, delta_pct: null, status: fact === 0 ? "IN_NORM" : "NO_PLAN" };
  }
  const delta_pct = delta / plan;
  let status: Status = "IN_NORM";
  if (Math.abs(delta_pct) <= threshold) status = "IN_NORM";
  else if (delta_pct > threshold) status = "OVERSPEND";
  else status = "SAVING";
  return { delta, delta_pct, status };
}

const syntheticCostCenters = [
  { cc_id: 1, cc_name: "Производство" },
  { cc_id: 2, cc_name: "Коммерция" },
  { cc_id: 3, cc_name: "ИТ" },
  { cc_id: 4, cc_name: "HR" },
  { cc_id: 5, cc_name: "Финансы" },
  { cc_id: 6, cc_name: "Логистика" },
] as const;

const syntheticItems: ReadonlyArray<{ item_id: number; item_name: string; type: ItemType }> = [
  { item_id: 1, item_name: "ФОТ", type: "OPEX" },
  { item_id: 2, item_name: "Аренда", type: "OPEX" },
  { item_id: 3, item_name: "ПО и лицензии", type: "OPEX" },
  { item_id: 4, item_name: "Командировки", type: "OPEX" },
  { item_id: 5, item_name: "Маркетинг", type: "OPEX" },
  { item_id: 6, item_name: "Оборудование", type: "CAPEX" },
  { item_id: 7, item_name: "Коммунальные услуги", type: "OPEX" },
  { item_id: 8, item_name: "Подрядчики", type: "OPEX" },
  { item_id: 9, item_name: "Капремонт", type: "CAPEX" },
  { item_id: 10, item_name: "Транспорт и парк", type: "CAPEX" },
];

const syntheticPeriods = Array.from({ length: 24 }, (_, idx) => {
  const year = 2025 + Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
});

function generateRawRows(): Omit<ReportRow, "delta" | "delta_pct" | "status">[] {
  const rows: Omit<ReportRow, "delta" | "delta_pct" | "status">[] = [];
  let id = 1;

  syntheticPeriods.forEach((period, periodIdx) => {
    syntheticCostCenters.forEach((cc, ccIdx) => {
      syntheticItems.forEach((item, itemIdx) => {
        const base = item.type === "CAPEX" ? 900000 : 520000;
        const seasonal = 0.9 + (periodIdx % 6) * 0.04;
        const centerWeight = 0.8 + (ccIdx % 5) * 0.09;
        const itemWeight = 0.95 + itemIdx * 0.06;

        const amount_plan = Math.round(base * seasonal * centerWeight * itemWeight);
        const fluctuation = 0.86 + ((periodIdx * 13 + ccIdx * 7 + itemIdx * 5) % 33) / 100;
        const amount_fact = Math.round(amount_plan * fluctuation);

        // Rare NO_PLAN rows to preserve the "нет плана" case in reporting.
        const noPlanCase = (periodIdx + ccIdx + itemIdx) % 41 === 0;

        rows.push({
          id,
          period,
          cc_id: cc.cc_id,
          cc_name: cc.cc_name,
          item_id: item.item_id,
          item_name: item.item_name,
          type: item.type,
          amount_plan: noPlanCase ? 0 : amount_plan,
          amount_fact: noPlanCase ? Math.round(amount_plan * 0.12) : amount_fact,
        });
        id += 1;
      });
    });
  });

  return rows;
}

// 12 periods × 6 cost centers × 10 items = 720 rows.
const rawRows = generateRawRows();

function buildData(threshold: number): ReportRow[] {
  return rawRows.map((r) => {
    const calc = calcStatus(r.amount_plan, r.amount_fact, threshold);
    return { ...r, ...calc };
  });
}

const allCostCenters = [...new Set(rawRows.map((r) => r.cc_name))].sort();
const allPeriods = [...new Set(rawRows.map((r) => r.period))].sort();

function formatCurrency(val: number) {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(0)}K`;
  return val.toLocaleString("ru-RU");
}

interface ReportProps {
  threshold: number;
  onThresholdChange: (value: number) => void;
  userRole: UserRole;
  allowedCostCenters: string[];
  externalSearchQuery?: string;
}

export function Report({ threshold, onThresholdChange, userRole, allowedCostCenters, externalSearchQuery = "" }: ReportProps) {
  type AggregateView = "items" | "cc" | "type" | "period";

  const [periodFrom, setPeriodFrom] = useState(allPeriods[0]);
  const [periodTo, setPeriodTo] = useState(allPeriods[allPeriods.length - 1]);
  const [selectedCC, setSelectedCC] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<"ALL" | "OPEX" | "CAPEX">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | Status>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("period");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(true);
  const [aggregateView, setAggregateView] = useState<AggregateView>("items");
  const [periodAggregationMode, setPeriodAggregationMode] = useState<"month" | "quarter">("month");
  const [fullData, setFullData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const managerScoped = userRole === "manager";
  const allowedCostCenterSet = useMemo(() => new Set(allowedCostCenters), [allowedCostCenters]);
  const allCostCentersFromData = useMemo(
    () => [...new Set(fullData.map((r) => r.cc_name))].sort(),
    [fullData],
  );
  const availableCostCenters = useMemo(
    () => {
      if (!managerScoped) return allCostCentersFromData;
      const scoped = allCostCentersFromData.filter((cc) => allowedCostCenterSet.has(cc));
      return scoped.length > 0 ? scoped : allCostCentersFromData.slice(0, 1);
    },
    [allCostCentersFromData, allowedCostCenterSet, managerScoped],
  );

  useEffect(() => {
    if (!managerScoped) return;
    const fallback = availableCostCenters[0] ?? "ALL";
    if (selectedCC === "ALL" || !availableCostCenters.includes(selectedCC)) {
      setSelectedCC(fallback);
    }
  }, [availableCostCenters, managerScoped, selectedCC]);

  const thresholdDecimal = threshold / 100;

  useEffect(() => {
    if (externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
      setShowFilters(true);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setLoadError(null);
    getReport({ from: periodFrom, to: periodTo, threshold: thresholdDecimal })
      .then((response) => {
        if (ignore) return;
        setFullData(response.rows.map((row, index) => ({ ...row, id: index + 1 })));
      })
      .catch((error) => {
        if (ignore) return;
        setLoadError(error instanceof Error ? error.message : "Не удалось загрузить отчёт");
        setFullData([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [periodFrom, periodTo, thresholdDecimal]);

  const filteredData = useMemo(() => {
    let data = [...fullData];

    if (managerScoped) {
      data = data.filter((r) => allowedCostCenterSet.has(r.cc_name));
    }

    // Period filter
    data = data.filter((r) => r.period >= periodFrom && r.period <= periodTo);

    // ЦФО
    if (selectedCC !== "ALL") data = data.filter((r) => r.cc_name === selectedCC);

    // Type
    if (selectedType !== "ALL") data = data.filter((r) => r.type === selectedType);

    // Status
    if (selectedStatus !== "ALL") data = data.filter((r) => r.status === selectedStatus);

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (r) =>
          r.cc_name.toLowerCase().includes(q) ||
          r.item_name.toLowerCase().includes(q) ||
          r.period.includes(q)
      );
    }

    // Sort
    data.sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return data;
  }, [
    allowedCostCenterSet,
    fullData,
    managerScoped,
    periodFrom,
    periodTo,
    searchQuery,
    selectedCC,
    selectedStatus,
    selectedType,
    sortDir,
    sortField,
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // KPI summary from filtered data (spec: share_in_norm, mean_abs_delta_pct)
  const kpi = useMemo(() => {
    const withPlan = filteredData.filter((r) => r.status !== "NO_PLAN");
    const inNorm = withPlan.filter((r) => r.status === "IN_NORM").length;
    const shareInNorm = withPlan.length > 0 ? (inNorm / withPlan.length) * 100 : 0;
    const absDeltaPcts = withPlan.filter((r) => r.delta_pct !== null).map((r) => Math.abs(r.delta_pct!));
    const meanAbs = absDeltaPcts.length > 0 ? absDeltaPcts.reduce((a, b) => a + b, 0) / absDeltaPcts.length * 100 : 0;
    const totalPlan = filteredData.reduce((s, r) => s + r.amount_plan, 0);
    const totalFact = filteredData.reduce((s, r) => s + r.amount_fact, 0);
    const totalDelta = filteredData.reduce((s, r) => s + r.delta, 0);
    return { shareInNorm, meanAbs, totalPlan, totalFact, totalDelta };
  }, [filteredData]);

  const summarizeRows = (rows: ReportRow[]) => {
    const withPlan = rows.filter((r) => r.delta_pct !== null);
    const absDelta = withPlan.map((r) => Math.abs((r.delta_pct ?? 0) * 100));
    const meanAbsDeltaPct = absDelta.length > 0 ? absDelta.reduce((a, b) => a + b, 0) / absDelta.length : 0;
    const inNormCount = withPlan.filter((r) => r.status === "IN_NORM").length;
    return {
      rows: rows.length,
      totalPlan: rows.reduce((sum, r) => sum + r.amount_plan, 0),
      totalFact: rows.reduce((sum, r) => sum + r.amount_fact, 0),
      totalDelta: rows.reduce((sum, r) => sum + r.delta, 0),
      meanAbsDeltaPct,
      inNormPct: withPlan.length > 0 ? (inNormCount / withPlan.length) * 100 : 0,
    };
  };

  const toQuarter = (period: string) => {
    const [year, monthRaw] = period.split("-");
    const month = Number(monthRaw);
    if (!year || Number.isNaN(month) || month < 1 || month > 12) return period;
    const quarter = Math.floor((month - 1) / 3) + 1;
    return `${year}-Q${quarter}`;
  };

  const itemAggregates = useMemo(() => {
    const grouped = new Map<string, { itemName: string; type: ItemType; rows: ReportRow[] }>();
    filteredData.forEach((row) => {
      const key = `${row.item_id}`;
      const prev = grouped.get(key);
      if (prev) {
        prev.rows.push(row);
      } else {
        grouped.set(key, { itemName: row.item_name, type: row.type, rows: [row] });
      }
    });

    return Array.from(grouped.values())
      .map((entry) => ({
        ...entry,
        metrics: summarizeRows(entry.rows),
      }))
      .sort((a, b) => Math.abs(b.metrics.totalDelta) - Math.abs(a.metrics.totalDelta));
  }, [filteredData]);

  const ccAggregates = useMemo(() => {
    const grouped = new Map<string, { ccName: string; rows: ReportRow[]; opexFact: number; capexFact: number }>();
    filteredData.forEach((row) => {
      const key = `${row.cc_id}`;
      const prev = grouped.get(key);
      if (prev) {
        prev.rows.push(row);
        if (row.type === "OPEX") prev.opexFact += row.amount_fact;
        else prev.capexFact += row.amount_fact;
      } else {
        grouped.set(key, {
          ccName: row.cc_name,
          rows: [row],
          opexFact: row.type === "OPEX" ? row.amount_fact : 0,
          capexFact: row.type === "CAPEX" ? row.amount_fact : 0,
        });
      }
    });

    return Array.from(grouped.values())
      .map((entry) => {
        const totalTypeFact = entry.opexFact + entry.capexFact;
        return {
          ...entry,
          metrics: summarizeRows(entry.rows),
          opexShareFact: totalTypeFact > 0 ? (entry.opexFact / totalTypeFact) * 100 : 0,
          capexShareFact: totalTypeFact > 0 ? (entry.capexFact / totalTypeFact) * 100 : 0,
        };
      })
      .sort((a, b) => Math.abs(b.metrics.totalDelta) - Math.abs(a.metrics.totalDelta));
  }, [filteredData]);

  const typeAggregates = useMemo(() => {
    const grouped = new Map<ItemType, ReportRow[]>();
    filteredData.forEach((row) => {
      const prev = grouped.get(row.type);
      if (prev) prev.push(row);
      else grouped.set(row.type, [row]);
    });

    return Array.from(grouped.entries()).map(([type, rows]) => ({
      type,
      metrics: summarizeRows(rows),
    }));
  }, [filteredData]);

  const periodAggregates = useMemo(() => {
    const grouped = new Map<string, ReportRow[]>();
    filteredData.forEach((row) => {
      const key = periodAggregationMode === "month" ? row.period : toQuarter(row.period);
      const prev = grouped.get(key);
      if (prev) prev.push(row);
      else grouped.set(key, [row]);
    });

    return Array.from(grouped.entries())
      .map(([period, rows]) => ({
        period,
        metrics: summarizeRows(rows),
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredData, periodAggregationMode]);

  const handleExport = useCallback(() => {
    const selectedCCRow = fullData.find((row) => row.cc_name === selectedCC);
    exportReportCsv({
      from: periodFrom,
      to: periodTo,
      cc_id: selectedCC !== "ALL" ? selectedCCRow?.cc_id : null,
      type: selectedType,
      status: selectedStatus,
      threshold: thresholdDecimal,
    })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `plan_fact_report_${periodFrom}_${periodTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Отчёт успешно экспортирован!");
      })
      .catch((error) => {
        toast.error("Не удалось экспортировать отчёт", {
          description: error instanceof Error ? error.message : "Ошибка API",
        });
      });
  }, [fullData, periodFrom, periodTo, selectedCC, selectedStatus, selectedType, thresholdDecimal]);

  const defaultCCFilter = managerScoped ? (availableCostCenters[0] ?? "ALL") : "ALL";
  const isFiltered = selectedCC !== defaultCCFilter || selectedType !== "ALL" || selectedStatus !== "ALL" || searchQuery || threshold !== 10;

  const columns = [
    { key: "period", label: "Период" },
    { key: "cc_name", label: "ЦФО" },
    { key: "item_name", label: "Статья" },
    { key: "type", label: "Тип" },
    { key: "amount_plan", label: "План" },
    { key: "amount_fact", label: "Факт" },
    { key: "delta", label: "Δ" },
    { key: "delta_pct", label: "Δ%" },
    { key: "status", label: "Статус" },
  ];

  const aggregateTabs: { id: AggregateView; label: string }[] = [
    { id: "items", label: "Статьи" },
    { id: "cc", label: "ЦФО" },
    { id: "type", label: "Тип" },
    { id: "period", label: "Период" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-foreground tracking-[-0.02em]"
            style={{ fontSize: "24px", fontWeight: 600 }}
          >
            Отчёт План–Факт
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1 text-[14px]"
          >
            {loading
              ? "Загружаем данные из backend..."
              : managerScoped
                ? "Детализация по вашим ЦФО, статьям затрат и периодам"
                : "Детализация по ЦФО, статьям затрат, периодам"}
          </motion.p>
          {loadError && (
            <p className="mt-2 inline-flex rounded-lg border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-3 py-1.5 text-[12px] text-[#f59e0b]">
              {loadError}
            </p>
          )}
        </div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] text-white text-[13px] hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-500/20 transition-all"
          style={{ fontWeight: 500 }}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </motion.button>
      </div>

      {/* Filter Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-[14px] text-foreground" style={{ fontWeight: 500 }}>
              Фильтры
            </span>
            {isFiltered && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px]" style={{ fontWeight: 500 }}>
                Активны
              </span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {/* Period From */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                    Период с
                  </label>
                  <select
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    {allPeriods.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Period To */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                    Период по
                  </label>
                  <select
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    {allPeriods.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* ЦФО */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                    ЦФО
                  </label>
                  <select
                    value={selectedCC}
                    onChange={(e) => setSelectedCC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    {!managerScoped && <option value="ALL">Все ЦФО</option>}
                    {availableCostCenters.map((cc) => (
                      <option key={cc} value={cc}>{cc}</option>
                    ))}
                  </select>
                </div>

                {/* Type OPEX/CAPEX */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                    Тип статьи
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="ALL">OPEX + CAPEX</option>
                    <option value="OPEX">OPEX</option>
                    <option value="CAPEX">CAPEX</option>
                  </select>
                </div>

                {/* Threshold */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                    Порог (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    step={1}
                    value={threshold}
                    onChange={(e) => onThresholdChange(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="10"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                    Отклонение
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as "ALL" | Status)}
                    className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="ALL">Все</option>
                    <option value="OVERSPEND">Перерасход</option>
                    <option value="SAVING">Экономия</option>
                    <option value="IN_NORM">В норме</option>
                    <option value="NO_PLAN">Нет плана</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1.5 block" style={{ fontWeight: 500 }}>
                    Поиск
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ЦФО, статья..."
                      className="pl-9 pr-8 py-2 rounded-xl bg-muted/50 border border-border text-[13px] w-full focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* KPI Summary (from spec: share_in_norm + mean_abs_delta_pct on current filter) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-3"
      >
        {[
          { label: "Итого План", value: formatCurrency(kpi.totalPlan), color: "#6366f1" },
          { label: "Итого Факт", value: formatCurrency(kpi.totalFact), color: "#06b6d4" },
          { label: "Итого Отклонение", value: `${kpi.totalDelta > 0 ? "+" : ""}${formatCurrency(kpi.totalDelta)}`, color: kpi.totalDelta > 0 ? "#ef4444" : "#10b981" },
          { label: "В норме", value: `${kpi.shareInNorm.toFixed(1)}%`, color: "#10b981" },
          { label: "Среднее откл.", value: `${kpi.meanAbs.toFixed(1)}%`, color: "#8b5cf6" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-card border border-border px-4 py-3 flex items-center justify-between"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}
          >
            <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>
              {item.label}
            </span>
            <span className="text-[15px] tabular-nums" style={{ fontWeight: 600, color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Aggregates: items / cost centers / type / period (month|quarter) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
      >
        <div className="px-5 py-4 border-b border-border flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h3 className="text-[15px] text-foreground" style={{ fontWeight: 600 }}>
              Сводные агрегаты
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Разрезы по статьям, ЦФО, типам затрат и периодам
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border">
            {aggregateTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAggregateView(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${
                  aggregateView === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                style={{ fontWeight: 500 }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {aggregateView === "period" && (
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Гранулярность периода</span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/40 border border-border">
              <button
                onClick={() => setPeriodAggregationMode("month")}
                className={`px-3 py-1 rounded-md text-[11px] transition-colors ${
                  periodAggregationMode === "month"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                style={{ fontWeight: 500 }}
              >
                Месяц
              </button>
              <button
                onClick={() => setPeriodAggregationMode("quarter")}
                className={`px-3 py-1 rounded-md text-[11px] transition-colors ${
                  periodAggregationMode === "quarter"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                style={{ fontWeight: 500 }}
              >
                Квартал
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {aggregateView === "items" && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Статья", "Тип", "Строк", "План", "Факт", "Δ", "Ср. |Δ%|", "В норме"].map((head) => (
                    <th
                      key={head}
                      className="text-left px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap"
                      style={{ fontWeight: 500 }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itemAggregates.map((row) => (
                  <tr key={row.itemName} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-foreground">{row.itemName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md ${
                          row.type === "CAPEX"
                            ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                            : "bg-[#64748b]/10 text-[#64748b]"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.rows}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{formatCurrency(row.metrics.totalPlan)}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{formatCurrency(row.metrics.totalFact)}</td>
                    <td
                      className="px-4 py-3 text-[13px] tabular-nums"
                      style={{ fontWeight: 500, color: row.metrics.totalDelta >= 0 ? "#ef4444" : "#10b981" }}
                    >
                      {row.metrics.totalDelta > 0 ? "+" : ""}
                      {formatCurrency(row.metrics.totalDelta)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.meanAbsDeltaPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.inNormPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aggregateView === "cc" && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["ЦФО", "Строк", "План", "Факт", "Δ", "Ср. |Δ%|", "В норме", "Доля OPEX", "Доля CAPEX"].map((head) => (
                    <th
                      key={head}
                      className="text-left px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap"
                      style={{ fontWeight: 500 }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ccAggregates.map((row) => (
                  <tr key={row.ccName} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-foreground" style={{ fontWeight: 500 }}>{row.ccName}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.rows}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{formatCurrency(row.metrics.totalPlan)}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{formatCurrency(row.metrics.totalFact)}</td>
                    <td
                      className="px-4 py-3 text-[13px] tabular-nums"
                      style={{ fontWeight: 500, color: row.metrics.totalDelta >= 0 ? "#ef4444" : "#10b981" }}
                    >
                      {row.metrics.totalDelta > 0 ? "+" : ""}
                      {formatCurrency(row.metrics.totalDelta)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.meanAbsDeltaPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.inNormPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.opexShareFact.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.capexShareFact.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aggregateView === "type" && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Тип", "Строк", "План", "Факт", "Δ", "Ср. |Δ%|", "В норме"].map((head) => (
                    <th
                      key={head}
                      className="text-left px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap"
                      style={{ fontWeight: 500 }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {typeAggregates.map((row) => (
                  <tr key={row.type} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md ${
                          row.type === "CAPEX"
                            ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                            : "bg-[#64748b]/10 text-[#64748b]"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.rows}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{formatCurrency(row.metrics.totalPlan)}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{formatCurrency(row.metrics.totalFact)}</td>
                    <td
                      className="px-4 py-3 text-[13px] tabular-nums"
                      style={{ fontWeight: 500, color: row.metrics.totalDelta >= 0 ? "#ef4444" : "#10b981" }}
                    >
                      {row.metrics.totalDelta > 0 ? "+" : ""}
                      {formatCurrency(row.metrics.totalDelta)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.meanAbsDeltaPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.inNormPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aggregateView === "period" && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Период", "Строк", "План", "Факт", "Δ", "Ср. |Δ%|", "В норме"].map((head) => (
                    <th
                      key={head}
                      className="text-left px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap"
                      style={{ fontWeight: 500 }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periodAggregates.map((row) => (
                  <tr key={row.period} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-foreground" style={{ fontWeight: 500 }}>{row.period}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.rows}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{formatCurrency(row.metrics.totalPlan)}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{formatCurrency(row.metrics.totalFact)}</td>
                    <td
                      className="px-4 py-3 text-[13px] tabular-nums"
                      style={{ fontWeight: 500, color: row.metrics.totalDelta >= 0 ? "#ef4444" : "#10b981" }}
                    >
                      {row.metrics.totalDelta > 0 ? "+" : ""}
                      {formatCurrency(row.metrics.totalDelta)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.meanAbsDeltaPct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">{row.metrics.inNormPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredData.length === 0 && (
          <div className="px-5 py-8 text-center text-[13px] text-muted-foreground border-t border-border">
            Нет данных по текущим фильтрам
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-4 py-3.5 text-[12px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap"
                    style={{ fontWeight: 500 }}
                  >
                    <div className="flex items-center gap-1.5">
                      {col.label}
                      {sortField === col.key ? (
                        sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredData.map((row, idx) => {
                  const sc = statusConfig[row.status];
                  return (
                    <motion.tr
                      key={row.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.4) }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-default"
                    >
                      <td className="px-4 py-3 text-[13px] text-muted-foreground tabular-nums">
                        {row.period}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                        {row.cc_name}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground">
                        {row.item_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md ${
                            row.type === "CAPEX"
                              ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                              : "bg-[#64748b]/10 text-[#64748b]"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                        {formatCurrency(row.amount_plan)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                        {formatCurrency(row.amount_fact)}
                      </td>
                      <td className="px-4 py-3 text-[13px] tabular-nums" style={{ fontWeight: 500, color: sc.color }}>
                        {row.delta > 0 ? "+" : ""}
                        {formatCurrency(row.delta)}
                      </td>
                      <td className="px-4 py-3 text-[13px] tabular-nums" style={{ fontWeight: 500, color: sc.color }}>
                        {row.delta_pct === null
                          ? "—"
                          : `${(row.delta_pct * 100) > 0 ? "+" : ""}${(row.delta_pct * 100).toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] ${sc.bg} ${sc.textColor}`}
                          style={{ fontWeight: 500 }}
                        >
                          <sc.icon className="w-3 h-3" />
                          {sc.labelRu}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground">
            Показано {filteredData.length} из {fullData.length} строк
          </span>
        </div>
      </motion.div>
    </div>
  );
}
