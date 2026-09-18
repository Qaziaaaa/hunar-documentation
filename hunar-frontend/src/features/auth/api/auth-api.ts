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
}

export interface OtpVerifyResponse {
  verificationId: string;
  attemptsLeft?: number;
}

export interface WorkerAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    name?: string;
    role: "WORKER";
    isVerified?: boolean;
  };
}

export function requestWorkerOtp(phone: string) {
  return http.post<OtpRequestResponse>("/auth/worker/otp/request", { phone });
}

export function resendWorkerOtp(
  phone: string,
  channel: "sms" | "whatsapp" = "sms",
) {
  return http.post<OtpRequestResponse>("/auth/worker/otp/resend", {
    phone,
    channel,
  });
}

export function verifyWorkerOtp(requestId: string, code: string) {
  return http.post<OtpVerifyResponse>("/auth/worker/otp/verify", {
    requestId,
    code,
  });
}

export function completeWorkerSignup(params: {
  phone: string;
  verificationId: string;
  password: string;
}) {
  return http.post<WorkerAuthResponse>("/auth/worker/signup", params);
}

export function workerLogin(phone: string, password: string) {
  return http.post<WorkerAuthResponse>("/auth/worker/login", {
    phone,
    password,
  });
}

export function refreshWorkerToken(refreshToken: string) {
  return http.post<WorkerAuthResponse>("/auth/worker/refresh", {
    refreshToken,
  });
}

export function getWorkerMe() {
  return http.get<StoredUser>("/auth/me");
}

export async function logoutWorker(): Promise<void> {
  try {
    await http.post("/auth/logout");
  } catch {
    // Ignore server logout errors on local cleanup
  } finally {
    clearTokens();
  }
}