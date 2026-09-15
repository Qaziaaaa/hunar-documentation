import { useState } from 'react'
import { T, I, Btn } from './components/shared'
import { DashboardPage } from './pages/DashboardPage'
import { JobsPage } from './pages/JobsPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { EarningsPage } from './pages/EarningsPage'
import { ProfilePage } from './pages/ProfilePage'

type Page = 'dashboard' | 'jobs' | 'reviews' | 'earnings' | 'profile'

const NAV = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: I.home },
  { id: 'jobs' as Page, label: 'My Jobs', icon: I.briefcase },
  { id: 'reviews' as Page, label: 'Reviews', icon: I.star },
  { id: 'earnings' as Page, label: 'Earnings', icon: I.wallet },
  { id: 'profile' as Page, label: 'Profile', icon: I.user },
]

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  jobs: 'My Jobs',
  reviews: 'Reviews & Ratings',
  earnings: 'Earnings',
  profile: 'Profile & Settings',
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [online, setOnline] = useState(true)
  const [search, setSearch] = useState('')

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif", background: T.bg }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="flex flex-col w-56 flex-shrink-0 overflow-hidden" style={{ background: T.sidebarBg }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: T.primary }}>
            <span style={{ color: 'white' }}>{I.wrench}</span>
          </div>
          <span className="font-700 text-base text-white tracking-tight">HUNAR</span>
          <span className="ml-auto text-[9px] font-600 px-1.5 py-0.5 rounded" style={{ background: T.primary + '33', color: T.primary }}>
            WORKER
          </span>
        </div>

        {/* Worker card */}
        <div className="px-3 py-3 mx-2 my-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5 mb-2.5">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=36&h=36&fit=crop" alt="" className="w-9 h-9 rounded-md object-cover flex-shrink-0" style={{ border: `1.5px solid ${T.primary}` }} />
            <div className="min-w-0">
              <p className="text-sm font-600 text-white truncate">Usman Malik</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: online ? T.success : '#94A3B8' }} />
                <p className="text-[10px]" style={{ color: online ? '#4ADE80' : '#94A3B8' }}>{online ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </div>
          {/* Online toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#64748B' }}>Available for jobs</span>
            <button onClick={() => setOnline(!online)} className="w-9 h-5 rounded-full relative transition-all" style={{ background: online ? T.primary : '#334155' }}>
              <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: online ? 17 : 2 }} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 flex flex-col gap-0.5">
          {NAV.map((n) => {
            const active = page === n.id
            return (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-all text-left w-full"
                style={{
                  background: active ? T.primary : 'transparent',
                  color: active ? 'white' : '#94A3B8',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span>{n.icon}</span>
                {n.label}
                {n.id === 'jobs' && (
                  <span className="ml-auto text-[10px] font-600 px-1.5 py-0.5 rounded-full" style={{ background: active ? 'rgba(255,255,255,0.2)' : T.primary + '33', color: active ? 'white' : T.primary }}>2</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom: rating + location */}
        <div className="px-2 pb-4 flex flex-col gap-2">
          <div className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px]" style={{ color: '#64748B' }}>Rating</span>
              <span className="text-xs font-700 text-white">4.8 ★</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: '#64748B' }}>This week</span>
              <span className="text-xs font-700" style={{ color: '#4ADE80' }}>Rs. 8,584</span>
            </div>
          </div>
          <div className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-1.5" style={{ color: '#64748B' }}>
              <span>{I.mapPin}</span>
              <span className="text-[10px]">F-10, Islamabad · 10 km</span>
            </div>
          </div>
          <button onClick={() => setPage('profile')} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all w-full" style={{ color: '#64748B' }}>
            <span>{I.settings}</span>
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-3 flex-shrink-0" style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h1 className="font-600 text-base" style={{ color: T.navy, letterSpacing: '-0.015em' }}>{PAGE_TITLES[page]}</h1>
            <p className="text-xs" style={{ color: T.gray }}>
              {page === 'dashboard' && 'Thursday, 10 September 2026'}
              {page === 'jobs' && '4 jobs · 1 active · 3 nearby'}
              {page === 'reviews' && '94 total reviews'}
              {page === 'earnings' && 'September 2026'}
              {page === 'profile' && 'Manage your account'}
            </p>
          </div>

          {/* Search (dashboard + jobs only) */}
          {(page === 'dashboard' || page === 'jobs') && (
            <div className="relative ml-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.grayDim }}>{I.search}</span>
              <input
                type="text"
                placeholder="Search jobs, customers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm pl-9 pr-4 py-2 rounded-md outline-none w-56"
                style={{ border: `1px solid ${T.border}`, color: T.navy, background: T.bg }}
                onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 1px ${T.primary}` }}
                onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-md hover:bg-slate-100 transition-colors" style={{ color: T.gray }}>
              {I.bell}
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: T.error }} />
            </button>

            {/* Active job chip */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-slate-50" style={{ border: `1px solid ${T.border}` }} onClick={() => setPage('jobs')}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.success }} />
              <span className="text-xs font-500" style={{ color: T.navy }}>Active: Leaking Valve</span>
              <span style={{ color: T.gray }}>{I.chevronRight}</span>
            </div>

            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop" alt="" className="w-8 h-8 rounded-md object-cover cursor-pointer" onClick={() => setPage('profile')} style={{ border: `1.5px solid ${T.primary}` }} />
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-hidden ${page === 'jobs' ? '' : 'overflow-y-auto p-6'}`}>
          {page === 'dashboard' && <DashboardPage onViewJob={() => setPage('jobs')} onGoJobs={() => setPage('jobs')} />}
          {page === 'jobs' && <JobsPage />}
          {page === 'reviews' && <ReviewsPage />}
          {page === 'earnings' && <EarningsPage />}
          {page === 'profile' && <ProfilePage />}
        </main>
      </div>
    </div>
  )
}
