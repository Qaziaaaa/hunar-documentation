import type {
  WorkerDashboardProfile,
  DashboardNotification,
} from "./types";

export const INITIAL_WORKER_PROFILE: WorkerDashboardProfile = {
  id: "w-0921-pesh",
  workerId: "HNR-PK-9824",
  fullName: "Muhammad Tariq Khan",
  phone: "0314-5829103",
  isVerified: true,
  isOnline: true,
  rating: 4.8,
  reviewCount: 38,
  activeJobsCount: 2,
  completedJobsCount: 46,
  totalEarnings: 24500,
  totalCommissionPaid: 2450,
  pendingCommission: 150,
  walletBalance: 0,
  experienceYears: 6,
  bio: "Certified electrical & home maintenance technician. Expert in circuit breakers, UPS wiring, AC servicing, and emergency residential repairs across Peshawar.",
  skills: ["Electrician", "AC Technician", "Plumber"],
  serviceAreas: ["Hayatabad", "University Town", "Saddar", "Gulbahar", "Ring Road"],
  city: "Peshawar",
};

export const INITIAL_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: "notif-1",
    title: "Verification Approved",
    message: "Your CNIC and pro credentials have been approved. You are now verified.",
    time: "2 hours ago",
    read: false,
    type: "verification",
  },
  {
    id: "notif-2",
    title: "System Update",
    message: "Welcome to HUNAR Worker Portal.",
    time: "1 day ago",
    read: true,
    type: "job",
  },
];
