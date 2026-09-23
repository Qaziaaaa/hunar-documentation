import type { WorkerSession } from "@/types/worker";
import { getAccessToken, clearTokens } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";
import { MOCK_WORKER_ID } from "@/mocks/jobs.mock";

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
    workerId: isMockMode() ? MOCK_WORKER_ID : "",
    isAuthenticated: true,
    isDemoMode: isMockMode(),
  };
}

export function logoutWorker(): void {
  clearTokens();
}

export const queryKeys = {
  session: ["worker", "session"] as const,
};