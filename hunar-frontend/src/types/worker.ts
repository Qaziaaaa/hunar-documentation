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
  avatarUrl?: string;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  completedJobs: number;
  skills: string[];
  categories: string[];
  yearsExperience: number;
  bio: string;
  serviceAreas: string[];
  defaultVisitCharge?: number;
  documents: WorkerDocument[];
  profileVisible: boolean;
}

export interface UpdateWorkerProfileInput {
  name?: string;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  yearsExperience?: number;
  serviceAreas?: string[];
  defaultVisitCharge?: number;
  documents?: WorkerDocument[];
}

export interface WorkerSession {
  workerId: string;
  isAuthenticated: boolean;
  isDemoMode: boolean;
}