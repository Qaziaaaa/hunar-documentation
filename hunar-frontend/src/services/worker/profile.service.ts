import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type {
  UpdateWorkerProfileInput,
  WorkerProfile,
} from "@/types/worker";
import { mockWorkerProfile } from "@/mocks/profile.mock";
import { MOCK_WORKER_ID } from "@/mocks/jobs.mock";

const emptyWorkerProfile: WorkerProfile = {
  id: "",
  name: "",
  phone: "",
  email: "",
  avatarUrl: "",
  isVerified: false,
  rating: 5.0,
  reviewsCount: 0,
  completedJobs: 0,
  skills: [],
  categories: [],
  yearsExperience: 0,
  bio: "",
  workshopLocation: "",
  serviceAreas: [],
  defaultVisitCharge: 300,
  documents: [],
  profileVisible: true,
};

let mockProfile: WorkerProfile = { ...mockWorkerProfile };

export function mapBackendWorkerProfile(raw: any): WorkerProfile {
  if (!raw) return emptyWorkerProfile;

  // If already matches WorkerProfile structure (e.g. from mock or test mock)
  if (
    raw.id &&
    raw.name &&
    typeof raw.rating === "number" &&
    Array.isArray(raw.skills) &&
    !raw.user &&
    !raw.workerProfile
  ) {
    return {
      ...raw,
      rating: typeof raw.rating === "number" ? raw.rating : 5.0,
      reviewsCount: typeof raw.reviewsCount === "number" ? raw.reviewsCount : 0,
      completedJobs: typeof raw.completedJobs === "number" ? raw.completedJobs : 0,
      serviceAreas: Array.isArray(raw.serviceAreas)
        ? raw.serviceAreas.map((a: any) =>
            typeof a === "string" ? a : a.label || a.address || ""
          )
        : [],
    };
  }

  const u = raw.user ?? raw;
  const wp = raw.workerProfile;

  const workshopArea = Array.isArray(raw.serviceAreas)
    ? raw.serviceAreas.find(
        (a: any) =>
          a.label === "Workshop" ||
          a.label?.toLowerCase()?.includes("workshop")
      )
    : null;

  const coverageAreas = Array.isArray(raw.serviceAreas)
    ? raw.serviceAreas
        .filter(
          (a: any) =>
            a.label !== "Workshop" &&
            !a.label?.toLowerCase()?.includes("workshop")
        )
        .map((a: any) =>
          (typeof a === "string" ? a : a.label || a.address || "").trim()
        )
        .filter(Boolean)
    : [];

  const allServiceAreaStrings = Array.isArray(raw.serviceAreas)
    ? raw.serviceAreas
        .map((a: any) =>
          (typeof a === "string" ? a : a.label || a.address || "").trim()
        )
        .filter(Boolean)
    : [];

  const docs = Array.isArray(raw.documents)
    ? raw.documents.map((d: any) => ({
        id: d.id || d.type || String(Math.random()),
        name: d.fileName || d.type || "Document",
        url: d.url || "",
        verified: Boolean(d.verified || wp?.verificationStatus === "APPROVED"),
        submittedAt: d.uploadedAt || d.submittedAt || new Date().toISOString(),
      }))
    : [];

  const categoryNames = Array.isArray(wp?.skillCategories)
    ? wp.skillCategories.map((c: any) => c.name)
    : raw.categories ?? [];

  return {
    id: u.id ?? raw.id ?? "",
    name: u.name ?? raw.name ?? "",
    phone: u.phone ?? raw.phone ?? "",
    email: u.email ?? raw.email ?? "",
    avatarUrl: u.avatarUrl ?? raw.avatarUrl ?? "",
    isVerified: wp?.verificationStatus === "APPROVED" || Boolean(raw.isVerified),
    rating:
      typeof raw.rating === "number"
        ? raw.rating
        : typeof raw.rating?.average === "number"
        ? raw.rating.average
        : typeof wp?.rating === "number"
        ? wp.rating
        : 5.0,
    reviewsCount:
      typeof raw.reviewsCount === "number"
        ? raw.reviewsCount
        : typeof raw.rating?.count === "number"
        ? raw.rating.count
        : typeof wp?.reviewsCount === "number"
        ? wp.reviewsCount
        : 0,
    completedJobs:
      typeof raw.completedJobs === "number"
        ? raw.completedJobs
        : typeof wp?.completedJobs === "number"
        ? wp.completedJobs
        : !isNaN(Number(raw.completedJobs))
        ? Number(raw.completedJobs)
        : 0,
    skills: wp?.skills ?? raw.skills ?? [],
    categories: categoryNames,
    yearsExperience: wp?.experienceYears ?? raw.yearsExperience ?? 0,
    bio: wp?.bio ?? raw.bio ?? "",
    workshopLocation:
      workshopArea?.address ??
      raw.workshopLocation ??
      (allServiceAreaStrings.length > 0 ? allServiceAreaStrings[0] : ""),
    serviceAreas:
      coverageAreas.length > 0
        ? coverageAreas
        : allServiceAreaStrings,
    defaultVisitCharge: raw.defaultVisitCharge ?? 300,
    documents: docs,
    profileVisible:
      wp?.isAvailable ??
      (typeof raw.profileVisible === "boolean" ? raw.profileVisible : true),
  };
}

export async function getWorkerProfile(): Promise<WorkerProfile> {
  if (isMockMode()) {
    return simulateLatency({ ...mockProfile });
  }
  const raw = await http.get<WorkerProfile>(`/users/me`);
  return mapBackendWorkerProfile(raw);
}

export async function updateWorkerProfile(
  input: UpdateWorkerProfileInput,
): Promise<WorkerProfile> {
  if (isMockMode()) {
    await simulateLatency(undefined, 500, 1000);
    mockProfile = { ...mockProfile, ...input };
    return { ...mockProfile };
  }
  const raw = await http.patch<WorkerProfile>(`/users/me`, input);
  return mapBackendWorkerProfile(raw);
}

export async function updateProfileAvatar(
  avatarUrl: string,
): Promise<WorkerProfile> {
  if (isMockMode()) {
    await simulateLatency(undefined, 400, 900);
    mockProfile = { ...mockProfile, avatarUrl };
    return { ...mockProfile };
  }
  const raw = await http.patch<WorkerProfile>(`/users/me`, { avatarUrl });
  return mapBackendWorkerProfile(raw);
}

export async function updateProfileVisibility(
  profileVisible: boolean,
): Promise<WorkerProfile> {
  if (isMockMode()) {
    await simulateLatency(undefined, 300, 700);
    mockProfile = { ...mockProfile, profileVisible };
    return { ...mockProfile };
  }
  const raw = await http.patch<WorkerProfile>(`/users/me`, {
    privacy: { profileVisible },
  });
  return mapBackendWorkerProfile(raw);
}

export const queryKeys = {
  profile: (workerId: string = MOCK_WORKER_ID) =>
    ["worker", "profile", workerId] as const,
};