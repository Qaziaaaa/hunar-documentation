import { type ReactNode } from 'react'
import type { JobStatus } from '../data/mock'

// ─── Tokens ───────────────────────────────────────────────────────────────────
export const T = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryLight: '#CCFBF1',
  navy: '#0F172A',
  gray: '#64748B',
  grayDim: '#94A3B8',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderDim: '#CBD5E1',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
}

// ─── Icons ────────────────────────────────────────────────────────────────────
export const Icons = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  briefcase: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  starFill: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 000 4h4v-4z"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9,18 15,12 9,6"/></svg>,
  chevronDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="6,9 12,15 18,9"/></svg>,
  arrowLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="20,6 9,17 4,12"/></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  camera: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  alertTriangle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  trending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  radio: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
  checkCircle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>,
  document: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>,
  wrench: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const STATUS_MAP: Record<JobStatus | string, { label: string; bg: string; text: string }> = {
  'offer-sent': { label: 'OFFER SENT', bg: '#FEF9C3', text: '#854D0E' },
  'visit-negotiation': { label: 'NEGOTIATING', bg: '#FEF9C3', text: '#854D0E' },
  'visit-scheduled': { label: 'SCHEDULED', bg: '#DBEAFE', text: '#1D4ED8' },
  'on-the-way': { label: 'EN ROUTE', bg: '#DBEAFE', text: '#1D4ED8' },
  'visit-in-progress': { label: 'INSPECTING', bg: '#EDE9FE', text: '#6D28D9' },
  'repair-negotiating': { label: 'QUOTE SENT', bg: '#FEF9C3', text: '#854D0E' },
  'repair-approved': { label: 'APPROVED', bg: '#DCFCE7', text: '#166534' },
  'in-progress': { label: 'IN PROGRESS', bg: '#DBEAFE', text: '#1D4ED8' },
  completed: { label: 'COMPLETED', bg: '#DCFCE7', text: '#166534' },
  paid: { label: 'PAID', bg: '#DCFCE7', text: '#166534' },
  disputed: { label: 'DISPUTED', bg: '#FEE2E2', text: '#991B1B' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status.toUpperCase(), bg: '#F1F5F9', text: '#475569' }
  return (
    <span
      className="text-[10px] font-600 px-2 py-0.5 rounded-full tracking-wide"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

// ─── UrgencyBadge ─────────────────────────────────────────────────────────────
export function UrgencyBadge({ urgency }: { urgency: 'urgent' | 'normal' }) {
  if (urgency === 'normal') return null
  return (
    <span className="text-[10px] font-600 px-2 py-0.5 rounded-full tracking-wide" style={{ background: '#FEE2E2', color: '#991B1B' }}>
      URGENT
    </span>
  )
}

// ─── PrimaryButton ────────────────────────────────────────────────────────────
export function PrimaryBtn({ children, onClick, className = '', disabled = false, loading = false }: {
  children: ReactNode; onClick?: () => void; className?: string; disabled?: boolean; loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2 font-600 text-sm text-white px-4 py-3 rounded-md transition-all active:scale-[0.98] disabled:opacity-50 ${className}`}
      style={{ background: disabled || loading ? T.grayDim : T.primary }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = T.primaryDark }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = T.primary }}
    >
      {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
    </button>
  )
}

// ─── OutlineBtn ───────────────────────────────────────────────────────────────
export function OutlineBtn({ children, onClick, className = '', danger = false }: {
  children: ReactNode; onClick?: () => void; className?: string; danger?: boolean
}) {
  const color = danger ? T.error : T.navy
  const borderColor = danger ? T.error : T.border
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 font-500 text-sm px-4 py-3 rounded-md transition-all active:scale-[0.98] bg-white ${className}`}
      style={{ border: `1px solid ${borderColor}`, color }}
    >
      {children}
    </button>
  )
}

// ─── GhostBtn ─────────────────────────────────────────────────────────────────
export function GhostBtn({ children, onClick, className = '', danger = false }: {
  children: ReactNode; onClick?: () => void; className?: string; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`font-500 text-sm transition-all ${className}`}
      style={{ color: danger ? T.error : T.primary }}
    >
      {children}
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }: {
  children: ReactNode; className?: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-4 ${onClick ? 'cursor-pointer active:bg-slate-50' : ''} ${className}`}
      style={{ border: `1px solid ${T.border}` }}
    >
      {children}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, placeholder, value, onChange, type = 'text', className = '' }: {
  label?: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string; className?: string
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm px-3 py-2.5 rounded-md outline-none transition-all"
        style={{
          border: `1px solid ${T.border}`,
          color: T.navy,
          background: T.surface,
        }}
        onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 1px ${T.primary}` }}
        onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
      />
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, placeholder, value, onChange, rows = 3, maxLength, className = '' }: {
  label?: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number; maxLength?: number; className?: string
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full text-sm px-3 py-2.5 rounded-md outline-none transition-all resize-none"
        style={{ border: `1px solid ${T.border}`, color: T.navy, background: T.surface }}
        onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 1px ${T.primary}` }}
        onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
      />
      {maxLength && (
        <p className="text-right text-xs mt-1" style={{ color: T.gray }}>{value.length} / {maxLength}</p>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div
      className="absolute top-4 left-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-md shadow-lg"
      style={{ background: T.surface, borderLeft: `3px solid ${type === 'success' ? T.success : T.error}`, border: `1px solid ${T.border}` }}
    >
      <div style={{ color: type === 'success' ? T.success : T.error }} className="mt-0.5 flex-shrink-0">
        {type === 'success' ? Icons.checkCircle : Icons.alertTriangle}
      </div>
      <p className="text-xs flex-1 leading-relaxed" style={{ color: T.navy }}>{message}</p>
      <button onClick={onClose} style={{ color: T.gray }}>{Icons.x}</button>
    </div>
  )
}

// ─── Chip / Pill ──────────────────────────────────────────────────────────────
export function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-500 px-3 py-1.5 rounded-full transition-all"
      style={{
        background: selected ? T.primaryLight : T.surface,
        border: `1px solid ${selected ? T.primary : T.border}`,
        color: selected ? T.primary : T.gray,
      }}
    >
      {label}
    </button>
  )
}

// ─── Stars ────────────────────────────────────────────────────────────────────
export function Stars({ rating, size = 'sm', interactive = false, onChange }: {
  rating: number; size?: 'sm' | 'md'; interactive?: boolean; onChange?: (r: number) => void
}) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <button
          key={i}
          onClick={() => interactive && onChange?.(i)}
          className={`${sz} transition-transform ${interactive ? 'active:scale-110' : ''}`}
          disabled={!interactive}
        >
          <svg viewBox="0 0 24 24" fill={i <= rating ? T.warning : 'none'} stroke={i <= rating ? T.warning : T.border} strokeWidth="1.5">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
          </svg>
        </button>
      ))}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-600"
      style={{ width: size, height: size, background: T.primaryLight, color: T.primary, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <div className="px-4 pt-10 pb-4 flex items-center gap-3 flex-shrink-0" style={{ background: T.navy }}>
      {onBack && (
        <button onClick={onBack} className="p-1 -ml-1" style={{ color: '#94A3B8' }}>
          {Icons.arrowLeft}
        </button>
      )}
      <div className="flex-1">
        <h1 className="font-600 text-base text-white" style={{ letterSpacing: '-0.015em' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Hairline Divider ─────────────────────────────────────────────────────────
export function Divider({ className = '' }: { className?: string }) {
  return <div className={`w-full ${className}`} style={{ height: 1, background: T.border }} />
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
type Screen = string
export function BottomNav({ screen, onNav }: { screen: Screen; onNav: (s: Screen) => void }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Icons.home },
    { id: 'active-job', label: 'Jobs', icon: Icons.briefcase },
    { id: 'reviews', label: 'Reviews', icon: Icons.star },
    { id: 'earnings', label: 'Earnings', icon: Icons.wallet },
    { id: 'profile', label: 'Profile', icon: Icons.user },
  ]
  const jobScreens = ['job-details', 'inspection', 'repair-quote', 'active-job']
  const reviewScreens = ['reviews']

  return (
    <nav className="flex items-center pt-2 pb-3 px-1 gap-0 flex-shrink-0" style={{ background: T.surface, borderTop: `1px solid ${T.border}` }}>
      {tabs.map((t) => {
        const active =
          screen === t.id ||
          (t.id === 'active-job' && jobScreens.includes(screen)) ||
          (t.id === 'reviews' && reviewScreens.includes(screen))
        return (
          <button
            key={t.id}
            onClick={() => onNav(t.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg transition-all"
            style={{ color: active ? T.primary : T.gray }}
          >
            {t.icon}
            <span className="text-[9px] font-500">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Category Icon ────────────────────────────────────────────────────────────
export function CategoryIcon({ category }: { category: string }) {
  const map: Record<string, string> = {
    Plumbing: '🔧', Electrician: '⚡', 'AC Repair': '❄️', Carpenter: '🪚',
    'Appliance Repair': '🛠️', Painter: '🖌️', Cleaning: '🧹', Other: '📦',
  }
  return <span>{map[category] ?? '🛠️'}</span>
}

// ─── Info Banner ──────────────────────────────────────────────────────────────
export function InfoBanner({ text, onDismiss }: { text: string; onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-2 px-3 py-3 rounded-md" style={{ background: '#EFF4FF', borderLeft: `3px solid ${T.primary}` }}>
      <div className="flex-shrink-0 mt-0.5" style={{ color: T.primary }}>{Icons.info}</div>
      <p className="text-xs flex-1 leading-relaxed" style={{ color: T.navy }}>{text}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0" style={{ color: T.gray }}>{Icons.x}</button>
      )}
    </div>
  )
}
