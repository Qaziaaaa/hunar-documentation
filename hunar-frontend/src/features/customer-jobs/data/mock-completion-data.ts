import { JobCompletionData } from "../types";
import { MOCK_WORKER_PROFILES } from "./mock-customer-jobs";

export const MOCK_JOB_COMPLETION_MAP: Record<string, JobCompletionData> = {
  "job-1": {
    jobId: "job-1",
    jobNumber: "#HN-9821",
    serviceTitle: "Main DB Breaker & Wiring Overhaul",
    worker: MOCK_WORKER_PROFILES["worker-1"] || {
      id: "worker-1",
      name: "Tariq Shah",
      businessName: "Shah Electrical Solutions",
      avatarUrl:
        "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80",
      phone: "+92 301 8492011",
      rating: 4.9,
      totalReviews: 124,
      jobSuccessRate: 98,
      completedJobsCount: 124,
      responseTime: "< 15m",
      tradeCategory: "Electrician",
      serviceArea: "Central Residency & Model Town",
      experienceYears: 8,
      bio: "Master Electrician with 8+ years experience in heavy distribution boards, Schneider breakers, and load calculations.",
      isCnicVerified: true,
      isNadraCleared: true,
      isPoliceCleared: true,
      hunarBadgeId: "#OW-4821",
      expertiseTags: ["Breaker Replacement", "DB Wiring", "Load Balancing"],
      workProjects: [],
      reviews: [],
      ratingBreakdown: {
        fiveStar: 90,
        fourStar: 8,
        threeStar: 2,
        twoStar: 0,
        oneStar: 0,
      },
    },
    completedAt: "Today, 4:18 PM",
    address: "House 45, Street 12, Main Residency",
    evidencePhotos: [
      {
        id: "ev-1",
        type: "before",
        title: "Overheating Main DB Breaker",
        description: "Carbon buildup and loose thermal terminal detected on 63A main switch.",
        timestamp: "14:12 PKT",
        imageUrl:
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "ev-2",
        type: "after",
        title: "New Schneider 63A Breaker Fitted",
        description: "Heavy-duty modular breaker installed, terminals torqued, and load balanced.",
        timestamp: "16:15 PKT",
        imageUrl:
          "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
      },
    ],
    technicianReport:
      "Replaced damaged 63A main double-pole breaker with genuine Schneider modular unit. Re-crimped copper cable terminations and load-tested with full household ACs activated simultaneously for 15 minutes. Zero voltage drop or thermal warming detected. Standard 5-day WorkerFIX craftsmanship guarantee applies automatically.",
    technicalSpecsNote: "Voltage: 232V Steady • Max Load Tested: 38 Amps",
    warrantyDays: 5,
    billingItems: [
      {
        id: "b-1",
        title: "Electrical Diagnostics & Installation Labor",
        description: "DB disassembly, terminal crimping, installation & continuous load test",
        amount: 1400,
      },
      {
        id: "b-2",
        title: "Materials: Genuine Schneider 63A DP Breaker",
        description: "Original packaged component with manufacturer serial tag",
        amount: 800,
      },
    ],
    totalAmount: 2200,
  },

  "job-2": {
    jobId: "job-2",
    jobNumber: "#HN-4790",
    serviceTitle: "Split AC Gas Refill & Cooling Service",
    worker: MOCK_WORKER_PROFILES["worker-1"],
    completedAt: "Yesterday, 3:45 PM",
    address: "Flat 4B, Pine Heights, Sector 4",
    evidencePhotos: [
      {
        id: "ev-3",
        type: "before",
        title: "Low Refrigerant Pressure (25 PSI)",
        description: "Suction line iced up due to pinhole flare nut leak.",
        timestamp: "11:30 PKT",
        imageUrl:
          "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "ev-4",
        type: "after",
        title: "Leak Repaired & Charged to 135 PSI (R410A)",
        description: "Copper flare redone, vacuum pump cycle completed, gas topped up.",
        timestamp: "14:10 PKT",
        imageUrl:
          "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
      },
    ],
    technicianReport:
      "Detected pinhole leak at outdoor unit brass flare connector. Cut and flared fresh 1/2 inch copper line, purged system with nitrogen, pulled deep vacuum to 500 microns, and charged 850 grams of virgin R410A refrigerant. Supply grill temperature dropped to a crisp 11.2°C at 18°C setpoint.",
    technicalSpecsNote: "Operating Suction Pressure: 135 PSI • Delta T: 14°C",
    warrantyDays: 5,
    billingItems: [
      {
        id: "b-3",
        title: "AC Leak Repair, Vacuuming & Refill Labor",
        description: "Nitrogen leak testing, flare cutting, deep vacuuming & gas charging",
        amount: 2000,
      },
      {
        id: "b-4",
        title: "Materials: Virgin R410A Refrigerant (850g)",
        description: "High-purity sealed cylinder refrigerant + brass flare nuts",
        amount: 1500,
      },
    ],
    totalAmount: 3500,
  },
};
