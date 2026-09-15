import { useState } from 'react'
import { T, I, Btn, Badge, Stars, StatCard, Card, Divider, JobBadge, CategoryIcon } from '../components/shared'
import { NEARBY_JOBS, ACTIVE_JOB, COMPLETED_JOBS } from '../data/mock'

const STEPS = [
  { key: 'visit-scheduled', label: 'Visit Scheduled' },
  { key: 'on-the-way', label: 'On the Way' },
  { key: 'visit-in-progress', label: 'Arrived & Inspecting' },
  { key: 'repair-negotiating', label: 'Repair Quote Sent' },
  { key: 'repair-approved', label: 'Repair Approved' },
  { key: 'in-progress', label: 'Repair in Progress' },
  { key: 'completed', label: 'Completed' },
]
const ORDER = STEPS.map((s) => s.key)

export function DashboardPage({ onViewJob, onGoJobs }: { onViewJob: () => void; onGoJobs: () => void }) {
  const [jobStatus, setJobStatus] = useState(ACTIVE_JOB.status)
  const currentIdx = ORDER.indexOf(jobStatus)

  const nextAction = () => {
    if (jobStatus === 'repair-approved') setJobStatus('in-progress')
    else if (jobStatus === 'in-progress') setJobStatus('completed')
    else if (jobStatus === 'visit-scheduled') setJobStatus('on-the-way')
    else if (jobStatus === 'on-the-way') setJobStatus('visit-in-progress')
  }
  const nextLabel = () => {
    if (jobStatus === 'visit-scheduled') return 'Start Visit'
    if (jobStatus === 'on-the-way') return "I've Arrived"
    if (jobStatus === 'repair-approved') return 'Start Repair'
    if (jobStatus === 'in-progress') return 'Mark Complete'
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Today's Earnings" value="Rs. 2,537" sub="+Rs. 850 pending" icon={I.wallet} accent={T.success} />
        <StatCard label="Active Jobs" value="2" sub="1 awaiting your action" icon={I.briefcase} accent={T.primary} />
        <StatCard label="Avg Rating" value="4.8 ★" sub="Based on 94 reviews" icon={I.star} accent={T.warning} />
        <StatCard label="Completion Rate" value="96%" sub="18 jobs this month" icon={I.trending} accent={T.primary} />
      </div>

      {/* Main two-column */}
      <div className="grid grid-cols-3 gap-5">
        {/* Nearby jobs — 2/3 */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-600 text-sm" style={{ color: T.navy }}>Nearby Jobs</h2>
            <Btn variant="ghost" size="sm" onClick={onGoJobs}>View all →</Btn>
          </div>

          <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            {/* Table header */}
            <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-600 uppercase tracking-wide" style={{ color: T.gray, background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              <span className="col-span-5">Job</span>
              <span className="col-span-2">Category</span>
              <span className="col-span-2">Distance</span>
              <span className="col-span-2">Visit Fee</span>
              <span className="col-span-1"></span>
            </div>
            {NEARBY_JOBS.map((job, i) => (
              <div
                key={job.id}
                className="grid grid-cols-12 px-4 py-3.5 items-center hover:bg-slate-50 transition-colors cursor-pointer"
                style={{ borderBottom: i < NEARBY_JOBS.length - 1 ? `1px solid ${T.border}` : 'none' }}
                onClick={onViewJob}
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0" style={{ background: T.primaryLight }}>
                    <CategoryIcon cat={job.category} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-500 truncate" style={{ color: T.navy }}>{job.title}</p>
                    <p className="text-xs truncate" style={{ color: T.gray }}>{job.area}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-xs" style={{ color: T.gray }}>{job.category}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 text-xs" style={{ color: T.gray }}>
                  {I.mapPin} {job.distance}
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-600" style={{ color: T.navy }}>Rs. {job.visitFee}</span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-2">
                  {job.urgency === 'urgent' && <Badge label="Urgent" color="red" />}
                  <span style={{ color: T.gray }}>{I.chevronRight}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent completed */}
          <div className="flex items-center justify-between mt-1">
            <h2 className="font-600 text-sm" style={{ color: T.navy }}>Recent Completed</h2>
          </div>
          <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            {COMPLETED_JOBS.slice(0, 3).map((job, i) => (
              <div key={job.id} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: i < 2 ? `1px solid ${T.border}` : 'none' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-500" style={{ color: T.navy }}>{job.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.gray }}>{job.customer} · {job.date}</p>
                </div>
                <Stars n={job.rating} size={12} />
                <span className="text-sm font-600 tabular-nums" style={{ color: T.primary }}>Rs. {job.amount.toLocaleString()}</span>
                <Badge label="Paid" color="green" />
              </div>
            ))}
          </div>
        </div>

        {/* Active job panel — 1/3 */}
        <div className="flex flex-col gap-4">
          <h2 className="font-600 text-sm" style={{ color: T.navy }}>Active Job</h2>

          <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            {/* Job header */}
            <div className="p-4" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-600" style={{ color: T.navy }}>Leaking Main Water Valve</p>
                  <p className="text-xs mt-0.5" style={{ color: T.gray }}>Ahmed Raza · F-10/2, Islamabad</p>
                </div>
                <JobBadge status={jobStatus} />
              </div>
              <div className="flex gap-2 mt-3">
                <Btn variant="outline" size="sm" className="flex-1">{I.phone} Call</Btn>
                <Btn variant="outline" size="sm" className="flex-1">{I.chat} Chat</Btn>
              </div>
            </div>

            {/* Stepper */}
            <div className="px-4 py-4">
              <p className="text-[10px] font-600 uppercase tracking-wide mb-3" style={{ color: T.gray }}>Progress</p>
              {STEPS.map((step, i) => {
                const done = i < currentIdx
                const active = i === currentIdx
                return (
                  <div key={step.key} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: done ? T.primary : active ? T.navy : T.bg, border: `1px solid ${done ? T.primary : active ? T.navy : T.border}` }}>
                        {done ? <span className="text-white" style={{ fontSize: 8 }}>✓</span> : active ? <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.primary }} /> : null}
                      </div>
                      {i < STEPS.length - 1 && <div className="w-px my-0.5" style={{ height: 14, background: done ? T.primary : T.border }} />}
                    </div>
                    <p className="text-xs pb-2" style={{ color: done ? T.primary : active ? T.navy : T.grayDim, fontWeight: active ? 600 : 400 }}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Invoice preview */}
            <div className="px-4 py-3" style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>
              <div className="flex justify-between text-xs mb-1"><span style={{ color: T.gray }}>Total</span><span className="font-600" style={{ color: T.navy }}>Rs. 2,985</span></div>
              <div className="flex justify-between text-xs"><span style={{ color: T.gray }}>Your payout (85%)</span><span className="font-600" style={{ color: T.success }}>Rs. 2,537</span></div>
            </div>

            {/* CTA */}
            {nextLabel() && (
              <div className="p-4" style={{ borderTop: `1px solid ${T.border}` }}>
                {jobStatus === 'repair-approved' && (
                  <div className="flex items-start gap-2 p-2.5 rounded-md mb-3 text-xs" style={{ background: '#FFFBEB', border: `1px solid #FDE68A` }}>
                    <div style={{ color: T.warning }}>{I.shield}</div>
                    <p style={{ color: '#92400E' }}>Customer approved. Safe to begin repair.</p>
                  </div>
                )}
                <Btn variant="primary" className="w-full" onClick={nextAction}>
                  {nextLabel()}
                </Btn>
              </div>
            )}
          </div>

          {/* Quick earnings */}
          <div className="bg-white rounded-lg p-4" style={{ border: `1px solid ${T.border}` }}>
            <p className="text-xs font-600 uppercase tracking-wide mb-3" style={{ color: T.gray }}>This Week</p>
            <div className="flex items-end gap-1 h-14">
              {[40, 65, 30, 80, 55, 90, 100].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i === 6 ? T.primary : T.border }} />
              ))}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: T.grayDim }}>
              <span>Mon</span><span>Today</span>
            </div>
            <Divider className="my-3" />
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: T.gray }}>Weekly total</span>
              <span className="text-sm font-700" style={{ color: T.navy }}>Rs. 8,584</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
