export type VerificationOutcome =
  | "pending"
  | "approved"
  | "rejected"
  | "request_changes";

export interface VerificationChangeRequestItem {
  id: string;
  field: string;
  title: string;
  adminNote: string;
  stepNumber: number;
}

export interface WorkerVerificationData {
  status: VerificationOutcome;
  workerId: string;
  fullName: string;
  phone: string;
  skills: string[];
  city: string;
  serviceAreas: string[];
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  changeRequests?: VerificationChangeRequestItem[];
  profilePhoto?: string;
  tradeCertificateName?: string;
  cnicNumber?: string;
}
