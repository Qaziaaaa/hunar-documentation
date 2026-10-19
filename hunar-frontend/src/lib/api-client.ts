export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
  if (typeof window === "undefined") {
    return envUrl;
  }
  try {
    const url = new URL(envUrl);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      const currentHost = window.location.hostname;
      if (currentHost && currentHost !== "localhost") {
        url.hostname = currentHost;
        return url.toString().replace(/\/$/, "");
      }
    }
    return envUrl;
  } catch {
    return envUrl;
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const ACCESS_TOKEN_KEY = "workerfix.access_token";
export const REFRESH_TOKEN_KEY = "workerfix.refresh_token";
export const AUTH_USER_KEY = "workerfix.auth_user";

// Role-scoped storage keys to prevent cross-portal token contamination
export const CUSTOMER_ACCESS_TOKEN_KEY = "workerfix.customer.access_token";
export const CUSTOMER_REFRESH_TOKEN_KEY = "workerfix.customer.refresh_token";
export const CUSTOMER_AUTH_USER_KEY = "workerfix.customer.auth_user";

export const WORKER_ACCESS_TOKEN_KEY = "workerfix.worker.access_token";
export const WORKER_REFRESH_TOKEN_KEY = "workerfix.worker.refresh_token";
export const WORKER_AUTH_USER_KEY = "workerfix.worker.auth_user";

export const ADMIN_ACCESS_TOKEN_KEY = "workerfix.admin.access_token";
export const ADMIN_REFRESH_TOKEN_KEY = "workerfix.admin.refresh_token";
export const ADMIN_AUTH_USER_KEY = "workerfix.admin.auth_user";

// Legacy keys for seamless migration
const LEGACY_ACCESS_TOKEN_KEY = "workerfix.access_token";
const LEGACY_REFRESH_TOKEN_KEY = "workerfix.refresh_token";
const LEGACY_AUTH_USER_KEY = "workerfix.auth_user";
const OLD_LEGACY_ACCESS_TOKEN_KEY = "hunar.access_token";
const OLD_LEGACY_REFRESH_TOKEN_KEY = "hunar.refresh_token";
const OLD_LEGACY_AUTH_USER_KEY = "hunar.auth_user";

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export type UserRole = "WORKER" | "CUSTOMER" | "ADMIN";

export interface StoredUser {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  isVerified?: boolean;
}

export function getRoleFromContext(pathname?: string): UserRole | null {
  if (typeof window === "undefined" && !pathname) return null;
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  if (path.includes("/customer")) return "CUSTOMER";
  if (path.includes("/worker")) return "WORKER";
  if (path.includes("/admin")) return "ADMIN";
  return null;
}

export interface DecodedJwtPayload {
  sub?: string;
  phone?: string;
  role?: string;
  purpose?: string;
  exp?: number;
  iat?: number;
}

export function parseJwtPayload(token: string | null | undefined): DecodedJwtPayload | null {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload) as DecodedJwtPayload;
  } catch {
    return null;
  }
}

function getRawGenericStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage.getItem(AUTH_USER_KEY) ??
    window.localStorage.getItem(LEGACY_AUTH_USER_KEY) ??
    window.localStorage.getItem(OLD_LEGACY_AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function getAccessToken(roleHint?: UserRole): string | null {
  if (typeof window === "undefined") return null;
  const targetRole = roleHint ?? getRoleFromContext();

  const genericToken =
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ??
    window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ??
    window.localStorage.getItem(OLD_LEGACY_ACCESS_TOKEN_KEY);

  if (targetRole === "CUSTOMER") {
    const custToken = window.localStorage.getItem(CUSTOMER_ACCESS_TOKEN_KEY);
    if (custToken) return custToken;

    if (genericToken) {
      const payload = parseJwtPayload(genericToken);
      const jwtRole = payload?.role ? (payload.role.toUpperCase() as UserRole) : null;
      const genericUser = getRawGenericStoredUser();
      const userRole = genericUser?.role ? (genericUser.role.toUpperCase() as UserRole) : null;

      const isExplicitCustomer = jwtRole === "CUSTOMER" || userRole === "CUSTOMER";
      const isOtherRole =
        jwtRole === "WORKER" || jwtRole === "ADMIN" || userRole === "WORKER" || userRole === "ADMIN";

      if (isExplicitCustomer || !isOtherRole) {
        // Auto-heal / backfill role-scoped storage so future queries are instant
        try {
          window.localStorage.setItem(CUSTOMER_ACCESS_TOKEN_KEY, genericToken);
          if (!window.localStorage.getItem(CUSTOMER_AUTH_USER_KEY)) {
            const healedUser: StoredUser = {
              id: payload?.sub || genericUser?.id || "customer",
              phone: payload?.phone || genericUser?.phone || "",
              name: genericUser?.name,
              avatarUrl: genericUser?.avatarUrl,
              role: "CUSTOMER",
              isVerified: genericUser?.isVerified,
            };
            window.localStorage.setItem(CUSTOMER_AUTH_USER_KEY, JSON.stringify(healedUser));
          }
        } catch {}
        return genericToken;
      }
    }
    return null;
  }

  if (targetRole === "WORKER") {
    const workerToken = window.localStorage.getItem(WORKER_ACCESS_TOKEN_KEY);
    if (workerToken) return workerToken;

    if (genericToken) {
      const payload = parseJwtPayload(genericToken);
      const jwtRole = payload?.role ? (payload.role.toUpperCase() as UserRole) : null;
      const genericUser = getRawGenericStoredUser();
      const userRole = genericUser?.role ? (genericUser.role.toUpperCase() as UserRole) : null;

      if (jwtRole === "WORKER" || userRole === "WORKER") {
        try {
          window.localStorage.setItem(WORKER_ACCESS_TOKEN_KEY, genericToken);
          if (!window.localStorage.getItem(WORKER_AUTH_USER_KEY)) {
            const healedUser: StoredUser = {
              id: payload?.sub || genericUser?.id || "worker",
              phone: payload?.phone || genericUser?.phone || "",
              name: genericUser?.name,
              avatarUrl: genericUser?.avatarUrl,
              role: "WORKER",
              isVerified: genericUser?.isVerified,
            };
            window.localStorage.setItem(WORKER_AUTH_USER_KEY, JSON.stringify(healedUser));
          }
        } catch {}
        return genericToken;
      }
    }
    return null;
  }

  if (targetRole === "ADMIN") {
    const adminToken =
      window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) ??
      window.localStorage.getItem("hunar_admin_token");
    if (adminToken) return adminToken;

    if (genericToken) {
      const payload = parseJwtPayload(genericToken);
      const jwtRole = payload?.role ? (payload.role.toUpperCase() as UserRole) : null;
      const genericUser = getRawGenericStoredUser();
      const userRole = genericUser?.role ? (genericUser.role.toUpperCase() as UserRole) : null;

      if (jwtRole === "ADMIN" || userRole === "ADMIN") {
        try {
          window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, genericToken);
        } catch {}
        return genericToken;
      }
    }
    return null;
  }

  return genericToken;
}

export function getRefreshToken(roleHint?: UserRole): string | null {
  if (typeof window === "undefined") return null;
  const targetRole = roleHint ?? getRoleFromContext();

  const genericRefresh =
    window.localStorage.getItem(REFRESH_TOKEN_KEY) ??
    window.localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY) ??
    window.localStorage.getItem(OLD_LEGACY_REFRESH_TOKEN_KEY);

  if (targetRole === "CUSTOMER") {
    const custRefresh = window.localStorage.getItem(CUSTOMER_REFRESH_TOKEN_KEY);
    if (custRefresh) return custRefresh;
    if (getAccessToken("CUSTOMER")) return genericRefresh;
    return null;
  }

  if (targetRole === "WORKER") {
    const workerRefresh = window.localStorage.getItem(WORKER_REFRESH_TOKEN_KEY);
    if (workerRefresh) return workerRefresh;
    if (getAccessToken("WORKER")) return genericRefresh;
    return null;
  }

  if (targetRole === "ADMIN") {
    const adminRefresh = window.localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
    if (adminRefresh) return adminRefresh;
    if (getAccessToken("ADMIN")) return genericRefresh;
    return null;
  }

  return genericRefresh;
}

// Emitted whenever the stored auth user is written/cleared (same-tab signal for useSyncExternalStore subscribers)
export const AUTH_USER_CHANGED_EVENT = "workerfix.auth.changed";

export function getStoredUserRaw(roleHint?: UserRole): string | null {
  if (typeof window === "undefined") return null;
  const targetRole = roleHint ?? getRoleFromContext();

  if (targetRole === "CUSTOMER") {
    const custRaw = window.localStorage.getItem(CUSTOMER_AUTH_USER_KEY);
    if (custRaw) return custRaw;
    const generic = getRawGenericStoredUser();
    if (generic?.role?.toUpperCase() === "CUSTOMER") return JSON.stringify(generic);

    const token = getAccessToken("CUSTOMER");
    if (token) {
      const payload = parseJwtPayload(token);
      if (payload?.sub) {
        const reconstructed: StoredUser = {
          id: payload.sub,
          phone: payload.phone || generic?.phone || "",
          name: generic?.name,
          avatarUrl: generic?.avatarUrl,
          role: "CUSTOMER",
          isVerified: generic?.isVerified,
        };
        try {
          window.localStorage.setItem(CUSTOMER_AUTH_USER_KEY, JSON.stringify(reconstructed));
        } catch {}
        return JSON.stringify(reconstructed);
      }
    }
    return null;
  }

  if (targetRole === "WORKER") {
    const workerRaw = window.localStorage.getItem(WORKER_AUTH_USER_KEY);
    if (workerRaw) return workerRaw;
    const generic = getRawGenericStoredUser();
    if (generic?.role?.toUpperCase() === "WORKER") return JSON.stringify(generic);

    const token = getAccessToken("WORKER");
    if (token) {
      const payload = parseJwtPayload(token);
      if (payload?.sub && payload.role?.toUpperCase() === "WORKER") {
        const reconstructed: StoredUser = {
          id: payload.sub,
          phone: payload.phone || generic?.phone || "",
          name: generic?.name,
          avatarUrl: generic?.avatarUrl,
          role: "WORKER",
          isVerified: generic?.isVerified,
        };
        try {
          window.localStorage.setItem(WORKER_AUTH_USER_KEY, JSON.stringify(reconstructed));
        } catch {}
        return JSON.stringify(reconstructed);
      }
    }
    return null;
  }

  if (targetRole === "ADMIN") {
    const adminRaw = window.localStorage.getItem(ADMIN_AUTH_USER_KEY);
    if (adminRaw) return adminRaw;
    const generic = getRawGenericStoredUser();
    return generic?.role?.toUpperCase() === "ADMIN" ? JSON.stringify(generic) : null;
  }

  return (
    window.localStorage.getItem(AUTH_USER_KEY) ??
    window.localStorage.getItem(LEGACY_AUTH_USER_KEY) ??
    window.localStorage.getItem(OLD_LEGACY_AUTH_USER_KEY)
  );
}

export function getStoredUser(roleHint?: UserRole): StoredUser | null {
  const raw = getStoredUserRaw(roleHint);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  user?: StoredUser,
): void {
  if (typeof window === "undefined") return;
  if (!accessToken) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  const payload = parseJwtPayload(accessToken);
  const jwtRole = payload?.role ? (payload.role.toUpperCase() as UserRole) : undefined;
  const role: UserRole | undefined = user?.role
    ? (user.role.toUpperCase() as UserRole)
    : jwtRole;

  let effectiveUser = user;
  if (effectiveUser && role) {
    effectiveUser = { ...effectiveUser, role };
  } else if (!effectiveUser && payload?.sub && role) {
    const existing = getStoredUser(role) ?? getRawGenericStoredUser();
    effectiveUser = {
      id: payload.sub,
      phone: payload.phone || existing?.phone || "",
      name: existing?.name,
      avatarUrl: existing?.avatarUrl,
      role,
      isVerified: existing?.isVerified,
    };
  }

  if (effectiveUser) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(effectiveUser));
  }

  // Also save in role-isolated storage
  if (role === "CUSTOMER") {
    window.localStorage.setItem(CUSTOMER_ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) window.localStorage.setItem(CUSTOMER_REFRESH_TOKEN_KEY, refreshToken);
    if (effectiveUser) window.localStorage.setItem(CUSTOMER_AUTH_USER_KEY, JSON.stringify(effectiveUser));
  } else if (role === "WORKER") {
    window.localStorage.setItem(WORKER_ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) window.localStorage.setItem(WORKER_REFRESH_TOKEN_KEY, refreshToken);
    if (effectiveUser) window.localStorage.setItem(WORKER_AUTH_USER_KEY, JSON.stringify(effectiveUser));
  } else if (role === "ADMIN") {
    window.localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) window.localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
    if (effectiveUser) window.localStorage.setItem(ADMIN_AUTH_USER_KEY, JSON.stringify(effectiveUser));
  }

  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}

export function clearTokens(roleHint?: UserRole): void {
  if (typeof window === "undefined") return;
  const targetRole = roleHint ?? getRoleFromContext();

  if (targetRole === "CUSTOMER") {
    window.localStorage.removeItem(CUSTOMER_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(CUSTOMER_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(CUSTOMER_AUTH_USER_KEY);
    const generic = getRawGenericStoredUser();
    if (generic?.role === "CUSTOMER") {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  } else if (targetRole === "WORKER") {
    window.localStorage.removeItem(WORKER_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(WORKER_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(WORKER_AUTH_USER_KEY);
    const generic = getRawGenericStoredUser();
    if (generic?.role === "WORKER") {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  } else if (targetRole === "ADMIN") {
    window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_AUTH_USER_KEY);
    window.localStorage.removeItem("hunar_admin_token");
    const generic = getRawGenericStoredUser();
    if (generic?.role === "ADMIN") {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
    }
  } else {
    // Clear all roles
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.localStorage.removeItem(CUSTOMER_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(CUSTOMER_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(CUSTOMER_AUTH_USER_KEY);
    window.localStorage.removeItem(WORKER_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(WORKER_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(WORKER_AUTH_USER_KEY);
    window.localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_AUTH_USER_KEY);
    window.localStorage.removeItem("hunar_admin_token");
  }

  window.localStorage.removeItem("workerfix.worker_profile_cache");
  window.localStorage.removeItem("hunar_worker_onboarding");
  window.localStorage.removeItem("hunar_worker_online");
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith("workerfix.worker_profile_") || key.startsWith("workerfix.profile_"))) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {}

  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}

// Track in-flight silent refresh promise to deduplicate concurrent 401s
let refreshPromise: Promise<string | null> | null = null;

async function executeSilentRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    // Single refresh endpoint; the backend /auth/refresh is role-agnostic.
    // 10s cap: a hung refresh would otherwise block every queued 401 retry.
    const res = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const envelope = (await res.json()) as {
      success?: boolean;
      data?: { accessToken: string; refreshToken?: string; user?: StoredUser };
    };

    const data = (envelope?.data ?? envelope ?? {}) as {
      accessToken?: string;
      refreshToken?: string;
      user?: StoredUser;
    };

    if (!data?.accessToken) {
      clearTokens();
      return null;
    }

    const newRefreshToken = data.refreshToken ?? refreshToken;
    setTokens(data.accessToken, newRefreshToken, data.user);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export async function silentRefreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = executeSilentRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export interface ApiClientOptions extends RequestInit {
  /** Override the request timeout in ms. 0 or Infinity disables it. */
  timeoutMs?: number;
}

// A hung fetch used to spin forever (perceived perf: infinite spinner).
// Accommodating Neon DB serverless cold starts & remote cross-region SSL latency
const DEFAULT_GET_TIMEOUT_MS = 60_000;
const DEFAULT_MUTATION_TIMEOUT_MS = 60_000;
const UPLOAD_TIMEOUT_MS = 90_000;

export async function apiClient<T>(
  path: string,
  options: ApiClientOptions = {},
  isRetry = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  let roleHint: UserRole | undefined;
  if (path.startsWith("/admin") || path.startsWith("/api/v1/admin")) {
    roleHint = "ADMIN";
  } else if (
    path.startsWith("/users/worker") ||
    path.startsWith("/workers") ||
    path.startsWith("/commissions") ||
    path.startsWith("/jobs/available") ||
    path.startsWith("/visits") ||
    path.startsWith("/uploads/inspection-photo") ||
    path.startsWith("/uploads/worker-document") ||
    path.startsWith("/uploads/cnic-document")
  ) {
    roleHint = "WORKER";
  } else if (
    path.startsWith("/auth/customer") ||
    path.startsWith("/repairs/pending") ||
    path.startsWith("/jobs/customer") ||
    path.startsWith("/uploads/job-photo") ||
    path.startsWith("/uploads/voice-note") ||
    (path === "/jobs" && options.method === "POST")
  ) {
    roleHint = "CUSTOMER";
  }

  const token = getAccessToken(roleHint);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = (options.method ?? "GET").toUpperCase();
  const defaultTimeout =
    options.body instanceof FormData && path.includes("upload")
      ? UPLOAD_TIMEOUT_MS
      : method === "GET" || method === "HEAD"
        ? DEFAULT_GET_TIMEOUT_MS
        : DEFAULT_MUTATION_TIMEOUT_MS;
  const timeoutMs = options.timeoutMs ?? defaultTimeout;

  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }
  const externalSignal = options.signal;
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (timedOut) {
      throw new ApiError(`REQUEST_TIMEOUT: no response within ${timeoutMs}ms (${method} ${path})`, 0);
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
  }

  // Handle 401 Unauthorized via Silent Token Refresh (once per request)
  const isAuthEndpoint =
    path.includes("/auth/login") ||
    path.includes("/auth/customer/login") ||
    path.includes("/auth/register") ||
    path.includes("/auth/customer/signup/complete") ||
    path.includes("/auth/otp/") ||
    path.includes("/auth/customer/otp/") ||
    path.includes("/auth/refresh");

  if (res.status === 401 && !isRetry && !isAuthEndpoint && getRefreshToken()) {
    const newToken = await silentRefreshToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      return apiClient<T>(path, { ...options, headers }, true);
    }
  }

  if (!res.ok) {
    let payload: unknown;
    try {
      const cloned = res.clone();
      try {
        payload = await cloned.json();
      } catch {
        payload = await res.text();
      }
    } catch {
      payload = null;
    }
    const message =
      (payload as { message?: string } | null)?.message ?? res.statusText;
    throw new ApiError(message, res.status, payload);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const raw = (await res.json()) as T | { success: boolean; data?: T; meta?: unknown };
  // The backend wraps every successful response in { success: true, data, meta? }.
  if (raw && typeof raw === "object" && "success" in raw) {
    if ("meta" in raw && (raw as { meta?: unknown }).meta) {
      const envelope = raw as { data?: T; meta?: unknown; [k: string]: unknown };
      const metaObj =
        typeof envelope.meta === "object" && envelope.meta !== null ? (envelope.meta as Record<string, unknown>) : {};
      const counts = (envelope as any).counts ?? metaObj.counts;
      const total = (envelope as any).total ?? metaObj.total;
      return {
        ...envelope,
        data: envelope.data,
        items: envelope.data,
        meta: envelope.meta,
        counts,
        total,
      } as unknown as T;
    }
    return (raw as { data?: T }).data as T;
  }
  return raw as T;
}

export const http = {
  get: <T,>(path: string, options?: ApiClientOptions) => apiClient<T>(path, options),
  post: <T,>(path: string, body?: unknown, options?: ApiClientOptions) =>
    apiClient<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    }),
  patch: <T,>(path: string, body?: unknown, options?: ApiClientOptions) =>
    apiClient<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    }),
  put: <T,>(path: string, body?: unknown, options?: ApiClientOptions) =>
    apiClient<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    }),
  delete: <T,>(path: string, options?: ApiClientOptions) => apiClient<T>(path, { method: "DELETE", ...options }),
  upload: <T,>(path: string, formData: FormData, options?: ApiClientOptions) =>
    apiClient<T>(path, {
      method: "POST",
      body: formData,
      ...options,
    }),
};