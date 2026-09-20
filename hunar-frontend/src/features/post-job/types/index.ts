export type ServiceCategory =
  | "plumber"
  | "electrician"
  | "ac-technician"
  | "carpenter"
  | "painter"
  | "cleaner"
  | "solar-technician"
  | "welder"
  | "cctv-security"
  | "mason-mistry"
  | "gardener"
  | "pest-control"
  | "movers";

export interface SubCategoryItem {
  id: string;
  name: string;
}

export type ScheduleType = "asap" | "scheduled";

export type TimeWindowOption = "morning" | "afternoon" | "evening" | "specific";

export interface PostJobData {
  category: ServiceCategory | "";
  subCategory: string;
  title: string;
  description: string;
  photos: string[];
  voiceNoteUrl?: string;
  voiceNoteDuration?: number;
  address: string;
  area: string;
  city: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  scheduleType: ScheduleType;
  preferredDate: string;
  preferredTimeSlot: string;
  suggestedVisitFee: number;
}

export type PostJobStep = 1 | 2 | 3 | 4;
