import { useState } from 'react'
import {
  T, Icons, PrimaryBtn, OutlineBtn, GhostBtn, Card, Divider, StatusBadge,
  CategoryIcon, PageHeader, Input, Textarea, Toast,
} from '../components/shared'
import { ACTIVE_JOB, type JobStatus } from '../data/mock'

type AppScreen = string

// ─── Active Job Screen ─────────────────────────────────────────────────────────
export function ActiveJobScreen({ onNav }: { onNav: (s: AppScreen) => void }) {
  const [jobStatus, setJobStatus] = useState<JobStatus>(ACTIVE_JOB.status)
  const [showDispute, setShowDispute] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const job = ACTIVE_JOB

  const STEPS: { key: JobStatus; label: string; sub: string }[] = [
    { key: 'visit-scheduled', label: 'Visit Scheduled', sub: 'Rs. 285 agreed' },
    { key: 'on-the-way', label: 'On the Way', sub: 'Customer notified' },
    { key: 'visit-in-progress', label: 'Arrived & Inspecting', sub: 'Diagnosing the issue' },
    { key: 'repair-negotiating', label: 'Repair Quote Sent', sub: 'Awaiting customer approval' },
    { key: 'repair-approved', label: 'Repair Approved', sub: 'Rs. 2,985 locked' },
    { key: 'in-progress', label: 'Repair in Progress', sub: 'Work underway' },
    { key: 'completed', label: 'Completed', sub: 'Awaiting payment' },
    { key: 'paid', label: 'Paid', sub: 'Rs. 2,537 payout released' },
  ]

  const ORDER = STEPS.map((s) => s.key)
  const currentIdx = ORDER.indexOf(jobStatus)

  const getAction = (): { label: string; next?: JobStatus; screen?: AppScreen } | null => {
    if (jobStatus === 'visit-scheduled') return { label: 'Start Visit — On My Way', next: 'on-the-way' }
    if (jobStatus === 'on-the-way') return { label: "I've Arrived", next: 'visit-in-progress' }
    if (jobStatus === 'visit-in-progress') return { label: 'Start Inspection', screen: 'inspection' }
    if (jobStatus === 'repair-approved') return { label: 'Start Repair', next: 'in-progress' }
    if (jobStatus === 'in-progress') return { label: 'Mark Repair Complete', next: 'completed' }
    if (jobStatus === 'completed') return { label: 'Confirm Cash Received', next: 'paid' }
    return null
  }
  const action = getAction()

  const canDispute = ['repair-approved', 'in-progress', 'completed'].includes(jobStatus)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      <PageHeader title="Active Job" subtitle={job.area} />

      <div className="flex-1 overflow-y-auto">
        {/* Job summary */}
        <div className="mx-4 mt-4" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-md flex items-center justify-center text-xl" style={{ background: T.primaryLight }}>
                  <CategoryIcon category={job.category} />
                </div>
                <div>
                  <h2 className="font-600 text-sm" style={{ color: T.navy }}>{job.title}</h2>
                  <p className="text-xs" style={{ color: T.gray }}>{job.customerName}</p>
                </div>
              </div>
              <StatusBadge status={jobStatus} />
            </div>
          </div>
          <Divider />
          <div className="px-4 py-3 flex gap-2">
            <OutlineBtn className="flex-1 py-2 text-xs gap-1">
              <span className="w-3.5 h-3.5">{Icons.phone}</span> Call Customer
            </OutlineBtn>
            <OutlineBtn className="flex-1 py-2 text-xs gap-1">
              <span className="w-3.5 h-3.5">{Icons.chat}</span> Chat
            </OutlineBtn>
          </div>
          {job.exactAddress && (
            <>
              <Divider />
              <div className="px-4 py-3 flex items-center gap-1.5 text-xs" style={{ color: T.gray }}>
                <span className="w-3.5 h-3.5 flex-shrink-0">{Icons.mapPin}</span>
                <span>{job.exactAddress}</span>
              </div>
            </>
          )}
        </div>

        {/* Safety warning */}
        {jobStatus === 'repair-approved' && (
          <div className="mx-4 mt-3 flex items-start gap-2 p-3 rounded-md" style={{ background: '#FFFBEB', borderLeft: `3px solid ${T.warning}`, border: `1px solid #FDE68A` }}>
            <div className="flex-shrink-0 mt-0.5" style={{ color: T.warning }}>{Icons.shield}</div>
            <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
              <strong>Safety Notice:</strong> Customer has approved the repair. You may now begin work.
            </p>
          </div>
        )}

        {/* Progress stepper */}
        <div className="mx-4 mt-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div className="px-4 pt-4 pb-1">
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Job Progress</h3>
          </div>
          <div className="px-4 py-3">
            {STEPS.map((step, i) => {
              const done = i < currentIdx
              const active = i === currentIdx
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all" style={{
                      background: done ? T.primary : active ? T.navy : T.bg,
                      border: `1px solid ${done ? T.primary : active ? T.navy : T.border}`,
                    }}>
                      {done ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-2.5 h-2.5"><polyline points="20,6 9,17 4,12"/></svg>
                      ) : active ? (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.primary }} />
                      ) : null}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="w-px mt-1 mb-1" style={{ height: 20, background: done ? T.primary : T.border }} />
                    )}
                  </div>
                  <div className={`pb-3 ${i === STEPS.length - 1 ? '' : ''}`}>
                    <p className="text-xs font-600 leading-tight" style={{ color: done ? T.primary : active ? T.navy : T.gray }}>
                      {step.label}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: done ? T.primary : active ? T.gray : '#CBD5E1' }}>
                      {step.sub}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Invoice (completed) */}
        {(jobStatus === 'completed' || jobStatus === 'paid') && (
          <div className="mx-4 mt-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <div className="px-4 pt-4 pb-1">
              <h3 className="font-600 text-sm" style={{ color: T.navy }}>Payment Summary</h3>
            </div>
            <div className="px-4 py-3">
              {[
                { label: 'Visit Fee', amount: 285 },
                { label: 'Labor', amount: 1500 },
                { label: 'Parts', amount: 1200 },
              ].map((line) => (
                <div key={line.label} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <span className="text-xs" style={{ color: T.gray }}>{line.label}</span>
                  <span className="text-xs font-600" style={{ color: T.navy }}>Rs. {line.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 pb-1">
                <span className="text-xs font-700" style={{ color: T.navy }}>Total</span>
                <span className="text-sm font-700" style={{ color: T.navy }}>Rs. 2,985</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-xs" style={{ color: T.gray }}>Platform (15%)</span>
                <span className="text-xs" style={{ color: T.gray }}>− Rs. 448</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-xs font-700" style={{ color: T.success }}>Your Payout</span>
                <span className="text-sm font-700" style={{ color: T.success }}>Rs. 2,537</span>
              </div>
              {jobStatus === 'paid' && (
                <div className="mt-3 flex items-center gap-2 py-2 px-3 rounded-md" style={{ background: '#DCFCE7' }}>
                  <div style={{ color: T.success }}>{Icons.checkCircle}</div>
                  <p className="text-xs font-600" style={{ color: '#166534' }}>Payment Received — Payout in 24h escrow</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action button */}
        {action && (
          <div className="mx-4 mt-3">
            <PrimaryBtn
              onClick={() => {
                if (action.screen) { onNav(action.screen) }
                else if (action.next) {
                  setJobStatus(action.next)
                  if (action.next === 'paid') showToast('Cash payment confirmed. Payout will be released within 24 hours.')
                }
              }}
              className="w-full"
            >
              {action.label}
            </PrimaryBtn>
          </div>
        )}

        {/* Leave Review prompt */}
        {jobStatus === 'paid' && (
          <div className="mx-4 mt-3">
            <div className="p-3 rounded-md flex items-center justify-between" style={{ background: T.primaryLight }}>
              <p className="text-xs" style={{ color: T.navy }}>You can now rate this customer.</p>
              <GhostBtn onClick={() => onNav('reviews')}>Rate Customer →</GhostBtn>
            </div>
          </div>
        )}

        {/* Raise Dispute */}
        {canDispute && (
          <div className="mx-4 mt-3 mb-4">
            <Divider className="mb-3" />
            <button
              onClick={() => setShowDispute(true)}
              className="w-full py-2.5 rounded-md text-xs font-500 flex items-center justify-center gap-1.5"
              style={{ color: T.error, border: `1px solid ${T.error}`, background: T.surface }}
            >
              {Icons.alertTriangle} Raise a Dispute
            </button>
          </div>
        )}
      </div>

      {showDispute && <DisputeModal onClose={() => setShowDispute(false)} onSubmit={() => { setShowDispute(false); showToast('Your dispute has been submitted. Admin will review within 24 hours.') }} />}
    </div>
  )
}

// ─── Inspection Screen ─────────────────────────────────────────────────────────
export function InspectionScreen({ onBack, onSubmit }: { onBack: () => void; onSubmit: () => void }) {
  const [summary, setSummary] = useState('')
  const [parts, setParts] = useState('1200')
  const [labor, setLabor] = useState('1500')
  const [photoCount, setPhotoCount] = useState(2)

  const visit = 285
  const total = (parseInt(parts) || 0) + (parseInt(labor) || 0) + visit

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      <PageHeader title="Inspection Report" subtitle="Leaking Main Water Valve" onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Safety notice */}
        <div className="mx-4 mt-4 flex items-start gap-2 p-3 rounded-md" style={{ background: '#FFFBEB', border: `1px solid #FDE68A`, borderLeft: `3px solid ${T.warning}` }}>
          <div className="flex-shrink-0 mt-0.5" style={{ color: T.warning }}>{Icons.alertTriangle}</div>
          <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
            <strong>Do not begin any repair</strong> until the customer approves the repair price.
          </p>
        </div>

        {/* Photos */}
        <div className="mx-4 mt-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div className="px-4 pt-4 pb-1">
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Inspection Photos</h3>
          </div>
          <div className="px-4 py-3 flex gap-2 flex-wrap">
            {Array.from({ length: photoCount }).map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                <img src={`https://images.unsplash.com/photo-${i === 0 ? '1558618666-fcd25c85cd64' : '1504328345606-18bbc8c9d7d1'}?w=80&h=80&fit=crop`} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <button
              onClick={() => setPhotoCount((n) => Math.min(n + 1, 6))}
              className="w-16 h-16 rounded-md flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ border: `1px dashed ${T.borderDim}`, background: T.bg }}
            >
              <div style={{ color: T.gray }}>{Icons.camera}</div>
              <p className="text-[9px]" style={{ color: T.gray }}>Add</p>
            </button>
          </div>
        </div>

        {/* Diagnostic summary */}
        <div className="mx-4 mt-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div className="px-4 pt-4 pb-1">
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Diagnostic Summary</h3>
          </div>
          <div className="px-4 pb-4 pt-2">
            <Textarea
              placeholder="e.g. Cracked 1-inch PVC elbow joint behind wall near main inlet. Joint needs replacement."
              value={summary}
              onChange={setSummary}
              rows={3}
            />
          </div>
        </div>

        {/* Itemized estimate */}
        <div className="mx-4 mt-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div className="px-4 pt-4 pb-1">
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Itemized Estimate</h3>
          </div>
          <div className="px-4 py-3">
            {[
              { label: 'Parts / Materials', sub: 'PVC joints, sealant, fittings', key: 'parts', value: parts, set: setParts },
              { label: 'Labor / Service', sub: 'Cutting, fitting, re-plastering', key: 'labor', value: labor, set: setLabor },
            ].map((row) => (
              <div key={row.key} className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <p className="text-xs font-500" style={{ color: T.navy }}>{row.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: T.gray }}>{row.sub}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs" style={{ color: T.gray }}>Rs.</span>
                  <input
                    type="number"
                    value={row.value}
                    onChange={(e) => row.set(e.target.value)}
                    className="w-20 text-right text-sm font-700 px-2 py-1.5 rounded-md outline-none"
                    style={{ border: `1px solid ${T.border}`, color: T.navy, background: T.surface }}
                    onFocus={(e) => e.target.style.borderColor = T.primary}
                    onBlur={(e) => e.target.style.borderColor = T.border}
                  />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div>
                <p className="text-xs font-500" style={{ color: T.gray }}>Visit / Inspection Fee</p>
                <p className="text-[10px]" style={{ color: T.gray }}>Agreed amount</p>
              </div>
              <span className="text-sm font-700" style={{ color: T.gray }}>Rs. {visit}</span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="text-sm font-700" style={{ color: T.navy }}>Total Estimated Cost</span>
              <span className="text-base font-700" style={{ color: T.primary }}>Rs. {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mx-4 mt-3 mb-4">
          <PrimaryBtn onClick={onSubmit} className="w-full">
            Submit Inspection & Send Quote →
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

// ─── Repair Quote Screen ───────────────────────────────────────────────────────
export function RepairQuoteScreen({ onBack, onApproved }: { onBack: () => void; onApproved: () => void }) {
  const [round, setRound] = useState(0)
  const [approved, setApproved] = useState(false)
  const [currentAmount, setCurrentAmount] = useState(2985)

  const ITEMS = [
    { label: 'PVC Elbow Joint (1-inch)', type: 'Parts', amount: 450 },
    { label: 'Pipe sealant & tape', type: 'Parts', amount: 380 },
    { label: 'Cutting & wall access', type: 'Labor', amount: 600 },
    { label: 'Fitting & sealing', type: 'Labor', amount: 550 },
    { label: 'Re-plastering (minor)', type: 'Labor', amount: 350 },
    { label: 'Visit / Inspection fee', type: 'Visit', amount: 285 },
  ]

  const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
    Parts: { bg: '#DBEAFE', text: '#1D4ED8' },
    Labor: { bg: '#EDE9FE', text: '#6D28D9' },
    Visit: { bg: T.primaryLight, text: T.primary },
  }

  const handleApprove = (amount: number) => {
    setCurrentAmount(amount)
    setApproved(true)
    setTimeout(onApproved, 800)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      <PageHeader title="Repair Quotation" subtitle="Awaiting customer approval" onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Status */}
        <div className="mx-4 mt-4">
          {approved ? (
            <div className="p-3 rounded-md flex items-center gap-2" style={{ background: T.primaryLight, border: `1px solid ${T.primary}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ background: T.primary }}>
                {Icons.check}
              </div>
              <div>
                <p className="text-sm font-600" style={{ color: T.primary }}>Repair Approved!</p>
                <p className="text-xs" style={{ color: T.navy }}>Rs. {currentAmount.toLocaleString()} agreed — you may start work.</p>
              </div>
            </div>
          ) : round === 0 ? (
            <div className="p-3 rounded-md flex items-center gap-2" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
              <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: T.warning }} />
              <p className="text-xs" style={{ color: T.gray }}>Quote sent to Ahmed Raza. Awaiting response…</p>
            </div>
          ) : (
            <div className="p-4 rounded-md" style={{ background: T.navy }}>
              <p className="text-xs mb-1.5" style={{ color: '#94A3B8' }}>Ahmed Raza countered — Round {round}/5:</p>
              <p className="text-xl font-700 text-white mb-3">Rs. 2,700</p>
              <div className="flex gap-2">
                <PrimaryBtn onClick={() => handleApprove(2700)} className="flex-1 py-2 text-xs">Accept Rs. 2,700</PrimaryBtn>
                <OutlineBtn onClick={() => setRound(r => r + 1)} className="flex-1 py-2 text-xs" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' } as any}>
                  Counter Rs. 2,985
                </OutlineBtn>
              </div>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div className="mx-4 mt-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div className="px-4 pt-4 pb-1">
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Quote Breakdown</h3>
          </div>
          <div className="px-4 py-2">
            {ITEMS.map((item) => {
              const style = TYPE_STYLES[item.type] ?? { bg: T.bg, text: T.gray }
              return (
                <div key={item.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <p className="text-xs font-500" style={{ color: T.navy }}>{item.label}</p>
                    <span className="text-[9px] font-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide mt-0.5 inline-block" style={{ background: style.bg, color: style.text }}>
                      {item.type}
                    </span>
                  </div>
                  <span className="text-sm font-600" style={{ color: T.navy }}>Rs. {item.amount.toLocaleString()}</span>
                </div>
              )
            })}
            <div className="py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-700" style={{ color: T.navy }}>Total</span>
                <span className="text-sm font-700" style={{ color: T.navy }}>Rs. {currentAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="py-2">
              <div className="flex justify-between py-1">
                <span className="text-xs" style={{ color: T.gray }}>Platform Commission (15%)</span>
                <span className="text-xs" style={{ color: T.gray }}>− Rs. {Math.round(currentAmount * 0.15).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-xs font-700" style={{ color: T.success }}>Your Payout</span>
                <span className="text-sm font-700" style={{ color: T.success }}>Rs. {Math.round(currentAmount * 0.85).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {!approved && round === 0 && (
          <div className="mx-4 mt-3 mb-4">
            <OutlineBtn onClick={() => setRound(1)} className="w-full text-xs py-2.5">
              Simulate Customer Counter-Offer (Demo)
            </OutlineBtn>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dispute Modal ─────────────────────────────────────────────────────────────
function DisputeModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const REASONS = [
    'Customer refusing to pay',
    'Customer made false claims',
    'Scope of work disagreement',
    'Quality dispute raised by customer',
    'Other',
  ]

  const handleSubmit = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); onSubmit() }, 1200)
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="rounded-t-xl overflow-hidden" style={{ background: T.surface }} onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: T.border }} />
        </div>

        <div className="px-4 pb-2">
          <h2 className="font-600 text-base" style={{ color: T.navy }}>Raise a Dispute</h2>
          <p className="text-xs mt-1" style={{ color: T.gray }}>
            Describe the issue clearly. Admin will review the case and contact both parties.
          </p>
        </div>
        <Divider className="my-3" />

        <div className="px-4 flex flex-col gap-4 pb-6">
          {/* Reason dropdown */}
          <div>
            <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>Reason for Dispute</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-md outline-none"
              style={{ border: `1px solid ${T.border}`, color: reason ? T.navy : T.grayDim, background: T.surface }}
            >
              <option value="">Select a reason…</option>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <Textarea
            label="Describe the issue"
            value={description}
            onChange={setDescription}
            placeholder="Provide a clear description of the problem..."
            rows={4}
            maxLength={500}
          />

          {/* File upload */}
          <div>
            <label className="block text-xs font-500 mb-1" style={{ color: T.navy }}>Attach Photos or Documents (Optional)</label>
            <p className="text-[10px] mb-2" style={{ color: T.gray }}>Max 5 files. Supports JPG, PNG, PDF.</p>
            <div className="rounded-md p-4 flex flex-col items-center gap-2 cursor-pointer" style={{ border: `1px dashed ${T.borderDim}` }}>
              <div style={{ color: T.gray }}>{Icons.upload}</div>
              <p className="text-xs" style={{ color: T.gray }}>Tap to upload files</p>
            </div>
          </div>

          <PrimaryBtn onClick={handleSubmit} className="w-full" disabled={!reason || !description} loading={loading}>
            Submit Dispute
          </PrimaryBtn>
          <GhostBtn onClick={onClose} className="text-center w-full">Cancel</GhostBtn>
        </div>
      </div>
    </div>
  )
}
