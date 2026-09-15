import { useState } from 'react'
import { T, I, Btn, Badge, Card, Divider, JobBadge, CategoryIcon, Input, Textarea } from '../components/shared'
import { NEARBY_JOBS, ACTIVE_JOB, type Job, type JobStatus } from '../data/mock'

const ALL_JOBS: Job[] = [
  { ...ACTIVE_JOB, id: 'J-0998', status: 'repair-approved' as JobStatus },
  ...NEARBY_JOBS,
]

const JOB_STATUS_STEPS = [
  { key: 'visit-scheduled', label: 'Visit Scheduled', sub: 'Rs. 285 agreed' },
  { key: 'on-the-way', label: 'On the Way', sub: 'Customer notified' },
  { key: 'visit-in-progress', label: 'Arrived & Inspecting', sub: '' },
  { key: 'repair-negotiating', label: 'Quote Sent', sub: 'Awaiting approval' },
  { key: 'repair-approved', label: 'Repair Approved', sub: 'Rs. 2,985 locked' },
  { key: 'in-progress', label: 'Repair In Progress', sub: '' },
  { key: 'completed', label: 'Completed', sub: 'Awaiting payment' },
]
const ORDER = JOB_STATUS_STEPS.map((s) => s.key)

export function JobsPage() {
  const [selected, setSelected] = useState<Job>(ALL_JOBS[0])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [jobStatus, setJobStatus] = useState<JobStatus>(ACTIVE_JOB.status)
  const [offerFee, setOfferFee] = useState('300')
  const [offerNote, setOfferNote] = useState('')
  const [offerSent, setOfferSent] = useState(false)
  const [counterStep, setCounterStep] = useState(0)
  const [showInspection, setShowInspection] = useState(false)
  const [showRepairQuote, setShowRepairQuote] = useState(false)
  const [parts, setParts] = useState('1200')
  const [labor, setLabor] = useState('1500')
  const [diagnosis, setDiagnosis] = useState('')
  const [showDispute, setShowDispute] = useState(false)

  const FILTERS = ['All', 'Nearby', 'Offer Sent', 'Active', 'Completed']
  const filteredJobs = ALL_JOBS.filter((j) =>
    (filter === 'All' || filter === 'Nearby' && !['repair-approved','in-progress','completed','paid'].includes(j.status) || filter === 'Active' && ['repair-approved','in-progress','on-the-way','visit-in-progress'].includes(j.status) || filter === 'Offer Sent' && j.status === 'offer-sent' || filter === 'Completed' && ['completed','paid'].includes(j.status)) &&
    (search === '' || j.title.toLowerCase().includes(search.toLowerCase()) || j.area.toLowerCase().includes(search.toLowerCase()))
  )

  const isActive = selected.id === ACTIVE_JOB.id
  const currentIdx = ORDER.indexOf(jobStatus)

  const nextLabel = () => {
    if (!isActive) return null
    if (jobStatus === 'visit-scheduled') return 'Start Visit — On My Way'
    if (jobStatus === 'on-the-way') return "I've Arrived"
    if (jobStatus === 'visit-in-progress') return 'Start Inspection'
    if (jobStatus === 'repair-approved') return 'Start Repair'
    if (jobStatus === 'in-progress') return 'Mark Repair Complete'
    if (jobStatus === 'completed') return 'Confirm Cash Received'
    return null
  }
  const handleNext = () => {
    if (jobStatus === 'visit-in-progress') { setShowInspection(true); return }
    const idx = ORDER.indexOf(jobStatus)
    if (idx < ORDER.length - 1) setJobStatus(ORDER[idx + 1] as JobStatus)
  }

  return (
    <div className="flex h-full gap-0" style={{ minHeight: 0 }}>
      {/* Left: Job list */}
      <div className="flex flex-col w-80 flex-shrink-0 overflow-hidden" style={{ borderRight: `1px solid ${T.border}` }}>
        {/* Search + filter */}
        <div className="p-3 flex flex-col gap-2" style={{ borderBottom: `1px solid ${T.border}` }}>
          <Input placeholder="Search jobs…" value={search} onChange={setSearch} icon={I.search} />
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className="text-xs px-2.5 py-1 rounded-full transition-all" style={{ background: filter === f ? T.navy : T.bg, color: filter === f ? 'white' : T.gray, border: `1px solid ${filter === f ? T.navy : T.border}` }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Job rows */}
        <div className="flex-1 overflow-y-auto">
          {filteredJobs.map((job, i) => {
            const sel = selected.id === job.id
            const statusToShow = job.id === ACTIVE_JOB.id ? jobStatus : job.status
            return (
              <div
                key={job.id}
                onClick={() => setSelected(job)}
                className="px-4 py-3.5 cursor-pointer transition-colors"
                style={{ background: sel ? T.primaryLight : 'white', borderBottom: `1px solid ${T.border}`, borderLeft: `2px solid ${sel ? T.primary : 'transparent'}` }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-500 leading-tight" style={{ color: T.navy }}>{job.title}</p>
                  {job.urgency === 'urgent' && <span className="text-[9px] font-600 px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: '#FEE2E2', color: '#991B1B' }}>URGENT</span>}
                </div>
                <p className="text-xs mb-2" style={{ color: T.gray }}>{job.category} · {job.area.split(',')[0]}</p>
                <div className="flex items-center justify-between">
                  <JobBadge status={statusToShow} />
                  <span className="text-xs font-600" style={{ color: T.navy }}>Rs. {job.visitFee}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: Detail panel */}
      <div className="flex-1 overflow-y-auto bg-white">
        {showInspection ? (
          <InspectionPanel
            parts={parts} setParts={setParts}
            labor={labor} setLabor={setLabor}
            diagnosis={diagnosis} setDiagnosis={setDiagnosis}
            onSubmit={() => { setShowInspection(false); setShowRepairQuote(true); setJobStatus('repair-negotiating') }}
            onBack={() => setShowInspection(false)}
          />
        ) : showRepairQuote ? (
          <RepairQuotePanel
            parts={parseInt(parts)||0} labor={parseInt(labor)||0}
            counterStep={counterStep} setCounterStep={setCounterStep}
            onApproved={() => { setShowRepairQuote(false); setJobStatus('repair-approved') }}
            onBack={() => setShowRepairQuote(false)}
          />
        ) : (
          <JobDetailPanel
            job={selected}
            isActive={isActive}
            jobStatus={jobStatus}
            currentIdx={currentIdx}
            nextLabel={nextLabel()}
            onNext={handleNext}
            offerFee={offerFee} setOfferFee={setOfferFee}
            offerNote={offerNote} setOfferNote={setOfferNote}
            offerSent={offerSent} setOfferSent={setOfferSent}
            counterStep={counterStep} setCounterStep={setCounterStep}
            onDispute={() => setShowDispute(true)}
          />
        )}
      </div>

      {/* Dispute modal */}
      {showDispute && <DisputeModal onClose={() => setShowDispute(false)} />}
    </div>
  )
}

// ─── Job Detail Panel ──────────────────────────────────────────────────────────
function JobDetailPanel({ job, isActive, jobStatus, currentIdx, nextLabel, onNext, offerFee, setOfferFee, offerNote, setOfferNote, offerSent, setOfferSent, counterStep, setCounterStep, onDispute }: any) {
  const canOffer = !isActive && job.status === 'offer-sent'
  const canDispute = isActive && ['repair-approved','in-progress','completed'].includes(jobStatus)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-md flex items-center justify-center text-base flex-shrink-0" style={{ background: T.primaryLight }}>
              <CategoryIcon cat={job.category} />
            </div>
            <h2 className="font-600 text-base" style={{ color: T.navy, letterSpacing: '-0.01em' }}>{job.title}</h2>
            {job.urgency === 'urgent' && <Badge label="Urgent" color="red" />}
          </div>
          <div className="flex items-center gap-4 pl-10 text-xs" style={{ color: T.gray }}>
            <span className="flex items-center gap-1">{I.mapPin} {job.area}</span>
            <span className="flex items-center gap-1">{I.clock} {job.postedTime}</span>
            <span className="flex items-center gap-1">{I.briefcase} {job.category}</span>
            {job.scheduledTime && <span className="flex items-center gap-1">{I.calendarCheck} {job.scheduledTime}</span>}
          </div>
        </div>
        <JobBadge status={isActive ? jobStatus : job.status} />
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {/* Problem description */}
          <div>
            <p className="text-[10px] font-600 uppercase tracking-wide mb-2" style={{ color: T.gray }}>Problem Description</p>
            <p className="text-sm leading-relaxed" style={{ color: T.navy }}>{job.description}</p>
          </div>

          {/* Photos */}
          <div>
            <p className="text-[10px] font-600 uppercase tracking-wide mb-2" style={{ color: T.gray }}>Issue Photos</p>
            <div className="flex gap-2">
              {['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=90&fit=crop', 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=120&h=90&fit=crop'].map((src, i) => (
                <div key={i} className="rounded-md overflow-hidden relative group" style={{ border: `1px solid ${T.border}` }}>
                  <img src={src} alt="" className="w-28 h-20 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div style={{ color: 'white' }}>{I.eye}</div>
                  </div>
                </div>
              ))}
              <div className="w-28 h-20 rounded-md flex flex-col items-center justify-center gap-1" style={{ border: `1px dashed ${T.borderDim}`, background: T.bg }}>
                <div style={{ color: T.grayDim }}>{I.camera}</div>
                <p className="text-[10px]" style={{ color: T.grayDim }}>Voice Note</p>
              </div>
            </div>
          </div>

          {/* Counter-offer for nearby job */}
          {canOffer && !offerSent && (
            <div>
              <p className="text-[10px] font-600 uppercase tracking-wide mb-2" style={{ color: T.gray }}>Submit Offer</p>
              <div className="rounded-lg p-4 flex flex-col gap-3" style={{ border: `1px solid ${T.border}` }}>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-500 mb-1" style={{ color: T.navy }}>Visit Fee (Rs.)</label>
                    <input type="number" value={offerFee} onChange={(e) => setOfferFee(e.target.value)} className="w-full text-sm px-3 py-2 rounded-md outline-none" style={{ border: `1px solid ${T.border}`, color: T.navy }} onFocus={(e) => e.target.style.borderColor = T.primary} onBlur={(e) => e.target.style.borderColor = T.border} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-500 mb-1" style={{ color: T.navy }}>Estimate Range (optional)</label>
                    <input type="text" placeholder="e.g. Rs. 1,500 – Rs. 2,500" className="w-full text-sm px-3 py-2 rounded-md outline-none" style={{ border: `1px solid ${T.border}`, color: T.navy }} />
                  </div>
                </div>
                <Textarea placeholder="Licensed plumber, 8 years experience. Available today at 4 PM." value={offerNote} onChange={setOfferNote} rows={2} />
                <Btn variant="primary" onClick={() => setOfferSent(true)}>Send Offer</Btn>
              </div>
            </div>
          )}

          {canOffer && offerSent && counterStep === 0 && (
            <div className="p-4 rounded-lg flex items-center gap-3" style={{ background: '#FEF9C3', border: `1px solid #FDE68A` }}>
              <span style={{ color: T.warning }}>{I.clock}</span>
              <div className="flex-1">
                <p className="text-sm font-600" style={{ color: '#854D0E' }}>Offer Sent — Rs. {offerFee}</p>
                <p className="text-xs" style={{ color: '#92400E' }}>Awaiting customer decision…</p>
              </div>
              <Btn variant="outline" size="sm" onClick={() => setCounterStep(1)}>Simulate Counter</Btn>
            </div>
          )}

          {canOffer && offerSent && counterStep === 1 && (
            <div className="p-4 rounded-lg" style={{ border: `1px solid ${T.border}` }}>
              <p className="text-sm font-600 mb-1" style={{ color: T.navy }}>Counter-Offer Received</p>
              <p className="text-xs mb-3" style={{ color: T.gray }}>{job.customerName} suggests Rs. 250 for the visit fee</p>
              <div className="flex gap-2">
                <Btn variant="primary" size="sm" onClick={() => setCounterStep(2)}>Accept Rs. 250</Btn>
                <Btn variant="outline" size="sm">Counter Rs. 280</Btn>
                <Btn variant="danger" size="sm">Decline</Btn>
              </div>
            </div>
          )}

          {canOffer && offerSent && counterStep === 2 && (
            <div className="p-4 rounded-lg flex items-center gap-3" style={{ background: T.primaryLight, border: `1px solid ${T.primary}` }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: T.primary }}>
                <span style={{ color: 'white' }}>{I.check}</span>
              </div>
              <div>
                <p className="text-sm font-600" style={{ color: T.primary }}>Visit Fee Locked — Rs. 250</p>
                <p className="text-xs" style={{ color: T.navy }}>Visit now confirmed.</p>
              </div>
            </div>
          )}

          {/* Active job progress + invoice */}
          {isActive && (
            <>
              {jobStatus === 'repair-approved' && (
                <div className="p-3 rounded-md flex items-start gap-2 text-sm" style={{ background: '#FFFBEB', border: `1px solid #FDE68A` }}>
                  <div style={{ color: T.warning }}>{I.shield}</div>
                  <p style={{ color: '#92400E' }}>Customer approved Rs. 2,985. Do not begin work until this approval — it is confirmed.</p>
                </div>
              )}
              {(jobStatus === 'completed' || jobStatus === 'paid') && (
                <div>
                  <p className="text-[10px] font-600 uppercase tracking-wide mb-2" style={{ color: T.gray }}>Invoice Breakdown</p>
                  <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                    {[{ l: 'Visit / Inspection Fee', a: 285 }, { l: 'Labor', a: 1500 }, { l: 'Parts & Materials', a: 1200 }].map((row, i) => (
                      <div key={i} className="flex justify-between px-4 py-2.5 text-sm" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <span style={{ color: T.gray }}>{row.l}</span>
                        <span className="font-500" style={{ color: T.navy }}>Rs. {row.a.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2.5" style={{ background: T.bg }}>
                      <span className="text-sm font-700" style={{ color: T.navy }}>Total</span>
                      <span className="text-sm font-700" style={{ color: T.navy }}>Rs. 2,985</span>
                    </div>
                    <div className="flex justify-between px-4 py-2" style={{ borderTop: `1px solid ${T.border}` }}>
                      <span className="text-xs" style={{ color: T.gray }}>Platform 15%</span>
                      <span className="text-xs" style={{ color: T.gray }}>− Rs. 448</span>
                    </div>
                    <div className="flex justify-between px-4 py-2">
                      <span className="text-xs font-700" style={{ color: T.success }}>Your Payout</span>
                      <span className="text-sm font-700" style={{ color: T.success }}>Rs. 2,537</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right column — contact + stepper */}
        {isActive && (
          <div className="w-64 flex-shrink-0 flex flex-col" style={{ borderLeft: `1px solid ${T.border}` }}>
            {/* Contact */}
            <div className="p-4" style={{ borderBottom: `1px solid ${T.border}` }}>
              <p className="text-[10px] font-600 uppercase tracking-wide mb-3" style={{ color: T.gray }}>Customer</p>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-600" style={{ background: T.primaryLight, color: T.primary }}>AR</div>
                <div>
                  <p className="text-sm font-500" style={{ color: T.navy }}>{job.customerName}</p>
                  <p className="text-xs" style={{ color: T.gray }}>{job.exactAddress?.split(',')[0]}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Btn variant="outline" size="sm" className="flex-1">{I.phone} Call</Btn>
                <Btn variant="outline" size="sm" className="flex-1">{I.chat} Chat</Btn>
              </div>
              {job.exactAddress && (
                <p className="text-xs mt-2 flex items-start gap-1" style={{ color: T.gray }}>
                  <span className="flex-shrink-0 mt-0.5">{I.mapPin}</span>{job.exactAddress}
                </p>
              )}
            </div>

            {/* Stepper */}
            <div className="p-4 flex-1 overflow-y-auto">
              <p className="text-[10px] font-600 uppercase tracking-wide mb-3" style={{ color: T.gray }}>Job Progress</p>
              {JOB_STATUS_STEPS.map((step, i) => {
                const done = i < currentIdx
                const active = i === currentIdx
                return (
                  <div key={step.key} className="flex items-start gap-2">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: done ? T.primary : active ? T.navy : T.bg, border: `1px solid ${done ? T.primary : active ? T.navy : T.border}` }}>
                        {done ? <span className="text-white" style={{ fontSize: 8 }}>✓</span> : active ? <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.primary }} /> : null}
                      </div>
                      {i < JOB_STATUS_STEPS.length - 1 && <div className="w-px my-0.5" style={{ height: 16, background: done ? T.primary : T.border }} />}
                    </div>
                    <div className="pb-2">
                      <p className="text-xs" style={{ color: done ? T.primary : active ? T.navy : T.grayDim, fontWeight: active ? 600 : 400 }}>{step.label}</p>
                      {step.sub && active && <p className="text-[10px]" style={{ color: T.gray }}>{step.sub}</p>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            {(nextLabel || canDispute) && (
              <div className="p-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${T.border}` }}>
                {nextLabel && <Btn variant="primary" className="w-full" onClick={onNext}>{nextLabel}</Btn>}
                {canDispute && (
                  <button onClick={onDispute} className="w-full py-2 text-xs font-500 rounded-md" style={{ color: T.error, border: `1px solid ${T.error}`, background: 'white' }}>
                    Raise a Dispute
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Inspection Panel ──────────────────────────────────────────────────────────
function InspectionPanel({ parts, setParts, labor, setLabor, diagnosis, setDiagnosis, onSubmit, onBack }: any) {
  const visit = 285
  const total = (parseInt(parts)||0) + (parseInt(labor)||0) + visit
  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-600 text-base" style={{ color: T.navy }}>Inspection Report</h2>
          <p className="text-xs mt-0.5" style={{ color: T.gray }}>Complete the diagnostic report before sending the repair quote</p>
        </div>
        <Btn variant="outline" size="sm" onClick={onBack}>{I.arrowLeft} Back</Btn>
      </div>

      <div className="p-3 rounded-md flex items-start gap-2" style={{ background: '#FFFBEB', border: `1px solid #FDE68A` }}>
        <div style={{ color: T.warning }}>{I.alertTriangle}</div>
        <p className="text-sm" style={{ color: '#92400E' }}><strong>Do not begin any repair</strong> until the customer approves the repair price below.</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-4">
          {/* Photos */}
          <div>
            <p className="text-xs font-500 mb-2" style={{ color: T.navy }}>Inspection Photos</p>
            <div className="flex gap-2 flex-wrap">
              {['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop','https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=80&h=80&fit=crop'].map((src,i) => (
                <img key={i} src={src} alt="" className="w-20 h-20 rounded-md object-cover" style={{ border: `1px solid ${T.border}` }} />
              ))}
              <button className="w-20 h-20 rounded-md flex flex-col items-center justify-center gap-1" style={{ border: `1px dashed ${T.borderDim}`, background: T.bg }}>
                <div style={{ color: T.grayDim }}>{I.camera}</div>
                <p className="text-[10px]" style={{ color: T.grayDim }}>Add Photo</p>
              </button>
            </div>
          </div>
          <Textarea label="Diagnostic Summary" placeholder="e.g. Cracked 1-inch PVC elbow joint behind wall near main inlet. Joint needs full replacement." value={diagnosis} onChange={setDiagnosis} rows={5} />
        </div>

        <div>
          <p className="text-xs font-500 mb-2" style={{ color: T.navy }}>Itemized Estimate</p>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            {[
              { label: 'Parts / Materials', sub: 'PVC joints, sealant, fittings', key: 'parts', value: parts, set: setParts },
              { label: 'Labor / Service', sub: 'Cutting, fitting & re-plastering', key: 'labor', value: labor, set: setLabor },
            ].map((row) => (
              <div key={row.key} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex-1">
                  <p className="text-sm font-500" style={{ color: T.navy }}>{row.label}</p>
                  <p className="text-xs" style={{ color: T.gray }}>{row.sub}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm" style={{ color: T.gray }}>Rs.</span>
                  <input type="number" value={row.value} onChange={(e) => row.set(e.target.value)} className="w-24 text-right text-sm font-600 px-2 py-1.5 rounded-md outline-none" style={{ border: `1px solid ${T.border}`, color: T.navy }} onFocus={(e) => e.target.style.borderColor = T.primary} onBlur={(e) => e.target.style.borderColor = T.border} />
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
              <p className="text-sm" style={{ color: T.gray }}>Visit / Inspection Fee</p>
              <span className="text-sm font-600" style={{ color: T.gray }}>Rs. {visit}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: T.bg }}>
              <p className="text-sm font-700" style={{ color: T.navy }}>Total Estimated Cost</p>
              <span className="text-lg font-700" style={{ color: T.primary }}>Rs. {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-md" style={{ background: T.primaryLight, border: `1px solid ${T.primary}` }}>
            <p className="text-xs" style={{ color: T.primary }}><strong>Platform commission:</strong> 15% · Your payout: <strong>Rs. {Math.round(total * 0.85).toLocaleString()}</strong></p>
          </div>
        </div>
      </div>

      <Btn variant="primary" onClick={onSubmit}>Submit Inspection & Send Repair Quote →</Btn>
    </div>
  )
}

// ─── Repair Quote Panel ────────────────────────────────────────────────────────
function RepairQuotePanel({ parts, labor, counterStep, setCounterStep, onApproved, onBack }: any) {
  const visit = 285
  const total = parts + labor + visit
  const ITEMS = [
    { label: 'PVC Elbow Joint (1-inch)', type: 'Parts', amount: 450 },
    { label: 'Pipe sealant & tape', type: 'Parts', amount: 380 },
    { label: 'Cutting & wall access', type: 'Labor', amount: 600 },
    { label: 'Fitting & sealing', type: 'Labor', amount: 550 },
    { label: 'Re-plastering (minor)', type: 'Labor', amount: 350 },
    { label: 'Visit / Inspection fee', type: 'Visit', amount: 285 },
  ]
  const TYPE_COLOR: Record<string, { bg: string; text: string }> = {
    Parts: { bg: '#DBEAFE', text: '#1D4ED8' },
    Labor: { bg: '#EDE9FE', text: '#6D28D9' },
    Visit: { bg: T.primaryLight, text: T.primary },
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-600 text-base" style={{ color: T.navy }}>Repair Quotation</h2>
          <p className="text-xs mt-0.5" style={{ color: T.gray }}>Sent to Ahmed Raza — awaiting approval</p>
        </div>
        <Btn variant="outline" size="sm" onClick={onBack}>{I.arrowLeft} Back</Btn>
      </div>

      {/* Status banner */}
      {counterStep === 0 && (
        <div className="p-3 rounded-md flex items-center gap-3" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.warning }} />
          <p className="text-sm" style={{ color: T.gray }}>Quote sent. Waiting for customer response…</p>
          <Btn variant="outline" size="sm" className="ml-auto" onClick={() => setCounterStep(1)}>Simulate Counter-Offer</Btn>
        </div>
      )}
      {counterStep === 1 && (
        <div className="p-4 rounded-lg" style={{ background: T.navy }}>
          <p className="text-xs mb-2" style={{ color: '#94A3B8' }}>Ahmed Raza countered (Round 1/5):</p>
          <p className="text-2xl font-700 text-white mb-3" style={{ letterSpacing: '-0.02em' }}>Rs. 2,700</p>
          <div className="flex gap-2">
            <Btn variant="primary" onClick={onApproved} className="flex-1">Accept Rs. 2,700</Btn>
            <button onClick={() => setCounterStep(0)} className="flex-1 py-2 text-sm font-500 rounded-md" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              Counter Rs. 2,985
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Itemized table */}
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="grid grid-cols-12 px-4 py-2.5 text-[10px] font-600 uppercase tracking-wide" style={{ color: T.gray, background: T.bg, borderBottom: `1px solid ${T.border}` }}>
            <span className="col-span-7">Line Item</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-3 text-right">Amount</span>
          </div>
          {ITEMS.map((item, i) => {
            const s = TYPE_COLOR[item.type]
            return (
              <div key={i} className="grid grid-cols-12 px-4 py-3 items-center" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span className="col-span-7 text-sm" style={{ color: T.navy }}>{item.label}</span>
                <div className="col-span-2">
                  <span className="text-[9px] font-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide" style={{ background: s.bg, color: s.text }}>{item.type}</span>
                </div>
                <span className="col-span-3 text-right text-sm font-500 tabular-nums" style={{ color: T.navy }}>Rs. {item.amount.toLocaleString()}</span>
              </div>
            )
          })}
          <div className="px-4 py-3" style={{ background: T.bg }}>
            <div className="flex justify-between mb-1"><span className="text-sm font-700" style={{ color: T.navy }}>Total</span><span className="text-sm font-700 tabular-nums" style={{ color: T.navy }}>Rs. {total.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Payout summary */}
        <div className="flex flex-col gap-3">
          <div className="rounded-lg p-4" style={{ border: `1px solid ${T.border}` }}>
            <p className="text-[10px] font-600 uppercase tracking-wide mb-3" style={{ color: T.gray }}>Payout Breakdown</p>
            {[
              { l: 'Quoted Amount', v: `Rs. ${total.toLocaleString()}`, bold: false },
              { l: 'Platform Commission (15%)', v: `− Rs. ${Math.round(total * 0.15).toLocaleString()}`, bold: false },
              { l: 'Your Net Payout', v: `Rs. ${Math.round(total * 0.85).toLocaleString()}`, bold: true },
            ].map((row) => (
              <div key={row.l} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span className="text-xs" style={{ color: T.gray }}>{row.l}</span>
                <span className={`text-sm tabular-nums ${row.bold ? 'font-700' : 'font-500'}`} style={{ color: row.bold ? T.success : T.navy }}>{row.v}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg p-4" style={{ background: T.primaryLight, border: `1px solid ${T.primary}` }}>
            <p className="text-xs font-600 mb-1" style={{ color: T.primary }}>Payment Methods</p>
            <p className="text-xs" style={{ color: T.navy }}>Digital (JazzCash / Easypaisa / Card): held in 24h escrow before payout.</p>
            <p className="text-xs mt-1" style={{ color: T.navy }}>Cash: tap "Confirm Cash Received" after payment.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Dispute Modal ─────────────────────────────────────────────────────────────
function DisputeModal({ onClose }: { onClose: () => void }) {
  const [reason, setReason] = useState('')
  const [desc, setDesc] = useState('')
  const REASONS = ['Customer refusing to pay', 'Customer made false claims', 'Scope of work disagreement', 'Quality dispute raised by customer', 'Other']
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(15,23,42,0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" style={{ border: `1px solid ${T.border}` }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h3 className="font-600 text-base" style={{ color: T.navy }}>Raise a Dispute</h3>
            <p className="text-xs mt-0.5" style={{ color: T.gray }}>Admin will review and contact both parties within 24 hours.</p>
          </div>
          <button onClick={onClose} style={{ color: T.gray }}>{I.x}</button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-500 mb-1" style={{ color: T.navy }}>Reason for Dispute</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full text-sm px-3 py-2 rounded-md outline-none" style={{ border: `1px solid ${T.border}`, color: reason ? T.navy : T.grayDim }}>
              <option value="">Select reason…</option>
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <Textarea label="Describe the issue" placeholder="Provide a clear description of the problem..." value={desc} onChange={setDesc} rows={4} maxLength={500} />
          <div>
            <p className="text-xs font-500 mb-1" style={{ color: T.navy }}>Attach Evidence (Optional)</p>
            <div className="rounded-md p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors" style={{ border: `1px dashed ${T.borderDim}` }}>
              <div style={{ color: T.gray }}>{I.upload}</div>
              <p className="text-sm" style={{ color: T.gray }}>Drop files here or click to upload</p>
              <p className="text-xs" style={{ color: T.grayDim }}>Max 5 files · JPG, PNG, PDF</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
          <Btn variant="primary" className="flex-1" disabled={!reason || !desc}>Submit Dispute</Btn>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
        </div>
      </div>
    </div>
  )
}
