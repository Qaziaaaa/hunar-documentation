export interface WorkerProfileFormData {
  // Step 1: Personal Details
  fullName: string;
  email: string;
  phone: string;
  city: string;
  profilePhoto: string; // Base64 / URL
  profilePhotoName?: string;

  // Step 2: Skills / Services
  skills: string[];

  // Step 3: Experience & Qualifications
  experienceYears: string;
  bio: string;
  certificateFile?: string; // Base64 / URL
  certificateName?: string;

  // Step 4: Service Areas (Peshawar)
  serviceAreas: string[];
  coverageRadius: string;
  primaryAddress: string;

  // Step 5: Verification Documents (Smart CNIC)
  cnicFront: string; // Base64 / URL (Required)
  cnicFrontName?: string;
  cnicBack: string; // Base64 / URL (Required)
  cnicBackName?: string;
  cnicNumber?: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | "success";

export interface SkillOption {
  id: string;
  label: string;
  labelUr: string;
  iconName: string;
  category: string;
}
