export type JobStatus =
  | 'offer-sent'
  | 'visit-negotiation'
  | 'visit-scheduled'
  | 'on-the-way'
  | 'visit-in-progress'
  | 'repair-negotiating'
  | 'repair-approved'
  | 'in-progress'
  | 'completed'
  | 'paid'
  | 'disputed'

export interface Job {
  id: string
  title: string
  category: string
  description: string
  distance: string
  area: string
  exactAddress?: string
  urgency: 'urgent' | 'normal'
  customerName: string
  customerPhone?: string
  visitFee: number
  repairEstimate: string
  status: JobStatus
  postedTime: string
  scheduledTime?: string
  totalCost?: number
  workerPayout?: number
}

export interface Review {
  id: string
  customerName: string
  customerInitials: string
  stars: number
  date: string
  jobCategory: string
  text: string
  tags: string[]
}

export interface Dispute {
  id: string
  jobId: string
  jobTitle: string
  reason: string
  description: string
  submittedOn: string
  status: 'under-review' | 'resolved-worker' | 'resolved-customer'
  adminMessage?: string
}

export const NEARBY_JOBS: Job[] = [
  {
    id: 'J-1001',
    title: 'Leaking Main Water Valve',
    category: 'Plumbing',
    description: 'Water leaking from the main inlet valve near the meter. Pipe appears to have a crack causing pooling. Need urgent attention before it spreads to flooring.',
    distance: '2.1 km',
    area: 'F-10, Islamabad',
    exactAddress: 'House 47, Street 12, F-10/2, Islamabad',
    urgency: 'urgent',
    customerName: 'Ahmed Raza',
    customerPhone: '+92 300 1234567',
    visitFee: 300,
    repairEstimate: 'Rs. 1,500 – Rs. 2,500',
    status: 'offer-sent',
    postedTime: '12 min ago',
    scheduledTime: 'Today, 4:00 PM',
  },
  {
    id: 'J-1002',
    title: 'AC Not Cooling — Compressor Noise',
    category: 'AC Repair',
    description: 'Split unit in living room stopped cooling after making loud noise. Compressor runs but temperature not dropping. Has been two days without AC in this heat.',
    distance: '3.4 km',
    area: 'G-9, Islamabad',
    urgency: 'normal',
    customerName: 'Sara Khan',
    visitFee: 350,
    repairEstimate: 'Rs. 2,000 – Rs. 4,000',
    status: 'offer-sent',
    postedTime: '35 min ago',
    scheduledTime: 'Tomorrow, 11:00 AM',
  },
  {
    id: 'J-1003',
    title: 'Frequent Power Tripping — Kitchen',
    category: 'Electrician',
    description: 'MCB trips every time the microwave or kettle is used. Lights also flicker. Suspect overloaded circuit or faulty wiring behind the kitchen wall.',
    distance: '1.8 km',
    area: 'I-8, Islamabad',
    urgency: 'urgent',
    customerName: 'Bilal Ahmed',
    visitFee: 280,
    repairEstimate: 'Rs. 800 – Rs. 1,800',
    status: 'offer-sent',
    postedTime: '1 hr ago',
    scheduledTime: 'Today, 6:30 PM',
  },
  {
    id: 'J-1004',
    title: 'Bathroom Ceiling Water Stain',
    category: 'Plumbing',
    description: 'Dark water stain on bathroom ceiling growing each day. Possibly pipe leakage from the apartment above. Need inspection and diagnosis.',
    distance: '4.2 km',
    area: 'E-11, Islamabad',
    urgency: 'normal',
    customerName: 'Nadia Ali',
    visitFee: 300,
    repairEstimate: 'Rs. 1,000 – Rs. 3,000',
    status: 'offer-sent',
    postedTime: '2 hrs ago',
    scheduledTime: 'Tomorrow, 2:00 PM',
  },
]

export const ACTIVE_JOB: Job = {
  id: 'J-0998',
  title: 'Leaking Main Water Valve',
  category: 'Plumbing',
  description: 'Cracked 1-inch PVC elbow joint behind wall near main inlet.',
  distance: '2.1 km',
  area: 'F-10, Islamabad',
  exactAddress: 'House 47, Street 12, F-10/2, Islamabad',
  urgency: 'urgent',
  customerName: 'Ahmed Raza',
  customerPhone: '+92 300 1234567',
  visitFee: 285,
  repairEstimate: 'Rs. 1,500 – Rs. 2,500',
  status: 'repair-approved',
  postedTime: '3 hrs ago',
  scheduledTime: 'Today, 4:00 PM',
  totalCost: 2985,
  workerPayout: 2537,
}

export const REVIEWS: Review[] = [
  {
    id: 'R-001',
    customerName: 'Ahmed Raza',
    customerInitials: 'AR',
    stars: 5,
    date: 'Sep 9, 2026',
    jobCategory: 'Plumbing',
    text: 'Usman arrived on time and diagnosed the problem quickly. The repair was clean and professional. Explained every step clearly. Would hire again without hesitation.',
    tags: ['Punctual', 'Professional', 'Transparent Pricing'],
  },
  {
    id: 'R-002',
    customerName: 'Sara Khan',
    customerInitials: 'SK',
    stars: 5,
    date: 'Sep 7, 2026',
    jobCategory: 'AC Repair',
    text: 'Very experienced with AC systems. Diagnosed gas leak and compressor fault within minutes. Pricing was fair and itemized. No surprises.',
    tags: ['Expert', 'Fair Pricing', 'Clean Work'],
  },
  {
    id: 'R-003',
    customerName: 'Nadia Ali',
    customerInitials: 'NA',
    stars: 4,
    date: 'Sep 5, 2026',
    jobCategory: 'Plumbing',
    text: 'Good work overall. Bathroom faucet is fixed. Took a bit longer than expected but the result is solid. Would recommend.',
    tags: ['Reliable', 'Thorough'],
  },
  {
    id: 'R-004',
    customerName: 'Hamid Ch.',
    customerInitials: 'HC',
    stars: 5,
    date: 'Sep 3, 2026',
    jobCategory: 'Plumbing',
    text: 'Cleared a stubborn kitchen drain block in under 30 minutes. Brought proper equipment. Very professional attitude.',
    tags: ['Efficient', 'Well-Equipped'],
  },
  {
    id: 'R-005',
    customerName: 'Ayesha M.',
    customerInitials: 'AM',
    stars: 4,
    date: 'Sep 1, 2026',
    jobCategory: 'Plumbing',
    text: 'Fixed the water tank float issue quickly. Price was reasonable. Cleaned up after himself which I really appreciated.',
    tags: ['Tidy', 'Courteous'],
  },
]

export const DISPUTES: Dispute[] = [
  {
    id: 'D-001',
    jobId: 'J-0985',
    jobTitle: 'Kitchen Pipe Burst Repair',
    reason: 'Customer refusing to pay',
    description: 'Completed the full repair as agreed. Customer approved Rs. 3,200 in the app but is now refusing to pay cash, claiming the work is incomplete. The pipe is fixed and I have before/after photos.',
    submittedOn: 'Sep 6, 2026 — 3:45 PM',
    status: 'under-review',
  },
]

export const COMPLETED_JOBS = [
  { id: 'J-0997', title: 'Leaking Main Valve', customer: 'Ahmed Raza', date: 'Today', amount: 2537, rating: 5 },
  { id: 'J-0996', title: 'AC Gas Refill & Service', customer: 'Sara Khan', date: 'Yesterday', amount: 3400, rating: 5 },
  { id: 'J-0995', title: 'Bathroom Faucet Repair', customer: 'Nadia Ali', date: 'Sep 8', amount: 850, rating: 4 },
  { id: 'J-0994', title: 'Kitchen Drain Blockage', customer: 'Hamid Ch.', date: 'Sep 6', amount: 1200, rating: 5 },
  { id: 'J-0993', title: 'Water Tank Float Fix', customer: 'Ayesha M.', date: 'Sep 5', amount: 600, rating: 4 },
]

export const CATEGORIES = [
  { id: 'ac', label: 'AC Repair', icon: '❄️' },
  { id: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { id: 'electrical', label: 'Electrician', icon: '⚡' },
  { id: 'carpenter', label: 'Carpenter', icon: '🪚' },
  { id: 'appliance', label: 'Appliance Repair', icon: '🛠️' },
  { id: 'painter', label: 'Painter', icon: '🖌️' },
  { id: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { id: 'other', label: 'Other', icon: '📦' },
]

export const SUB_SKILLS: Record<string, string[]> = {
  ac: ['Installation', 'Gas Refilling', 'Servicing & Cleaning', 'Compressor Repair', 'Thermostat Repair'],
  plumbing: ['Pipe Fitting', 'Leak Repair', 'Drain Cleaning', 'Water Heater', 'Tank Installation'],
  electrical: ['Wiring', 'MCB / Fuse Box', 'Fan / Light Installation', 'Inverter Setup', 'CCTV Wiring'],
  carpenter: ['Door Fitting', 'Furniture Assembly', 'Cabinet Making', 'Wood Polish', 'Kitchen Cabinets'],
  appliance: ['Washing Machine', 'Refrigerator', 'Microwave', 'Dishwasher', 'Generator'],
  painter: ['Interior Painting', 'Exterior Painting', 'Wall Texture', 'Wood Polish', 'Waterproofing'],
  cleaning: ['Deep Cleaning', 'Sofa Cleaning', 'Carpet Cleaning', 'After-Construction', 'Tank Cleaning'],
  other: [],
}
