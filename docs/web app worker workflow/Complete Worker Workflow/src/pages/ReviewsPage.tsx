import { useState } from 'react'
import { T, I, Btn, Stars, Divider, Avatar, Toast } from '../components/shared'
import { REVIEWS } from '../data/mock'

const TAGS = ['Courteous', 'Prompt Payment', 'Accurate Description', 'Respectful', 'Flexible']

export function ReviewsPage() {
  const [showForm, setShowForm] = useState(false)
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [toast, setToast] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const avg = (REVIEWS.reduce((s, r) => s + r.stars, 0) / REVIEWS.length)
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, count: REVIEWS.filter((r) => r.stars === s).length, pct: Math.round(REVIEWS.filter((r) => r.stars === s).length / REVIEWS.length * 100) }))

  const submit = () => {
    setShowForm(false); setStars(0); setTags([]); setComment('')
    setToast(true); setTimeout(() => setToast(false), 4000)
  }

  const toggleTag = (t: string) => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : tags.length < 3 ? [...tags, t] : tags)

  return (
    <div className="flex gap-6 h-full">
      {toast && <Toast message="Review submitted successfully." type="success" onClose={() => setToast(false)} />}

      {/* Left: summary + list */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
        {/* Rating summary */}
        <div className="bg-white rounded-lg p-5 flex items-start gap-8" style={{ border: `1px solid ${T.border}` }}>
          <div className="text-center">
            <p className="font-700 text-white rounded-lg flex items-center justify-center mb-2" style={{ width: 80, height: 80, background: T.primary, fontSize: 32, letterSpacing: '-0.04em' }}>{avg.toFixed(1)}</p>
            <Stars n={Math.round(avg)} size={16} />
            <p className="text-xs mt-1.5" style={{ color: T.gray }}>Based on {REVIEWS.length} reviews</p>
          </div>
          <div className="flex-1">
            {dist.map((d) => (
              <div key={d.s} className="flex items-center gap-3 mb-2">
                <span className="text-xs w-8" style={{ color: T.gray }}>{d.s} ★</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.border }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${d.pct}%`, background: T.primary }} />
                </div>
                <span className="text-xs w-6 text-right" style={{ color: T.gray }}>{d.count}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Jobs Completed', value: '94' },
              { label: 'Positive Feedback', value: '97%' },
              { label: 'Response Rate', value: '100%' },
            ].map((s) => (
              <div key={s.label} className="text-right">
                <p className="font-700 text-lg" style={{ color: T.navy, letterSpacing: '-0.02em' }}>{s.value}</p>
                <p className="text-xs" style={{ color: T.gray }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews list */}
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h2 className="font-600 text-sm" style={{ color: T.navy }}>Customer Reviews</h2>
            <div className="flex items-center gap-2">
              <select className="text-xs px-2.5 py-1.5 rounded-md outline-none" style={{ border: `1px solid ${T.border}`, color: T.navy }}>
                <option>Most Recent</option>
                <option>Highest Rated</option>
                <option>Lowest Rated</option>
              </select>
            </div>
          </div>
          {REVIEWS.map((r, i) => {
            const exp = expanded === r.id
            return (
              <div key={r.id}>
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={r.customerName} size={40} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-600 text-sm" style={{ color: T.navy }}>{r.customerName}</p>
                          <Stars n={r.stars} size={13} />
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: T.bg, color: T.gray }}>{r.jobCategory}</span>
                        </div>
                        <p className="text-xs mb-2 mt-0.5" style={{ color: T.gray }}>{r.date}</p>
                        <p className={`text-sm leading-relaxed ${!exp ? 'line-clamp-2' : ''}`} style={{ color: T.navy }}>{r.text}</p>
                        {r.text.length > 100 && (
                          <button className="text-xs mt-1 font-500" style={{ color: T.primary }} onClick={() => setExpanded(exp ? null : r.id)}>
                            {exp ? 'Show less' : 'Read more'}
                          </button>
                        )}
                        {r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {r.tags.map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ border: `1px solid ${T.border}`, color: T.gray }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {i < REVIEWS.length - 1 && <Divider />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right: Rate Customer */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white rounded-lg overflow-hidden sticky top-0" style={{ border: `1px solid ${T.border}` }}>
          <div className="px-4 py-3" style={{ background: T.primaryLight, borderBottom: `1px solid ${T.primary}` }}>
            <p className="text-sm font-600" style={{ color: T.primary }}>New: Rate your latest customer</p>
            <p className="text-xs mt-0.5" style={{ color: T.navy }}>Ahmed Raza · Leaking Main Valve</p>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <div>
              <p className="text-xs font-500 mb-2" style={{ color: T.navy }}>Your Rating</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map((i) => (
                  <button key={i} onClick={() => setStars(i)} className="transition-transform active:scale-110">
                    <svg viewBox="0 0 24 24" fill={i <= stars ? T.warning : 'none'} stroke={i <= stars ? T.warning : T.borderDim} strokeWidth="1.5" className="w-8 h-8">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                  </button>
                ))}
              </div>
              {stars > 0 && <p className="text-xs mt-1 font-500" style={{ color: T.navy }}>{['','Poor','Fair','Good','Very Good','Excellent!'][stars]}</p>}
            </div>
            <div>
              <p className="text-xs font-500 mb-2" style={{ color: T.navy }}>Quality Tags (max 3)</p>
              <div className="flex flex-wrap gap-1.5">
                {TAGS.map((tag) => {
                  const sel = tags.includes(tag)
                  return (
                    <button key={tag} onClick={() => toggleTag(tag)} className="text-xs px-2.5 py-1.5 rounded-full transition-all" style={{ background: sel ? T.primaryLight : 'white', border: `1px solid ${sel ? T.primary : T.border}`, color: sel ? T.primary : T.gray }}>
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-500 mb-1" style={{ color: T.navy }}>Comment (optional)</p>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave a comment..." rows={3} maxLength={250} className="w-full text-sm px-3 py-2 rounded-md outline-none resize-none" style={{ border: `1px solid ${T.border}`, color: T.navy }}
                onFocus={(e) => e.target.style.borderColor = T.primary} onBlur={(e) => e.target.style.borderColor = T.border}
              />
              <p className="text-right text-xs mt-0.5" style={{ color: T.grayDim }}>{comment.length}/250</p>
            </div>
            <Btn variant="primary" className="w-full" disabled={stars === 0} onClick={submit}>Submit Review</Btn>
            <button className="text-xs text-center" style={{ color: T.gray }}>Skip for now</button>
          </div>
        </div>
      </div>
    </div>
  )
}
