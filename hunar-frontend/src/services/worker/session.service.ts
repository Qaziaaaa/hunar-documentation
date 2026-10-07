import type { WorkerSession } from "@/types/worker";
import { getAccessToken, clearTokens } from "@/lib/api-client";

export function getWorkerSession(): WorkerSession {
  if (typeof window === "undefined") {
    return { workerId: "", isAuthenticated: false, isDemoMode: false };
  }
  const token = getAccessToken();
  if (token) {
    return {
      workerId: "",
      isAuthenticated: true,
      isDemoMode: false,
    };
  }
  return {
    workerId: "",
    isAuthenticated: false,
    isDemoMode: false,
  };
}

export function logoutWorker(): void {
  clearTokens();
}

export const queryKeys = {
  session: ["worker", "session"] as const,
};