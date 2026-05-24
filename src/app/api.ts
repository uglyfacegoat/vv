import {
  ALL_COST_CENTERS,
  API_TOKEN_KEY,
  type UserRole,
  type UserSession,
} from "./auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").toString();

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
  cc_id?: number | null;
  cc_name?: string | null;
  profile_name: string;
  department: string;
  plan_rows: number;
  fact_rows: number;
  state_keys: number;
  created_at: string;
  updated_at: string;
}

export interface AdminRoleSummary {
  role: UserRole;
  role_display_name: string;
  users: number;
}

export interface AdminDataSummary {
  cost_centers: number;
  items: number;
  plan_rows: number;
  fact_rows: number;
  imports: number;
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
}

export interface AdminOverview {
  users: AdminUserSummary[];
  roles: AdminRoleSummary[];
  data: AdminDataSummary;
  states: AdminStateSummary[];
  imports: AdminImportSummary[];
}

function getToken() {
  try {
    return localStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
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

function toFriendlyApiError(rawMessage: string, status: number) {
  const message = rawMessage || `HTTP ${status}`;
  const lower = message.toLowerCase();
  if (lower.includes("invalid email or password")) return "Неверный email или пароль. Проверьте данные и попробуйте ещё раз.";
  if (lower.includes("email and password")) return "Укажите email и пароль. Пароль должен быть не короче 8 символов.";
  if (lower.includes("duplicate key") && lower.includes("users_email")) return "Аккаунт с таким email уже существует. Войдите или используйте другой email.";
  if (lower.includes("duplicate key")) return "Такая запись уже есть в базе. Проверьте код, период или связку ЦФО/статья.";
  if (lower.includes("violates foreign key")) return "Не найдена связанная запись. Проверьте cc_id и item_id в справочниках.";
  if (lower.includes("check constraint")) return "Значение не проходит проверку. Сумма должна быть неотрицательной, тип: OPEX или CAPEX.";
  if (lower.includes("failed to create user")) return "Не удалось создать аккаунт. Возможно, email уже занят.";
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
