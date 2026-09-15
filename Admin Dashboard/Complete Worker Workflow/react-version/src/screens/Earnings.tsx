import { useState } from 'react'
import { T, Icons, Divider, Stars, PageHeader } from '../components/shared'
import { COMPLETED_JOBS } from '../data/mock'

export function EarningsScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'payout' | 'history'>('payout')

  const weeklyTotal = COMPLETED_JOBS.reduce((s, j) => s + j.amount, 0)
  const weeklyBars = [40, 65, 30, 80, 55, 90, 45, 100, 70, 85, 60, 95, 50, 75, 88]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      <div className="px-4 pt-10 pb-4 flex-shrink-0" style={{ background: T.navy }}>
        <h1 className="font-600 text-base text-white mb-4" style={{ letterSpacing: '-0.015em' }}>Earnings</h1>

        <div className="rounded-md p-4 mb-3" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>This Week's Earnings</p>
          <p className="font-700 text-white" style={{ fontSize: 28, letterSpacing: '-0.03em' }}>
            Rs. {weeklyTotal.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-3.5 h-3.5" style={{ color: '#4ADE80' }}>{Icons.trending}</div>
            <span className="text-xs font-600" style={{ color: '#4ADE80' }}>+23%</span>
            <span className="text-xs" style={{ color: '#94A3B8' }}>vs last week</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Jobs Completed', value: '18' },
            { label: 'Avg Rating', value: '4.8 ★' },
            { label: 'Completion Rate', value: '96%' },
          ].map((s) => (
            <div key={s.label} className="rounded-md p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="font-700 text-sm text-white">{s.value}</p>
              <p className="text-[9px] mt-0.5 leading-tight" style={{ color: '#94A3B8' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-shrink-0" style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        {([['payout', 'Payout Tracker'], ['history', 'Completed Jobs']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 py-3 text-xs font-600 transition-colors"
            style={{
              color: tab === id ? T.primary : T.gray,
              borderBottom: `2px solid ${tab === id ? T.primary : 'transparent'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'payout' ? (
          <div className="p-4 flex flex-col gap-3">
            {/* Pending escrow */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div className="px-4 pt-4 pb-1 flex items-center justify-between">
                <h3 className="font-600 text-sm" style={{ color: T.navy }}>Pending Payout</h3>
                <span className="text-[10px] font-600 px-2 py-0.5 rounded-full" style={{ background: '#FEF9C3', color: '#854D0E' }}>
                  IN ESCROW 22H
                </span>
              </div>
              <div className="px-4 py-3">
                <p className="font-700" style={{ color: T.primary, fontSize: 24, letterSpacing: '-0.02em' }}>Rs. 2,537</p>
                <p className="text-xs mt-0.5" style={{ color: T.gray }}>Leaking Main Valve · Ahmed Raza</p>
                <Divider className="my-3" />
                {[
                  { label: 'Total Job Value', amount: 'Rs. 2,985', highlight: false },
                  { label: 'Platform Commission (15%)', amount: '− Rs. 448', highlight: false },
                  { label: 'Your Payout', amount: 'Rs. 2,537', highlight: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-1">
                    <span className="text-xs" style={{ color: T.gray }}>{row.label}</span>
                    <span className="text-xs font-700" style={{ color: row.highlight ? T.primary : T.navy }}>{row.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly chart */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div className="px-4 pt-4 pb-1">
                <h3 className="font-600 text-sm" style={{ color: T.navy }}>This Month</h3>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-end gap-1 h-20">
                  {weeklyBars.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{ height: `${h}%`, background: i === 14 ? T.primary : T.border }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px]" style={{ color: T.gray }}>Sep 1</span>
                  <span className="text-[10px]" style={{ color: T.gray }}>Today</span>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <div className="px-4 pt-4 pb-1">
                <h3 className="font-600 text-sm" style={{ color: T.navy }}>Payment Methods Accepted</h3>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {[
                  { label: 'JazzCash', sub: 'Linked · 0321-XXXXXXX', active: true },
                  { label: 'Easypaisa', sub: 'Not linked', active: false },
                  { label: 'Bank Transfer', sub: 'MCB · XXXX-1234', active: true },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <p className="text-xs font-600" style={{ color: T.navy }}>{m.label}</p>
                      <p className="text-[10px]" style={{ color: T.gray }}>{m.sub}</p>
                    </div>
                    <span className="text-[10px] font-600 px-2 py-0.5 rounded-full" style={{
                      background: m.active ? '#DCFCE7' : T.border,
                      color: m.active ? '#166534' : T.gray,
                    }}>
                      {m.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              {COMPLETED_JOBS.map((job, i) => (
                <div key={job.id}>
                  <div className="px-4 py-3.5 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-600 text-xs" style={{ color: T.navy }}>{job.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: T.gray }}>{job.customer} · {job.date}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Stars rating={job.rating} size="sm" />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-700 text-sm" style={{ color: T.primary }}>Rs. {job.amount.toLocaleString()}</p>
                      <p className="text-[10px]" style={{ color: T.gray }}>{job.id}</p>
                    </div>
                  </div>
                  {i < COMPLETED_JOBS.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
