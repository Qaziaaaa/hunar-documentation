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

export const SKILL_TO_CATEGORY_NAMES: Record<string, string[]> = {
  Plumber: ['Plumbing', 'Plumber'],
  Plumbing: ['Plumbing', 'Plumber'],
  Electrician: ['Electrical', 'Electrician'],
  Electrical: ['Electrical', 'Electrician'],
  'AC Technician': ['AC & Refrigeration', 'AC Technician', 'AC Repair'],
  'AC & Refrigeration': ['AC & Refrigeration', 'AC Technician', 'AC Repair'],
  Carpenter: ['Carpentry', 'Carpenter'],
  Carpentry: ['Carpentry', 'Carpenter'],
  Painter: ['Painting', 'Painter'],
  Painting: ['Painting', 'Painter'],
  Cleaning: ['Cleaning', 'Cleaner'],
  Cleaner: ['Cleaning', 'Cleaner'],
  Mason: ['Masonry', 'Mason'],
  Masonry: ['Masonry', 'Mason'],
  'Pest Control': ['Pest Control'],
  'General Handyman': ['General Handyman'],
  Mechanic: ['General Handyman', 'Mechanic'],
  'Solar Technician': ['General Handyman', 'Solar Technician'],
  Welder: ['General Handyman', 'Welder'],
  'Appliance Repair': ['General Handyman', 'Appliance Repair'],
};

export function expandSkillNames(skills: string[] = []): string[] {
  if (!skills || skills.length === 0) return [];
  const expanded = new Set<string>();
  for (const s of skills) {
    if (s && typeof s === 'string') {
      expanded.add(s);
      const mapped = SKILL_TO_CATEGORY_NAMES[s];
      if (mapped) {
        for (const m of mapped) expanded.add(m);
      }
    }
  }
  return Array.from(expanded);
}
