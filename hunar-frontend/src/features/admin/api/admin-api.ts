import { apiClient } from "@/lib/api-client";
import type {
  AdminKpiStats,
  AuditLogEntry,
  CustomerUser,
  DisputeReport,
  LiveJobItem,
  PaymentTransaction,
  PlatformSettings,
  VerificationRequest,
  WithdrawalRequest,
  WorkerUser,
} from "@/types/admin";
import {
  MOCK_ADMIN_KPIS,
  MOCK_AUDIT_LOGS,
  MOCK_DISPUTES,
  MOCK_LIVE_JOBS,
  MOCK_PAYMENTS,
  MOCK_SETTINGS,
  MOCK_VERIFICATIONS,
  MOCK_WITHDRAWALS,
  MOCK_WORKERS,
} from "@/mocks/admin.mock";

export async function fetchAdminKpis(): Promise<AdminKpiStats> {
  try {
    const data = await apiClient<AdminKpiStats>("/admin/kpis");
    if (data) return data;
  } catch {
    // Backend API unavailable; fallback to mock data
  }
  return MOCK_ADMIN_KPIS;
}

export async function fetchPendingVerifications(): Promise<VerificationRequest[]> {
  try {
    const data = await apiClient<VerificationRequest[]>("/admin/verifications/pending");
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return MOCK_VERIFICATIONS;
}

export async function approveWorkerVerification(userId: string): Promise<boolean> {
  try {
    await apiClient(`/admin/verifications/${userId}/approve`, { method: "PUT" });
    return true;
  } catch {
    return false;
  }
}

export async function rejectWorkerVerification(userId: string, reason: string): Promise<boolean> {
  try {
    await apiClient(`/admin/verifications/${userId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchRecentTransactions(): Promise<PaymentTransaction[]> {
  try {
    const data = await apiClient<PaymentTransaction[]>("/admin/transactions");
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return MOCK_PAYMENTS;
}

export async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  try {
    const data = await apiClient<WithdrawalRequest[]>("/admin/withdrawals");
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return MOCK_WITHDRAWALS;
}

export async function processWithdrawalRequest(
  id: string,
  action: "approve" | "reject",
  note?: string,
): Promise<boolean> {
  try {
    await apiClient(`/admin/withdrawals/${id}/process`, {
      method: "PUT",
      body: JSON.stringify({ action, note }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchDisputesQueue(): Promise<DisputeReport[]> {
  try {
    const data = await apiClient<DisputeReport[]>("/admin/disputes");
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return MOCK_DISPUTES;
}

export async function resolveDispute(
  id: string,
  action: "refund_customer" | "release_worker" | "split" | "dismiss",
  resolutionNotes?: string,
): Promise<boolean> {
  try {
    await apiClient(`/admin/disputes/${id}/resolve`, {
      method: "PUT",
      body: JSON.stringify({ action, resolutionNotes }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchLiveJobsStream(): Promise<LiveJobItem[]> {
  try {
    const data = await apiClient<LiveJobItem[]>("/admin/jobs");
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return MOCK_LIVE_JOBS;
}

export async function fetchAuditLogsFeed(): Promise<AuditLogEntry[]> {
  try {
    const data = await apiClient<AuditLogEntry[]>("/admin/audit");
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return MOCK_AUDIT_LOGS;
}

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  try {
    const data = await apiClient<PlatformSettings>("/admin/settings");
    if (data) return data;
  } catch {
    // Fallback
  }
  return MOCK_SETTINGS;
}

export async function updatePlatformSettings(
  settings: Partial<PlatformSettings>,
): Promise<boolean> {
  try {
    await apiClient("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchTopWorkers(): Promise<WorkerUser[]> {
  try {
    const data = await apiClient<WorkerUser[]>("/admin/workers");
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return MOCK_WORKERS;
}

export async function fetchCustomers(): Promise<CustomerUser[]> {
  try {
    const data = await apiClient<CustomerUser[]>("/admin/customers");
    if (Array.isArray(data)) return data;
  } catch {
    // Fallback
  }
  return [];
}
