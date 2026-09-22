"use client";

import { useEffect, useState } from "react";
import { JobRequest, JobFeedFilters } from "@/types/job";
import { VisitOffer, CounterHistoryItem } from "@/types/offer";
import { InspectionReport } from "@/types/inspection";
import { getSocket } from "@/lib/socket";

const INITIAL_JOBS: JobRequest[] = [
  {
    id: "job-101",
    title: "Instant Geyser Pilot Burner Not Igniting & Gas Odor",
    category: "Plumber",
    urgency: "emergency",
    problemSummary: "Gas water heater pilot flame keeps blowing out with mild gas smell in laundry area.",
    description:
      "Our Fischer instant gas geyser's pilot burner does not catch flame even after multiple ignition attempts. When forced, there is a mild gas odor. Need an experienced technician with gas leakage detection tools to safely inspect and repair before evening.",
    location: {
      area: "Hayatabad Phase 3, Peshawar",
      city: "Peshawar",
      distanceKm: 1.8,
      fullAddress: "House 42, Street 7, Sector F-2, Hayatabad Phase 3, Peshawar",
      coordinates: { lat: 33.987, lng: 71.432 },
    },
    postedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    postedAgo: "12 mins ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "11:30 AM - 01:00 PM",
    },
    customerSuggestedPrice: 500,
    photos: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
    ],
    voiceNote: {
      url: "https://actions.google.com/sounds/v1/ambiences/humming_fridge.ogg",
      durationSeconds: 18,
      waveform: [30, 45, 75, 90, 60, 40, 80, 100, 85, 50, 65, 40, 30, 70, 95, 80, 50, 20],
    },
    customer: {
      id: "cust-1",
      name: "Mrs. Arifa Khan",
      phone: "+92 300 9876543",
      rating: 4.9,
      totalReviews: 28,
      area: "Hayatabad Phase 3",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 0,
    status: "open",
  },
  {
    id: "job-102",
    title: "Concealed Toilet Flush Tank Leakage & Float Valve Jam",
    category: "Plumber",
    urgency: "standard",
    problemSummary: "In-wall Grohe toilet cistern is continuously overflowing into bowl.",
    description:
      "Water is running non-stop into the toilet commode from the concealed wall fixture. The float shut-off mechanism appears calcified or dislodged. Requires careful removal of the actuator faceplate without cracking tiles.",
    location: {
      area: "University Town, Circular Rd",
      city: "Peshawar",
      distanceKm: 3.2,
      fullAddress: "Bungalow 18-A, Old Jamrud Rd, University Town, Peshawar",
      coordinates: { lat: 34.004, lng: 71.488 },
    },
    postedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    postedAgo: "35 mins ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "02:00 PM - 04:00 PM",
    },
    customerSuggestedPrice: 600,
    photos: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-2",
      name: "Dr. Farooq Shah",
      phone: "+92 312 8765432",
      rating: 4.8,
      totalReviews: 15,
      area: "University Town",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 2,
    status: "open",
  },
  {
    id: "job-103",
    title: "Main Distribution Board Tripping & Burnt Circuit Breaker",
    category: "Electrician",
    urgency: "emergency",
    problemSummary: "63A main double-pole breaker overheating and tripping ground floor lights.",
    description:
      "The main breaker panel emitted sparks and burning plastic smell. Half the house has lost electricity. Need immediate visit to check load balancing, replace faulty breaker, and inspect wiring joints.",
    location: {
      area: "Gulberg III, Sector B",
      city: "Peshawar",
      distanceKm: 2.1,
      fullAddress: "Flat 402, Al-Razi Heights, Gulberg III, Peshawar",
      coordinates: { lat: 34.015, lng: 71.535 },
    },
    postedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    postedAgo: "45 mins ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "Scheduled Arrival: 11:30 AM",
    },
    customerSuggestedPrice: 800,
    photos: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    ],
    voiceNote: {
      url: "https://actions.google.com/sounds/v1/ambiences/humming_fridge.ogg",
      durationSeconds: 24,
      waveform: [40, 60, 90, 80, 50, 70, 100, 95, 60, 45, 80, 75, 40, 25],
    },
    customer: {
      id: "cust-3",
      name: "Ahmed Khan",
      phone: "+92 333 1234567",
      rating: 5.0,
      totalReviews: 42,
      area: "Gulberg III",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 1,
    status: "accepted", // Active pre-visit job by default for immediate testing
  },
  {
    id: "job-104",
    title: "1.5 Ton Inverter AC Gas Leakage & Cooling Coil Inspection",
    category: "AC Technician",
    urgency: "standard",
    problemSummary: "Gree inverter AC blowing warm air, error code E6 on display.",
    description:
      "The outdoor unit runs for 3 minutes and then shuts off. Unit was serviced 2 months ago. Suspecting refrigerant leak at flared copper joints. Bring nitrogen pressure gauge and R410A gas kit.",
    location: {
      area: "Saddar Cantonment, Peshawar",
      city: "Peshawar",
      distanceKm: 4.5,
      fullAddress: "House 12-B, The Mall Road, Saddar Peshawar Cantt",
      coordinates: { lat: 34.008, lng: 71.551 },
    },
    postedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    postedAgo: "1 hour ago",
    preferredVisitWindow: {
      date: "Tomorrow, 25 Oct",
      timeSlot: "10:00 AM - 12:00 PM",
    },
    customerSuggestedPrice: 1000,
    photos: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-4",
      name: "Sardar Bilal",
      phone: "+92 345 5544332",
      rating: 4.7,
      totalReviews: 19,
      area: "Saddar Cantt",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 3,
    status: "open",
  },
  {
    id: "job-105",
    title: "Kitchen Cabinet Hydraulic Hinges & Sliding Track Repair",
    category: "Carpenter",
    urgency: "standard",
    problemSummary: "Two soft-close cabinet doors fallen off hinges, drawer track seized.",
    description:
      "Wood screws in the particle board frame came loose. Need reinforced hardwood inserts or new heavy-duty clip-on hinges installed. Also one pantry drawer slider ball-bearing is stuck.",
    location: {
      area: "Warsak Road Officers Colony",
      city: "Peshawar",
      distanceKm: 5.6,
      fullAddress: "Street 4, Sector C, Officers Colony, Warsak Road, Peshawar",
      coordinates: { lat: 34.041, lng: 71.521 },
    },
    postedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    postedAgo: "2 hours ago",
    preferredVisitWindow: {
      date: "Tomorrow, 25 Oct",
      timeSlot: "03:00 PM - 05:00 PM",
    },
    customerSuggestedPrice: 500,
    photos: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-5",
      name: "Tariq Javed",
      phone: "+92 301 7766554",
      rating: 4.9,
      totalReviews: 31,
      area: "Warsak Road",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 1,
    status: "counter_received", // In counter-offer negotiation by default for immediate testing
  },
  {
    id: "job-106",
    title: "Exterior Boundary Wall Weather-Shield & Main Gate Enamel",
    category: "Painter",
    urgency: "flexible",
    problemSummary: "45-foot front wall painting + scraping rust off iron boundary gate.",
    description:
      "Front boundary wall has monsoon rain streaks and peeling paint. Need scraping, acrylic putty filling, and two coats of weather-shield paint. Metal gate requires red oxide primer + black enamel.",
    location: {
      area: "DHA Phase 1, Ring Road",
      city: "Peshawar",
      distanceKm: 7.2,
      fullAddress: "Plot 88, Sector A, DHA Peshawar",
      coordinates: { lat: 33.972, lng: 71.411 },
    },
    postedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    postedAgo: "3 hours ago",
    preferredVisitWindow: {
      date: "Flexible this weekend",
      timeSlot: "Anytime morning",
    },
    customerSuggestedPrice: 400,
    photos: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-6",
      name: "Malik Zubair",
      phone: "+92 321 4433221",
      rating: 4.6,
      totalReviews: 8,
      area: "DHA Phase 1",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 0,
    status: "open",
  },
  {
    id: "job-107",
    title: "Honda 3.5kVA Generator Carburetor Overhaul & Oil Change",
    category: "Mechanic",
    urgency: "standard",
    problemSummary: "Generator surging under load, spark plug fouled with black soot.",
    description:
      "Gasoline generator RPM fluctuates wildly when AC is turned on. Requires carburetor sonic bath or needle valve cleaning, fresh 20W-50 oil replacement, and governor spring adjustment.",
    location: {
      area: "Kohat Road Industrial Area",
      city: "Peshawar",
      distanceKm: 8.5,
      fullAddress: "Factory Compound, Kohat Road, Peshawar",
      coordinates: { lat: 33.955, lng: 71.528 },
    },
    postedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    postedAgo: "4 hours ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "05:00 PM - 07:00 PM",
    },
    customerSuggestedPrice: 700,
    photos: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-7",
      name: "Usman Durrani",
      phone: "+92 334 9988776",
      rating: 4.8,
      totalReviews: 12,
      area: "Kohat Road",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 4,
    status: "open",
  },
];

const INITIAL_OFFERS: Record<string, VisitOffer> = {
  "job-103": {
    id: "off-103",
    jobId: "job-103",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 800,
    platformCommission: 80,
    workerNetEarnings: 720,
    message: "Certified electrician with clamp meter and spare breaker stock. Will reach in 25 mins.",
    status: "accepted",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 800,
        message: "Offer of Rs. 800 sent.",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 800,
  },
  "job-105": {
    id: "off-105",
    jobId: "job-105",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 600,
    platformCommission: 60,
    workerNetEarnings: 540,
    message: "Experienced carpenter. I will bring German clip-on hinges and track rollers.",
    status: "counter_received",
    createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    currentRound: 2,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 600,
        message: "Original visit quote Rs. 600.",
        createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
      },
      {
        round: 2,
        sender: "customer",
        amount: 400,
        message: "Can you do Rs. 400? It's just a 15-minute hinge adjustment.",
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
    ],
    customerCounterAmount: 400,
    customerCounterMessage: "Can you do Rs. 400? It's just a 15-minute hinge adjustment.",
  },
};

export interface WorkerState {
  jobs: JobRequest[];
  offers: Record<string, VisitOffer>; // jobId -> VisitOffer
  inspectionReports: Record<string, InspectionReport>; // jobId -> InspectionReport
  filters: JobFeedFilters;
  workerOnline: boolean;
  walletBalance: number; // PKR (Rs.)
  walletHold: number; // Commission hold
  workerSkills: string[];
  workerArea: string;
}

const defaultFilters: JobFeedFilters = {
  category: "all",
  maxDistanceKm: 15,
  area: "Peshawar",
  sortBy: "fresh_first",
  onlyWithoutOffers: false,
  hideFarJobs: false,
};

let globalState: WorkerState = {
  jobs: INITIAL_JOBS,
  offers: INITIAL_OFFERS,
  inspectionReports: {},
  filters: defaultFilters,
  workerOnline: true,
  walletBalance: 1250, // Positive balance for testing (above -500 Rs. threshold)
  walletHold: 80, // Hold for active job 103
  workerSkills: ["Plumber", "Electrician", "AC Technician", "Carpenter", "Painter", "Mechanic"],
  workerArea: "Peshawar Urban Sector",
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const workerStore = {
  getState() {
    return globalState;
  },

  setFilter(update: Partial<JobFeedFilters>) {
    globalState = {
      ...globalState,
      filters: { ...globalState.filters, ...update },
    };
    notify();
  },

  resetFilters() {
    globalState = {
      ...globalState,
      filters: defaultFilters,
    };
    notify();
  },

  toggleOnline() {
    globalState = {
      ...globalState,
      workerOnline: !globalState.workerOnline,
    };
    notify();
  },

  setWalletBalance(amount: number) {
    globalState = {
      ...globalState,
      walletBalance: amount,
    };
    notify();
  },

  // Task 4 & Rule: One offer per job
  sendVisitOffer(jobId: string, visitCharge: number, message?: string): { success: boolean; error?: string } {
    if (globalState.offers[jobId]) {
      return {
        success: false,
        error: "You have already sent an offer for this job. Only ONE offer per job is permitted.",
      };
    }

    const commission = Math.round(visitCharge * 0.1); // 10% platform commission
    const net = visitCharge - commission;

    const newOffer: VisitOffer = {
      id: `off-${Date.now()}`,
      jobId,
      workerId: "worker-me",
      workerName: "Shahzad Ahmad",
      visitCharge,
      platformCommission: commission,
      workerNetEarnings: net,
      message,
      status: "sent",
      createdAt: new Date().toISOString(),
      currentRound: 1,
      maxRounds: 3,
      counterHistory: [
        {
          round: 1,
          sender: "worker",
          amount: visitCharge,
          message: message ?? "Visit offer submitted.",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    globalState = {
      ...globalState,
      offers: {
        ...globalState.offers,
        [jobId]: newOffer,
      },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "offer_sent" as const, totalOffers: j.totalOffers + 1 } : j
      ),
    };
    notify();

    // Trigger simulated socket or backend ping
    const s = getSocket();
    s?.emit("job:offer:submit", { jobId, visitCharge, message });

    return { success: true };
  },

  // Task 6: Accept customer's counter offer
  acceptCounterOffer(jobId: string): boolean {
    const offer = globalState.offers[jobId];
    if (!offer || !offer.customerCounterAmount) return false;

    const agreedPrice = offer.customerCounterAmount;
    const commission = Math.round(agreedPrice * 0.1);
    const net = agreedPrice - commission;

    const updatedOffer: VisitOffer = {
      ...offer,
      visitCharge: agreedPrice,
      platformCommission: commission,
      workerNetEarnings: net,
      agreedVisitCharge: agreedPrice,
      status: "accepted",
      counterHistory: [
        ...offer.counterHistory,
        {
          round: offer.currentRound,
          sender: "worker",
          amount: agreedPrice,
          message: `Agreed to customer counter offer of Rs. ${agreedPrice}. Price locked.`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    globalState = {
      ...globalState,
      offers: {
        ...globalState.offers,
        [jobId]: updatedOffer,
      },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "accepted" as const } : j
      ),
    };
    notify();
    return true;
  },

  // Task 6: Send worker counter-offer (Bounded Rounds: max 3)
  sendWorkerCounter(jobId: string, counterAmount: number, message?: string): { success: boolean; error?: string } {
    const offer = globalState.offers[jobId];
    if (!offer) return { success: false, error: "Offer not found" };

    if (offer.currentRound >= offer.maxRounds) {
      return {
        success: false,
        error: `Maximum negotiation rounds (${offer.maxRounds}) reached. No further counters allowed.`,
      };
    }

    const nextRound = offer.currentRound + 1;
    const commission = Math.round(counterAmount * 0.1);
    const net = counterAmount - commission;

    const updatedHistory: CounterHistoryItem[] = [
      ...offer.counterHistory,
      {
        round: nextRound,
        sender: "worker",
        amount: counterAmount,
        message: message ?? `Worker countered with Rs. ${counterAmount}`,
        createdAt: new Date().toISOString(),
      },
    ];

    const updatedOffer: VisitOffer = {
      ...offer,
      visitCharge: counterAmount,
      platformCommission: commission,
      workerNetEarnings: net,
      currentRound: nextRound,
      status: "sent",
      counterHistory: updatedHistory,
      customerCounterAmount: undefined,
      customerCounterMessage: undefined,
    };

    globalState = {
      ...globalState,
      offers: {
        ...globalState.offers,
        [jobId]: updatedOffer,
      },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "offer_sent" as const } : j
      ),
    };
    notify();
    return { success: true };
  },

  // Task 8a: Start Visit -> visit_in_progress
  startVisit(jobId: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "visit_in_progress" as const } : j
      ),
    };
    notify();
  },

  // Task 8b: I've Arrived -> visit_completed
  // Checks 10% commission hold from wallet.
  arriveAtSite(jobId: string): { success: boolean; error?: string; requiredHold?: number } {
    const job = globalState.jobs.find((j) => j.id === jobId);
    const offer = globalState.offers[jobId];
    const visitCharge = offer?.agreedVisitCharge ?? offer?.visitCharge ?? job?.customerSuggestedPrice ?? 500;
    const requiredHold = Math.round(visitCharge * 0.1); // 10% platform commission

    // Check wallet balance
    if (globalState.walletBalance < requiredHold) {
      return {
        success: false,
        error: "Insufficient wallet balance. Please top up before arriving.",
        requiredHold,
      };
    }

    globalState = {
      ...globalState,
      walletHold: globalState.walletHold + requiredHold,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "visit_completed" as const } : j
      ),
    };
    notify();
    return { success: true, requiredHold };
  },

  // Task 8c: Start Inspection -> inspecting
  startInspection(jobId: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "inspecting" as const } : j
      ),
    };
    notify();
  },

  // Task 8d: Submit Inspection -> 5 required fields
  submitInspection(
    jobId: string,
    report: Omit<InspectionReport, "jobId" | "submittedAt">
  ): { success: boolean; error?: string } {
    if (!report.diagnosis?.trim()) {
      return { success: false, error: "Diagnosis is required." };
    }
    if (!report.repairPlan?.trim()) {
      return { success: false, error: "Repair plan is required." };
    }
    if (!report.repairPriceEstimate || report.repairPriceEstimate <= 0) {
      return { success: false, error: "A valid repair price estimate (Rs.) is required." };
    }
    if (!report.photos || report.photos.length === 0) {
      return { success: false, error: "At least one inspection photo is required as evidence." };
    }
    if (!report.estimatedRepairTime?.trim()) {
      return { success: false, error: "Estimated repair time is required." };
    }

    const fullReport: InspectionReport = {
      jobId,
      ...report,
      submittedAt: new Date().toISOString(),
    };

    globalState = {
      ...globalState,
      inspectionReports: {
        ...globalState.inspectionReports,
        [jobId]: fullReport,
      },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "inspection_submitted" as const } : j
      ),
    };
    notify();
    return { success: true };
  },

  // Cancel Job (Active pre-visit)
  cancelJob(jobId: string, reason: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "cancelled" as const } : j
      ),
    };
    notify();
  },

  // Simulation: Another worker assigned (Real-time Socket.IO trigger)
  simulateClosedAssigned(jobId: string) {
    const offer = globalState.offers[jobId];
    if (offer) {
      globalState = {
        ...globalState,
        offers: {
          ...globalState.offers,
          [jobId]: { ...offer, status: "closed_assigned" },
        },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "closed_assigned" as const } : j
        ),
      };
      notify();
    }
  },

  // Simulation: Customer viewing offer
  simulateCustomerViewing(jobId: string) {
    const offer = globalState.offers[jobId];
    if (offer && offer.status === "sent") {
      globalState = {
        ...globalState,
        offers: {
          ...globalState.offers,
          [jobId]: { ...offer, status: "viewing" },
        },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "customer_viewing" as const } : j
        ),
      };
      notify();
    }
  },

  // Simulation: Customer sent counter
  simulateCustomerCounter(jobId: string, counterAmount: number, message: string) {
    const offer = globalState.offers[jobId];
    if (offer) {
      const nextRound = offer.currentRound + 1;
      const updatedHistory: CounterHistoryItem[] = [
        ...offer.counterHistory,
        {
          round: nextRound,
          sender: "customer",
          amount: counterAmount,
          message,
          createdAt: new Date().toISOString(),
        },
      ];

      globalState = {
        ...globalState,
        offers: {
          ...globalState.offers,
          [jobId]: {
            ...offer,
            currentRound: nextRound,
            status: "counter_received",
            customerCounterAmount: counterAmount,
            customerCounterMessage: message,
            counterHistory: updatedHistory,
          },
        },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "counter_received" as const } : j
        ),
      };
      notify();
    }
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// React Hook for consuming the store
export function useWorkerJobs() {
  const [state, setState] = useState<WorkerState>(workerStore.getState());

  useEffect(() => {
    return workerStore.subscribe(() => {
      setState(workerStore.getState());
    });
  }, []);

  return state;
}
