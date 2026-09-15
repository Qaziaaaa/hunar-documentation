import { useState } from 'react'
import { T, I, Btn, Badge, Stars, Divider, Textarea, Input, Toast } from '../components/shared'
import { CATEGORIES, SUB_SKILLS, DISPUTES } from '../data/mock'

type Tab = 'overview' | 'services' | 'location' | 'disputes'

export function ProfilePage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [toast, setToast] = useState<string | null>(null)

  const save = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000) }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'My Services' },
    { id: 'location', label: 'Location & Area' },
    { id: 'disputes', label: 'Disputes' },
  ]

  return (
    <div className="flex flex-col h-full">
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      {/* Tab bar */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: `1px solid ${T.border}` }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="text-sm font-500 px-4 py-2.5 transition-colors" style={{ color: tab === t.id ? T.primary : T.gray, borderBottom: `2px solid ${tab === t.id ? T.primary : 'transparent'}` }}>
            {t.label}
            {t.id === 'disputes' && DISPUTES.length > 0 && (
              <span className="ml-2 text-xs font-600 px-1.5 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: T.error }}>{DISPUTES.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'services' && <ServicesTab onSave={() => save('Service categories updated successfully.')} />}
        {tab === 'location' && <LocationTab onSave={() => save('Service area updated successfully.')} />}
        {tab === 'disputes' && <DisputesTab />}
      </div>
    </div>
  )
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState('Usman Malik')
  const [bio, setBio] = useState('Licensed plumber with 8 years of residential and commercial experience in Islamabad. Specialize in pipe fitting, leak repair, drainage, and water heater installation.')
  const [visitFee, setVisitFee] = useState('300')
  const [experience, setExperience] = useState('8')

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Left: profile card */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="p-5 text-center" style={{ background: T.navy }}>
            <div className="relative inline-block mb-3">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" alt="" className="w-20 h-20 rounded-lg object-cover" style={{ border: `2px solid ${T.primary}` }} />
              <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: T.primary }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-2.5 h-2.5"><polyline points="20,6 9,17 4,12"/></svg>
                <span className="text-white text-[9px] font-600">VERIFIED</span>
              </div>
            </div>
            <h2 className="font-600 text-base text-white" style={{ letterSpacing: '-0.015em' }}>{name}</h2>
            <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Plumber · {experience} years exp.</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <Stars n={5} size={14} />
              <span className="text-xs" style={{ color: '#94A3B8' }}>4.8 (94 reviews)</span>
            </div>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {[{ l: 'Phone', v: '+92 321 1234567' }, { l: 'CNIC', v: '61101-XXXXXXX-X' }, { l: 'Default Visit Fee', v: `Rs. ${visitFee}` }, { l: 'Member Since', v: 'Jan 2024' }].map((r) => (
              <div key={r.l} className="flex justify-between text-xs py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                <span style={{ color: T.gray }}>{r.l}</span>
                <span className="font-500" style={{ color: T.navy }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verification */}
        <div className="bg-white rounded-lg p-4" style={{ border: `1px solid ${T.border}` }}>
          <p className="text-[10px] font-600 uppercase tracking-wide mb-3" style={{ color: T.gray }}>Verification</p>
          {[{ l: 'CNIC', d: true }, { l: 'Phone', d: true }, { l: 'Trade Certificate', d: true }, { l: 'Portfolio Photos', d: true }].map((v) => (
            <div key={v.l} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: v.d ? T.primary : T.bg, border: `1px solid ${v.d ? T.primary : T.border}` }}>
                  {v.d && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-2.5 h-2.5"><polyline points="20,6 9,17 4,12"/></svg>}
                </div>
                <span className="text-xs font-500" style={{ color: T.navy }}>{v.l}</span>
              </div>
              {v.d && <Badge label="Verified" color="teal" />}
            </div>
          ))}
        </div>
      </div>

      {/* Right: edit profile */}
      <div className="col-span-2 flex flex-col gap-4">
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Profile Information</h3>
            <Btn variant={editMode ? 'primary' : 'outline'} size="sm" onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Save Changes' : <>{I.edit} Edit Profile</>}
            </Btn>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <Input label="Full Name" value={name} onChange={setName} className={editMode ? '' : 'pointer-events-none opacity-70'} />
            <Input label="Years of Experience" value={experience} onChange={setExperience} type="number" className={editMode ? '' : 'pointer-events-none opacity-70'} />
            <Input label="Default Visit Fee (Rs.)" value={visitFee} onChange={setVisitFee} type="number" className={editMode ? '' : 'pointer-events-none opacity-70'} />
            <div />
            <div className="col-span-2">
              <Textarea label="Professional Bio" value={bio} onChange={setBio} rows={4} className={editMode ? '' : 'pointer-events-none opacity-70'} />
            </div>
          </div>
        </div>

        {/* ID / KYC */}
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Identity Documents</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            {['CNIC Front', 'CNIC Back', 'Trade Certificate', 'Portfolio Photo'].map((doc) => (
              <div key={doc} className="rounded-md p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors" style={{ border: `1px dashed ${T.borderDim}` }}>
                <div style={{ color: T.grayDim }}>{I.upload}</div>
                <p className="text-sm font-500" style={{ color: T.navy }}>{doc}</p>
                <p className="text-xs" style={{ color: T.grayDim }}>JPG, PNG, PDF · Max 5MB</p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Account Settings</h3>
          </div>
          {['Notification Preferences', 'Change Language', 'Privacy Settings', 'Help & Support'].map((item, i) => (
            <div key={item} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer" style={{ borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
              <span className="text-sm" style={{ color: T.navy }}>{item}</span>
              <span style={{ color: T.gray }}>{I.chevronRight}</span>
            </div>
          ))}
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
            <button className="flex items-center gap-2 text-sm font-500" style={{ color: T.error }}>
              {I.logout} Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Services Tab ──────────────────────────────────────────────────────────────
function ServicesTab({ onSave }: { onSave: () => void }) {
  const [selected, setSelected] = useState<string[]>(['plumbing', 'ac'])
  const [subSkills, setSubSkills] = useState<Record<string, string[]>>({ plumbing: ['Pipe Fitting', 'Leak Repair'], ac: ['Gas Refilling'] })
  const [showBanner, setShowBanner] = useState(true)

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length === 1) return
      setSelected(selected.filter((s) => s !== id))
    } else setSelected([...selected, id])
  }
  const toggleSub = (cat: string, skill: string) => {
    const cur = subSkills[cat] ?? []
    setSubSkills({ ...subSkills, [cat]: cur.includes(skill) ? cur.filter((s) => s !== skill) : [...cur, skill] })
  }

  return (
    <div className="flex flex-col gap-5">
      {showBanner && (
        <div className="flex items-start gap-2 p-3 rounded-md" style={{ background: '#EFF4FF', borderLeft: `3px solid ${T.primary}` }}>
          <div style={{ color: T.primary }}>{I.info}</div>
          <p className="text-sm flex-1" style={{ color: T.navy }}>Workers only receive jobs matching their registered categories and service area. Keep these accurate.</p>
          <button onClick={() => setShowBanner(false)} style={{ color: T.gray }}>{I.x}</button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {CATEGORIES.map((cat) => {
          const sel = selected.includes(cat.id)
          return (
            <div key={cat.id} className="flex flex-col gap-2">
              <button onClick={() => toggle(cat.id)} className="w-full rounded-lg p-4 text-left transition-all relative" style={{ background: sel ? T.primaryLight : 'white', border: `${sel ? 2 : 1}px solid ${sel ? T.primary : T.border}` }}>
                {sel && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: T.primary }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3 h-3"><polyline points="20,6 9,17 4,12"/></svg>
                  </div>
                )}
                <div className="w-10 h-10 rounded-md flex items-center justify-center text-xl mb-2" style={{ background: T.primaryLight }}>{cat.icon}</div>
                <p className="text-sm font-600" style={{ color: T.navy }}>{cat.label}</p>
              </button>
              {sel && SUB_SKILLS[cat.id]?.length > 0 && (
                <div className="p-2 rounded-md" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                  <p className="text-[10px] font-600 uppercase tracking-wide mb-1.5" style={{ color: T.gray }}>Specializations</p>
                  <div className="flex flex-wrap gap-1">
                    {SUB_SKILLS[cat.id].map((skill) => {
                      const s = (subSkills[cat.id] ?? []).includes(skill)
                      return (
                        <button key={skill} onClick={() => toggleSub(cat.id, skill)} className="text-[10px] px-2 py-1 rounded-full transition-all" style={{ background: s ? T.primaryLight : 'white', border: `1px solid ${s ? T.primary : T.border}`, color: s ? T.primary : T.gray }}>
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Btn variant="primary" onClick={onSave}>Save Changes</Btn>
        <Btn variant="outline">Cancel</Btn>
      </div>
    </div>
  )
}

// ─── Location Tab ──────────────────────────────────────────────────────────────
function LocationTab({ onSave }: { onSave: () => void }) {
  const [city, setCity] = useState('F-10, Islamabad')
  const [radius, setRadius] = useState('10')
  const [areas, setAreas] = useState(['F-10, Islamabad', 'G-9, Islamabad'])

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
            <h3 className="font-600 text-sm" style={{ color: T.navy }}>Service Area Settings</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <Input label="Primary City / Area" value={city} onChange={setCity} placeholder="e.g. F-10, Islamabad" icon={I.mapPin} />

            <div>
              <label className="block text-xs font-500 mb-2" style={{ color: T.navy }}>Travel Radius</label>
              <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                {['2', '5', '10', '20', '30+'].map((r) => (
                  <button key={r} onClick={() => setRadius(r)} className="flex-1 py-2 text-sm font-500 transition-all" style={{ background: radius === r ? T.primary : 'white', color: radius === r ? 'white' : T.gray, borderRight: r !== '30+' ? `1px solid ${T.border}` : 'none' }}>
                    {r} km
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1.5 font-500" style={{ color: T.primary }}>Currently set to: {radius} km</p>
            </div>

            <div>
              <label className="block text-xs font-500 mb-2" style={{ color: T.navy }}>Service Areas ({areas.length}/5)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {areas.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-500" style={{ background: T.primaryLight, border: `1px solid ${T.primary}`, color: T.primary }}>
                    {a}
                    {areas.length > 1 && <button onClick={() => setAreas(areas.filter((_,j) => j !== i))} style={{ color: T.primary }}>{I.x}</button>}
                  </div>
                ))}
              </div>
              {areas.length < 5 && (
                <button onClick={() => setAreas([...areas, 'I-8, Islamabad'])} className="flex items-center gap-1 text-sm" style={{ color: T.primary }}>
                  {I.plus} Add Area
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Btn variant="primary" onClick={onSave}>Save Location</Btn>
              <Btn variant="outline">Discard</Btn>
            </div>
          </div>
        </div>
      </div>

      {/* Map + error states */}
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="relative" style={{ height: 280 }}>
            <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=600&h=280&fit=crop" alt="Map" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: T.primary }}>
                <span style={{ color: 'white' }}>{I.mapPin}</span>
              </div>
            </div>
            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-md text-xs font-500" style={{ background: 'rgba(15,23,42,0.75)', color: 'white' }}>
              Drag to adjust location
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-2 text-xs" style={{ color: T.gray, borderTop: `1px solid ${T.border}` }}>
            <span style={{ color: T.primary }}>{I.info}</span>
            Text input is the primary method. Map provides visual reference only.
          </div>
        </div>

        {/* Error reference */}
        <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
            <p className="text-xs font-600" style={{ color: T.navy }}>Location Error States</p>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {[
              { label: 'No location entered', msg: 'Please enter your service area.' },
              { label: 'GPS denied', msg: 'Unable to access location. Please enter manually.' },
              { label: 'Area not found', msg: 'Area not found. Try a different location.' },
            ].map((e) => (
              <div key={e.label} className="flex flex-col gap-0.5">
                <p className="text-[10px] font-600 uppercase tracking-wide" style={{ color: T.gray }}>{e.label}</p>
                <p className="text-xs" style={{ color: T.error }}>{e.msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Disputes Tab ──────────────────────────────────────────────────────────────
function DisputesTab() {
  const [selected, setSelected] = useState(DISPUTES[0] ?? null)

  if (DISPUTES.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div style={{ color: T.border }}>{I.document}</div>
      <p className="font-600 text-sm" style={{ color: T.navy }}>No Disputes</p>
      <p className="text-sm" style={{ color: T.gray }}>You have no active or past disputes.</p>
    </div>
  )

  return (
    <div className="flex gap-5 h-full">
      {/* List */}
      <div className="w-80 flex-shrink-0 bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
        {DISPUTES.map((d, i) => (
          <div key={d.id} onClick={() => setSelected(d)} className="p-4 cursor-pointer transition-colors" style={{ background: selected?.id === d.id ? T.primaryLight : 'white', borderBottom: i < DISPUTES.length - 1 ? `1px solid ${T.border}` : 'none', borderLeft: `2px solid ${selected?.id === d.id ? T.primary : 'transparent'}` }}>
            <div className="flex items-start gap-2 mb-1">
              <span style={{ color: T.error }}>{I.alertTriangle}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-500 truncate" style={{ color: T.navy }}>{d.jobTitle}</p>
                <p className="text-xs" style={{ color: T.gray }}>{d.reason}</p>
                <p className="text-[10px] mt-1" style={{ color: T.gray }}>{d.submittedOn}</p>
              </div>
              <Badge label={d.status === 'under-review' ? 'Under Review' : 'Resolved'} color={d.status === 'under-review' ? 'red' : 'green'} />
            </div>
          </div>
        ))}
      </div>

      {/* Detail */}
      {selected && (
        <div className="flex-1 flex flex-col gap-4">
          {/* Status banner */}
          <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: '#FEF2F2', borderLeft: `3px solid ${T.error}`, border: `1px solid #FECACA` }}>
            <div style={{ color: T.error }}>{I.alertTriangle}</div>
            <div>
              <p className="font-600 text-sm" style={{ color: T.error }}>Dispute Under Review</p>
              <p className="text-xs mt-0.5" style={{ color: '#92400E' }}>Admin will review and contact both parties. Expected resolution: 24–48 hours.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Dispute details */}
            <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                <h3 className="font-600 text-sm" style={{ color: T.navy }}>Dispute Details</h3>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <p className="text-[10px] font-600 uppercase tracking-wide mb-1" style={{ color: T.gray }}>Reason</p>
                  <p className="text-sm" style={{ color: T.navy }}>{selected.reason}</p>
                </div>
                <div>
                  <p className="text-[10px] font-600 uppercase tracking-wide mb-1" style={{ color: T.gray }}>Description</p>
                  <p className="text-sm leading-relaxed" style={{ color: T.navy }}>{selected.description}</p>
                </div>
                <div>
                  <p className="text-[10px] font-600 uppercase tracking-wide mb-1" style={{ color: T.gray }}>Submitted</p>
                  <p className="text-sm" style={{ color: T.navy }}>{selected.submittedOn}</p>
                </div>
                <div>
                  <p className="text-[10px] font-600 uppercase tracking-wide mb-2" style={{ color: T.gray }}>Evidence Photos</p>
                  <div className="flex gap-2">
                    {['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=60&fit=crop','https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=80&h=60&fit=crop'].map((src,i) => (
                      <img key={i} src={src} alt="" className="w-20 h-14 rounded-md object-cover" style={{ border: `1px solid ${T.border}` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin message */}
            <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                <h3 className="font-600 text-sm" style={{ color: T.navy }}>Admin Communication</h3>
              </div>
              <div className="p-5">
                <div className="pl-4" style={{ borderLeft: `3px solid ${T.borderDim}` }}>
                  <p className="text-sm italic leading-relaxed" style={{ color: T.gray }}>
                    Your dispute has been received and is under review. Our team will contact both parties within 24 hours. Please retain all chat messages and photos related to this job.
                  </p>
                  <p className="text-xs mt-2 font-600" style={{ color: T.gray }}>— HUNAR Admin · Sep 7, 2026</p>
                </div>
                <div className="mt-5 p-3 rounded-md" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                  <p className="text-xs font-600 mb-1" style={{ color: T.navy }}>Resolution Outcomes</p>
                  <p className="text-xs mb-1" style={{ color: T.gray }}>✅ Worker favored → Payment released + green banner</p>
                  <p className="text-xs" style={{ color: T.gray }}>⚠️ Customer favored → See admin decision notice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
