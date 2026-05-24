export type UserRole = "analyst" | "manager" | "controller";

export interface UserSession {
  name: string;
  email: string;
  role: UserRole;
  position: string;
  department: string;
  phone?: string;
  avatarUrl?: string;
  enterprise?: string;
  enterpriseKey?: string;
  allowedCostCenters: string[];
}

export interface RolePermissions {
  canImport: boolean;
  canSettings: boolean;
  canExport: boolean;
  scope: "all" | "assigned";
}

export const API_TOKEN_KEY = "budgetiq.api.token";

export const ALL_COST_CENTERS = [
  "Производство",
  "Коммерция",
  "ИТ",
  "HR",
  "Финансы",
  "Логистика",
  "Маркетинг",
  "АХО",
] as const;

export const roleLabels: Record<UserRole, string> = {
  analyst: "Финансовый аналитик",
  manager: "Руководитель подразделения",
  controller: "Контролёр планирования",
};

export const rolePermissions: Record<UserRole, RolePermissions> = {
  controller: { canImport: true, canSettings: true, canExport: true, scope: "all" },
  analyst: { canImport: true, canSettings: true, canExport: true, scope: "all" },
  manager: { canImport: false, canSettings: false, canExport: true, scope: "assigned" },
};

const roleDefaults: Record<UserRole, { name: string; position: string; department: string }> = {
  controller: {
    name: "Алексей Котов",
    position: "Контролёр планирования",
    department: "Финансы",
  },
  analyst: {
    name: "Мария Жданова",
    position: "Финансовый аналитик",
    department: "Финансы",
  },
  manager: {
    name: "Иван Петров",
    position: "Руководитель подразделения",
    department: "Операционный блок",
  },
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUserRole(value: unknown): value is UserRole {
  return value === "analyst" || value === "manager" || value === "controller";
}

function isKnownCostCenter(value: string) {
  return ALL_COST_CENTERS.includes(value as (typeof ALL_COST_CENTERS)[number]);
}

function resolveManagerCostCenter(email: string, preferred?: string) {
  if (preferred && isKnownCostCenter(preferred)) return preferred;
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) hash += email.charCodeAt(i);
  return ALL_COST_CENTERS[hash % ALL_COST_CENTERS.length];
}

function normalizeAllowedCostCenters(role: UserRole, email: string, allowed?: string[], preferred?: string) {
  if (role !== "manager") return [...ALL_COST_CENTERS];
  const scoped = (allowed ?? []).filter((cc) => isKnownCostCenter(cc));
  if (scoped.length > 0) return Array.from(new Set(scoped));
  return [resolveManagerCostCenter(email, preferred)];
}

function toDisplayNameFromEmail(email: string) {
  const local = normalizeEmail(email).split("@")[0] ?? "";
  if (!local) return "Пользователь";
  const tokens = local.replace(/[._-]+/g, " ").split(" ").filter(Boolean);
  if (tokens.length === 0) return "Пользователь";
  return tokens.map((token) => token.slice(0, 1).toUpperCase() + token.slice(1)).join(" ");
}

export function inferRoleFromEmail(email: string): UserRole {
  const normalized = normalizeEmail(email);
  if (
    normalized.includes("controller")
    || normalized.includes("admin")
    || normalized.includes("cfo")
    || normalized.includes("control")
  ) {
    return "controller";
  }
  if (
    normalized.includes("manager")
    || normalized.includes("head")
    || normalized.includes("director")
    || normalized.includes("chief")
  ) {
    return "manager";
  }
  return "analyst";
}

export function buildMockUserSession(input: {
  email: string;
  role?: UserRole;
  costCenter?: string;
  name?: string;
}): UserSession {
  const email = normalizeEmail(input.email);
  const role = input.role ?? inferRoleFromEmail(email);
  const defaults = roleDefaults[role];
  const displayName = input.name?.trim() || toDisplayNameFromEmail(email) || defaults.name;
  const managerCostCenter = role === "manager" ? resolveManagerCostCenter(email, input.costCenter) : undefined;
  return {
    name: displayName,
    email,
    role,
    position: defaults.position,
    department: role === "manager" && managerCostCenter ? managerCostCenter : defaults.department,
    allowedCostCenters: role === "manager" ? [managerCostCenter!] : [...ALL_COST_CENTERS],
  };
}

function isUserSession(value: unknown): value is UserSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as UserSession;
  if (typeof candidate.name !== "string") return false;
  if (typeof candidate.email !== "string") return false;
  if (!isUserRole(candidate.role)) return false;
  if (typeof candidate.position !== "string") return false;
  if (typeof candidate.department !== "string") return false;
  if (!Array.isArray(candidate.allowedCostCenters)) return false;
  return true;
}

export function sanitizeSession(input: UserSession): UserSession {
  const role = isUserRole(input.role) ? input.role : "analyst";
  const email = normalizeEmail(input.email);
  const allowedCostCenters = normalizeAllowedCostCenters(role, email, input.allowedCostCenters, input.department);
  return {
    name: input.name.trim() || roleDefaults[role].name,
    email,
    role,
    position: input.position.trim() || roleDefaults[role].position,
    department:
      input.department.trim()
      || (role === "manager" ? allowedCostCenters[0] : roleDefaults[role].department),
    phone: input.phone,
    avatarUrl: input.avatarUrl,
    enterprise: input.enterprise,
    enterpriseKey: input.enterpriseKey,
    allowedCostCenters,
  };
}

export function saveApiToken(token: string) {
  try {
    localStorage.setItem(API_TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export function hasApiToken() {
  try {
    return Boolean(localStorage.getItem(API_TOKEN_KEY));
  } catch {
    return false;
  }
}

export function clearStoredUser() {
  try {
    localStorage.removeItem("budgetiq.user.session.v1");
    localStorage.removeItem("budgetiq.authenticated");
    localStorage.removeItem(API_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}
