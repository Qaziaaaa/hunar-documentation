import type { WorkerProfile } from "@/types/worker";
import { isoDaysAgo } from "./utils";

export const mockWorkerProfile: WorkerProfile = {
  id: "worker-demo-1",
  name: "Faizan Ahmed",
  phone: "+92 300 1234567",
  email: "faizan.ahmed@hunar.pk",
  avatarUrl: "",
  isVerified: true,
  rating: 4.8,
  reviewsCount: 12,
  completedJobs: 14,
  skills: ["Electrical wiring", "Socket replacement", "Circuit breaker", "Lighting"],
  categories: ["Electrical", "Light fixture repair"],
  yearsExperience: 3,
  bio: "Certified electrician with 3+ years of experience in residential wiring, repairs and maintenance across Peshawar.",
  workshopLocation: "Shop #14, Main Saddar Road, Peshawar Cantt",
  serviceAreas: ["University Town", "Hayatabad", "Saddar", "Defence"],
  defaultVisitCharge: 300,
  documents: [
    {
      id: "doc-1",
      name: "CNIC Front",
      url: "/mocks/cnic-front.png",
      verified: true,
      submittedAt: isoDaysAgo(20, 9),
    },
    {
      id: "doc-2",
      name: "CNIC Back",
      url: "/mocks/cnic-back.png",
      verified: true,
      submittedAt: isoDaysAgo(20, 9),
    },
  ],
  profileVisible: true,
};