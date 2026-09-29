import {
  CustomerJobReferenceOption,
  FaqItem,
  HelplineDeskInfo,
  SupportTicket,
} from "../types";

export const MOCK_FAQS: FaqItem[] = [
  // PRICING & DIRECT PAYMENTS
  {
    id: "faq-price-1",
    category: "pricing",
    question: "How does the Rs. 300 doorstep visit fee work?",
    answer:
      "Every booking includes a standard Rs. 300 doorstep visit & diagnostic charge. Once the verified technician arrives and inspects the site, they provide an exact quote based on necessary labor and spare parts. If you proceed with the repair, the quotation is transparently finalized before work begins.",
    badge: "Transparent Rates",
    isPopular: true,
  },
  {
    id: "faq-price-2",
    category: "pricing",
    question: "How and when do I pay the technician?",
    answer:
      "You pay directly to the technician only AFTER the job is completed and inspected to your total satisfaction. You can pay via Cash, JazzCash, EasyPaisa, or Raast instant bank transfer.",
    badge: "Direct Payment",
    isPopular: true,
  },
  {
    id: "faq-price-3",
    category: "pricing",
    question: "Are there any hidden platform charges or commission markups?",
    answer:
      "Zero hidden markups. The amount agreed upon during the technician's on-site quote is the exact total you pay. WorkerFIX believes in fair, transparent pricing on all home service bookings.",
  },
  {
    id: "faq-price-4",
    category: "pricing",
    question: "What if the technician demands extra money beyond the agreed quote?",
    answer:
      "Technicians are strictly bound by the agreed digital quote on your job order. Never pay undocumented cash surcharges. If a pro requests extra without scope change, report immediately via our 24/7 customer helpline or open a direct ticket.",
  },

  // SAFETY PIN & DOORSTEP CHECKLIST
  {
    id: "faq-safety-1",
    category: "safety",
    question: "What is the 4-digit Safety PIN and how do I use it?",
    answer:
      "For your family's protection, a unique 4-digit Safety PIN is generated when you book any visit. When the technician reaches your doorstep, ask for the PIN or have them verify it to ensure they are the exact authorized WorkerFIX professional.",
    badge: "Doorstep Security",
    isPopular: true,
  },
  {
    id: "faq-safety-2",
    category: "safety",
    question: "Are all technicians NADRA CNIC verified and background checked?",
    answer:
      "Yes, 100%. Every technician on WorkerFIX undergoes strict biometric NADRA CNIC verification, police background checks, hands-on trade skill testing, and phone verification before being admitted to our verified network.",
    badge: "100% Verified",
    isPopular: true,
  },
  {
    id: "faq-safety-3",
    category: "safety",
    question: "What should I do if an unrecognized person arrives instead?",
    answer:
      "Do NOT allow anyone into your home whose face or details do not match the photo profile on your active visit screen. Report the incident instantly using the Emergency Help hotline at 091-5840000.",
  },
  {
    id: "faq-safety-4",
    category: "safety",
    question: "What safety precautions do technicians follow on visits?",
    answer:
      "All technicians carry official WorkerFIX photo badges, bring proper insulated safety gear/tools, and follow a strict household decorum checklist.",
  },

  // BOOKING & RESCHEDULING
  {
    id: "faq-booking-1",
    category: "booking",
    question: "Can I reschedule or cancel a booked visit?",
    answer:
      "Yes, you can easily reschedule or cancel your visit free of charge directly from the Visits tab up to 1 hour prior to the technician's scheduled arrival window.",
    badge: "Flexible Schedule",
    isPopular: true,
  },
  {
    id: "faq-booking-2",
    category: "booking",
    question: "What if the technician is delayed due to traffic or weather?",
    answer:
      "You can monitor the technician's live route progress in real time on the arrival tracker map. If delayed, you can tap the direct call button or our operations desk will proactively notify you with updated ETA.",
  },
  {
    id: "faq-booking-3",
    category: "booking",
    question: "Can I add more repair tasks once the technician is at my home?",
    answer:
      "Yes. Simply inform the technician of additional fixtures or tasks. They will update the work scope and quote on-site for your approval before starting.",
  },

  // QUALITY & GUARANTEE
  {
    id: "faq-guarantee-1",
    category: "guarantee",
    question: "What is the WorkerFIX 5-Day Craftsmanship Warranty?",
    answer:
      "If a repaired plumbing pipe leaks, an electrical breaker trips, or an AC unit malfunctions within 5 days of completion, WorkerFIX dispatches the technician back for a 100% free rework or sends an Elite specialist at zero extra charge.",
    badge: "5-Day Warranty",
    isPopular: true,
  },
  {
    id: "faq-guarantee-2",
    category: "guarantee",
    question: "How fast does the Customer Support Desk resolve complaints?",
    answer:
      "Our average first-response time is under 20 minutes, with a full mediation turnaround averaging 1.8 hours. Over 94% of customer inquiries are resolved on the same day.",
  },
  {
    id: "faq-guarantee-3",
    category: "guarantee",
    question: "How does dispute mediation work?",
    answer:
      "When you submit a ticket with photo or video evidence, our dedicated operations officers inspect the case, contact both parties, and ensure immediate corrective action, re-service, or replacement pro dispatch.",
  },
];

export const MOCK_CUSTOMER_JOBS: CustomerJobReferenceOption[] = [
  {
    id: "job-1",
    jobNumber: "#JOB-4821",
    title: "Main DB Breaker & Wiring Inspection",
    workerName: "Tariq Shah (Master Electrician)",
    category: "Electrician",
    date: "Today, 02:30 PM",
    status: "Confirmed Visit",
    amount: 1200,
  },
  {
    id: "job-2",
    jobNumber: "#JOB-4790",
    title: "Split AC Gas Refill & Cooling Service",
    workerName: "Farhan Khattak (HVAC Pro)",
    category: "HVAC",
    date: "Yesterday, 11:00 AM",
    status: "Completed",
    amount: 3500,
  },
  {
    id: "job-3",
    jobNumber: "#JOB-4620",
    title: "Sanitary Bathroom Leak & Seal Fix",
    workerName: "Rashid Ali (Plumber)",
    category: "Plumbing",
    date: "Oct 24, 03:00 PM",
    status: "Under Review",
    amount: 2000,
  },
  {
    id: "job-4",
    jobNumber: "#JOB-4510",
    title: "Ceiling Fan Bearing Replacement",
    workerName: "Kamran Khan (Electrician)",
    category: "Electrician",
    date: "Oct 18, 04:00 PM",
    status: "Completed",
    amount: 850,
  },
];

export const MOCK_ACTIVE_TICKET: SupportTicket = {
  id: "ticket-4491",
  caseNumber: "CASE-4491",
  jobReference: "#JOB-4620",
  serviceTitle: "Sanitary Bathroom Leak & Seal Fix",
  workerName: "Rashid Ali (Plumber)",
  location: "Sector 3, Main Residency",
  issueType: "incomplete",
  issueTitle: "Unresolved Leak & Incomplete Seal",
  priority: "high",
  description:
    "Joint fixture underneath master bathroom sink was left partially unsealed. Small water drops continue to leak onto vanity cabinet when main supply line is turned on.",
  resolutionPreference: "rework",
  status: "in_investigation",
  statusLabel: "Operations Investigation",
  createdAt: "Today, 03:15 PM",
  lastUpdate: "15 mins ago",
  estimatedResolutionTime: "Within 45 mins",
  timeline: [
    {
      title: "Claim Submitted",
      timestamp: "Today • 03:15 PM",
      status: "completed",
      iconName: "check",
    },
    {
      title: "Operations Desk Review",
      timestamp: "Today • 03:22 PM",
      status: "completed",
      iconName: "verified",
    },
    {
      title: "Technician Defense & Rework Schedule",
      timestamp: "In Progress • Due 04:30 PM",
      status: "current",
      iconName: "pending",
    },
    {
      title: "Final Resolution & Sign-off",
      timestamp: "Field Verification",
      status: "upcoming",
      iconName: "gavel",
    },
  ],
  notesCount: 3,
};

export const MOCK_HELPLINE_INFO: HelplineDeskInfo = {
  hotlineNumber: "0915840000",
  hotlineDisplay: "091-5840000 / 021-3849201",
  whatsappNumber: "923005559821",
  whatsappDisplay: "+92 300 5559821",
  supportEmail: "support@workerfix.pk",
  hoursDisplay: "24/7 Round the Clock Support",
  deskLocation: "WorkerFIX Central Operations & Support Desk",
  avgResolutionTime: "1.8 hrs",
  resolutionRateText: "94% resolved same-day nationwide",
  isDeskOnline: true,
};
