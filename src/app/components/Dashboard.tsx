import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Activity,
  AlertTriangle,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronDown,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { UserRole } from "../auth";

// ── Mock data matching spec: periods YYYY-MM, real ЦФО names, OPEX/CAPEX items ──

const costCenters = [
  { cc_id: 1, name: "Производство" },
  { cc_id: 2, name: "Коммерция" },
  { cc_id: 3, name: "ИТ" },
  { cc_id: 4, name: "HR" },
  { cc_id: 5, name: "Финансы" },
  { cc_id: 6, name: "Логистика" },
  { cc_id: 7, name: "Маркетинг" },
  { cc_id: 8, name: "АХО" },
];

const items = [
  { item_id: 1, name: "ФОТ", type: "OPEX" },
  { item_id: 2, name: "Аренда", type: "OPEX" },
  { item_id: 3, name: "ПО и лицензии", type: "OPEX" },
  { item_id: 4, name: "Командировки", type: "OPEX" },
  { item_id: 5, name: "Маркетинг", type: "OPEX" },
  { item_id: 6, name: "Оборудование", type: "CAPEX" },
  { item_id: 7, name: "Коммунальные услуги", type: "OPEX" },
  { item_id: 8, name: "Подрядчики", type: "OPEX" },
  { item_id: 9, name: "Капремонт", type: "CAPEX" },
  { item_id: 10, name: "Транспорт и парк", type: "CAPEX" },
];

// Chart data: plan vs fact by month (aggregated)
const chartData = [
  { period: "2025-07", plan: 12400, fact: 11800 },
  { period: "2025-08", plan: 13100, fact: 13650 },
  { period: "2025-09", plan: 14200, fact: 13900 },
  { period: "2025-10", plan: 13800, fact: 15100 },
  { period: "2025-11", plan: 14500, fact: 14200 },
  { period: "2025-12", plan: 15800, fact: 16400 },
  { period: "2026-01", plan: 14900, fact: 14100 },
  { period: "2026-02", plan: 15200, fact: 15600 },
];

// Mock per-ЦФО breakdown for pinned detail
const periodBreakdown: Record<string, { cc: string; plan: number; fact: number }[]> = {};
chartData.forEach((d) => {
  periodBreakdown[d.period] = costCenters.map((cc, i) => {
    const base = d.plan / costCenters.length;
    const jitter = ((i * 7 + d.plan) % 13) / 13;
    const planCC = Math.round(base * (0.7 + jitter * 0.6));
    const factCC = Math.round(planCC * (0.85 + ((i * 3 + d.fact) % 17) / 17 * 0.3));
    return { cc: cc.name, plan: planCC, fact: factCC };
  });
});

// ── KPI calculations (spec: share_in_norm, mean_abs_delta_pct) ──
// Simulated from the full dataset
const totalRows = costCenters.length * items.length;
const noplanRows = 3;
const relevantRows = totalRows - noplanRows;
const inNormCount = 32;
const shareInNorm = inNormCount / relevantRows;
const meanAbsDeltaPct = 9.7; // avg |delta_pct| across non-NO_PLAN rows
const overspendCount = 8;
const savingTotal = 3420; // тыс. руб

const THRESHOLD = 0.1; // ±10%

// Heatmap raw data: rows = costCenters, cols = items, values = delta_pct
const heatmapRaw = costCenters.map((_, ccIdx) =>
  items.map((_, itemIdx) => {
    const base = ((ccIdx * 13 + itemIdx * 7 + 19) % 28) - 14; // -14..13
    const fine = (((ccIdx + 1) * (itemIdx + 3)) % 10) / 10; // 0.0..0.9
    const value = base >= 0 ? base + fine : base - fine;
    return Number(value.toFixed(1));
  })
);

const kpis = [
  {
    title: "Доля строк «В норме»",
    subtitle: "",
    value: `${(shareInNorm * 100).toFixed(1)}%`,
    detail: `${inNormCount} из ${relevantRows} строк`,
    change: "+4.2% к пред. периоду",
    positive: true,
    icon: CheckCircle2,
    gradient: "from-[#10b981]/10 to-[#06b6d4]/10",
    iconColor: "#10b981",
    border: "border-[#10b981]/20",
  },
  {
    title: "Среднее отклонение",
    subtitle: "",
    value: `${meanAbsDeltaPct.toFixed(1)}%`,
    detail: "Среднее абсолютное отклонение",
    change: "-1.3% к пред. периоду",
    positive: true,
    icon: Activity,
    gradient: "from-[#6366f1]/10 to-[#8b5cf6]/10",
    iconColor: "#6366f1",
    border: "border-[#6366f1]/20",
  },
  {
    title: "Превышения бюджета",
    subtitle: "",
    value: String(overspendCount),
    detail: `Отклонение свыше ${(THRESHOLD * 100).toFixed(0)}%`,
    change: "+2 к пред. периоду",
    positive: false,
    icon: AlertTriangle,
    gradient: "from-[#f59e0b]/10 to-[#ef4444]/10",
    iconColor: "#f59e0b",
    border: "border-[#f59e0b]/20",
  },
  {
    title: "Общая экономия",
    subtitle: "",
    value: `${(savingTotal / 1000).toFixed(1)}M`,
    detail: "Сумма экономии по всем ЦФО",
    change: "+540K к пред. периоду",
    positive: true,
    icon: TrendingDown,
    gradient: "from-[#06b6d4]/10 to-[#10b981]/10",
    iconColor: "#06b6d4",
    border: "border-[#06b6d4]/20",
  },
];

// ── Components ──

function KPICard({ kpi, index }: { kpi: (typeof kpis)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
      className={`relative overflow-hidden rounded-2xl bg-card border ${kpi.border} p-5 cursor-default transition-colors`}
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-50`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${kpi.iconColor}15` }}
          >
            <kpi.icon className="w-5 h-5" style={{ color: kpi.iconColor }} />
          </div>
          <div
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg ${
              kpi.positive
                ? "bg-[#10b981]/10 text-[#10b981]"
                : "bg-[#ef4444]/10 text-[#ef4444]"
            }`}
            style={{ fontWeight: 500 }}
          >
            {kpi.positive ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : (
              <ArrowUpRight className="w-3 h-3" />
            )}
            {kpi.change.split(" ")[0]}
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground mb-0.5" style={{ fontWeight: 400 }}>
          {kpi.title}
        </p>
        <p className="text-[28px] tracking-[-0.02em] text-foreground mb-1" style={{ fontWeight: 600 }}>
          {kpi.value}
        </p>
        <p className="text-[11px] text-muted-foreground/70" style={{ fontWeight: 400 }}>
          {kpi.detail}
        </p>
      </div>
    </motion.div>
  );
}

function getStatusFromDelta(deltaPct: number): { status: string; color: string } {
  const abs = Math.abs(deltaPct);
  if (abs <= THRESHOLD * 100) return { status: "IN_NORM", color: "" };
  if (deltaPct > 0) return { status: "OVERSPEND", color: "" };
  return { status: "SAVING", color: "" };
}

function getHeatmapColor(value: number, isDark: boolean) {
  const abs = Math.abs(value);
  // Colors match spec statuses
  if (abs <= 10) {
    // IN_NORM — green
    return isDark ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.15)";
  }
  if (value > 10) {
    // OVERSPEND — red
    return isDark ? "rgba(239,68,68,0.30)" : "rgba(239,68,68,0.18)";
  }
  // SAVING — blue
  return isDark ? "rgba(99,102,241,0.30)" : "rgba(99,102,241,0.15)";
}

function getHeatmapTextColor(value: number) {
  const abs = Math.abs(value);
  if (abs <= 10) return "#10b981";
  if (value > 10) return "#ef4444";
  return "#6366f1";
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-card/95 backdrop-blur-xl border border-border rounded-xl px-4 py-3"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
      >
        <p className="text-[13px] text-foreground mb-2" style={{ fontWeight: 500 }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-[12px]">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name === "plan" ? "План" : "Факт"}:</span>
            <span className="text-foreground" style={{ fontWeight: 500 }}>
              {(entry.value / 1000).toFixed(1)}M
            </span>
          </div>
        ))}
        {payload.length === 2 && (
          <div className="mt-1.5 pt-1.5 border-t border-border text-[11px]">
            <span className="text-muted-foreground">Отклонение: </span>
            <span
              style={{
                fontWeight: 500,
                color: payload[1].value - payload[0].value > 0 ? "#ef4444" : "#10b981",
              }}
            >
              {payload[1].value - payload[0].value > 0 ? "+" : ""}
              {((payload[1].value - payload[0].value) / 1000).toFixed(1)}M (
              {(((payload[1].value - payload[0].value) / payload[0].value) * 100).toFixed(1)}%)
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

interface DashboardProps {
  userRole: UserRole;
  allowedCostCenters: string[];
}

export function Dashboard({ userRole, allowedCostCenters }: DashboardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-100px" });
  const heatmapRef = useRef<HTMLDivElement>(null);
  const heatmapInView = useInView(heatmapRef, { once: true, margin: "-100px" });
  const [isDark, setIsDark] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("2025-07 — 2026-02");
  const [pinnedPeriod, setPinnedPeriod] = useState<string | null>(null);
  const [pinnedCoord, setPinnedCoord] = useState<{ x: number; y: number } | null>(null);
  const [pinnedPayload, setPinnedPayload] = useState<any[] | null>(null);
  const managerScoped = userRole === "manager";
  const allowedCostCenterSet = useMemo(() => new Set(allowedCostCenters), [allowedCostCenters]);
  const visibleHeatmapRows = useMemo(() => {
    const rows = costCenters.map((cc, ccIdx) => ({
      cc,
      values: heatmapRaw[ccIdx],
    }));
    if (!managerScoped) return rows;
    const scoped = rows.filter((row) => allowedCostCenterSet.has(row.cc.name));
    return scoped.length > 0 ? scoped : rows.slice(0, 1);
  }, [allowedCostCenterSet, managerScoped]);

  const pinnedData = pinnedPeriod ? chartData.find((d) => d.period === pinnedPeriod) : null;
  const pinnedBreakdown = useMemo(() => {
    if (!pinnedPeriod) return null;
    const rows = periodBreakdown[pinnedPeriod] ?? [];
    if (!managerScoped) return rows;
    const scoped = rows.filter((row) => allowedCostCenterSet.has(row.cc));
    return scoped.length > 0 ? scoped : rows.slice(0, 1);
  }, [allowedCostCenterSet, managerScoped, pinnedPeriod]);
  const pinnedSummary = useMemo(() => {
    if (!pinnedBreakdown || pinnedBreakdown.length === 0) {
      return pinnedData ? { plan: pinnedData.plan, fact: pinnedData.fact } : null;
    }
    return {
      plan: pinnedBreakdown.reduce((sum, row) => sum + row.plan, 0),
      fact: pinnedBreakdown.reduce((sum, row) => sum + row.fact, 0),
    };
  }, [pinnedBreakdown, pinnedData]);

  const handleChartClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const clickedPeriod = state.activePayload[0].payload.period;
      if (pinnedPeriod === clickedPeriod) {
        setPinnedPeriod(null);
        setPinnedCoord(null);
        setPinnedPayload(null);
      } else {
        setPinnedPeriod(clickedPeriod);
        setPinnedCoord(state.activeCoordinate ? { x: state.activeCoordinate.x, y: state.activeCoordinate.y } : null);
        setPinnedPayload(state.activePayload);
      }
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    setIsDark(document.documentElement.classList.contains("dark"));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-foreground tracking-[-0.02em]"
            style={{ fontSize: "24px", fontWeight: 600 }}
          >
            Аналитика бюджета
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1 text-[14px]"
          >
            {managerScoped ? "План–Факт анализ по вашим ЦФО" : "План–Факт анализ по всем подразделениям"}
          </motion.p>
        </div>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => toast.info("Выбор периода", { description: "Подключите бэкенд ля выбора произвольного периода" })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          style={{ fontWeight: 500, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <Calendar className="w-4 h-4" />
          {selectedPeriod}
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* KPI Cards — spec: share_in_norm + mean_abs_delta_pct + extras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={kpi.title} kpi={kpi} index={i} />
        ))}
      </div>

      {/* Chart: Plan vs Fact by period */}
      <motion.div
        ref={chartRef}
        initial={{ opacity: 0, y: 30 }}
        animate={chartInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="rounded-2xl bg-card border border-border p-6"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-foreground tracking-[-0.01em]" style={{ fontSize: "16px", fontWeight: 600 }}>
              План vs Факт по месяцам
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Исполнение бюджета, тыс. руб.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {pinnedPeriod && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setPinnedPeriod(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] hover:bg-primary/20 transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <span>{pinnedPeriod}</span>
                  <X className="w-3 h-3" />
                </motion.button>
              )}
            </AnimatePresence>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
              <span className="text-[12px] text-muted-foreground">План</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#06b6d4]" />
              <span className="text-[12px] text-muted-foreground">Факт</span>
            </div>
          </div>
        </div>
        <div className="h-[340px] min-h-[340px] cursor-pointer relative">
          <ResponsiveContainer width="100%" height={340} debounce={50}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} onClick={handleChartClick} style={{ cursor: "pointer" }}>
              <defs>
                <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="factGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: isDark ? "#94a3b8" : "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: isDark ? "#94a3b8" : "#64748b" }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", strokeWidth: 1 }} />
              {pinnedPeriod && (
                <ReferenceLine
                  x={pinnedPeriod}
                  stroke={isDark ? "rgba(99,102,241,0.6)" : "rgba(99,102,241,0.5)"}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              )}
              <Area
                type="monotone"
                dataKey="plan"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#planGrad)"
                name="plan"
                dot={(props: any) => {
                  if (pinnedPeriod && props.payload?.period === pinnedPeriod) {
                    return (
                      <circle
                        key={`plan-pin-${props.cx}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={7}
                        fill="#6366f1"
                        stroke="#fff"
                        strokeWidth={3}
                        style={{ filter: "drop-shadow(0 2px 6px rgba(99,102,241,0.4))" }}
                      />
                    );
                  }
                  return <circle key={`plan-${props.cx}`} cx={props.cx} cy={props.cy} r={0} fill="none" />;
                }}
                activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="fact"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fill="url(#factGrad)"
                name="fact"
                dot={(props: any) => {
                  if (pinnedPeriod && props.payload?.period === pinnedPeriod) {
                    return (
                      <circle
                        key={`fact-pin-${props.cx}`}
                        cx={props.cx}
                        cy={props.cy}
                        r={7}
                        fill="#06b6d4"
                        stroke="#fff"
                        strokeWidth={3}
                        style={{ filter: "drop-shadow(0 2px 6px rgba(6,182,212,0.4))" }}
                      />
                    );
                  }
                  return <circle key={`fact-${props.cx}`} cx={props.cx} cy={props.cy} r={0} fill="none" />;
                }}
                activeDot={{ r: 5, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Pinned tooltip overlay */}
          <AnimatePresence>
            {pinnedPeriod && pinnedCoord && pinnedPayload && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute z-20 pointer-events-auto"
                style={{
                  left: pinnedCoord.x,
                  top: Math.max(8, pinnedCoord.y - 80),
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl px-4 py-3 pointer-events-auto"
                  style={{ boxShadow: "0 8px 32px rgba(99,102,241,0.15)", minWidth: 160 }}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                      {pinnedPeriod}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPinnedPeriod(null); setPinnedCoord(null); setPinnedPayload(null); }}
                      className="w-4 h-4 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {pinnedPayload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-[12px]">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name === "plan" ? "План" : "Факт"}:</span>
                      <span className="text-foreground" style={{ fontWeight: 500 }}>
                        {(entry.value / 1000).toFixed(1)}M
                      </span>
                    </div>
                  ))}
                  {pinnedPayload.length === 2 && (
                    <div className="mt-1.5 pt-1.5 border-t border-border text-[11px]">
                      <span className="text-muted-foreground">Отклонение: </span>
                      <span
                        style={{
                          fontWeight: 500,
                          color: pinnedPayload[1].value - pinnedPayload[0].value > 0 ? "#ef4444" : "#10b981",
                        }}
                      >
                        {pinnedPayload[1].value - pinnedPayload[0].value > 0 ? "+" : ""}
                        {((pinnedPayload[1].value - pinnedPayload[0].value) / 1000).toFixed(1)}M (
                        {(((pinnedPayload[1].value - pinnedPayload[0].value) / pinnedPayload[0].value) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!pinnedPeriod && (
          <p className="text-[11px] text-muted-foreground/50 text-center mt-2">
            Нажмите на точку графика для детализации
          </p>
        )}
      </motion.div>

      {/* Pinned period detail panel */}
      <AnimatePresence>
        {pinnedData && pinnedBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl bg-card border border-primary/20 p-6"
              style={{ boxShadow: "0 4px 32px rgba(99,102,241,0.08)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-foreground text-[15px]" style={{ fontWeight: 600 }}>
                      Детализация за {pinnedPeriod}
                    </h3>
                    <p className="text-[12px] text-muted-foreground">
                      Разбивка по подразделениям
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Summary pills */}
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-[#6366f1]/10 text-[12px]" style={{ fontWeight: 500, color: "#6366f1" }}>
                      План: {((pinnedSummary?.plan ?? pinnedData.plan) / 1000).toFixed(1)}M
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-[#06b6d4]/10 text-[12px]" style={{ fontWeight: 500, color: "#06b6d4" }}>
                      Факт: {((pinnedSummary?.fact ?? pinnedData.fact) / 1000).toFixed(1)}M
                    </div>
                    {(() => {
                      const plan = pinnedSummary?.plan ?? pinnedData.plan;
                      const fact = pinnedSummary?.fact ?? pinnedData.fact;
                      const delta = fact - plan;
                      const deltaPct = plan > 0 ? (delta / plan) * 100 : 0;
                      const isOver = delta > 0;
                      return (
                        <div
                          className={`px-3 py-1.5 rounded-lg text-[12px] ${isOver ? "bg-[#ef4444]/10" : "bg-[#10b981]/10"}`}
                          style={{ fontWeight: 500, color: isOver ? "#ef4444" : "#10b981" }}
                        >
                          {isOver ? "+" : ""}{(delta / 1000).toFixed(1)}M ({isOver ? "+" : ""}{deltaPct.toFixed(1)}%)
                        </div>
                      );
                    })()}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPinnedPeriod(null)}
                    className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Breakdown table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left text-[12px] text-muted-foreground px-4 py-2.5" style={{ fontWeight: 500 }}>Подразделение</th>
                      <th className="text-right text-[12px] text-muted-foreground px-4 py-2.5" style={{ fontWeight: 500 }}>План</th>
                      <th className="text-right text-[12px] text-muted-foreground px-4 py-2.5" style={{ fontWeight: 500 }}>Факт</th>
                      <th className="text-right text-[12px] text-muted-foreground px-4 py-2.5" style={{ fontWeight: 500 }}>Отклонение</th>
                      <th className="text-right text-[12px] text-muted-foreground px-4 py-2.5" style={{ fontWeight: 500 }}>%</th>
                      <th className="text-center text-[12px] text-muted-foreground px-4 py-2.5" style={{ fontWeight: 500 }}>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pinnedBreakdown.map((row, i) => {
                      const delta = row.fact - row.plan;
                      const deltaPct = row.plan > 0 ? (delta / row.plan) * 100 : 0;
                      const absPct = Math.abs(deltaPct);
                      const isOver = delta > 0;
                      let statusLabel = "В норме";
                      let statusColor = "#10b981";
                      let statusBg = "bg-[#10b981]/10";
                      if (absPct > 10 && isOver) {
                        statusLabel = "Перерасход";
                        statusColor = "#ef4444";
                        statusBg = "bg-[#ef4444]/10";
                      } else if (absPct > 10 && !isOver) {
                        statusLabel = "Экономия";
                        statusColor = "#6366f1";
                        statusBg = "bg-[#6366f1]/10";
                      }
                      return (
                        <motion.tr
                          key={row.cc}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          className="border-t border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-[13px] text-foreground" style={{ fontWeight: 500 }}>{row.cc}</td>
                          <td className="px-4 py-2.5 text-[13px] text-foreground text-right tabular-nums">{row.plan.toLocaleString("ru-RU")}</td>
                          <td className="px-4 py-2.5 text-[13px] text-foreground text-right tabular-nums">{row.fact.toLocaleString("ru-RU")}</td>
                          <td className="px-4 py-2.5 text-[13px] text-right tabular-nums" style={{ fontWeight: 500, color: isOver ? "#ef4444" : "#10b981" }}>
                            {isOver ? "+" : ""}{delta.toLocaleString("ru-RU")}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-right tabular-nums" style={{ fontWeight: 500, color: isOver ? "#ef4444" : "#10b981" }}>
                            {isOver ? "+" : ""}{deltaPct.toFixed(1)}%
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] ${statusBg}`}
                              style={{ fontWeight: 500, color: statusColor }}
                            >
                              {statusLabel}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heatmap: Y=ЦФО, X=статьи затрат, value=delta_pct */}
      <motion.div
        ref={heatmapRef}
        initial={{ opacity: 0, y: 30 }}
        animate={heatmapInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="rounded-2xl bg-card border border-border p-6"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-foreground tracking-[-0.01em]" style={{ fontSize: "16px", fontWeight: 600 }}>
              Heatmap отклонений
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Отклонения по подразделениям и статьям затрат
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(99,102,241,0.25)" }} />
              Экономия
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(16,185,129,0.2)" }} />
              В норме
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.22)" }} />
              Перерасход
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th
                  className="text-left text-[12px] text-muted-foreground pb-3 pr-4 min-w-[120px]"
                  style={{ fontWeight: 500 }}
                >
                  ЦФО
                </th>
                {items.map((item) => (
                  <th
                    key={item.item_id}
                    className="text-center text-[12px] text-muted-foreground pb-3 px-1"
                    style={{ fontWeight: 500 }}
                  >
                    <div>{item.name}</div>
                    <div className="text-[10px] opacity-60">{item.type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleHeatmapRows.map((row, ccIdx) => (
                <motion.tr
                  key={row.cc.cc_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={heatmapInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: ccIdx * 0.05, duration: 0.4 }}
                >
                  <td className="text-[13px] text-foreground pr-4 py-1.5" style={{ fontWeight: 500 }}>
                    {row.cc.name}
                  </td>
                  {row.values.map((val, itemIdx) => (
                    <td key={itemIdx} className="px-1 py-1.5">
                      <motion.div
                        whileHover={{ scale: 1.08 }}
                        className="rounded-lg h-10 flex items-center justify-center text-[12px] cursor-default transition-all"
                        style={{
                          backgroundColor: getHeatmapColor(val, isDark),
                          color: getHeatmapTextColor(val),
                          fontWeight: 500,
                        }}
                      >
                        {val > 0 ? "+" : ""}
                        {val.toFixed(1)}%
                      </motion.div>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
