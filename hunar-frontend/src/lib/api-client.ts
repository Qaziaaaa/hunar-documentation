const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

export const ACCESS_TOKEN_KEY = "hunar.access_token";
export const REFRESH_TOKEN_KEY = "hunar.refresh_token";
export const AUTH_USER_KEY = "hunar.auth_user";

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

export interface StoredUser {
  id: string;
  phone: string;
  name?: string;
  role: "WORKER" | "CUSTOMER" | "ADMIN";
  isVerified?: boolean;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
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
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
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
    // Attempt worker refresh endpoint first, fallback to generic auth refresh
    let res = await fetch(`${API_URL}/auth/worker/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = (await res.json()) as {
      accessToken: string;
      refreshToken?: string;
      user?: StoredUser;
    };

    if (!data.accessToken) {
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

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Handle 401 Unauthorized via Silent Token Refresh (once per request)
  const isAuthEndpoint =
    path.includes("/auth/login") ||
    path.includes("/auth/worker/login") ||
    path.includes("/auth/worker/signup") ||
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

  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => apiClient<T>(path),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(path, {
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    }),
  put: <T>(path: string, body?: unknown, options?: RequestInit) =>
    apiClient<T>(path, {
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
      ...options,
    }),
  delete: <T>(path: string) => apiClient<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData, options?: RequestInit) =>
    apiClient<T>(path, {
      method: "POST",
      body: formData,
      ...options,
    }),
};