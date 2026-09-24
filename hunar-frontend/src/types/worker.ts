export interface WorkerDocument {
  id: string;
  name: string;
  url: string;
  verified: boolean;
  submittedAt: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  completedJobs: number;
  skills: string[];
  categories: string[];
  yearsExperience: number;
  bio: string;
  workshopLocation: string; // Fixed shop / workshop base address
  serviceAreas: string[]; // Service coverage areas / sectors
  defaultVisitCharge?: number;
  documents: WorkerDocument[];
  profileVisible: boolean;
}

export interface UpdateWorkerProfileInput {
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  yearsExperience?: number;
  workshopLocation?: string;
  serviceAreas?: string[];
  defaultVisitCharge?: number;
  documents?: WorkerDocument[];
}

export interface WorkerSession {
  workerId: string;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}