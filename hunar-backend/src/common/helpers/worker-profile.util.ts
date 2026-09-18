// Worker profile completion rules shared by the onboarding/submission flow and the jobs gate.
// A worker may only see jobs when the profile is COMPLETE (all five required steps) AND verified.

export const WORKER_PROFILE_STEPS = [
  'BASIC_INFORMATION',
  'SKILLS',
  'EXPERIENCE',
  'SERVICE_AREAS',
  'VERIFICATION_DOCUMENTS',
] as const;

export type WorkerProfileStepName = (typeof WORKER_PROFILE_STEPS)[number];

export interface WorkerProfileCompletionInput {
  name: string | null;
  avatarUrl: string | null;
  skills: string[];
  experienceYears: number | null;
  bio: string | null;
  serviceAreaCount: number;
  cnicFrontUrl: string | null;
  cnicBackUrl: string | null;
}

export interface WorkerProfileCompletion {
  complete: boolean;
  missingSteps: WorkerProfileStepName[];
}

export const WORKER_PROFILE_TOTAL_STEPS = WORKER_PROFILE_STEPS.length;

export function getWorkerProfileCompletion(
  input: WorkerProfileCompletionInput,
): WorkerProfileCompletion {
  const missingSteps: WorkerProfileStepName[] = [];

  if (!input.name?.trim() || !input.avatarUrl?.trim()) {
    missingSteps.push('BASIC_INFORMATION');
  }
  if (input.skills.length === 0) {
    missingSteps.push('SKILLS');
  }
  if (input.experienceYears === null || input.experienceYears === undefined || !input.bio?.trim()) {
    missingSteps.push('EXPERIENCE');
  }
  if (input.serviceAreaCount === 0) {
    missingSteps.push('SERVICE_AREAS');
  }
  if (!input.cnicFrontUrl?.trim() || !input.cnicBackUrl?.trim()) {
    missingSteps.push('VERIFICATION_DOCUMENTS');
  }

  return {
    complete: missingSteps.length === 0,
    missingSteps: [...new Set(missingSteps)],
  };
}
