import type { ReactNode } from 'react'

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
  sidebarBg: '#0F172A',
}

export const I = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  briefcase: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  starFill: <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 000 4h4v-4z"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4.5 h-4.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  mapPin: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="9,18 15,12 9,6"/></svg>,
  chevronDown: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="6,9 12,15 18,9"/></svg>,
  arrowLeft: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><polyline points="20,6 9,17 4,12"/></svg>,
  phone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-3.5 h-3.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  camera: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  alertTriangle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><polyline points="16,16 12,12 8,16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  trending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  checkCircle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  wrench: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><polyline points="8,17 12,21 16,17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  document: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-5 h-5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  calendarCheck: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>,
  zap: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/></svg>,
  tool: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
}

// ─── Primitive Components ─────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, loading = false }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'outline' | 'ghost' | 'danger'; size?: 'sm' | 'md'; className?: string; disabled?: boolean; loading?: boolean
}) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-500 rounded-md transition-all cursor-pointer select-none active:scale-[0.99] disabled:opacity-50'
  const sz = size === 'sm' ? 'text-xs px-3 py-1.5' : 'text-sm px-4 py-2'
  const vs: Record<string, string> = {
    primary: 'text-white',
    outline: 'bg-white',
    ghost: 'bg-transparent',
    danger: 'bg-white',
  }
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: disabled ? T.grayDim : T.primary, color: 'white', border: 'none' },
    outline: { background: 'white', color: T.navy, border: `1px solid ${T.border}` },
    ghost: { background: 'transparent', color: T.primary, border: 'none' },
    danger: { background: 'white', color: T.error, border: `1px solid ${T.error}` },
  }
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${sz} ${vs[variant]} ${className}`} style={styles[variant]}>
      {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : children}
    </button>
  )
}

export function Badge({ label, color = 'gray' }: { label: string; color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'teal' | 'gray' }) {
  const map: Record<string, { bg: string; text: string }> = {
    green: { bg: '#DCFCE7', text: '#166534' },
    yellow: { bg: '#FEF9C3', text: '#854D0E' },
    red: { bg: '#FEE2E2', text: '#991B1B' },
    blue: { bg: '#DBEAFE', text: '#1D4ED8' },
    purple: { bg: '#EDE9FE', text: '#6D28D9' },
    teal: { bg: T.primaryLight, text: T.primary },
    gray: { bg: '#F1F5F9', text: '#475569' },
  }
  const s = map[color]
  return (
    <span className="inline-flex items-center text-[10px] font-600 uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
      {label}
    </span>
  )
}

export function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i <= n ? T.warning : 'none'} stroke={i <= n ? T.warning : T.borderDim} strokeWidth="1.5" style={{ width: size, height: size }}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </span>
  )
}

export function Avatar({ name, size = 36, src }: { name: string; size?: number; src?: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  if (src) return <img src={src} alt={name} className="rounded-md object-cover flex-shrink-0" style={{ width: size, height: size }} />
  return (
    <div className="rounded-md flex items-center justify-center flex-shrink-0 font-600" style={{ width: size, height: size, background: T.primaryLight, color: T.primary, fontSize: size * 0.35 }}>
      {initials}
    </div>
  )
}

export function Divider({ vertical = false, className = '' }: { vertical?: boolean; className?: string }) {
  if (vertical) return <div className={`self-stretch ${className}`} style={{ width: 1, background: T.border }} />
  return <div className={`w-full ${className}`} style={{ height: 1, background: T.border }} />
}

export function Card({ children, className = '', onClick, noPad = false }: {
  children: ReactNode; className?: string; onClick?: () => void; noPad?: boolean
}) {
  return (
    <div onClick={onClick} className={`bg-white rounded-lg overflow-hidden ${noPad ? '' : 'p-4'} ${onClick ? 'cursor-pointer hover:shadow-sm' : ''} ${className}`} style={{ border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

export function Input({ label, placeholder, value, onChange, type = 'text', icon, className = '' }: {
  label?: string; placeholder?: string; value: string; onChange: (v: string) => void; type?: string; icon?: ReactNode; className?: string
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-500 mb-1" style={{ color: T.navy }}>{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.grayDim }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm py-2 rounded-md outline-none transition-all"
          style={{ paddingLeft: icon ? 36 : 12, paddingRight: 12, border: `1px solid ${T.border}`, color: T.navy, background: T.surface }}
          onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 1px ${T.primary}` }}
          onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
        />
      </div>
    </div>
  )
}

export function Textarea({ label, placeholder, value, onChange, rows = 3, maxLength, className = '' }: {
  label?: string; placeholder?: string; value: string; onChange: (v: string) => void; rows?: number; maxLength?: number; className?: string
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-500 mb-1" style={{ color: T.navy }}>{label}</label>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} maxLength={maxLength} className="w-full text-sm px-3 py-2 rounded-md outline-none resize-none transition-all" style={{ border: `1px solid ${T.border}`, color: T.navy, background: T.surface }}
        onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 1px ${T.primary}` }}
        onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
      />
      {maxLength && <p className="text-right text-xs mt-1" style={{ color: T.grayDim }}>{value.length}/{maxLength}</p>}
    </div>
  )
}

export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-md shadow-lg" style={{ background: T.surface, borderLeft: `3px solid ${type === 'success' ? T.success : T.error}`, border: `1px solid ${T.border}`, maxWidth: 360 }}>
      <div style={{ color: type === 'success' ? T.success : T.error }}>{I.checkCircle}</div>
      <p className="text-sm flex-1" style={{ color: T.navy }}>{message}</p>
      <button onClick={onClose} style={{ color: T.gray }}>{I.x}</button>
    </div>
  )
}

export function StatCard({ label, value, sub, icon, accent }: { label: string; value: string; sub?: string; icon: ReactNode; accent: string }) {
  return (
    <Card className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: accent + '1A', color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-500" style={{ color: T.gray }}>{label}</p>
        <p className="font-700 text-xl mt-0.5" style={{ color: T.navy, letterSpacing: '-0.02em' }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: T.gray }}>{sub}</p>}
      </div>
    </Card>
  )
}

const JOB_STATUS_MAP: Record<string, { label: string; color: 'green' | 'yellow' | 'blue' | 'purple' | 'red' | 'gray' }> = {
  'offer-sent': { label: 'Offer Sent', color: 'yellow' },
  'visit-negotiation': { label: 'Negotiating', color: 'yellow' },
  'visit-scheduled': { label: 'Scheduled', color: 'blue' },
  'on-the-way': { label: 'En Route', color: 'blue' },
  'visit-in-progress': { label: 'Inspecting', color: 'purple' },
  'repair-negotiating': { label: 'Quote Sent', color: 'yellow' },
  'repair-approved': { label: 'Approved', color: 'green' },
  'in-progress': { label: 'In Progress', color: 'blue' },
  completed: { label: 'Completed', color: 'green' },
  paid: { label: 'Paid', color: 'green' },
  disputed: { label: 'Disputed', color: 'red' },
}

export function JobBadge({ status }: { status: string }) {
  const s = JOB_STATUS_MAP[status] ?? { label: status, color: 'gray' as const }
  return <Badge label={s.label} color={s.color} />
}

export function CategoryIcon({ cat }: { cat: string }) {
  const m: Record<string, string> = { Plumbing: '🔧', Electrician: '⚡', 'AC Repair': '❄️', Carpenter: '🪚', 'Appliance Repair': '🛠️', Painter: '🖌️', Cleaning: '🧹', Other: '📦' }
  return <span>{m[cat] ?? '🛠️'}</span>
}
