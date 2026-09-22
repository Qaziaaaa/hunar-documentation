export type FaqCategory = "all" | "pricing" | "safety" | "booking" | "guarantee";

export interface FaqItem {
  id: string;
  category: "pricing" | "safety" | "booking" | "guarantee";
  question: string;
  answer: string;
  badge?: string;
  isPopular?: boolean;
}

export type TicketIssueType =
  | "incomplete"
  | "damage"
  | "noshow"
  | "pricing"
  | "quality"
  | "safety"
  | "other";

export type TicketPriority = "normal" | "high" | "urgent";

export type TicketResolutionPreference = "rework" | "replacement" | "callback";

export type TicketStatus =
  | "submitted"
  | "under_review"
  | "in_investigation"
  | "resolved";

export interface SupportTicketTimelineStep {
  title: string;
  timestamp: string;
  status: "completed" | "current" | "upcoming";
  iconName?: string;
}

export interface SupportTicket {
  id: string;
  caseNumber: string;
  jobReference: string;
  serviceTitle: string;
  workerName: string;
  location: string;
  issueType: TicketIssueType;
  issueTitle: string;
  priority: TicketPriority;
  description: string;
  resolutionPreference: TicketResolutionPreference;
  status: TicketStatus;
  statusLabel: string;
  createdAt: string;
  lastUpdate: string;
  estimatedResolutionTime: string;
  timeline: SupportTicketTimelineStep[];
  attachments?: string[];
  notesCount?: number;
}

export interface CustomerJobReferenceOption {
  id: string;
  jobNumber: string;
  title: string;
  workerName: string;
  category: string;
  date: string;
  status: string;
  amount?: number;
}

export interface HelplineDeskInfo {
  hotlineNumber: string;
  hotlineDisplay: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  supportEmail: string;
  hoursDisplay: string;
  deskLocation: string;
  avgResolutionTime: string;
  resolutionRateText: string;
  isDeskOnline: boolean;
}
