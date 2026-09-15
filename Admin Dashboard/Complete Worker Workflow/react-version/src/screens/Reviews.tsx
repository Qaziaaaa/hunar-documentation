import { useState } from 'react'
import {
  T, Icons, PrimaryBtn, GhostBtn, Divider, Avatar, Stars, Chip, PageHeader, Textarea, Toast,
} from '../components/shared'
import { REVIEWS } from '../data/mock'

export function ReviewsScreen({ onBack }: { onBack: () => void }) {
  const [showLeaveReview, setShowLeaveReview] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const avgRating = (REVIEWS.reduce((s, r) => s + r.stars, 0) / REVIEWS.length).toFixed(1)

  const dist = [5, 4, 3, 2, 1].map((s) => ({
    stars: s,
    count: REVIEWS.filter((r) => r.stars === s).length,
    pct: Math.round((REVIEWS.filter((r) => r.stars === s).length / REVIEWS.length) * 100),
  }))

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      <PageHeader title="Reviews" subtitle={`${REVIEWS.length} reviews · ${avgRating} average`} onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        {/* Rate Customer prompt */}
        <div className="mx-4 mt-4 flex items-center justify-between p-3 rounded-md" style={{ background: T.primaryLight }}>
          <p className="text-xs" style={{ color: T.navy }}>You can now rate your latest customer. Tap to leave a review.</p>
          <GhostBtn onClick={() => setShowLeaveReview(true)} className="ml-3 whitespace-nowrap">Rate Customer →</GhostBtn>
        </div>

        {/* Rating summary */}
        <div className="mx-4 mt-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <div className="p-4">
            <div className="flex items-start gap-5">
              <div className="text-center flex-shrink-0">
                <p className="font-700" style={{ color: T.navy, fontSize: 40, lineHeight: 1, letterSpacing: '-0.03em' }}>{avgRating}</p>
                <Stars rating={parseFloat(avgRating)} size="sm" />
                <p className="text-[10px] mt-1.5" style={{ color: T.gray }}>Based on {REVIEWS.length} reviews</p>
              </div>
              <div className="flex-1">
                {dist.map((d) => (
                  <div key={d.stars} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] w-6 text-right" style={{ color: T.gray }}>{d.stars}★</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, background: T.primary }} />
                    </div>
                    <span className="text-[10px] w-6" style={{ color: T.gray }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <div className="mx-4 mt-3" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
          {REVIEWS.map((review, i) => {
            const expanded = expandedId === review.id
            return (
              <div key={review.id}>
                <div className="px-4 py-4">
                  <div className="flex items-start gap-3">
                    <Avatar initials={review.customerInitials} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-600 text-sm" style={{ color: T.navy }}>{review.customerName}</p>
                        <p className="text-[10px] flex-shrink-0" style={{ color: T.gray }}>{review.date}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 mb-2">
                        <Stars rating={review.stars} size="sm" />
                        <span className="text-[10px] uppercase tracking-wide font-600" style={{ color: T.gray }}>{review.jobCategory}</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`} style={{ color: T.navy }}>
                        {review.text}
                      </p>
                      {review.text.length > 120 && (
                        <button className="text-[10px] mt-1 font-600" style={{ color: T.primary }} onClick={() => setExpandedId(expanded ? null : review.id)}>
                          {expanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                      {review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {review.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ border: `1px solid ${T.border}`, color: T.gray, background: T.surface }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {i < REVIEWS.length - 1 && <Divider />}
              </div>
            )
          })}
        </div>

        <div className="h-4" />
      </div>

      {showLeaveReview && (
        <LeaveReviewModal
          onClose={() => setShowLeaveReview(false)}
          onSubmit={() => {
            setShowLeaveReview(false)
            showToast('Review submitted successfully.')
          }}
        />
      )}
    </div>
  )
}

// ─── Leave Review Modal ───────────────────────────────────────────────────────
const CUSTOMER_TAGS = ['Courteous', 'Prompt Payment', 'Accurate Description', 'Respectful', 'Flexible']

function LeaveReviewModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) {
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) setTags(tags.filter((t) => t !== tag))
    else if (tags.length < 3) setTags([...tags, tag])
  }

  const handleSubmit = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); onSubmit() }, 1000)
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" style={{ background: 'rgba(15,23,42,0.4)' }} onClick={onClose}>
      <div className="rounded-t-xl overflow-hidden" style={{ background: T.surface }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: T.border }} />
        </div>

        <div className="px-4 pb-2">
          <h2 className="font-600 text-base" style={{ color: T.navy }}>Rate this Customer</h2>
          <p className="text-xs mt-0.5" style={{ color: T.gray }}>Ahmed Raza · Leaking Main Valve</p>
        </div>
        <Divider className="my-3" />

        <div className="px-4 flex flex-col gap-4 pb-6">
          {/* Star selector */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex gap-2">
              {[1,2,3,4,5].map((i) => (
                <button
                  key={i}
                  onClick={() => setStars(i)}
                  className="transition-transform active:scale-110"
                >
                  <svg viewBox="0 0 24 24" fill={i <= stars ? T.warning : 'none'} stroke={i <= stars ? T.warning : T.border} strokeWidth="1.5" className="w-8 h-8">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p className="text-xs font-600" style={{ color: T.navy }}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][stars]}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs font-500 mb-2" style={{ color: T.navy }}>Quality Tags (select up to 3)</p>
            <div className="flex flex-wrap gap-2">
              {CUSTOMER_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  selected={tags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </div>
          </div>

          <Textarea
            label="Comment (optional)"
            value={comment}
            onChange={setComment}
            placeholder="Leave a comment (optional)..."
            rows={3}
            maxLength={250}
          />

          <PrimaryBtn onClick={handleSubmit} className="w-full" disabled={stars === 0} loading={loading}>
            Submit Review
          </PrimaryBtn>
          <GhostBtn onClick={onClose} className="text-center w-full">Skip for now</GhostBtn>
        </div>
      </div>
    </div>
  )
}
