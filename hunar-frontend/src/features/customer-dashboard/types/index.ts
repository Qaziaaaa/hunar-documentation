export type JobStatus =
  | "RECEIVING_OFFERS"
  | "VISIT_SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  city: string;
  area: string;
  avatarInitials: string;
}

export interface CustomerStats {
  activeJobs: number;
  activeJobsDelta: string;
  pendingOffers: number;
  pendingOffersDelta: string;
  upcomingBookings: number;
  upcomingBookingsLabel: string;
  completedJobs: number;
  completedJobsLabel: string;
  totalSpent: number;
  monthlySpent: number;
  monthName: string;
}

export interface CustomerJob {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  offersCount: number;
  postedDate: string;
  status: JobStatus;
  statusLabel: string;
  assignedWorker?: {
    name: string;
    avatarInitials: string;
    avatarUrl?: string;
    isVerified: boolean;
    rating: number;
    trades: string;
  };
}

export interface UpcomingBooking {
  id: string;
  jobId: string;
  jobTitle: string;
  serviceItem: string;
  scheduledDate: string;
  month: string;
  day: string;
  timeSlot: string;
  slotLabel: string;
  worker: {
    name: string;
    avatarUrl?: string;
    avatarInitials: string;
    title: string;
    rating: number;
    reviewsCount: number;
    isVerified: boolean;
  };
  baseCharge: number;
  address: string;
  completionOtp: string;
}

export interface NearbyWorker {
  id: string;
  name: string;
  profession: string;
  category: string;
  rating: number;
  reviewsCount: number;
  ordersCount: number;
  distance: string;
  isVerified: boolean;
  basePrice: number;
  avatarInitials: string;
  availableNow: boolean;
}

export interface CustomerActivity {
  id: string;
  text: string;
  timestamp: string;
  type: "quote" | "payment" | "booking" | "completed";
}
