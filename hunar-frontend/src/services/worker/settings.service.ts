import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type {
  AccountDeleteInput,
  ChangePasswordInput,
  PrivacySettings,
} from "@/types/settings";
import { getWorkerSession, logoutWorker } from "./session.service";

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    return;
  }
  await http.put(`/auth/change-password`, input);
}

export async function deleteAccount(
  input: AccountDeleteInput,
): Promise<void> {
  if (isMockMode()) {
    await simulateLatency(undefined, 800, 1500);
    return;
  }
  await http.delete(`/users/me?confirmation=${encodeURIComponent(input.confirmationText)}`);
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  if (isMockMode()) {
    return simulateLatency({ profileVisible: true, showVisitCharge: true });
  }
  return http.get<PrivacySettings>(`/users/me/privacy`);
}

export async function updatePrivacySettings(
  input: Partial<PrivacySettings>,
): Promise<PrivacySettings> {
  if (isMockMode()) {
    await simulateLatency(undefined, 300, 700);
    return {
      profileVisible: input.profileVisible ?? true,
      showVisitCharge: input.showVisitCharge ?? true,
    };
  }
  return http.patch<PrivacySettings>(`/users/me/privacy`, input);
}

export function signOut(): void {
  logoutWorker();
}

export function isDemoSession(): boolean {
  return getWorkerSession().isDemoMode;
}

export const queryKeys = {
  privacy: ["worker", "settings", "privacy"] as const,
};