import { useState } from 'react'
import { T, I, Btn, Badge, Stars, Divider } from '../components/shared'
import { COMPLETED_JOBS } from '../data/mock'

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
const MONTH_VALS = [42000, 58000, 49000, 71000, 63000, 8584]
const MAX = Math.max(...MONTH_VALS)

export function EarningsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')
  const weeklyBars = [65, 40, 80, 55, 90, 70, 100]
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="flex flex-col gap-5">
      {/* Top stat strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Earned (This Month)', value: 'Rs. 8,584', sub: '5 jobs completed', color: T.success },
          { label: 'Pending Payout', value: 'Rs. 2,537', sub: 'In 24h escrow', color: T.warning },
          { label: 'Platform Commission', value: 'Rs. 1,513', sub: '15% of Rs. 10,097', color: T.gray },
          { label: 'Net This Month', value: 'Rs. 8,584', sub: 'After commission', color: T.primary },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-4" style={{ border: `1px solid ${T.border}` }}>
            <p className="text-xs font-500" style={{ color: T.gray }}>{s.label}</p>
            <p className="font-700 mt-1.5" style={{ color: s.color, fontSize: 22, letterSpacing: '-0.02em' }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: T.gray }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Charts — 2/3 */}
        <div className="col-span-2 flex flex-col gap-5">
          {/* Period selector */}
          <div className="bg-white rounded-lg p-5" style={{ border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-600 text-sm" style={{ color: T.navy }}>Earnings Overview</h2>
              <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                {(['week','month','year'] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className="text-xs px-3 py-1.5 capitalize transition-all" style={{ background: period === p ? T.primary : 'white', color: period === p ? 'white' : T.gray, borderRight: p !== 'year' ? `1px solid ${T.border}` : 'none' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {period === 'week' ? (
              <div>
                <div className="flex items-end gap-3 h-40 mb-2">
                  {weeklyBars.map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px]" style={{ color: T.gray }}>
                        {i === 6 ? 'Rs. 2,537' : ''}
                      </span>
                      <div className="w-full rounded-t-sm" style={{ height: `${h}%`, background: i === 6 ? T.primary : T.border }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">{DAYS.map((d) => <span key={d} className="flex-1 text-center text-[10px]" style={{ color: T.gray }}>{d}</span>)}</div>
              </div>
            ) : period === 'month' ? (
              <div>
                <div className="flex items-end gap-3 h-40 mb-2">
                  {MONTH_VALS.map((v, i) => {
                    const h = Math.round((v / MAX) * 100)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        {i === 5 && <span className="text-[10px]" style={{ color: T.gray }}>Rs. 8.5k</span>}
                        <div className="w-full rounded-t-sm" style={{ height: `${h}%`, background: i === 5 ? T.primary : T.border }} />
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-3">{MONTHS.map((m) => <span key={m} className="flex-1 text-center text-[10px]" style={{ color: T.gray }}>{m}</span>)}</div>
              </div>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = [60, 55, 70, 75, 80, 85, 90, 65, 70, 88, 40, 30][i]
                  return <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i >= 8 ? T.primary : T.border }} />
                })}
              </div>
            )}
          </div>

          {/* Jobs history table */}
          <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
              <h2 className="font-600 text-sm" style={{ color: T.navy }}>Transaction History</h2>
              <Btn variant="outline" size="sm">{I.download} Export</Btn>
            </div>
            <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] font-600 uppercase tracking-wide" style={{ color: T.gray, background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              <span className="col-span-1">ID</span>
              <span className="col-span-4">Job</span>
              <span className="col-span-2">Customer</span>
              <span className="col-span-1">Date</span>
              <span className="col-span-1">Rating</span>
              <span className="col-span-1">Total</span>
              <span className="col-span-1">Commission</span>
              <span className="col-span-1 text-right">Payout</span>
            </div>
            {COMPLETED_JOBS.map((job, i) => {
              const commission = Math.round(job.amount * 0.15 / 0.85 * 0.15)
              const gross = Math.round(job.amount / 0.85)
              return (
                <div key={job.id} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-slate-50 transition-colors" style={{ borderBottom: i < COMPLETED_JOBS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <span className="col-span-1 text-xs" style={{ color: T.gray }}>{job.id}</span>
                  <span className="col-span-4 text-sm font-500 truncate pr-3" style={{ color: T.navy }}>{job.title}</span>
                  <span className="col-span-2 text-xs truncate" style={{ color: T.gray }}>{job.customer}</span>
                  <span className="col-span-1 text-xs" style={{ color: T.gray }}>{job.date}</span>
                  <div className="col-span-1"><Stars n={job.rating} size={11} /></div>
                  <span className="col-span-1 text-xs tabular-nums" style={{ color: T.navy }}>Rs. {gross.toLocaleString()}</span>
                  <span className="col-span-1 text-xs tabular-nums" style={{ color: T.gray }}>−Rs. {commission.toLocaleString()}</span>
                  <span className="col-span-1 text-right text-sm font-600 tabular-nums" style={{ color: T.success }}>Rs. {job.amount.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right — payout + payment */}
        <div className="flex flex-col gap-4">
          {/* Pending escrow */}
          <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#FFFBEB', borderBottom: `1px solid #FDE68A` }}>
              <p className="text-xs font-600" style={{ color: '#854D0E' }}>Pending Escrow</p>
              <Badge label="22h remaining" color="yellow" />
            </div>
            <div className="p-4">
              <p className="font-700" style={{ color: T.primary, fontSize: 28, letterSpacing: '-0.02em' }}>Rs. 2,537</p>
              <p className="text-xs mt-0.5 mb-3" style={{ color: T.gray }}>Leaking Main Valve · Ahmed Raza</p>
              <Divider />
              <div className="mt-3 flex flex-col gap-1.5">
                {[{ l: 'Job Total', v: 'Rs. 2,985' }, { l: 'Commission (15%)', v: '− Rs. 448' }, { l: 'Your Payout', v: 'Rs. 2,537', bold: true }].map((r) => (
                  <div key={r.l} className="flex justify-between text-xs">
                    <span style={{ color: T.gray }}>{r.l}</span>
                    <span style={{ color: (r as any).bold ? T.success : T.navy, fontWeight: (r as any).bold ? 700 : 500 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment accounts */}
          <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
              <p className="text-sm font-600" style={{ color: T.navy }}>Payment Accounts</p>
            </div>
            {[
              { name: 'JazzCash', detail: '0321-XXXXXXX', active: true },
              { name: 'Easypaisa', detail: 'Not connected', active: false },
              { name: 'MCB Bank', detail: 'XXXX-1234', active: true },
            ].map((acc, i) => (
              <div key={acc.name} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                <div>
                  <p className="text-sm font-500" style={{ color: T.navy }}>{acc.name}</p>
                  <p className="text-xs" style={{ color: T.gray }}>{acc.detail}</p>
                </div>
                <Badge label={acc.active ? 'Active' : 'Inactive'} color={acc.active ? 'green' : 'gray'} />
              </div>
            ))}
            <div className="px-4 py-3">
              <Btn variant="outline" size="sm" className="w-full">{I.plus} Add Account</Btn>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-lg p-4" style={{ border: `1px solid ${T.border}` }}>
            <p className="text-[10px] font-600 uppercase tracking-wide mb-3" style={{ color: T.gray }}>All-Time Summary</p>
            {[
              { l: 'Total Jobs', v: '94' },
              { l: 'Total Earned', v: 'Rs. 3,84,500' },
              { l: 'Commission Paid', v: 'Rs. 57,675' },
              { l: 'Avg Job Value', v: 'Rs. 4,090' },
            ].map((s) => (
              <div key={s.l} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span className="text-xs" style={{ color: T.gray }}>{s.l}</span>
                <span className="text-sm font-600" style={{ color: T.navy }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
