import type { WorkerProfile } from "@/types/worker";
import { isoDaysAgo } from "./utils";

export const mockWorkerProfile: WorkerProfile = {
  id: "worker-demo-1",
  name: "Faizan Ahmed",
  phone: "+92 300 1234567",
  avatarUrl: "",
  isVerified: true,
  rating: 4.8,
  reviewsCount: 12,
  completedJobs: 6,
  skills: ["Electrical wiring", "Socket replacement", "Circuit breaker", "Lighting"],
  categories: ["Electrical", "Light fixture repair"],
  yearsExperience: 3,
  bio: "Certified electrician with 3+ years of experience in residential wiring, repairs and maintenance across Peshawar.",
  serviceAreas: ["University Town", "Hayatabad", "Defence", "Cantt"],
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