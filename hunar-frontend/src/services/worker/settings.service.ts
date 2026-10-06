import { http } from "@/lib/api-client";
import type {
  AccountDeleteInput,
  ChangePasswordInput,
  PrivacySettings,
} from "@/types/settings";
import { getWorkerSession, logoutWorker } from "./session.service";

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  await http.put(`/auth/change-password`, input);
}

export async function deleteAccount(
  input: AccountDeleteInput,
): Promise<void> {
  await http.delete(`/users/me?confirmation=${encodeURIComponent(input.confirmationText)}`);
}

export async function getPrivacySettings(): Promise<PrivacySettings> {
  return http.get<PrivacySettings>(`/users/me/privacy`);
}

export async function updatePrivacySettings(
  input: Partial<PrivacySettings>,
): Promise<PrivacySettings> {
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