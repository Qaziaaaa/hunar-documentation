import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type {
  UpdateWorkerProfileInput,
  WorkerProfile,
} from "@/types/worker";
import { mockWorkerProfile } from "@/mocks/profile.mock";
import { MOCK_WORKER_ID } from "@/mocks/jobs.mock";

let mockProfile: WorkerProfile = { ...mockWorkerProfile };

export async function getWorkerProfile(): Promise<WorkerProfile> {
  if (isMockMode()) {
    return simulateLatency({ ...mockProfile });
  }
  return http.get<WorkerProfile>(`/users/me`);
}

export async function updateWorkerProfile(
  input: UpdateWorkerProfileInput,
): Promise<WorkerProfile> {
  if (isMockMode()) {
    await simulateLatency(undefined, 500, 1000);
    mockProfile = { ...mockProfile, ...input };
    return { ...mockProfile };
  }
  return http.patch<WorkerProfile>(`/users/me`, input);
}

export async function updateProfileAvatar(
  avatarUrl: string,
): Promise<WorkerProfile> {
  if (isMockMode()) {
    await simulateLatency(undefined, 400, 900);
    mockProfile = { ...mockProfile, avatarUrl };
    return { ...mockProfile };
  }
  return http.patch<WorkerProfile>(`/users/me`, { avatarUrl });
}

export async function updateProfileVisibility(
  profileVisible: boolean,
): Promise<WorkerProfile> {
  if (isMockMode()) {
    await simulateLatency(undefined, 300, 700);
    mockProfile = { ...mockProfile, profileVisible };
    return { ...mockProfile };
  }
  return http.patch<WorkerProfile>(`/users/me`, {
    privacy: { profileVisible },
  });
}

export const queryKeys = {
  profile: (workerId: string = MOCK_WORKER_ID) =>
    ["worker", "profile", workerId] as const,
};