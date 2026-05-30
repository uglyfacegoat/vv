import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Activity,
  Building2,
  Database,
  FileClock,
  History,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { getAdminOverview, type AdminOverview } from "../api";

function formatDate(value?: string | null) {
  if (!value) return "нет данных";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMetadata(raw: string) {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(data)
      .slice(0, 4)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  } catch {
    return raw;
  }
}

export function AdminPanel() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const loadOverview = async () => {
    setLoading(true);
    try {
      setOverview(await getAdminOverview());
    } catch (error) {
      toast.error("Админ-панель недоступна", {
        description: error instanceof Error ? error.message : "Нужна роль controller",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const filteredUsers = useMemo(() => {
    const users = overview?.users ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      user.email.toLowerCase().includes(q)
      || user.role.toLowerCase().includes(q)
      || user.profile_name.toLowerCase().includes(q)
      || user.enterprise_key.toLowerCase().includes(q)
      || (user.cc_name ?? "").toLowerCase().includes(q)
      || user.id.toLowerCase().includes(q)
    );
  }, [overview, query]);

  const data = overview?.data;
  const cards = [
    { label: "Enterprise / users", value: `${data?.enterprises ?? 0} / ${overview?.users.length ?? 0}`, icon: Building2, color: "#6366f1" },
    { label: "Справочники", value: `${data?.cost_centers ?? 0} ЦФО / ${data?.items ?? 0} статей`, icon: Database, color: "#06b6d4" },
    { label: "Plan / Fact", value: `${data?.plan_rows ?? 0} / ${data?.fact_rows ?? 0}`, icon: Activity, color: "#10b981" },
    { label: "Audit / imports", value: `${data?.audit_events ?? 0} / ${data?.imports ?? 0}`, icon: History, color: "#f59e0b" },
  ];

  return (
    <div className="max-w-[1500px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-foreground tracking-[-0.02em]"
            style={{ fontSize: "24px", fontWeight: 600 }}
          >
            Enterprise console
          </motion.h1>
          <p className="text-muted-foreground mt-1 text-[14px]">
            Организации, привязки пользователей, импорты, состояния и журнал действий
          </p>
        </div>
        <button
          onClick={loadOverview}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-60"
          style={{ fontWeight: 500 }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-card border border-border p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="text-[11px] text-muted-foreground">live</span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-4">{card.label}</p>
            <p className="text-[24px] text-foreground tabular-nums" style={{ fontWeight: 600 }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <p className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>Enterprise контур</p>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                {["Enterprise", "Users", "ЦФО / статьи", "Plan / Fact", "Imports", "Audit", "State", "Активность"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left" style={{ fontWeight: 500 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(overview?.enterprises ?? []).map((enterprise) => (
                <tr key={enterprise.id} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="text-foreground" style={{ fontWeight: 600 }}>{enterprise.name}</p>
                    <p className="text-[10px] text-muted-foreground">{enterprise.key}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{enterprise.users}</td>
                  <td className="px-4 py-3 tabular-nums">{enterprise.cost_centers} / {enterprise.items}</td>
                  <td className="px-4 py-3 tabular-nums">{enterprise.plan_rows} / {enterprise.fact_rows}</td>
                  <td className="px-4 py-3 tabular-nums">{enterprise.imports}</td>
                  <td className="px-4 py-3 tabular-nums">{enterprise.audit_events}</td>
                  <td className="px-4 py-3 tabular-nums">{enterprise.enterprise_state_keys}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(enterprise.last_activity_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>Аккаунты и привязки</p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти пользователя..."
              className="pl-9 pr-3 py-2 rounded-xl bg-muted/50 border border-transparent text-[13px] w-72 outline-none focus:border-primary/30"
            />
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                {["Email", "Enterprise", "Роль", "ЦФО", "Профиль", "Plan / Fact", "Imports", "State", "Последний импорт"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left" style={{ fontWeight: 500 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="text-foreground" style={{ fontWeight: 500 }}>{user.email}</p>
                    <p className="text-[10px] text-muted-foreground">{user.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-foreground">{user.enterprise_name || user.enterprise_key}</p>
                    <p className="text-[10px] text-muted-foreground">{user.enterprise_key}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary" style={{ fontWeight: 500 }}>
                      {user.role_display_name || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user.cc_name ?? "Все ЦФО"} {user.cc_id ? <span className="text-muted-foreground">#{user.cc_id}</span> : null}</td>
                  <td className="px-4 py-3">
                    <p>{user.profile_name}</p>
                    <p className="text-muted-foreground">{user.department || "без отдела"}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{user.plan_rows} / {user.fact_rows}</td>
                  <td className="px-4 py-3 tabular-nums">{user.import_rows}</td>
                  <td className="px-4 py-3 tabular-nums">{user.state_keys}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(user.last_import_at)}</td>
                </tr>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Пользователей не найдено</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <UploadCloud className="w-4 h-4 text-primary" />
            <p className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>Последние импорты</p>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-auto">
            {(overview?.imports ?? []).map((item, idx) => (
              <div key={`${item.imported_at}-${idx}`} className="grid grid-cols-[92px_1fr_auto] gap-3 rounded-xl bg-muted/30 border border-border px-3 py-2 text-[12px]">
                <span className="text-primary" style={{ fontWeight: 500 }}>{item.kind}</span>
                <span className="truncate">{item.filename}</span>
                <span className={item.status === "SUCCESS" ? "text-[#10b981]" : "text-[#ef4444]"}>{item.status}</span>
                <span className="text-muted-foreground col-span-3">
                  {formatDate(item.imported_at)} · {item.enterprise_key || "без enterprise"} · {item.email || "system"} · inserted {item.inserted}, updated {item.updated}, errors {item.errors}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-primary" />
            <p className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>State storage</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-auto">
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.08em]">Enterprise JSON</p>
              {(overview?.enterprise_states ?? []).map((state) => (
                <div key={`${state.enterprise_id}-${state.key}`} className="rounded-xl bg-muted/30 border border-border px-3 py-2">
                  <p className="text-[12px] text-foreground truncate">{state.enterprise_key}</p>
                  <p className="text-[11px] text-muted-foreground">{state.key} · {formatDate(state.updated_at)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.08em]">User JSON</p>
              {(overview?.states ?? []).map((state) => (
                <div key={`${state.user_id}-${state.key}`} className="rounded-xl bg-muted/30 border border-border px-3 py-2">
                  <p className="text-[12px] text-foreground truncate">{state.email}</p>
                  <p className="text-[11px] text-muted-foreground">{state.key} · {formatDate(state.updated_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <FileClock className="w-4 h-4 text-primary" />
          <p className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>Журнал аудита</p>
        </div>
        <div className="overflow-auto max-h-[460px]">
          <table className="w-full text-[12px]">
            <thead className="bg-muted/60 text-muted-foreground sticky top-0">
              <tr>
                {["Время", "Enterprise", "Пользователь", "Action", "Entity", "Metadata"].map((col) => (
                  <th key={col} className="px-4 py-3 text-left" style={{ fontWeight: 500 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(overview?.audit ?? []).map((item) => (
                <tr key={item.id} className="border-t border-border/60 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(item.created_at)}</td>
                  <td className="px-4 py-3">{item.enterprise_key || "system"}</td>
                  <td className="px-4 py-3">{item.email || "system"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary" style={{ fontWeight: 500 }}>{item.action}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p>{item.entity}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[220px]">{item.entity_id}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground min-w-[280px]">{formatMetadata(item.metadata)}</td>
                </tr>
              ))}
              {!loading && (overview?.audit ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Журнал пока пустой</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
