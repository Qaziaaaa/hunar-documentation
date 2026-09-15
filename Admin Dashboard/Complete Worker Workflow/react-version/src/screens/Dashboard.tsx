import { useState } from 'react'
import {
  T, Icons, PrimaryBtn, Card, StatusBadge, UrgencyBadge, Divider, CategoryIcon,
} from '../components/shared'
import { NEARBY_JOBS } from '../data/mock'

const FILTERS = ['All', 'Plumbing', 'Electrician', 'AC Repair', 'Carpenter']

export function DashboardScreen({ onViewJob }: { onViewJob: () => void }) {
  const [online, setOnline] = useState(true)
  const [filter, setFilter] = useState('All')
  const [showBanner, setShowBanner] = useState(false)

  const filtered = filter === 'All' ? NEARBY_JOBS : NEARBY_JOBS.filter((j) => j.category === filter)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex-shrink-0" style={{ background: T.navy }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs" style={{ color: '#94A3B8' }}>Good afternoon,</p>
            <h1 className="font-600 text-base text-white mt-0.5" style={{ letterSpacing: '-0.015em' }}>Usman Malik</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative" style={{ color: '#94A3B8' }}>
              {Icons.bell}
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-700" style={{ background: T.primary }}>3</span>
            </button>
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop"
              alt="Usman Malik"
              className="w-9 h-9 rounded-md object-cover"
              style={{ border: `2px solid ${T.primary}` }}
            />
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-md p-3 mb-3" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${online ? 'animate-pulse' : ''}`} style={{ background: online ? T.success : T.gray }} />
              <span className="text-sm font-600 text-white">{online ? 'Online — Ready for Jobs' : 'Offline'}</span>
            </div>
            <button
              onClick={() => setOnline(!online)}
              className="w-11 h-6 rounded-full relative transition-all"
              style={{ background: online ? T.primary : '#334155' }}
            >
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" style={{ left: online ? 22 : 2 }} />
            </button>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
            <span className="w-3.5 h-3.5 flex-shrink-0">{Icons.mapPin}</span>
            <p className="text-xs">Serving: F-10, Islamabad — 10 km radius</p>
            <button className="text-xs font-500 ml-1" style={{ color: T.primary }}>Change</button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Today's Earnings", value: 'Rs. 2,537', icon: Icons.trending, color: T.success },
            { label: 'Active Jobs', value: '2', icon: Icons.briefcase, color: T.warning },
            { label: 'Rating', value: '4.8', icon: Icons.star, color: T.warning },
          ].map((s) => (
            <div key={s.label} className="rounded-md p-2.5" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-1 mb-1" style={{ color: s.color }}>
                <span className="w-4 h-4">{s.icon}</span>
              </div>
              <p className="font-700 text-sm text-white">{s.value}</p>
              <p className="text-[9px] mt-0.5 leading-tight" style={{ color: '#94A3B8' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Jobs feed */}
      <div className="flex-1 overflow-y-auto" style={{ background: T.bg }}>
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-600 text-sm" style={{ color: T.navy, letterSpacing: '-0.01em' }}>Nearby Jobs</h2>
            <span className="text-xs font-500" style={{ color: T.primary }}>{filtered.length} available</span>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs font-600 px-3 py-1.5 rounded-full whitespace-nowrap transition-all"
                style={{
                  background: filter === f ? T.navy : T.surface,
                  color: filter === f ? 'white' : T.gray,
                  border: `1px solid ${filter === f ? T.navy : T.border}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Job cards */}
        <div className="px-4 flex flex-col gap-3 pb-4">
          {filtered.map((job) => (
            <div
              key={job.id}
              onClick={onViewJob}
              className="bg-white rounded-md cursor-pointer active:bg-slate-50 transition-colors"
              style={{ border: `1px solid ${T.border}` }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-md flex items-center justify-center text-lg flex-shrink-0" style={{ background: T.primaryLight }}>
                      <CategoryIcon category={job.category} />
                    </div>
                    <div>
                      <h3 className="font-600 text-sm leading-tight" style={{ color: T.navy }}>{job.title}</h3>
                      <p className="text-xs mt-0.5" style={{ color: T.gray }}>{job.category}</p>
                    </div>
                  </div>
                  <UrgencyBadge urgency={job.urgency} />
                </div>

                <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: T.gray }}>
                  {job.description}
                </p>

                <div className="flex items-center gap-3 text-xs" style={{ color: T.gray }}>
                  <span className="flex items-center gap-1">{Icons.mapPin}{job.distance} · {job.area.split(',')[0]}</span>
                  <span className="flex items-center gap-1">{Icons.clock}{job.postedTime}</span>
                </div>
              </div>

              <Divider />

              <div className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wide font-600" style={{ color: T.gray }}>Visit Fee</p>
                  <p className="font-700 text-sm" style={{ color: T.navy }}>Rs. {job.visitFee}</p>
                </div>
                <PrimaryBtn onClick={(e) => { e?.stopPropagation?.(); onViewJob() }} className="px-4 py-2 text-xs">
                  View Job →
                </PrimaryBtn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
