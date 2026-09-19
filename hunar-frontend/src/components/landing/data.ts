export type Step = {
  step: string;
  title: string;
  alt: string;
  image: string;
  description: string;
  linkText: string;
  href: string;
};

export const steps: Step[] = [
  {
    step: "Step 1",
    title: "Post a job",
    alt: "Post a job",
    image: "/landing/post-a-job.png",
    description:
      "Describe your home repair or skilled service need in under a minute with photos or details.",
    linkText: "Start Posting",
    href: "#services",
  },
  {
    step: "Step 2",
    title: "Choose Worker",
    alt: "Choose Worker",
    image: "/landing/choose-worker.png",
    description:
      "Compare verified tradespeople, check real ratings, CNIC verification, and transparent upfront quotes.",
    linkText: "View Offers Hub",
    href: "#pros",
  },
  {
    step: "Step 3",
    title: "Work done",
    alt: "Work done",
    image: "/landing/work-done.png",
    description:
      "The certified local artisan completes the job with guaranteed craft quality and 5-day rework warranty.",
    linkText: "Completion Flow",
    href: "#",
  },
  {
    step: "Step 4",
    title: "Pay safely",
    alt: "Pay safely",
    image: "/landing/pay-safely.png",
    description:
      "Pay with complete confidence using secure milestone escrow. Funds released only when you're 100% satisfied.",
    linkText: "Escrow & Wallet",
    href: "#",
  },
];

export type Pro = {
  name: string;
  role: string;
  rating: string;
  reviews: number;
  image: string;
  alt: string;
  tags: string[];
  location: string;
  success: number;
  successText: string;
};

export const pros: Pro[] = [
  {
    name: "Ahmad Khan",
    role: "DB Expert & Master Electrician",
    rating: "4.9",
    reviews: 142,
    image: "/landing/ahmad-khan-large-alt.png",
    alt: "Ahmad Khan",
    tags: ["DB Wiring", "Solar 3-Phase", "Breakers"],
    location: "Lahore",
    success: 99,
    successText: "99% Success",
  },
  {
    name: "Tariq Mehmood",
    role: "HVAC & AC Specialist",
    rating: "4.95",
    reviews: 210,
    image: "/landing/tariq-mehmood-large-alt.png",
    alt: "Tariq Mehmood",
    tags: ["Inverter PCB", "R32 Gas", "Chillers"],
    location: "Karachi",
    success: 98,
    successText: "98% Success",
  },
  {
    name: "Mansoor",
    role: "Architectural Consultant",
    rating: "4.98",
    reviews: 89,
    image: "/landing/mansoor-avatar.png",
    alt: "Mansoor",
    tags: ["Site Audit", "Layout Plans", "Fitouts"],
    location: "Islamabad",
    success: 100,
    successText: "100% Success",
  },
  {
    name: "Rashid Ali",
    role: "Master Plumber & Pipefitter",
    rating: "4.88",
    reviews: 94,
    image: "/landing/rashid-ali-large.png",
    alt: "Rashid Ali",
    tags: ["PPRC Hot/Cold", "Geyser Fix", "Motors"],
    location: "Rawalpindi",
    success: 97,
    successText: "97% Success",
  },
];

export type Service = {
  category: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  rating: string;
  reviews: number;
  href: string;
};

export const services: Service[] = [
  {
    category: "Cooling & AC",
    title: "Complete Inverter AC Deep Chemical Wash & Gas Pressure Topup",
    description: "Deep chemical wash, coil cleaning & gas pressure topup for maximum cooling.",
    image: "/landing/ac-deep-wash-alt.png",
    alt: "AC Deep Chemical Wash",
    rating: "4.92",
    reviews: 84,
    href: "#services",
  },
  {
    category: "Electrical & Power",
    title: "Master DB Panel Wiring, Breakers & Three-Phase Load Balancing",
    description: "Complete DB wiring, breakers & three-phase load balancing done safely.",
    image: "/landing/db-panel-wiring.png",
    alt: "DB Panel Wiring",
    rating: "4.98",
    reviews: 112,
    href: "#pros",
  },
  {
    category: "Plumbing & Sanitary",
    title: "Concealed PPRC Water Leakage Detection & Pipe Burst Repair",
    description: "Detect concealed PPRC leaks & repair pipe bursts without wrecking walls.",
    image: "/landing/plumbing-leakage-alt.png",
    alt: "Plumbing Leakage Detection",
    rating: "4.88",
    reviews: 64,
    href: "#",
  },
  {
    category: "Carpentry & Fitout",
    title: "Custom Kitchen Cabinetry & Hydraulic Soft-Close Hinge Fix",
    description: "Custom kitchen cabinets with soft-close hinges, built to fit your space.",
    image: "/landing/kitchen-cabinetry-alt.png",
    alt: "Kitchen Cabinetry & Woodwork",
    rating: "4.95",
    reviews: 42,
    href: "#pros",
  },
  {
    category: "Painting & Polish",
    title: "Full House WeatherSheet & Interior Velvet Matte Finish",
    description: "Full-house WeatherSheet & velvet matte finish with a clean edge.",
    image: "/landing/house-painting-alt.png",
    alt: "House Painting & Polish",
    rating: "4.90",
    reviews: 78,
    href: "#services",
  },
  {
    category: "Home Care",
    title: "Automatic Underground & Overhead Water Tank Disinfection",
    description: "Underground & overhead tank cleaning and disinfection, ready to drink.",
    image: "/landing/water-tank-disinfection.png",
    alt: "Water Tank Disinfection",
    rating: "4.85",
    reviews: 53,
    href: "#pros",
  },
  {
    category: "Solar & Renewable",
    title: "Solar Inverter Hybrid Net-Metering Setup & Distribution Wiring",
    description: "Hybrid solar inverter, net-metering & distribution wiring installation.",
    image: "/landing/solar-inverter.png",
    alt: "Solar Inverter Hybrid Net-Metering",
    rating: "4.96",
    reviews: 95,
    href: "#services",
  },
  {
    category: "Appliance Repair",
    title: "Automatic Washing Machine & Refrigerator Compressor Overhaul",
    description: "Compressor & motor overhaul for washing machines and refrigerators.",
    image: "/landing/washing-machine-repair.png",
    alt: "Washing Machine & Refrigerator Repair",
    rating: "4.89",
    reviews: 71,
    href: "#pros",
  },
];

export const categoryTabs = [
  { label: "All Trades", href: "#services", active: true },
  { label: "Electrical & Power", href: "#services", active: false },
  { label: "Cooling & AC", href: "#pros", active: false },
  { label: "Plumbing & Sanitary", href: "#", active: false },
  { label: "Carpentry & Fitout", href: "#pros", active: false },
];

export const valuePropPoints = [
  "The best for every budget with upfront estimates",
  "Quality work done quickly with verified professionals",
  "Protected payments, every time via digital escrow",
  "24/7 dedicated support & 5-day rework warranty",
];

export const brands = [
  { label: "DEANS", className: "font-black tracking-tight" },
  { label: "PC PESHAWAR", className: "font-extrabold tracking-tighter" },
  { label: "Shiraz", className: "font-bold tracking-widest" },
  { label: "SHIREEN MAHAL", className: "font-medium tracking-tight" },
  { label: "BRT PESHAWAR", className: "font-bold tracking-wider" },
  { label: "TOWN CLUB", className: "font-extrabold tracking-tight" },
];

export const footerColumns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "About",
    links: [
      { label: "Customer Dashboard", href: "#" },
      { label: "My Work Orders", href: "#" },
      { label: "Live GPS Arrival Tracker", href: "#" },
      { label: "Offers & Worker Selection", href: "#" },
      { label: "Secure Escrow Protection", href: "#" },
      { label: "Account Settings", href: "#" },
      { label: "24/7 Help & Support", href: "#" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Electrical & Power", href: "#services" },
      { label: "HVAC & Air Conditioning", href: "#services" },
      { label: "Plumbing & Sanitary", href: "#services" },
      { label: "Carpentry & Fitout", href: "#services" },
      { label: "Painting & Renovation", href: "#services" },
      { label: "Solar & Renewable Energy", href: "#services" },
      { label: "Water Tank & Deep Cleaning", href: "#services" },
      { label: "Home Appliance Repair", href: "#services" },
      { label: "Civil Work & Masonry", href: "#services" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help & Support 24/7", href: "#" },
      { label: "Escrow Trust & Money-Back Guarantee", href: "#" },
      { label: "Post a Service Request", href: "#services" },
      { label: "Customer Portal", href: "#" },
    ],
  },
];