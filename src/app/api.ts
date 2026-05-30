import {
  ALL_COST_CENTERS,
  API_TOKEN_KEY,
  type UserRole,
  type UserSession,
} from "./auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").toString();
const STATIC_DEMO = (import.meta.env.VITE_STATIC_DEMO ?? "").toString() === "1";
const STATIC_STORE_KEY = "budgetiq.static.demo.store.v1";

export interface ApiUser {
  id: string;
  email: string;
  role_id: number;
  cc_id?: number | null;
  enterprise?: string;
  enterprise_key?: string;
  profile?: UserProfile;
  settings?: UserSettings;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
  role: UserRole;
}

export interface AccountResponse {
  user: ApiUser;
  role: UserRole;
}

export interface UserProfile {
  name: string;
  phone: string;
  position: string;
  department: string;
  avatar_url?: string;
}

export interface UserSettings {
  threshold: number;
  overspend_threshold: number;
  saving_threshold: number;
  number_format: "ru" | "en";
  currency: string;
  notify_import: boolean;
  notify_overspend: boolean;
  notify_weekly: boolean;
  email_notify: boolean;
  theme: "dark" | "light";
}

export interface CostCenterRef {
  cc_id: number;
  code: string;
  name: string;
  owner: string;
  active: boolean;
}

export interface ItemRef {
  item_id: number;
  code: string;
  name: string;
  type: ItemType;
  active: boolean;
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  auto_created: number;
  errors: ImportError[];
}

export interface ImportLogEntry {
  kind: string;
  filename: string;
  status: string;
  inserted: number;
  updated: number;
  errors: number;
  imported_at: string;
}

export interface CompletenessResult {
  missing_in_fact: number;
  missing_in_plan: number;
  period_mismatch: string[];
}

export type ReportStatus = "IN_NORM" | "OVERSPEND" | "SAVING" | "NO_PLAN";
export type ItemType = "OPEX" | "CAPEX";

export interface ReportRow {
  id?: number;
  period: string;
  cc_id: number;
  cc_name: string;
  item_id: number;
  item_name: string;
  type: ItemType;
  amount_plan: number;
  amount_fact: number;
  delta: number;
  delta_pct: number | null;
  status: ReportStatus;
}

export interface ReportKPI {
  share_in_norm: number;
  mean_abs_delta_pct: number;
  total_plan: number;
  total_fact: number;
  total_delta: number;
}

export interface ReportResponse {
  rows: ReportRow[];
  kpi: ReportKPI;
}

export type DataKind = "plan" | "fact";

export interface DataEntry {
  kind: DataKind;
  period: string;
  cc_id: number;
  cc_name: string;
  item_id: number;
  item_name: string;
  type: ItemType;
  amount: number;
}

export interface UpsertDataEntryInput {
  period: string;
  cc_id: number;
  item_id: number;
  amount: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  role: UserRole;
  role_display_name: string;
  enterprise_id: string;
  enterprise_key: string;
  enterprise_name: string;
  cc_id?: number | null;
  cc_name?: string | null;
  profile_name: string;
  department: string;
  plan_rows: number;
  fact_rows: number;
  import_rows: number;
  state_keys: number;
  last_import_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminRoleSummary {
  role: UserRole;
  role_display_name: string;
  users: number;
}

export interface AdminDataSummary {
  enterprises: number;
  cost_centers: number;
  items: number;
  plan_rows: number;
  fact_rows: number;
  imports: number;
  audit_events: number;
  enterprise_state_keys: number;
  user_state_keys: number;
}

export interface AdminStateSummary {
  user_id: string;
  email: string;
  key: string;
  updated_at: string;
}

export interface AdminImportSummary {
  kind: string;
  filename: string;
  status: string;
  inserted: number;
  updated: number;
  errors: number;
  imported_at: string;
  user_id?: string | null;
  email: string;
  enterprise_id?: string | null;
  enterprise_key: string;
}

export interface AdminEnterpriseSummary {
  id: string;
  key: string;
  name: string;
  users: number;
  cost_centers: number;
  items: number;
  plan_rows: number;
  fact_rows: number;
  imports: number;
  audit_events: number;
  enterprise_state_keys: number;
  last_activity_at?: string | null;
  created_at: string;
}

export interface AdminEnterpriseStateSummary {
  enterprise_id: string;
  enterprise_key: string;
  key: string;
  updated_at: string;
}

export interface AdminAuditSummary {
  id: string;
  enterprise_id?: string | null;
  enterprise_key: string;
  user_id?: string | null;
  email: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: string;
  created_at: string;
}

export interface AdminOverview {
  users: AdminUserSummary[];
  roles: AdminRoleSummary[];
  data: AdminDataSummary;
  states: AdminStateSummary[];
  enterprise_states: AdminEnterpriseStateSummary[];
  enterprises: AdminEnterpriseSummary[];
  imports: AdminImportSummary[];
  audit: AdminAuditSummary[];
}

function getToken() {
  try {
    return localStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (STATIC_DEMO) return staticRequest<T>(path, options);

  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error("Backend недоступен. Проверьте, что API запущен, и повторите загрузку.");
  }
  if (!response.ok) {
    const rawMessage = (await response.text()).trim();
    const friendly = toFriendlyApiError(rawMessage, response.status);
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("budgetiq:unauthorized"));
      throw new Error("Сессия истекла или отсутствует. Войдите заново.");
    }
    throw new Error(friendly);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

type StaticStore = {
  users: Array<{ token: string; password: string; role: UserRole; user: ApiUser }>;
  costCenters: CostCenterRef[];
  items: ItemRef[];
  plan: Array<{ user_id: string; period: string; cc_id: number; item_id: number; amount: number }>;
  fact: Array<{ user_id: string; period: string; cc_id: number; item_id: number; amount: number }>;
  logs: Record<string, ImportLogEntry[]>;
  states: Record<string, Record<string, unknown>>;
  threshold: number;
};

function staticDefaults(): StaticStore {
  return {
    users: [],
    costCenters: [
      { cc_id: 1, code: "CC-001", name: "Производство", owner: "Операционный блок", active: true },
      { cc_id: 2, code: "CC-002", name: "Коммерция", owner: "Коммерческий блок", active: true },
      { cc_id: 3, code: "CC-003", name: "ИТ", owner: "Технологический блок", active: true },
    ],
    items: [
      { item_id: 1, code: "ITM-001", name: "ФОТ", type: "OPEX", active: true },
      { item_id: 2, code: "ITM-002", name: "Аренда", type: "OPEX", active: true },
      { item_id: 3, code: "ITM-003", name: "Оборудование", type: "CAPEX", active: true },
    ],
    plan: [],
    fact: [],
    logs: {},
    states: {},
    threshold: 0.1,
  };
}

function loadStaticStore(): StaticStore {
  try {
    const raw = localStorage.getItem(STATIC_STORE_KEY);
    if (!raw) return staticDefaults();
    return { ...staticDefaults(), ...JSON.parse(raw) };
  } catch {
    return staticDefaults();
  }
}

function saveStaticStore(store: StaticStore) {
  localStorage.setItem(STATIC_STORE_KEY, JSON.stringify(store));
}

function staticCurrentUser(store: StaticStore) {
  const token = getToken();
  return store.users.find((entry) => entry.token === token);
}

function staticId() {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function roleId(role: UserRole) {
  if (role === "controller") return 3;
  if (role === "manager") return 2;
  return 1;
}

function staticProfile(email: string, role: UserRole): UserProfile {
  return {
    name: email.split("@")[0],
    phone: "",
    position: role === "controller" ? "Контролёр планирования" : role === "manager" ? "Руководитель подразделения" : "Финансовый аналитик",
    department: role === "manager" ? "ЦФО" : "Финансы",
    avatar_url: "",
  };
}

function staticSettings(): UserSettings {
  return {
    threshold: 10,
    overspend_threshold: 15,
    saving_threshold: 15,
    number_format: "ru",
    currency: "RUB",
    notify_import: true,
    notify_overspend: true,
    notify_weekly: false,
    email_notify: true,
    theme: "dark",
  };
}

async function staticRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const store = loadStaticStore();
  const method = (options.method ?? "GET").toUpperCase();
  const [pathname, rawQuery = ""] = path.split("?");
  const query = new URLSearchParams(rawQuery);

  const jsonBody = () => {
    if (!options.body || typeof options.body !== "string") return {};
    return JSON.parse(options.body);
  };
  const requireUser = () => {
    const user = staticCurrentUser(store);
    if (!user) throw new Error("Сессия истекла или отсутствует. Войдите заново.");
    return user;
  };

  if (pathname === "/api/v1/auth/register" && method === "POST") {
    const input = jsonBody() as { email: string; password: string; role: UserRole; cc_id?: number | null };
    const email = input.email.trim().toLowerCase();
    const existing = store.users.find((entry) => entry.user.email === email);
    if (existing) return { token: existing.token, user: existing.user, role: existing.role } as T;
    const role = input.role || "analyst";
    const now = new Date().toISOString();
    const user: ApiUser = {
      id: staticId(),
      email,
      role_id: roleId(role),
      cc_id: input.cc_id,
      enterprise: email.split("@")[1] || "static-demo",
      enterprise_key: email.split("@")[1] || "static-demo",
      profile: staticProfile(email, role),
      settings: staticSettings(),
      created_at: now,
    };
    const token = `static-demo:${user.id}`;
    store.users.push({ token, password: input.password, role, user });
    saveStaticStore(store);
    return { token, user, role } as T;
  }

  if (pathname === "/api/v1/auth/login" && method === "POST") {
    const input = jsonBody() as { email: string; password: string };
    const email = input.email.trim().toLowerCase();
    let found = store.users.find((entry) => entry.user.email === email && entry.password === input.password);
    if (!found && email === "123" && input.password === "456") {
      found = store.users.find((entry) => entry.user.email === email);
      if (found) {
        found.password = input.password;
        saveStaticStore(store);
      } else {
        const role: UserRole = "analyst";
        const now = new Date().toISOString();
        const user: ApiUser = {
          id: staticId(),
          email,
          role_id: roleId(role),
          enterprise: "demo",
          enterprise_key: "demo",
          profile: staticProfile(email, role),
          settings: staticSettings(),
          created_at: now,
        };
        const token = `static-demo:${user.id}`;
        found = { token, password: input.password, role, user };
        store.users.push(found);
        saveStaticStore(store);
      }
    }
    if (!found) throw new Error("Неверный email или пароль. Для демо можно зарегистрировать новый аккаунт.");
    return { token: found.token, user: found.user, role: found.role } as T;
  }

  if (pathname === "/api/v1/auth/me") {
    const entry = requireUser();
    return { user: entry.user, role: entry.role } as T;
  }

  if (pathname === "/api/v1/profile" && method === "PATCH") {
    const entry = requireUser();
    entry.user.profile = (jsonBody() as { profile: UserProfile }).profile;
    saveStaticStore(store);
    return { user: entry.user, role: entry.role } as T;
  }

  if (pathname === "/api/v1/account/settings" && method === "PATCH") {
    const entry = requireUser();
    entry.user.settings = (jsonBody() as { settings: UserSettings }).settings;
    saveStaticStore(store);
    return { user: entry.user, role: entry.role } as T;
  }

  if (pathname.startsWith("/api/v1/account/state/")) {
    const entry = requireUser();
    const key = decodeURIComponent(pathname.split("/").pop() ?? "");
    store.states[entry.user.id] ??= {};
    if (method === "PUT") {
      store.states[entry.user.id][key] = jsonBody();
      saveStaticStore(store);
      return { ok: true } as T;
    }
    return (store.states[entry.user.id][key] ?? null) as T;
  }

  if (pathname === "/api/v1/cost-centers") {
    if (method === "GET") return store.costCenters as T;
    if (method === "POST") {
      const input = jsonBody() as Omit<CostCenterRef, "cc_id">;
      const cc: CostCenterRef = { ...input, cc_id: Math.max(0, ...store.costCenters.map((item) => item.cc_id)) + 1, active: true };
      store.costCenters.push(cc);
      saveStaticStore(store);
      return cc as T;
    }
  }

  if (pathname.startsWith("/api/v1/cost-centers/")) {
    const id = Number(pathname.split("/").pop());
    if (method === "PUT") {
      const input = jsonBody() as Omit<CostCenterRef, "cc_id">;
      const cc: CostCenterRef = { ...input, cc_id: id };
      store.costCenters = store.costCenters.map((item) => item.cc_id === id ? cc : item);
      saveStaticStore(store);
      return cc as T;
    }
    if (method === "DELETE") {
      store.costCenters = store.costCenters.filter((item) => item.cc_id !== id);
      saveStaticStore(store);
      return { ok: true } as T;
    }
  }

  if (pathname === "/api/v1/items") {
    if (method === "GET") return store.items as T;
    if (method === "POST") {
      const input = jsonBody() as Omit<ItemRef, "item_id">;
      const item: ItemRef = { ...input, item_id: Math.max(0, ...store.items.map((row) => row.item_id)), active: true };
      item.item_id += 1;
      store.items.push(item);
      saveStaticStore(store);
      return item as T;
    }
  }

  if (pathname.startsWith("/api/v1/items/")) {
    const id = Number(pathname.split("/").pop());
    if (method === "PUT") {
      const input = jsonBody() as Omit<ItemRef, "item_id">;
      const item: ItemRef = { ...input, item_id: id };
      store.items = store.items.map((row) => row.item_id === id ? item : row);
      saveStaticStore(store);
      return item as T;
    }
    if (method === "DELETE") {
      store.items = store.items.filter((row) => row.item_id !== id);
      saveStaticStore(store);
      return { ok: true } as T;
    }
  }

  if (pathname.startsWith("/api/import/") && method === "POST") {
    const entry = requireUser();
    const kind = pathname.split("/").pop()!.replace("cost-centers", "cost_centers") as "cost_centers" | "items" | "plan" | "fact";
    const file = (options.body as FormData).get("file") as File;
    const result = await staticImportCsv(store, entry.user.id, kind, file);
    const status = result.errors.length > 0 ? "FAILED" : "SUCCESS";
    store.logs[entry.user.id] = [{ kind, filename: file.name, status, inserted: result.inserted, updated: result.updated, errors: result.errors.length, imported_at: new Date().toISOString() }, ...(store.logs[entry.user.id] ?? [])];
    saveStaticStore(store);
    return result as T;
  }

  if (pathname === "/api/import/logs") {
    const entry = requireUser();
    const limit = Number(query.get("limit") ?? 20);
    return (store.logs[entry.user.id] ?? []).slice(0, limit) as T;
  }

  if (pathname === "/api/import/completeness") {
    const entry = requireUser();
    return staticCompleteness(store, entry.user.id) as T;
  }

  if (pathname.startsWith("/api/v1/data/")) {
    const entry = requireUser();
    const kind = pathname.split("/").pop() as DataKind;
    if (method === "GET") return staticDataEntries(store, entry.user.id, kind, Number(query.get("limit") ?? 200)) as T;
    const input = method === "PUT" ? jsonBody() as UpsertDataEntryInput : null;
    if (method === "PUT" && input) {
      staticUpsertData(store, entry.user.id, kind, input.period, input.cc_id, input.item_id, input.amount);
      saveStaticStore(store);
      return { ok: true } as T;
    }
    if (method === "DELETE") {
      const period = query.get("period") ?? "";
      const ccID = Number(query.get("cc_id"));
      const itemID = Number(query.get("item_id"));
      const rows = kind === "plan" ? store.plan : store.fact;
      const filtered = rows.filter((row) => !(row.user_id === entry.user.id && row.period === period && row.cc_id === ccID && row.item_id === itemID));
      if (kind === "plan") store.plan = filtered; else store.fact = filtered;
      saveStaticStore(store);
      return { ok: true } as T;
    }
  }

  if (pathname === "/api/v1/data" && method === "DELETE") {
    const entry = requireUser();
    store.plan = store.plan.filter((row) => row.user_id !== entry.user.id);
    store.fact = store.fact.filter((row) => row.user_id !== entry.user.id);
    saveStaticStore(store);
    return { ok: true } as T;
  }

  if (pathname === "/api/v1/report") {
    const entry = requireUser();
    return staticReport(store, entry.user.id, query) as T;
  }

  if (pathname === "/api/v1/settings/threshold") {
    if (method === "PUT") {
      store.threshold = (jsonBody() as { threshold: number }).threshold;
      saveStaticStore(store);
    }
    return { threshold: store.threshold } as T;
  }

  if (pathname === "/api/v1/admin/overview") {
    const entry = requireUser();
    const enterpriseKey = entry.user.enterprise_key ?? entry.user.enterprise ?? "static-demo";
    const now = new Date().toISOString();
    const logs = Object.values(store.logs).flat();
    return {
      users: store.users.map((row) => ({ id: row.user.id, email: row.user.email, role: row.role, role_display_name: row.user.profile?.position ?? row.role, enterprise_id: "static-enterprise", enterprise_key: row.user.enterprise_key ?? row.user.enterprise ?? enterpriseKey, enterprise_name: row.user.enterprise ?? row.user.enterprise_key ?? enterpriseKey, cc_id: row.user.cc_id, cc_name: store.costCenters.find((cc) => cc.cc_id === row.user.cc_id)?.name, profile_name: row.user.profile?.name ?? row.user.email, department: row.user.profile?.department ?? "", plan_rows: store.plan.length, fact_rows: store.fact.length, import_rows: logs.length, state_keys: Object.keys(store.states[row.user.id] ?? {}).length, last_import_at: logs[0]?.imported_at ?? null, created_at: row.user.created_at ?? now, updated_at: row.user.created_at ?? now })),
      roles: ["analyst", "manager", "controller"].map((role) => ({ role, role_display_name: role, users: store.users.filter((row) => row.role === role).length })),
      data: { enterprises: 1, cost_centers: store.costCenters.length, items: store.items.length, plan_rows: store.plan.length, fact_rows: store.fact.length, imports: logs.length, audit_events: logs.length, enterprise_state_keys: 2, user_state_keys: Object.values(store.states).reduce((sum, states) => sum + Object.keys(states).length, 0) },
      enterprises: [{ id: "static-enterprise", key: enterpriseKey, name: enterpriseKey, users: store.users.length, cost_centers: store.costCenters.length, items: store.items.length, plan_rows: store.plan.length, fact_rows: store.fact.length, imports: logs.length, audit_events: logs.length, enterprise_state_keys: 2, last_activity_at: logs[0]?.imported_at ?? now, created_at: now }],
      states: [],
      enterprise_states: [{ enterprise_id: "static-enterprise", enterprise_key: enterpriseKey, key: "dashboard.defaults", updated_at: now }, { enterprise_id: "static-enterprise", enterprise_key: enterpriseKey, key: "access.policy", updated_at: now }],
      imports: logs.map((log) => ({ ...log, email: entry.user.email, enterprise_id: "static-enterprise", enterprise_key: enterpriseKey })),
      audit: logs.map((log, idx) => ({ id: `${log.imported_at}-${idx}`, enterprise_id: "static-enterprise", enterprise_key: enterpriseKey, user_id: entry.user.id, email: entry.user.email, action: `import.${log.kind}`, entity: "imports_log", entity_id: log.filename, metadata: JSON.stringify(log), created_at: log.imported_at })),
    } as T;
  }

  throw new Error(`Static demo route is not implemented: ${method} ${path}`);
}

function parseCsv(text: string) {
  const delimiter = (text.slice(0, 4096).match(/;/g)?.length ?? 0) > (text.slice(0, 4096).match(/,/g)?.length ?? 0) ? ";" : ",";
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  return lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
}

async function staticImportCsv(store: StaticStore, userID: string, kind: "cost_centers" | "items" | "plan" | "fact", file: File): Promise<ImportResult> {
  const records = parseCsv(await file.text());
  const result: ImportResult = { inserted: 0, updated: 0, auto_created: 0, errors: [] };
  if (records.length < 2) return { ...result, errors: [{ row: 1, message: "CSV must contain header and at least one data row" }] };
  const header = records[0].map((cell) => cell.toLowerCase());
  const value = (record: string[], key: string) => record[header.indexOf(key)] ?? "";
  for (let i = 1; i < records.length; i += 1) {
    const record = records[i];
    if (kind === "cost_centers") {
      const id = Number(value(record, "cc_id"));
      const found = store.costCenters.find((row) => row.cc_id === id);
      const cc = { cc_id: id, code: value(record, "code") || `CC-${String(id).padStart(3, "0")}`, name: value(record, "name"), owner: value(record, "owner") || "CSV импорт", active: true };
      if (found) { Object.assign(found, cc); result.updated += 1; } else { store.costCenters.push(cc); result.inserted += 1; }
    } else if (kind === "items") {
      const id = Number(value(record, "item_id"));
      const itemType = value(record, "type").toUpperCase() as ItemType;
      const found = store.items.find((row) => row.item_id === id);
      const item = { item_id: id, code: value(record, "code") || `ITM-${String(id).padStart(3, "0")}`, name: value(record, "name"), type: itemType, active: true };
      if (itemType !== "OPEX" && itemType !== "CAPEX") result.errors.push({ row: i + 1, message: "type must be OPEX or CAPEX" });
      else if (found) { Object.assign(found, item); result.updated += 1; } else { store.items.push(item); result.inserted += 1; }
    } else {
      const amountKey = kind === "plan" ? "amount_plan" : "amount_fact";
      const period = value(record, "period");
      const ccID = Number(value(record, "cc_id"));
      const itemID = Number(value(record, "item_id"));
      const amount = Number(value(record, amountKey).replace(",", "."));
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || !ccID || !itemID || Number.isNaN(amount) || amount < 0) {
        result.errors.push({ row: i + 1, message: "invalid plan/fact row" });
      } else {
        const updated = staticUpsertData(store, userID, kind, period, ccID, itemID, amount);
        if (updated) result.updated += 1; else result.inserted += 1;
      }
    }
  }
  return result;
}

function staticUpsertData(store: StaticStore, userID: string, kind: DataKind, period: string, ccID: number, itemID: number, amount: number) {
  const rows = kind === "plan" ? store.plan : store.fact;
  const found = rows.find((row) => row.user_id === userID && row.period === period && row.cc_id === ccID && row.item_id === itemID);
  if (found) { found.amount = amount; return true; }
  rows.push({ user_id: userID, period, cc_id: ccID, item_id: itemID, amount });
  return false;
}

function staticDataEntries(store: StaticStore, userID: string, kind: DataKind, limit: number): DataEntry[] {
  const rows = kind === "plan" ? store.plan : store.fact;
  return rows.filter((row) => row.user_id === userID).slice(0, limit).map((row) => {
    const cc = store.costCenters.find((item) => item.cc_id === row.cc_id);
    const item = store.items.find((entry) => entry.item_id === row.item_id);
    return { kind, period: row.period, cc_id: row.cc_id, cc_name: cc?.name ?? `ЦФО ${row.cc_id}`, item_id: row.item_id, item_name: item?.name ?? `Статья ${row.item_id}`, type: item?.type ?? "OPEX", amount: row.amount };
  });
}

function staticReport(store: StaticStore, userID: string, query: URLSearchParams): ReportResponse {
  const from = query.get("from") || "0000-00";
  const to = query.get("to") || "9999-99";
  const threshold = Number(query.get("threshold") ?? store.threshold);
  const map = new Map<string, ReportRow>();
  for (const row of store.plan.filter((entry) => entry.user_id === userID)) {
    const cc = store.costCenters.find((item) => item.cc_id === row.cc_id);
    const item = store.items.find((entry) => entry.item_id === row.item_id);
    map.set(`${row.period}:${row.cc_id}:${row.item_id}`, { period: row.period, cc_id: row.cc_id, cc_name: cc?.name ?? "", item_id: row.item_id, item_name: item?.name ?? "", type: item?.type ?? "OPEX", amount_plan: row.amount, amount_fact: 0, delta: 0, delta_pct: 0, status: "IN_NORM" });
  }
  for (const row of store.fact.filter((entry) => entry.user_id === userID)) {
    const key = `${row.period}:${row.cc_id}:${row.item_id}`;
    const cc = store.costCenters.find((item) => item.cc_id === row.cc_id);
    const item = store.items.find((entry) => entry.item_id === row.item_id);
    const current = map.get(key) ?? { period: row.period, cc_id: row.cc_id, cc_name: cc?.name ?? "", item_id: row.item_id, item_name: item?.name ?? "", type: item?.type ?? "OPEX", amount_plan: 0, amount_fact: 0, delta: 0, delta_pct: null, status: "NO_PLAN" as ReportStatus };
    current.amount_fact = row.amount;
    map.set(key, current);
  }
  const rows = [...map.values()].filter((row) => row.period >= from && row.period <= to).map((row) => {
    row.delta = row.amount_fact - row.amount_plan;
    row.delta_pct = row.amount_plan === 0 ? (row.amount_fact > 0 ? null : 0) : row.delta / row.amount_plan;
    row.status = row.delta_pct === null ? "NO_PLAN" : Math.abs(row.delta_pct) <= threshold ? "IN_NORM" : row.delta_pct > threshold ? "OVERSPEND" : "SAVING";
    return row;
  });
  const kpi = rows.reduce<ReportKPI>((acc, row) => ({ share_in_norm: acc.share_in_norm, mean_abs_delta_pct: acc.mean_abs_delta_pct + Math.abs(row.delta_pct ?? 0), total_plan: acc.total_plan + row.amount_plan, total_fact: acc.total_fact + row.amount_fact, total_delta: acc.total_delta + row.delta }), { share_in_norm: 0, mean_abs_delta_pct: 0, total_plan: 0, total_fact: 0, total_delta: 0 });
  if (rows.length > 0) {
    kpi.share_in_norm = rows.filter((row) => row.status === "IN_NORM").length / rows.length;
    kpi.mean_abs_delta_pct /= rows.length;
  }
  return { rows, kpi };
}

function staticCompleteness(store: StaticStore, userID: string): CompletenessResult {
  const plan = new Set(store.plan.filter((row) => row.user_id === userID).map((row) => `${row.period}:${row.cc_id}:${row.item_id}`));
  const fact = new Set(store.fact.filter((row) => row.user_id === userID).map((row) => `${row.period}:${row.cc_id}:${row.item_id}`));
  return { missing_in_fact: [...plan].filter((key) => !fact.has(key)).length, missing_in_plan: [...fact].filter((key) => !plan.has(key)).length, period_mismatch: [] };
}

function toFriendlyApiError(rawMessage: string, status: number) {
  const message = rawMessage || `HTTP ${status}`;
  const lower = message.toLowerCase();
  if (lower.includes("invalid email or password")) return "Неверный email или пароль. Проверьте данные и попробуйте ещё раз.";
  if (lower.includes("email and password")) return "Укажите email и пароль. Пароль должен быть не короче 8 символов.";
  if (lower.includes("email already exists")) return "Аккаунт с таким email уже существует. Войдите или используйте другой email.";
  if (lower.includes("invalid cost center")) return "Выбранный ЦФО не найден. Обновите страницу и попробуйте ещё раз.";
  if (lower.includes("duplicate key") && lower.includes("users_email")) return "Аккаунт с таким email уже существует. Войдите или используйте другой email.";
  if (lower.includes("duplicate key")) return "Такая запись уже есть в базе. Проверьте код, период или связку ЦФО/статья.";
  if (lower.includes("violates foreign key")) return "Не найдена связанная запись. Проверьте cc_id и item_id в справочниках.";
  if (lower.includes("check constraint")) return "Значение не проходит проверку. Сумма должна быть неотрицательной, тип: OPEX или CAPEX.";
  if (lower.includes("failed to create user")) return "Не удалось создать аккаунт. Возможно, email уже занят.";
  if (lower.includes("internal db error")) return "Ошибка базы данных на backend. Перезапустите backend и проверьте PostgreSQL.";
  if (lower.includes("failed to load user")) return "Аккаунт создан, но backend не смог загрузить пользователя. Перезапустите backend, чтобы применить миграции.";
  if (status >= 500) return "Backend вернул ошибку 500. Обычно это означает, что API не запущен, PostgreSQL недоступен или миграции ещё не применились.";
  if (lower.includes("failed to load threshold")) return "Не удалось загрузить порог отклонений из backend.";
  if (lower.includes("network") || lower.includes("fetch")) return "Backend недоступен. Проверьте, что API запущен.";
  return message;
}

export function toUserSession(response: AuthResponse): UserSession {
  const role = response.role;
  const profile = response.user.profile;
  const ccName = response.user.cc_id
    ? ALL_COST_CENTERS[(response.user.cc_id - 1) % ALL_COST_CENTERS.length]
    : undefined;
  return {
    name: profile?.name?.trim() || response.user.email.split("@")[0] || "Пользователь",
    email: response.user.email,
    role,
    position:
      profile?.position?.trim()
      || (role === "controller"
          ? "Контролёр планирования"
          : role === "manager"
            ? "Руководитель подразделения"
            : "Финансовый аналитик"),
    department: profile?.department?.trim() || (role === "manager" ? ccName ?? "ЦФО" : "Финансы"),
    phone: profile?.phone,
    avatarUrl: profile?.avatar_url,
    enterprise: response.user.enterprise?.trim() || response.user.enterprise_key?.trim() || response.user.email.split("@")[1] || "default",
    enterpriseKey: response.user.enterprise_key?.trim() || response.user.email.split("@")[1] || "default",
    allowedCostCenters: role === "manager" && ccName ? [ccName] : [...ALL_COST_CENTERS],
  };
}

export function toUserSessionFromAccount(response: AccountResponse): UserSession {
  return toUserSession({ token: "", user: response.user, role: response.role });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(input: { email: string; password: string; role: UserRole; cc_id?: number | null }) {
  return request<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAccount() {
  return request<AccountResponse>("/api/v1/auth/me");
}

export function updateProfile(profile: UserProfile) {
  return request<AccountResponse>("/api/v1/profile", {
    method: "PATCH",
    body: JSON.stringify({ profile }),
  });
}

export function updateAccountSettings(settings: UserSettings) {
  return request<AccountResponse>("/api/v1/account/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings }),
  });
}

export function getAccountState<T>(key: string) {
  return request<T | null>(`/api/v1/account/state/${encodeURIComponent(key)}`);
}

export function saveAccountState<T>(key: string, value: T) {
  return request<{ ok: boolean }>(`/api/v1/account/state/${encodeURIComponent(key)}`, {
    method: "PUT",
    body: JSON.stringify(value),
  });
}

export function getCostCenters() {
  return request<CostCenterRef[]>("/api/v1/cost-centers");
}

export function createCostCenter(input: Omit<CostCenterRef, "cc_id">) {
  return request<CostCenterRef>("/api/v1/cost-centers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCostCenter(id: number, input: Omit<CostCenterRef, "cc_id">) {
  return request<CostCenterRef>(`/api/v1/cost-centers/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCostCenter(id: number) {
  return request<{ ok: boolean }>(`/api/v1/cost-centers/${id}`, { method: "DELETE" });
}

export function getItems() {
  return request<ItemRef[]>("/api/v1/items");
}

export function createItem(input: Omit<ItemRef, "item_id">) {
  return request<ItemRef>("/api/v1/items", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateItem(id: number, input: Omit<ItemRef, "item_id">) {
  return request<ItemRef>(`/api/v1/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteItem(id: number) {
  return request<{ ok: boolean }>(`/api/v1/items/${id}`, { method: "DELETE" });
}

export function uploadCsv(kind: "cost_centers" | "items" | "plan" | "fact", file: File) {
  const pathByKind = {
    cost_centers: "/api/import/cost-centers",
    items: "/api/import/items",
    plan: "/api/import/plan",
    fact: "/api/import/fact",
  };
  const formData = new FormData();
  formData.set("file", file);
  return request<ImportResult>(pathByKind[kind], { method: "POST", body: formData });
}

export function uploadCsvWithOptions(
  kind: "cost_centers" | "items" | "plan" | "fact",
  file: File,
  options: { autoCreateRefs?: boolean } = {},
) {
  const pathByKind = {
    cost_centers: "/api/import/cost-centers",
    items: "/api/import/items",
    plan: "/api/import/plan",
    fact: "/api/import/fact",
  };
  const formData = new FormData();
  formData.set("file", file);
  if (options.autoCreateRefs) formData.set("auto_create_refs", "true");
  return request<ImportResult>(pathByKind[kind], { method: "POST", body: formData });
}

export function checkCompleteness() {
  return request<CompletenessResult>("/api/import/completeness");
}

export function getImportLogs(limit = 20) {
  return request<ImportLogEntry[] | null>(`/api/import/logs?limit=${limit}`).then((logs) => logs ?? []);
}

export function getDataEntries(kind: DataKind, limit = 200) {
  return request<DataEntry[] | null>(`/api/v1/data/${kind}?limit=${limit}`).then((entries) => entries ?? []);
}

export function upsertDataEntry(kind: DataKind, input: UpsertDataEntryInput) {
  return request<{ ok: boolean }>(`/api/v1/data/${kind}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteDataEntry(kind: DataKind, input: Pick<UpsertDataEntryInput, "period" | "cc_id" | "item_id">) {
  const search = new URLSearchParams({
    period: input.period,
    cc_id: String(input.cc_id),
    item_id: String(input.item_id),
  });
  return request<{ ok: boolean }>(`/api/v1/data/${kind}?${search.toString()}`, { method: "DELETE" });
}

export function clearPlanFactData() {
  return request<{ ok: boolean }>("/api/v1/data", { method: "DELETE" });
}

export function getAdminOverview() {
  return request<AdminOverview>("/api/v1/admin/overview");
}

export function getReport(params: {
  from: string;
  to: string;
  cc_id?: number | null;
  type?: "ALL" | ItemType;
  status?: "ALL" | ReportStatus;
  threshold: number;
}) {
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
    threshold: String(params.threshold),
  });
  if (params.cc_id) search.set("cc_id", String(params.cc_id));
  if (params.type && params.type !== "ALL") search.set("type", params.type);
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  return request<ReportResponse>(`/api/v1/report?${search.toString()}`);
}

export async function getThresholdSetting() {
  const response = await request<{ threshold: number }>("/api/v1/settings/threshold");
  return Math.round(response.threshold * 100);
}

export async function saveThresholdSetting(thresholdPercent: number) {
  const response = await request<{ threshold: number }>("/api/v1/settings/threshold", {
    method: "PUT",
    body: JSON.stringify({ threshold: thresholdPercent / 100 }),
  });
  return Math.round(response.threshold * 100);
}

export function getReportExportUrl(params: {
  from: string;
  to: string;
  cc_id?: number | null;
  type?: "ALL" | ItemType;
  status?: "ALL" | ReportStatus;
  threshold: number;
}) {
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
    threshold: String(params.threshold),
  });
  if (params.cc_id) search.set("cc_id", String(params.cc_id));
  if (params.type && params.type !== "ALL") search.set("type", params.type);
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  return `${API_BASE}/api/v1/report/export?${search.toString()}`;
}

export async function exportReportCsv(params: {
  from: string;
  to: string;
  cc_id?: number | null;
  type?: "ALL" | ItemType;
  status?: "ALL" | ReportStatus;
  threshold: number;
}) {
  if (STATIC_DEMO) {
    const report = await getReport(params);
    const rows = [
      ["period", "cc_id", "cc_name", "item_id", "item_name", "type", "amount_plan", "amount_fact", "delta", "delta_pct", "status"],
      ...report.rows.map((row) => [
        row.period,
        String(row.cc_id),
        row.cc_name,
        String(row.item_id),
        row.item_name,
        row.type,
        String(row.amount_plan),
        String(row.amount_fact),
        String(row.delta),
        row.delta_pct === null ? "" : String(row.delta_pct),
        row.status,
      ]),
    ];
    return new Blob([rows.map((row) => row.join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
  }
  const url = getReportExportUrl(params);
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("budgetiq:unauthorized"));
      throw new Error("Сессия истекла или отсутствует. Войдите заново.");
    }
    throw new Error(await response.text());
  }
  return response.blob();
}
