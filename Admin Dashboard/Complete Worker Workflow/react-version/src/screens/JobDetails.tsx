import { useState } from 'react'
import {
  T, Icons, PrimaryBtn, OutlineBtn, GhostBtn, Card, Divider, CategoryIcon,
  UrgencyBadge, PageHeader, Input, Textarea,
} from '../components/shared'
import { NEARBY_JOBS } from '../data/mock'

export function JobDetailsScreen({ onBack, onOfferAccepted }: { onBack: () => void; onOfferAccepted: () => void }) {
  const job = NEARBY_JOBS[0]
  const [visitFee, setVisitFee] = useState('300')
  const [estimate, setEstimate] = useState('')
  const [note, setNote] = useState('')
  const [phase, setPhase] = useState<'form' | 'sent' | 'countered' | 'accepted'>('form')
  const [counterAmount] = useState(250)

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      <PageHeader title="Job Details" subtitle={job.area} onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Job card */}
        <div className="mx-4 mt-4" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-md flex items-center justify-center text-xl flex-shrink-0" style={{ background: T.primaryLight }}>
                  <CategoryIcon category={job.category} />
                </div>
                <div>
                  <h2 className="font-600 text-sm" style={{ color: T.navy }}>{job.title}</h2>
                  <p className="text-xs mt-0.5" style={{ color: T.gray }}>{job.category}</p>
                </div>
              </div>
              <UrgencyBadge urgency={job.urgency} />
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: T.gray }}>{job.description}</p>
            <div className="flex gap-4 text-xs" style={{ color: T.gray }}>
              <span className="flex items-center gap-1">{Icons.mapPin}{job.distance} away</span>
              <span className="flex items-center gap-1">{Icons.clock}{job.postedTime}</span>
            </div>
          </div>

          <Divider />

          <div className="p-4">
            <p className="text-xs font-600 mb-2.5" style={{ color: T.navy }}>Issue Photos</p>
            <div className="flex gap-2">
              {[
                'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop',
                'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=80&h=80&fit=crop',
              ].map((src, i) => (
                <img key={i} src={src} alt={`Issue ${i+1}`} className="w-16 h-16 rounded-md object-cover" style={{ border: `1px solid ${T.border}` }} />
              ))}
              <div className="w-16 h-16 rounded-md flex flex-col items-center justify-center" style={{ border: `1px dashed ${T.borderDim}`, background: T.bg }}>
                <div style={{ color: T.gray }}>{Icons.radio}</div>
                <p className="text-[9px] mt-1" style={{ color: T.gray }}>Voice Note</p>
              </div>
            </div>
          </div>

          <Divider />

          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: T.gray }}>Preferred time</span>
              <span className="text-xs font-600" style={{ color: T.navy }}>{job.scheduledTime}</span>
            </div>
          </div>
        </div>

        {/* Counter-offer banner */}
        {phase === 'countered' && (
          <div className="mx-4 mt-3 p-4 rounded-md" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.warning }} />
              <p className="text-sm font-600" style={{ color: T.navy }}>Counter-Offer Received</p>
            </div>
            <p className="text-xs mb-3" style={{ color: T.gray }}>
              {job.customerName} suggests Rs. {counterAmount} for the visit fee.
            </p>
            <div className="flex gap-2">
              <PrimaryBtn onClick={() => setPhase('accepted')} className="flex-1 py-2 text-xs">
                Accept Rs. {counterAmount}
              </PrimaryBtn>
              <OutlineBtn className="flex-1 py-2 text-xs">
                Counter Rs. 280
              </OutlineBtn>
              <OutlineBtn danger className="px-3 py-2 text-xs">
                Decline
              </OutlineBtn>
            </div>
          </div>
        )}

        {phase === 'accepted' && (
          <div className="mx-4 mt-3 p-4 rounded-md" style={{ background: T.primaryLight, border: `1px solid ${T.primary}` }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: T.primary }}>
                {Icons.check}
              </div>
              <div>
                <p className="text-sm font-600" style={{ color: T.primary }}>Visit Fee Locked — Rs. {counterAmount}</p>
                <p className="text-xs" style={{ color: T.navy }}>Customer accepted. Visit is now scheduled.</p>
              </div>
            </div>
          </div>
        )}

        {/* Offer form */}
        {phase === 'form' && (
          <div className="mx-4 mt-3 mb-4" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <div className="px-4 pt-4 pb-1">
              <h3 className="font-600 text-sm" style={{ color: T.navy }}>Submit Your Offer</h3>
              <p className="text-xs mt-0.5" style={{ color: T.gray }}>One offer per job. You can withdraw before customer accepts.</p>
            </div>
            <Divider className="mt-3" />
            <div className="p-4 flex flex-col gap-3">
              <Input label="Visit / Inspection Fee (Rs.)" value={visitFee} onChange={setVisitFee} type="number" />
              <Input label="Initial Estimate Range (optional)" value={estimate} onChange={setEstimate} placeholder="e.g. Rs. 1,500 – Rs. 2,500" />
              <Textarea
                label="Proposal Note"
                value={note}
                onChange={setNote}
                placeholder="e.g. Licensed plumber with 8 years experience. Available today at 4 PM."
                rows={3}
              />
              <PrimaryBtn onClick={() => setPhase('sent')} className="w-full">
                Send Offer
              </PrimaryBtn>
            </div>
          </div>
        )}

        {phase === 'sent' && (
          <div className="mx-4 mt-3 mb-4" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: '#FEF9C3' }}>
                  <span className="text-lg">⏳</span>
                </div>
                <div>
                  <p className="font-600 text-sm" style={{ color: T.navy }}>Offer Sent — Rs. {visitFee}</p>
                  <p className="text-xs" style={{ color: T.gray }}>Awaiting customer decision…</p>
                </div>
              </div>
              <OutlineBtn onClick={() => setPhase('countered')} className="w-full text-xs py-2">
                Simulate Counter-Offer (Demo)
              </OutlineBtn>
            </div>
          </div>
        )}

        {phase === 'accepted' && (
          <div className="mx-4 mt-3 mb-4">
            <PrimaryBtn onClick={onOfferAccepted} className="w-full">
              Go to Active Job →
            </PrimaryBtn>
          </div>
        )}
      </div>
    </div>
  )
}
