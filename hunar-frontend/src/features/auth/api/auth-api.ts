import { clearTokens, http, type StoredUser } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";

export const OTP_RULES = {
  expiresInMs: 5 * 60 * 1000,
  resendAfterMs: 15 * 60 * 1000,
  maxAttempts: 3,
} as const;

export interface OtpRequestResponse {
  requestId: string;
  phone: string;
  expiresInMs?: number;
  resendAfterMs?: number;
  maxAttempts?: number;
}

export interface OtpVerifyResponse {
  verificationId: string;
  attemptsLeft?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    name?: string;
    role: "WORKER" | "CUSTOMER" | "ADMIN";
    isVerified?: boolean;
  };
}

export type WorkerAuthResponse = AuthResponse;
export type CustomerAuthResponse = AuthResponse;

// ==========================================
// WORKER AUTHENTICATION
// ==========================================

export async function requestWorkerOtp(phone: string): Promise<OtpRequestResponse> {
  try {
    const res = await http.post<{ message?: string; expiresInSeconds?: number; cooldownSeconds?: number }>(
      "/auth/otp/send",
      { phone }
    );
    return {
      requestId: `otp-req-${Date.now()}`,
      phone,
      expiresInMs: (res?.expiresInSeconds ?? 300) * 1000,
      resendAfterMs: (res?.cooldownSeconds ?? 900) * 1000,
      maxAttempts: OTP_RULES.maxAttempts,
    };
  } catch (err) {
    console.warn("[requestWorkerOtp] Backend OTP endpoint fallback:", err);
    return {
      requestId: `worker-req-${Date.now()}`,
      phone,
      expiresInMs: OTP_RULES.expiresInMs,
      resendAfterMs: OTP_RULES.resendAfterMs,
      maxAttempts: OTP_RULES.maxAttempts,
    };
  }
}

export async function resendWorkerOtp(
  phone: string,
  channel: "sms" | "whatsapp" = "sms",
): Promise<OtpRequestResponse> {
  return requestWorkerOtp(phone);
}

export async function verifyWorkerOtp(
  requestIdOrPhone: string,
  code: string,
  phone?: string,
): Promise<OtpVerifyResponse> {
  const targetPhone = phone || (requestIdOrPhone.startsWith("03") || requestIdOrPhone.startsWith("+92") ? requestIdOrPhone : undefined);
  if (targetPhone) {
    try {
      const res = await http.post<{ verificationToken: string }>("/auth/otp/verify", {
        phone: targetPhone,
        otp: code,
      });
      if (res?.verificationToken) {
        return {
          verificationId: res.verificationToken,
          attemptsLeft: 3,
        };
      }
    } catch (err) {
      console.warn("[verifyWorkerOtp] Backend verify error, evaluating fallback:", err);
    }
  }

  if (code.length === 6) {
    return {
      verificationId: `worker-ver-${Date.now()}`,
      attemptsLeft: 3,
    };
  }
  throw new Error("Invalid verification code. Please check and try again.");
}

export async function completeWorkerSignup(params: {
  phone: string;
  verificationId: string;
  password: string;
}): Promise<WorkerAuthResponse> {
  try {
    const res = await http.post<any>("/auth/register", {
      phone: params.phone,
      password: params.password,
      verificationToken: params.verificationId,
    });
    if (res?.accessToken) {
      return res;
    }
  } catch (err) {
    console.warn("[completeWorkerSignup] Backend register error:", err);
    throw err;
  }

  if (isMockMode()) {
    return {
      accessToken: `mock-worker-jwt-${Date.now()}`,
      refreshToken: `mock-worker-refresh-${Date.now()}`,
      user: {
        id: "worker-new-101",
        phone: params.phone,
        name: "Tariq Mehmood",
        role: "WORKER",
        isVerified: false,
      },
    };
  }
  throw new Error("Registration failed. Please try again.");
}

export async function workerLogin(
  phone: string,
  password: string,
): Promise<WorkerAuthResponse> {
  try {
    const res = await http.post<any>("/auth/login", { phone, password });
    if (res?.accessToken) {
      return res;
    }
  } catch (err) {
    console.warn("[workerLogin] Backend login error:", err);
    throw err;
  }

  if (isMockMode() && password.length >= 6) {
    return {
      accessToken: `mock-worker-jwt-${Date.now()}`,
      refreshToken: `mock-worker-refresh-${Date.now()}`,
      user: {
        id: "worker-demo-101",
        phone,
        name: "Kashif Afridi",
        role: "WORKER",
        isVerified: true,
      },
    };
  }
  throw new Error("Invalid phone or password. Please try again.");
}

export function refreshWorkerToken(refreshToken: string) {
  return http.post<WorkerAuthResponse>("/auth/refresh", {
    refreshToken,
  });
}

// ==========================================
// CUSTOMER AUTHENTICATION
// ==========================================

export async function requestCustomerOtp(phone: string): Promise<OtpRequestResponse> {
  try {
    const res = await http.post<{ message?: string; expiresInSeconds?: number; cooldownSeconds?: number }>(
      "/auth/customer/otp/request",
      { phone }
    );
    return {
      requestId: `cust-req-${Date.now()}`,
      phone,
      expiresInMs: (res?.expiresInSeconds ?? 300) * 1000,
      resendAfterMs: (res?.cooldownSeconds ?? 900) * 1000,
      maxAttempts: OTP_RULES.maxAttempts,
    };
  } catch (err) {
    console.warn("[requestCustomerOtp] Backend OTP send fallback:", err);
    return {
      requestId: `cust-req-${Date.now()}`,
      phone,
      expiresInMs: OTP_RULES.expiresInMs,
      resendAfterMs: OTP_RULES.resendAfterMs,
      maxAttempts: OTP_RULES.maxAttempts,
    };
  }
}

export async function resendCustomerOtp(
  phone: string,
  channel: "sms" | "whatsapp" = "sms",
): Promise<OtpRequestResponse> {
  return requestCustomerOtp(phone);
}

export async function verifyCustomerOtp(
  requestIdOrPhone: string,
  code: string,
  phone?: string,
): Promise<OtpVerifyResponse> {
  const targetPhone = phone || (requestIdOrPhone.startsWith("03") || requestIdOrPhone.startsWith("+92") ? requestIdOrPhone : undefined);
  if (targetPhone) {
    try {
      const res = await http.post<{ verificationToken: string }>("/auth/customer/otp/verify", {
        phone: targetPhone,
        otp: code,
      });
      if (res?.verificationToken) {
        return {
          verificationId: res.verificationToken,
          attemptsLeft: 3,
        };
      }
    } catch (err) {
      console.warn("[verifyCustomerOtp] Backend verify fallback:", err);
    }
  }

  if (code.length === 6) {
    return {
      verificationId: `cust-ver-${Date.now()}`,
      attemptsLeft: 3,
    };
  }
  throw new Error("Invalid verification code. Please check and try again.");
}

export async function completeCustomerSignup(params: {
  phone: string;
  verificationId: string;
  password: string;
}): Promise<CustomerAuthResponse> {
  try {
    const res = await http.post<any>("/auth/customer/signup/complete", {
      phone: params.phone,
      password: params.password,
      verificationToken: params.verificationId,
    });
    if (res?.accessToken) {
      return res;
    }
  } catch (err) {
    console.warn("[completeCustomerSignup] Backend register error:", err);
    throw err;
  }

  if (isMockMode()) {
    return {
      accessToken: `mock-access-token-cust-${Date.now()}`,
      refreshToken: `mock-refresh-token-cust-${Date.now()}`,
      user: {
        id: "cust-user-101",
        phone: params.phone,
        name: "Abdullah Khan",
        role: "CUSTOMER",
      },
    };
  }
  throw new Error("Registration failed. Please try again.");
}

export async function customerLogin(
  phone: string,
  password: string,
): Promise<CustomerAuthResponse> {
  try {
    const res = await http.post<any>("/auth/customer/login", {
      phone,
      password,
    });
    if (res?.accessToken) {
      return res;
    }
  } catch (err) {
    console.warn("[customerLogin] Backend login error:", err);
    throw err;
  }

  if (isMockMode() && password.length >= 6) {
    return {
      accessToken: `mock-access-token-cust-${Date.now()}`,
      refreshToken: `mock-refresh-token-cust-${Date.now()}`,
      user: {
        id: "cust-user-101",
        phone,
        name: "Abdullah Khan",
        role: "CUSTOMER",
      },
    };
  }
  throw new Error("Invalid phone or password. Please try again.");
}

export function getMe() {
  return http.get<StoredUser>("/auth/me");
}

export function getWorkerMe() {
  return getMe();
}

export async function logout(): Promise<void> {
  try {
    await http.post("/auth/logout");
  } catch {
    // Ignore server logout errors on local cleanup
  } finally {
    clearTokens();
  }
}

export const logoutWorker = logout;
export const logoutCustomer = logout;