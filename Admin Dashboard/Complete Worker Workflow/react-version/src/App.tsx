import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | 'dashboard'
  | 'job-details'
  | 'active-job'
  | 'inspection'
  | 'repair-quote'
  | 'earnings'
  | 'profile'

type JobStatus =
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

interface Job {
  id: string
  title: string
  category: string
  description: string
  distance: string
  area: string
  urgency: 'urgent' | 'normal'
  customerName: string
  visitFee: number
  repairEstimate: string
  status: JobStatus
  postedTime: string
  scheduledTime?: string
  totalCost?: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const NEARBY_JOBS: Job[] = [
  {
    id: '1',
    title: 'Leaking Main Water Valve',
    category: 'Plumber',
    description: 'There\'s water leaking from the main valve near the meter. Pipe seems to have a crack. Need urgent attention before it causes water damage.',
    distance: '2.1 km',
    area: 'F-10, Islamabad',
    urgency: 'urgent',
    customerName: 'Ahmed Raza',
    visitFee: 300,
    repairEstimate: 'Rs. 1,500 – Rs. 2,500',
    status: 'offer-sent',
    postedTime: '12 min ago',
    scheduledTime: 'Today, 4:00 PM',
  },
  {
    id: '2',
    title: 'AC Not Cooling Properly',
    category: 'AC Technician',
    description: 'Split AC unit in living room stopped cooling. Compressor makes noise but room temperature not dropping. Already 2 days without AC.',
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
    id: '3',
    title: 'Electrical Wiring Issue',
    category: 'Electrician',
    description: 'Power tripping in kitchen frequently. Lights flicker when microwave is on. Suspect faulty wiring or overloaded circuit.',
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
]

const ACTIVE_JOB: Job = {
  id: '4',
  title: 'Leaking Main Water Valve',
  category: 'Plumber',
  description: 'Cracked 1-inch PVC elbow joint behind wall near main inlet.',
  distance: '2.1 km',
  area: 'House 47, Street 12, F-10/2, Islamabad',
  urgency: 'urgent',
  customerName: 'Ahmed Raza',
  visitFee: 285,
  repairEstimate: 'Rs. 1,500 – Rs. 2,500',
  status: 'repair-approved',
  postedTime: '2 hrs ago',
  scheduledTime: 'Today, 4:00 PM',
  totalCost: 2985,
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
      <path d="M18 12a2 2 0 000 4h4v-4z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  mapPin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  arrowLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12,19 5,12 12,5" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  trending: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
      <polyline points="17,6 23,6 23,12" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
    </svg>
  ),
  wrench: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
}

// ─── Shared Components ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    'offer-sent': { label: 'Offer Sent', color: 'bg-amber-100 text-amber-700' },
    'visit-negotiation': { label: 'Negotiating', color: 'bg-amber-100 text-amber-700' },
    'visit-scheduled': { label: 'Visit Scheduled', color: 'bg-blue-100 text-blue-700' },
    'on-the-way': { label: 'On the Way', color: 'bg-blue-100 text-blue-700' },
    'visit-in-progress': { label: 'Inspecting', color: 'bg-purple-100 text-purple-700' },
    'repair-negotiating': { label: 'Repair Quote Sent', color: 'bg-amber-100 text-amber-700' },
    'repair-approved': { label: 'Repair Approved', color: 'bg-green-100 text-green-700' },
    'in-progress': { label: 'Repair in Progress', color: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  }
  const s = map[status] ?? { label: status, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`text-xs font-600 px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  )
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    Plumber: '🔧',
    Electrician: '⚡',
    'AC Technician': '❄️',
    Carpenter: '🪚',
  }
  return <span className="text-base">{icons[category] ?? '🛠️'}</span>
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ screen, onNav }: { screen: Screen; onNav: (s: Screen) => void }) {
  const tabs: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: Icons.home },
    { id: 'active-job', label: 'Jobs', icon: Icons.briefcase },
    { id: 'earnings', label: 'Earnings', icon: Icons.wallet },
    { id: 'profile', label: 'Profile', icon: Icons.user },
  ]
  return (
    <nav className="flex items-center border-t border-slate-100 bg-white px-2 pt-2 pb-3 gap-1">
      {tabs.map((t) => {
        const active = screen === t.id || (t.id === 'active-job' && ['job-details', 'inspection', 'repair-quote'].includes(screen))
        return (
          <button
            key={t.id}
            onClick={() => onNav(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition-all ${
              active ? 'text-[#1DB954]' : 'text-[#64748B]'
            }`}
          >
            {t.icon}
            <span className={`text-[10px] font-500 ${active ? 'text-[#1DB954]' : 'text-[#64748B]'}`}>
              {t.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Screen: Dashboard ────────────────────────────────────────────────────────
function DashboardScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [online, setOnline] = useState(true)
  const [activeFilter, setActiveFilter] = useState('All')
  const filters = ['All', 'Plumber', 'Electrician', 'AC Tech']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-[#1A1A2E] px-4 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-400 text-xs font-400">Good afternoon,</p>
            <h1 className="text-white text-lg font-700">Usman Malik</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-slate-400 hover:text-white transition-colors">
              {Icons.bell}
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1DB954] rounded-full text-white text-[9px] flex items-center justify-center font-700">3</span>
            </button>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&auto=format"
              alt="Usman Malik"
              className="w-9 h-9 rounded-full object-cover border-2 border-[#1DB954]"
            />
          </div>
        </div>

        {/* Online toggle + stats */}
        <div className="bg-white/10 rounded-2xl p-3 flex items-center justify-between mb-4">
          <div>
            <p className="text-slate-300 text-xs">Availability</p>
            <p className={`text-sm font-700 ${online ? 'text-[#1DB954]' : 'text-slate-400'}`}>
              {online ? '● Online — Ready for Jobs' : '○ Offline'}
            </p>
          </div>
          <button
            onClick={() => setOnline(!online)}
            className={`w-12 h-6 rounded-full transition-all relative ${online ? 'bg-[#1DB954]' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${online ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Today's Earnings", value: 'Rs. 2,537', icon: Icons.trending, color: 'text-[#1DB954]' },
            { label: 'Active Jobs', value: '2', icon: Icons.briefcase, color: 'text-[#F59E0B]' },
            { label: 'Rating', value: '4.8 ★', icon: Icons.star, color: 'text-[#F59E0B]' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
              <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
              <p className={`text-sm font-700 ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-[9px] leading-tight mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs feed */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#1A1A2E] font-700 text-base">Nearby Jobs</h2>
          <span className="text-[#1DB954] text-xs font-600">{NEARBY_JOBS.length} available</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-600 whitespace-nowrap transition-all ${
                activeFilter === f
                  ? 'bg-[#1A1A2E] text-white'
                  : 'bg-white text-[#64748B] border border-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Job cards */}
        <div className="flex flex-col gap-3 pb-4">
          {NEARBY_JOBS.map((job) => (
            <div
              key={job.id}
              onClick={() => onNav('job-details')}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#F8FAFC] rounded-xl flex items-center justify-center text-lg">
                    <CategoryIcon category={job.category} />
                  </div>
                  <div>
                    <h3 className="text-[#1A1A2E] font-600 text-sm leading-tight">{job.title}</h3>
                    <span className="text-[#64748B] text-xs">{job.category}</span>
                  </div>
                </div>
                {job.urgency === 'urgent' && (
                  <span className="bg-red-100 text-red-600 text-[10px] font-700 px-2 py-0.5 rounded-full">
                    URGENT
                  </span>
                )}
              </div>

              <p className="text-[#64748B] text-xs leading-relaxed mb-3 line-clamp-2">
                {job.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[#64748B] text-xs">
                    {Icons.mapPin}
                    <span>{job.distance} · {job.area.split(',')[0]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#64748B] text-xs">
                  {Icons.clock}
                  <span>{job.postedTime}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[#64748B] text-xs">Visit fee</p>
                  <p className="text-[#1A1A2E] font-700 text-sm">Rs. {job.visitFee}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onNav('job-details') }}
                  className="bg-[#1DB954] text-white text-xs font-700 px-4 py-2 rounded-xl"
                >
                  View Job
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Job Details & Offer ──────────────────────────────────────────────
function JobDetailsScreen({ onBack, onSubmitOffer }: { onBack: () => void; onSubmitOffer: () => void }) {
  const [visitFee, setVisitFee] = useState('300')
  const [estimate, setEstimate] = useState('')
  const [note, setNote] = useState('')
  const [offerSent, setOfferSent] = useState(false)
  const [showCounter, setShowCounter] = useState(false)
  const [counterStep, setCounterStep] = useState<'incoming' | 'sent'>('incoming')

  const job = NEARBY_JOBS[0]

  const handleSendOffer = () => {
    setOfferSent(true)
    setTimeout(() => setShowCounter(true), 1200)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#1A1A2E] px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          {Icons.arrowLeft}
        </button>
        <div className="flex-1">
          <h1 className="text-white font-700 text-base">Job Details</h1>
          <p className="text-slate-400 text-xs">{job.area}</p>
        </div>
        {job.urgency === 'urgent' && (
          <span className="bg-red-500 text-white text-[10px] font-700 px-2 py-0.5 rounded-full">URGENT</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Customer problem */}
        <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center text-xl">
              <CategoryIcon category={job.category} />
            </div>
            <div>
              <h2 className="text-[#1A1A2E] font-700 text-sm">{job.title}</h2>
              <span className="text-[#64748B] text-xs">{job.category}</span>
            </div>
          </div>
          <p className="text-[#64748B] text-sm leading-relaxed mb-3">{job.description}</p>

          <div className="flex items-center gap-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-1">{Icons.mapPin}<span>{job.distance} away</span></div>
            <div className="flex items-center gap-1">{Icons.clock}<span>{job.postedTime}</span></div>
          </div>

          {/* Issue photos */}
          <div className="mt-3">
            <p className="text-[#1A1A2E] text-xs font-600 mb-2">Issue Photos</p>
            <div className="flex gap-2">
              {[
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop',
                'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=80&h=80&fit=crop',
              ].map((src, i) => (
                <img key={i} src={src} alt={`Issue ${i + 1}`} className="w-16 h-16 rounded-xl object-cover bg-slate-200" />
              ))}
              <div className="w-16 h-16 rounded-xl bg-[#F8FAFC] border border-dashed border-slate-300 flex items-center justify-center">
                <span className="text-slate-400 text-[10px] text-center leading-tight">Audio<br/>Note</span>
              </div>
            </div>
          </div>
        </div>

        {/* Counter-offer banner */}
        {showCounter && (
          <div className="mx-4 mt-3">
            <div className={`rounded-2xl p-4 border ${counterStep === 'incoming' ? 'bg-amber-50 border-amber-200' : 'bg-[#F0FDF4] border-green-200'}`}>
              {counterStep === 'incoming' ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
                    <p className="text-amber-700 font-600 text-sm">Customer Counter-Offer</p>
                  </div>
                  <p className="text-[#64748B] text-xs mb-3">Ahmed Raza suggests Rs. 250 for the visit fee</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCounterStep('sent')}
                      className="flex-1 bg-[#1DB954] text-white text-xs font-700 py-2 rounded-xl"
                    >
                      Accept Rs. 250
                    </button>
                    <button className="flex-1 bg-white text-[#1A1A2E] text-xs font-600 py-2 rounded-xl border border-slate-200">
                      Counter Rs. 280
                    </button>
                    <button className="px-3 bg-white text-[#EF4444] text-xs font-600 py-2 rounded-xl border border-red-200">
                      Decline
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#1DB954] rounded-full flex items-center justify-center text-white">
                    {Icons.check}
                  </div>
                  <div>
                    <p className="text-green-700 font-600 text-sm">Visit Fee Locked — Rs. 250</p>
                    <p className="text-[#64748B] text-xs">Customer accepted. Visit now scheduled.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Offer form */}
        {!offerSent ? (
          <div className="bg-white mx-4 mt-3 mb-4 rounded-2xl p-4 shadow-sm border border-slate-100">
            <h3 className="text-[#1A1A2E] font-700 text-sm mb-3">Submit Your Offer</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[#64748B] text-xs font-500 mb-1 block">Visit / Inspection Fee (Rs.)</label>
                <input
                  type="number"
                  value={visitFee}
                  onChange={(e) => setVisitFee(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1A1A2E] font-600 focus:outline-none focus:border-[#1DB954] transition-colors"
                />
              </div>
              <div>
                <label className="text-[#64748B] text-xs font-500 mb-1 block">Initial Estimate (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rs. 1,500 – Rs. 2,500"
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1A1A2E] focus:outline-none focus:border-[#1DB954] transition-colors"
                />
              </div>
              <div>
                <label className="text-[#64748B] text-xs font-500 mb-1 block">Your Proposal Note</label>
                <textarea
                  placeholder="e.g. Licensed plumber with 8 years experience. Can arrive today at 4 PM."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1A1A2E] focus:outline-none focus:border-[#1DB954] transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleSendOffer}
                className="w-full bg-[#1DB954] text-white font-700 py-3 rounded-xl text-sm"
              >
                Send Offer
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white mx-4 mt-3 mb-4 rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-[#F59E0B] text-base">⏳</span>
              </div>
              <div>
                <p className="text-[#1A1A2E] font-600 text-sm">Offer Sent — Rs. {visitFee}</p>
                <p className="text-[#64748B] text-xs">Awaiting customer decision…</p>
              </div>
            </div>
            {counterStep === 'sent' && (
              <button
                onClick={onSubmitOffer}
                className="mt-3 w-full bg-[#1A1A2E] text-white font-700 py-3 rounded-xl text-sm"
              >
                Go to Active Job →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen: Active Job ───────────────────────────────────────────────────────
function ActiveJobScreen({ onNav }: { onNav: (s: Screen) => void }) {
  const [jobStatus, setJobStatus] = useState<JobStatus>(ACTIVE_JOB.status)
  const job = ACTIVE_JOB

  const steps: { key: JobStatus; label: string; subLabel: string }[] = [
    { key: 'visit-scheduled', label: 'Visit Scheduled', subLabel: 'Visit confirmed at Rs. 285' },
    { key: 'on-the-way', label: 'On the Way', subLabel: 'Customer notified' },
    { key: 'visit-in-progress', label: 'Arrived & Inspecting', subLabel: 'Diagnosing the issue' },
    { key: 'repair-negotiating', label: 'Repair Quote Sent', subLabel: 'Awaiting customer approval' },
    { key: 'repair-approved', label: 'Repair Approved', subLabel: 'Rs. 2,985 — Locked' },
    { key: 'in-progress', label: 'Repair in Progress', subLabel: 'Work underway' },
    { key: 'completed', label: 'Completed', subLabel: 'Awaiting payment' },
  ]

  const statusOrder = steps.map((s) => s.key)
  const currentIndex = statusOrder.indexOf(jobStatus)

  const getNextAction = () => {
    if (jobStatus === 'repair-approved') return { label: 'Start Repair', next: 'in-progress' as JobStatus }
    if (jobStatus === 'in-progress') return { label: 'Mark Repair Complete', next: 'completed' as JobStatus }
    if (jobStatus === 'visit-scheduled') return { label: 'Start Visit (On My Way)', next: 'on-the-way' as JobStatus }
    if (jobStatus === 'on-the-way') return { label: "I've Arrived", next: 'visit-in-progress' as JobStatus }
    if (jobStatus === 'visit-in-progress') return { label: 'Start Inspection', next: null, screen: 'inspection' as Screen }
    return null
  }
  const nextAction = getNextAction()

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#1A1A2E] px-4 pt-10 pb-4">
        <h1 className="text-white font-700 text-base mb-0.5">Active Job</h1>
        <p className="text-slate-400 text-xs">{job.area}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Job card */}
        <div className="bg-white mx-4 mt-4 rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#F8FAFC] rounded-xl flex items-center justify-center text-lg">
                <CategoryIcon category={job.category} />
              </div>
              <div>
                <h2 className="text-[#1A1A2E] font-700 text-sm">{job.title}</h2>
                <p className="text-[#64748B] text-xs">{job.customerName}</p>
              </div>
            </div>
            <StatusBadge status={jobStatus} />
          </div>

          {/* Contact buttons */}
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-xs font-600 text-[#1A1A2E]">
              {Icons.phone} Call Customer
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 rounded-xl py-2 text-xs font-600 text-[#1A1A2E]">
              {Icons.chat} Chat
            </button>
          </div>
        </div>

        {/* Progress stepper */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[#1A1A2E] font-700 text-sm mb-4">Job Progress</h3>
          <div className="flex flex-col gap-0">
            {steps.map((step, i) => {
              const done = i < currentIndex
              const active = i === currentIndex
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done ? 'bg-[#1DB954]' : active ? 'bg-[#1A1A2E] ring-4 ring-[#1A1A2E]/10' : 'bg-slate-200'
                    }`}>
                      {done ? (
                        <span className="text-white text-[10px]">✓</span>
                      ) : active ? (
                        <span className="w-2 h-2 bg-[#1DB954] rounded-full" />
                      ) : (
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                      )}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 h-6 mt-1 ${done ? 'bg-[#1DB954]' : 'bg-slate-200'}`} />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className={`text-xs font-600 ${active ? 'text-[#1A1A2E]' : done ? 'text-[#1DB954]' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] ${active ? 'text-[#64748B]' : done ? 'text-slate-400' : 'text-slate-300'}`}>
                      {step.subLabel}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Safety lock warning */}
        {jobStatus === 'repair-approved' && (
          <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
            {Icons.shield}
            <p className="text-amber-700 text-xs leading-relaxed">
              <strong>Safety Notice:</strong> Customer has approved Rs. 2,985. You may now begin repair work.
            </p>
          </div>
        )}

        {/* Next action */}
        {nextAction && (
          <div className="mx-4 mt-3 mb-4">
            <button
              onClick={() => {
                if (nextAction.next) setJobStatus(nextAction.next)
                if ('screen' in nextAction && nextAction.screen) onNav(nextAction.screen)
              }}
              className="w-full bg-[#1DB954] text-white font-700 py-3.5 rounded-2xl text-sm"
            >
              {nextAction.label}
            </button>
          </div>
        )}

        {jobStatus === 'completed' && (
          <div className="mx-4 mt-3 mb-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-[#22C55E] text-base">✓</span>
              </div>
              <div>
                <p className="text-[#1A1A2E] font-700 text-sm">Job Completed!</p>
                <p className="text-[#64748B] text-xs">Awaiting customer payment</p>
              </div>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-3 text-xs text-[#64748B]">
              <div className="flex justify-between mb-1"><span>Visit Fee</span><span className="text-[#1A1A2E] font-600">Rs. 285</span></div>
              <div className="flex justify-between mb-1"><span>Labor</span><span className="text-[#1A1A2E] font-600">Rs. 1,500</span></div>
              <div className="flex justify-between mb-1"><span>Parts</span><span className="text-[#1A1A2E] font-600">Rs. 1,200</span></div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-700 text-[#1A1A2E]">
                <span>Total</span><span>Rs. 2,985</span>
              </div>
              <div className="flex justify-between mt-1 text-[#64748B]"><span>Platform (15%)</span><span>− Rs. 448</span></div>
              <div className="flex justify-between mt-1 text-[#1DB954] font-700"><span>Your Payout</span><span>Rs. 2,537</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen: Inspection Form ──────────────────────────────────────────────────
function InspectionScreen({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  const [summary, setSummary] = useState('')
  const [parts, setParts] = useState('1200')
  const [labor, setLabor] = useState('1500')
  const [photos, setPhotos] = useState(2)

  const visit = 285
  const total = parseInt(parts || '0') + parseInt(labor || '0') + visit

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <div className="bg-[#1A1A2E] px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          {Icons.arrowLeft}
        </button>
        <div>
          <h1 className="text-white font-700 text-base">Inspection Report</h1>
          <p className="text-slate-400 text-xs">Leaking Main Water Valve</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Warning */}
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-[#F59E0B] text-sm mt-0.5">⚠️</span>
          <p className="text-amber-700 text-xs leading-relaxed">
            Do <strong>not</strong> begin any repair work before the customer approves the repair price below.
          </p>
        </div>

        {/* Diagnostic photos */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[#1A1A2E] font-700 text-sm mb-3">Inspection Photos</h3>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: photos }).map((_, i) => (
              <div key={i} className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200">
                <img
                  src={`https://images.unsplash.com/photo-${i === 0 ? '1558618666-fcd25c85cd64' : '1504328345606-18bbc8c9d7d1'}?w=80&h=80&fit=crop`}
                  alt={`Inspection ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            <button
              onClick={() => setPhotos(p => p + 1)}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-[#1DB954] hover:text-[#1DB954] transition-colors"
            >
              {Icons.camera}
              <span className="text-[9px] font-500">Add Photo</span>
            </button>
          </div>
        </div>

        {/* Diagnostic summary */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[#1A1A2E] font-700 text-sm mb-3">Diagnostic Summary</h3>
          <textarea
            placeholder="e.g. Cracked 1-inch PVC elbow joint behind wall near main inlet. Joint needs replacement."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1A1A2E] focus:outline-none focus:border-[#1DB954] transition-colors resize-none"
          />
        </div>

        {/* Itemized estimate */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[#1A1A2E] font-700 text-sm mb-3">Itemized Repair Estimate</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A2E] text-xs font-500">Parts / Materials (Rs.)</p>
                <p className="text-[#64748B] text-[10px]">PVC joints, sealant tape, fittings</p>
              </div>
              <input
                type="number"
                value={parts}
                onChange={(e) => setParts(e.target.value)}
                className="w-24 border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-700 text-[#1A1A2E] text-right focus:outline-none focus:border-[#1DB954]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A2E] text-xs font-500">Labor / Service (Rs.)</p>
                <p className="text-[#64748B] text-[10px]">Cutting, fitting & re-plastering</p>
              </div>
              <input
                type="number"
                value={labor}
                onChange={(e) => setLabor(e.target.value)}
                className="w-24 border border-slate-200 rounded-xl px-2 py-1.5 text-sm font-700 text-[#1A1A2E] text-right focus:outline-none focus:border-[#1DB954]"
              />
            </div>
            <div className="flex items-center justify-between opacity-60">
              <p className="text-[#1A1A2E] text-xs font-500">Visit / Inspection (Rs.)</p>
              <span className="text-sm font-700 text-[#1A1A2E]">{visit}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[#1A1A2E] font-700 text-sm">Total Estimated Cost</span>
            <span className="text-[#1DB954] font-700 text-base">Rs. {total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mx-4 mt-3 mb-4">
          <button
            onClick={onSubmit}
            className="w-full bg-[#1DB954] text-white font-700 py-3.5 rounded-2xl text-sm"
          >
            Submit Inspection & Send Quote
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Screen: Repair Quote ─────────────────────────────────────────────────────
function RepairQuoteScreen({ onBack, onApproved }: { onBack: () => void; onApproved: () => void }) {
  const [negotiationRound, setNegotiationRound] = useState(0)
  const [approved, setApproved] = useState(false)
  const [counterValue, setCounterValue] = useState(2700)

  const quotes = [2985, 2800, 2985, 2900, 2985]
  const currentQuote = quotes[Math.min(negotiationRound, quotes.length - 1)]

  const handleApprove = () => {
    setApproved(true)
    setTimeout(onApproved, 1000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <div className="bg-[#1A1A2E] px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          {Icons.arrowLeft}
        </button>
        <div>
          <h1 className="text-white font-700 text-base">Repair Quotation</h1>
          <p className="text-slate-400 text-xs">Ahmed Raza reviewing…</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Quote status */}
        <div className="mx-4 mt-4">
          {!approved ? (
            negotiationRound === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse flex-shrink-0" />
                <p className="text-amber-700 text-xs">Quote sent. Waiting for customer response…</p>
              </div>
            ) : (
              <div className="bg-[#1A1A2E] rounded-2xl p-3">
                <p className="text-slate-300 text-xs mb-2">Ahmed Raza countered with:</p>
                <p className="text-white font-700 text-lg">Rs. {counterValue.toLocaleString()}</p>
                <p className="text-slate-400 text-xs">Round {negotiationRound} of 5</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleApprove} className="flex-1 bg-[#1DB954] text-white text-xs font-700 py-2 rounded-xl">
                    Accept Rs. {counterValue.toLocaleString()}
                  </button>
                  <button
                    onClick={() => setNegotiationRound(r => r + 1)}
                    className="flex-1 bg-white/10 text-white text-xs font-600 py-2 rounded-xl"
                  >
                    Counter Rs. {currentQuote.toLocaleString()}
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="bg-[#F0FDF4] border border-green-200 rounded-2xl p-3 flex items-center gap-2">
              <div className="w-7 h-7 bg-[#1DB954] rounded-full flex items-center justify-center text-white flex-shrink-0">
                {Icons.check}
              </div>
              <div>
                <p className="text-green-700 font-700 text-sm">Repair Approved!</p>
                <p className="text-green-600 text-xs">Rs. {counterValue.toLocaleString()} — You may now start repair</p>
              </div>
            </div>
          )}
        </div>

        {/* Quote breakdown */}
        <div className="bg-white mx-4 mt-3 rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[#1A1A2E] font-700 text-sm mb-3">Quote Breakdown</h3>

          <div className="flex flex-col gap-2">
            {[
              { label: 'PVC Elbow Joint (1-inch)', type: 'Parts', amount: 450 },
              { label: 'Pipe sealant & tape', type: 'Parts', amount: 380 },
              { label: 'Cutting & wall access', type: 'Labor', amount: 600 },
              { label: 'Fitting & sealing', type: 'Labor', amount: 550 },
              { label: 'Re-plastering (minor)', type: 'Labor', amount: 350 },
              { label: 'Visit / Inspection fee', type: 'Visit', amount: 285 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-[#1A1A2E] text-xs font-500">{item.label}</p>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-600 ${
                    item.type === 'Parts' ? 'bg-blue-100 text-blue-600' :
                    item.type === 'Labor' ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  }`}>{item.type}</span>
                </div>
                <span className="text-[#1A1A2E] font-600 text-sm">Rs. {item.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex justify-between">
              <span className="text-[#1A1A2E] font-700 text-sm">Total</span>
              <span className="text-[#1A1A2E] font-700 text-base">Rs. {currentQuote.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[#64748B] text-xs">Platform Commission (15%)</span>
              <span className="text-[#64748B] text-xs">− Rs. {Math.round(currentQuote * 0.15).toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[#1DB954] font-700 text-sm">Your Payout</span>
              <span className="text-[#1DB954] font-700 text-sm">Rs. {Math.round(currentQuote * 0.85).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Simulate counter button */}
        {!approved && negotiationRound === 0 && (
          <div className="mx-4 mt-3 mb-4">
            <button
              onClick={() => setNegotiationRound(1)}
              className="w-full border border-slate-200 text-[#64748B] font-600 py-2.5 rounded-2xl text-xs"
            >
              Simulate Customer Counter-Offer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen: Earnings ─────────────────────────────────────────────────────────
function EarningsScreen() {
  const [activeTab, setActiveTab] = useState<'earnings' | 'history'>('earnings')

  const history = [
    { id: 'J-0041', title: 'Leaking Main Valve', customer: 'Ahmed Raza', date: 'Today', amount: 2537, rating: 5, status: 'paid' },
    { id: 'J-0040', title: 'AC Gas Refill & Service', customer: 'Sara Khan', date: 'Yesterday', amount: 3400, rating: 5, status: 'paid' },
    { id: 'J-0039', title: 'Bathroom Faucet Repair', customer: 'Nadia Ali', date: 'Sep 8', amount: 850, rating: 4, status: 'paid' },
    { id: 'J-0038', title: 'Kitchen Drain Blockage', customer: 'Hamid Ch.', date: 'Sep 6', amount: 1200, rating: 5, status: 'paid' },
    { id: 'J-0037', title: 'Water Tank Float Fix', customer: 'Ayesha M.', date: 'Sep 5', amount: 600, rating: 4, status: 'paid' },
  ]

  const weeklyTotal = history.reduce((s, j) => s + j.amount, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#1A1A2E] px-4 pt-10 pb-5">
        <h1 className="text-white font-700 text-base mb-4">Earnings</h1>
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">This Week's Earnings</p>
          <p className="text-white font-700 text-2xl">Rs. {weeklyTotal.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[#1DB954] text-xs">↑ 23%</span>
            <span className="text-slate-400 text-xs">vs last week</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: 'Jobs Done', value: '18' },
            { label: 'Avg Rating', value: '4.8 ★' },
            { label: 'Completion', value: '96%' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-white font-700 text-sm">{s.value}</p>
              <p className="text-slate-400 text-[9px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-slate-100 px-4">
        {(['earnings', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-xs font-600 capitalize transition-colors border-b-2 ${
              activeTab === t ? 'text-[#1DB954] border-[#1DB954]' : 'text-[#64748B] border-transparent'
            }`}
          >
            {t === 'earnings' ? 'Payout Tracker' : 'Completed Jobs'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'earnings' ? (
          <div className="p-4 flex flex-col gap-3">
            {/* Payout pending */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#1A1A2E] font-700 text-sm">Pending Payout</h3>
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-600">In Escrow 22h</span>
              </div>
              <p className="text-[#1DB954] font-700 text-xl">Rs. 2,537</p>
              <p className="text-[#64748B] text-xs mt-0.5">Leaking Main Valve · Ahmed Raza</p>
              <div className="mt-3 bg-[#F8FAFC] rounded-xl p-3">
                <div className="flex justify-between text-xs mb-1"><span className="text-[#64748B]">Total Job Value</span><span className="text-[#1A1A2E] font-600">Rs. 2,985</span></div>
                <div className="flex justify-between text-xs"><span className="text-[#64748B]">Platform (15%)</span><span className="text-[#64748B]">− Rs. 448</span></div>
                <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-200 font-700"><span className="text-[#1DB954]">Your Payout</span><span className="text-[#1DB954]">Rs. 2,537</span></div>
              </div>
            </div>

            {/* Monthly chart placeholder */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="text-[#1A1A2E] font-700 text-sm mb-3">This Month</h3>
              <div className="flex items-end gap-1.5 h-20">
                {[40, 65, 30, 80, 55, 90, 45, 100, 70, 85, 60, 95, 50, 75, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm transition-all" style={{
                    height: `${h}%`,
                    backgroundColor: i === 14 ? '#1DB954' : '#E2E8F0',
                  }} />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-[#64748B]">
                <span>Sep 1</span><span>Today</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-2 pb-4">
            {history.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-[#1A1A2E] font-600 text-xs">{job.title}</p>
                    <p className="text-[#64748B] text-[10px]">{job.customer} · {job.date}</p>
                  </div>
                  <p className="text-[#1DB954] font-700 text-sm">Rs. {job.amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-[10px] ${i < job.rating ? 'text-[#F59E0B]' : 'text-slate-200'}`}>★</span>
                  ))}
                  <span className="text-[#64748B] text-[10px] ml-1">{job.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Screen: Profile ──────────────────────────────────────────────────────────
function ProfileScreen() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <div className="bg-[#1A1A2E] px-4 pt-10 pb-6 text-center">
        <div className="relative inline-block mb-3">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format"
            alt="Usman Malik"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-[#1DB954]"
          />
          <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1DB954] rounded-full flex items-center justify-center text-white text-[10px] font-700">
            ✓
          </span>
        </div>
        <h1 className="text-white font-700 text-lg">Usman Malik</h1>
        <p className="text-slate-400 text-xs">Plumber · 8 years experience</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < 5 ? 'text-[#F59E0B]' : 'text-slate-600'}`}>★</span>
          ))}
          <span className="text-slate-300 text-xs ml-1">4.8 (94 reviews)</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Skills */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[#1A1A2E] font-700 text-sm mb-3">Skills & Trades</h3>
          <div className="flex flex-wrap gap-2">
            {['Plumber', 'Drainage Expert', 'Water Heater', 'Pipe Fitting'].map((skill) => (
              <span key={skill} className="bg-[#F0FDF4] text-[#1DB954] text-xs font-600 px-3 py-1.5 rounded-full border border-[#1DB954]/20">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Service area */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[#1A1A2E] font-700 text-sm mb-2">Service Area</h3>
          <div className="flex items-center gap-2 text-[#64748B] text-xs mb-2">
            {Icons.mapPin}
            <span>F-10, G-9, I-8, F-11 — Islamabad</span>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl overflow-hidden h-24 flex items-center justify-center border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=300&h=96&fit=crop"
              alt="Service area map"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[#64748B] text-[10px] mt-1.5">5 km radius · Default visit: Rs. 300</p>
        </div>

        {/* KYC status */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-[#1A1A2E] font-700 text-sm mb-3">Verification</h3>
          {[
            { label: 'CNIC Verified', done: true },
            { label: 'Phone Verified', done: true },
            { label: 'Trade Certificate', done: true },
            { label: 'Portfolio Photos', done: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 mb-2 last:mb-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? 'bg-[#1DB954]' : 'bg-slate-200'}`}>
                {item.done && <span className="text-white text-[9px]">✓</span>}
              </div>
              <span className={`text-xs font-500 ${item.done ? 'text-[#1A1A2E]' : 'text-[#64748B]'}`}>{item.label}</span>
              {item.done && <span className="ml-auto text-[#1DB954] text-[10px] font-600">Verified</span>}
            </div>
          ))}
        </div>

        {/* Settings links */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {['Edit Profile', 'Notification Settings', 'Payment Account', 'Help & Support', 'Sign Out'].map((item, i) => (
            <button
              key={item}
              className={`w-full flex items-center justify-between px-4 py-3.5 text-sm text-left hover:bg-[#F8FAFC] transition-colors ${
                i > 0 ? 'border-t border-slate-100' : ''
              } ${item === 'Sign Out' ? 'text-[#EF4444]' : 'text-[#1A1A2E]'}`}
            >
              <span className="font-500">{item}</span>
              {item !== 'Sign Out' && <span className="text-[#64748B]">{Icons.chevronRight}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')

  const navScreens: Screen[] = ['dashboard', 'active-job', 'earnings', 'profile']

  return (
    <div className="size-full flex items-center justify-center bg-[#0F0F1A]">
      {/* Mobile frame */}
      <div
        className="relative flex flex-col bg-white overflow-hidden shadow-2xl"
        style={{
          width: '390px',
          height: '844px',
          maxHeight: '100vh',
          maxWidth: '100vw',
          borderRadius: '40px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 py-2 bg-[#1A1A2E] flex-shrink-0">
          <span className="text-white text-[11px] font-600">9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5 items-end h-3">
              {[3, 5, 7, 9].map((h, i) => (
                <div key={i} className="w-1 bg-white rounded-[1px]" style={{ height: `${h}px`, opacity: i < 3 ? 1 : 0.4 }} />
              ))}
            </div>
            <div className="w-4 h-2 rounded-sm border border-white/60 ml-1 relative">
              <div className="absolute inset-0.5 bg-white rounded-[1px] w-3/4" />
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-hidden">
          {screen === 'dashboard' && <DashboardScreen onNav={setScreen} />}
          {screen === 'job-details' && (
            <JobDetailsScreen
              onBack={() => setScreen('dashboard')}
              onSubmitOffer={() => setScreen('active-job')}
            />
          )}
          {screen === 'active-job' && <ActiveJobScreen onNav={setScreen} />}
          {screen === 'inspection' && (
            <InspectionScreen
              onBack={() => setScreen('active-job')}
              onSubmit={() => setScreen('repair-quote')}
            />
          )}
          {screen === 'repair-quote' && (
            <RepairQuoteScreen
              onBack={() => setScreen('inspection')}
              onApproved={() => setScreen('active-job')}
            />
          )}
          {screen === 'earnings' && <EarningsScreen />}
          {screen === 'profile' && <ProfileScreen />}
        </div>

        {/* Bottom nav */}
        {navScreens.includes(screen) && (
          <BottomNav screen={screen} onNav={setScreen} />
        )}
      </div>
    </div>
  )
}
