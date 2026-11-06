import { clearTokens, http, type StoredUser } from "@/lib/api-client";

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
  /** Provided by the API while no SMS gateway is connected (OTP_DEBUG). */
  devOtp?: string;
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
    avatarUrl?: string;
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
  const res = await http.post<{ message?: string; expiresInSeconds?: number; cooldownSeconds?: number; devOtp?: string }>(
    "/auth/otp/send",
    { phone }
  );
  return {
    requestId: `otp-req-${Date.now()}`,
    phone,
    expiresInMs: (res?.expiresInSeconds ?? 300) * 1000,
    resendAfterMs: (res?.cooldownSeconds ?? 900) * 1000,
    maxAttempts: OTP_RULES.maxAttempts,
    devOtp: res?.devOtp,
  };
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
  if (!targetPhone) {
    throw new Error("Phone number is required for OTP verification.");
  }
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
  throw new Error("Invalid verification code. Please check and try again.");
}

export async function completeWorkerSignup(params: {
  phone: string;
  verificationId: string;
  password: string;
}): Promise<WorkerAuthResponse> {
  const res = await http.post<any>("/auth/register", {
    phone: params.phone,
    password: params.password,
    verificationToken: params.verificationId,
  });
  if (res?.accessToken) {
    return res;
  }
  throw new Error("Registration failed. Please try again.");
}

export async function workerLogin(
  phone: string,
  password: string,
): Promise<WorkerAuthResponse> {
  const res = await http.post<any>("/auth/login", { phone, password });
  if (res?.accessToken) {
    return res;
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
  const res = await http.post<{ message?: string; expiresInSeconds?: number; cooldownSeconds?: number; devOtp?: string }>(
    "/auth/customer/otp/request",
    { phone }
  );
  return {
    requestId: `cust-req-${Date.now()}`,
    phone,
    expiresInMs: (res?.expiresInSeconds ?? 300) * 1000,
    resendAfterMs: (res?.cooldownSeconds ?? 900) * 1000,
    maxAttempts: OTP_RULES.maxAttempts,
    devOtp: res?.devOtp,
  };
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
  if (!targetPhone) {
    throw new Error("Phone number is required for OTP verification.");
  }
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
  throw new Error("Invalid verification code. Please check and try again.");
}

export async function completeCustomerSignup(params: {
  phone: string;
  verificationId: string;
  password: string;
}): Promise<CustomerAuthResponse> {
  const res = await http.post<any>("/auth/customer/signup/complete", {
    phone: params.phone,
    password: params.password,
    verificationToken: params.verificationId,
  });
  if (res?.accessToken) {
    return res;
  }
  throw new Error("Registration failed. Please try again.");
}

export async function customerLogin(
  phone: string,
  password: string,
): Promise<CustomerAuthResponse> {
  const res = await http.post<any>("/auth/customer/login", {
    phone,
    password,
  });
  if (res?.accessToken) {
    return res;
  }
  throw new Error("Invalid phone or password. Please try again.");
}

export function getMe() {
  return http.get<StoredUser>("/auth/me");
}

export function getWorkerMe() {
  return getMe();
}

export async function logout(role?: "WORKER" | "CUSTOMER" | "ADMIN"): Promise<void> {
  try {
    await http.post("/auth/logout");
  } catch {
    // Ignore server logout errors on local cleanup
  } finally {
    clearTokens(role);
  }
}

export const logoutWorker = () => logout("WORKER");
export const logoutCustomer = () => logout("CUSTOMER");