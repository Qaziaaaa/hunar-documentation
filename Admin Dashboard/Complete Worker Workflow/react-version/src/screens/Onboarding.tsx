import { useState, useRef, useEffect } from 'react'
import { T, Icons, PrimaryBtn, OutlineBtn, GhostBtn, Input, InfoBanner, Chip } from '../components/shared'
import { CATEGORIES, SUB_SKILLS } from '../data/mock'

type OnboardStep = 'phone' | 'otp' | 'role' | 'profile' | 'categories' | 'location' | 'pending'

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<OnboardStep>('phone')

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: T.bg }}>
      {step === 'phone' && <PhoneStep onNext={() => setStep('otp')} />}
      {step === 'otp' && <OtpStep onNext={() => setStep('role')} onBack={() => setStep('phone')} />}
      {step === 'role' && <RoleStep onNext={() => setStep('profile')} />}
      {step === 'profile' && <ProfileStep onNext={() => setStep('categories')} />}
      {step === 'categories' && <CategoriesStep onNext={() => setStep('location')} onBack={() => setStep('profile')} />}
      {step === 'location' && <LocationStep onNext={() => setStep('pending')} onBack={() => setStep('categories')} />}
      {step === 'pending' && <PendingStep onComplete={onComplete} />}
    </div>
  )
}

// ─── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 justify-center py-4">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="rounded-full transition-all" style={{
          width: i === current ? 20 : 6, height: 6,
          background: i <= current ? T.primary : T.border,
        }} />
      ))}
    </div>
  )
}

// ─── Phone Step ────────────────────────────────────────────────────────────────
function PhoneStep({ onNext }: { onNext: () => void }) {
  const [phone, setPhone] = useState('')
  return (
    <div className="flex flex-col h-full">
      {/* Logo header */}
      <div className="px-6 pt-12 pb-6" style={{ background: T.navy }}>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: T.primary }}>
            <span style={{ color: 'white', fontSize: 16 }}>{Icons.wrench}</span>
          </div>
          <span className="text-white font-700 text-lg tracking-tight">HUNAR</span>
        </div>
        <h1 className="text-white font-600 text-2xl mb-1" style={{ letterSpacing: '-0.025em' }}>Welcome</h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>Enter your mobile number to get started</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8">
        <ProgressDots current={0} total={5} />
        <div className="mt-2">
          <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>Mobile Number</label>
          <div className="flex gap-2">
            <div className="flex items-center px-3 rounded-md text-sm font-500" style={{ border: `1px solid ${T.border}`, color: T.navy, background: T.surface, minWidth: 56 }}>
              🇵🇰 +92
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="3XX XXXXXXX"
              className="flex-1 text-sm px-3 py-2.5 rounded-md outline-none"
              style={{ border: `1px solid ${T.border}`, color: T.navy, background: T.surface }}
              onFocus={(e) => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 1px ${T.primary}` }}
              onBlur={(e) => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: T.gray }}>We'll send a 6-digit verification code via SMS.</p>
        </div>

        <PrimaryBtn onClick={onNext} className="w-full mt-6" disabled={phone.length < 10}>
          Send OTP →
        </PrimaryBtn>

        <p className="text-xs text-center mt-4" style={{ color: T.gray }}>
          By continuing you agree to HUNAR's{' '}
          <span style={{ color: T.primary }}>Terms of Service</span> and{' '}
          <span style={{ color: T.primary }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}

// ─── OTP Step ──────────────────────────────────────────────────────────────────
function OtpStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const [timer, setTimer] = useState(30)

  useEffect(() => {
    const t = setInterval(() => setTimer((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const handleInput = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return
    const next = [...otp]
    next[i] = v.slice(-1)
    setOtp(next)
    if (v && i < 5) refs.current[i + 1]?.focus()
    if (!v && i > 0) refs.current[i - 1]?.focus()
  }

  const filled = otp.every((d) => d !== '')

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-12 pb-6" style={{ background: T.navy }}>
        <button onClick={onBack} className="mb-4" style={{ color: '#94A3B8' }}>{Icons.arrowLeft}</button>
        <h1 className="text-white font-600 text-2xl mb-1" style={{ letterSpacing: '-0.025em' }}>Verify your number</h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>Enter the 6-digit code sent to +92 3XX XXXXXXX</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8">
        <ProgressDots current={0} total={5} />
        <div className="flex gap-2 justify-center mt-4">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleInput(i, e.target.value)}
              className="w-11 h-12 text-center text-lg font-700 rounded-md outline-none transition-all"
              style={{
                border: `1px solid ${d ? T.primary : T.border}`,
                color: T.navy,
                background: d ? T.primaryLight : T.surface,
                boxShadow: d ? `0 0 0 1px ${T.primary}` : 'none',
              }}
            />
          ))}
        </div>

        <div className="text-center mt-4">
          {timer > 0 ? (
            <p className="text-xs" style={{ color: T.gray }}>Resend code in {timer}s</p>
          ) : (
            <GhostBtn onClick={() => setTimer(30)}>Resend OTP</GhostBtn>
          )}
        </div>

        <PrimaryBtn onClick={onNext} className="w-full mt-6" disabled={!filled}>
          Verify & Continue →
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Role Step ─────────────────────────────────────────────────────────────────
function RoleStep({ onNext }: { onNext: () => void }) {
  const [role, setRole] = useState<'worker' | 'customer' | null>(null)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-12 pb-6" style={{ background: T.navy }}>
        <h1 className="text-white font-600 text-2xl mb-1" style={{ letterSpacing: '-0.025em' }}>I want to…</h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>Choose how you'll use HUNAR</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8">
        <ProgressDots current={1} total={5} />
        <div className="flex flex-col gap-3 mt-4">
          {[
            { id: 'worker' as const, icon: '🔧', title: 'I am a Skilled Worker', desc: 'Offer my services and get hired for local jobs' },
            { id: 'customer' as const, icon: '🏠', title: 'I need a service', desc: 'Find verified workers for home repairs and services' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className="w-full text-left rounded-md p-4 transition-all"
              style={{
                background: role === r.id ? T.primaryLight : T.surface,
                border: `${role === r.id ? 2 : 1}px solid ${role === r.id ? T.primary : T.border}`,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center text-xl flex-shrink-0" style={{ background: T.bg }}>
                  {r.icon}
                </div>
                <div className="flex-1">
                  <p className="font-600 text-sm" style={{ color: T.navy }}>{r.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: T.gray }}>{r.desc}</p>
                </div>
                {role === r.id && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.primary }}>
                    {Icons.check}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        <PrimaryBtn onClick={onNext} className="w-full mt-6" disabled={!role}>
          Continue →
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Profile Step ──────────────────────────────────────────────────────────────
function ProfileStep({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState('Usman Malik')
  const [experience, setExperience] = useState('8')
  const [bio, setBio] = useState('')
  const [visitFee, setVisitFee] = useState('300')

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-10 pb-5" style={{ background: T.navy }}>
        <h1 className="text-white font-600 text-xl mb-1" style={{ letterSpacing: '-0.02em' }}>Your Profile</h1>
        <p className="text-sm" style={{ color: '#94A3B8' }}>Set up your professional identity</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6">
        <ProgressDots current={2} total={5} />

        {/* Avatar upload */}
        <div className="flex flex-col items-center mt-4 mb-6">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
              alt="Profile"
              className="w-20 h-20 rounded-lg object-cover"
              style={{ border: `2px solid ${T.primary}` }}
            />
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white" style={{ background: T.primary }}>
              {Icons.camera}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: T.gray }}>Tap to upload profile photo</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input label="Full Name" value={name} onChange={setName} placeholder="e.g. Usman Malik" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Years of Experience" value={experience} onChange={setExperience} type="number" placeholder="8" />
            <Input label="Default Visit Fee (Rs.)" value={visitFee} onChange={setVisitFee} type="number" placeholder="300" />
          </div>
          <div>
            <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>Short Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Licensed plumber with 8 years of residential and commercial experience in Islamabad. Specialise in pipe fitting, leak repair, and drainage."
              rows={3}
              className="w-full text-sm px-3 py-2.5 rounded-md outline-none resize-none"
              style={{ border: `1px solid ${T.border}`, color: T.navy, background: T.surface }}
              onFocus={(e) => { e.target.style.borderColor = T.primary }}
              onBlur={(e) => { e.target.style.borderColor = T.border }}
            />
          </div>

          {/* CNIC upload */}
          <div>
            <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>Identity Verification (CNIC)</label>
            <div className="grid grid-cols-2 gap-2">
              {['Front Side', 'Back Side'].map((side) => (
                <div key={side} className="rounded-md p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:border-teal-500 transition-colors" style={{ border: `1px dashed ${T.borderDim}` }}>
                  <div style={{ color: T.gray }}>{Icons.upload}</div>
                  <p className="text-xs font-500" style={{ color: T.navy }}>{side}</p>
                  <p className="text-[10px]" style={{ color: T.gray }}>JPG, PNG, PDF</p>
                </div>
              ))}
            </div>
            <p className="text-xs mt-1.5" style={{ color: T.gray }}>Optional: Trade licenses or certificates</p>
          </div>
        </div>

        <PrimaryBtn onClick={onNext} className="w-full mt-6 mb-4" disabled={!name}>
          Continue →
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Categories Step ───────────────────────────────────────────────────────────
function CategoriesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>(['plumbing'])
  const [expanded, setExpanded] = useState<string | null>('plumbing')
  const [subSkills, setSubSkills] = useState<Record<string, string[]>>({ plumbing: ['Pipe Fitting', 'Leak Repair'] })
  const [showBanner, setShowBanner] = useState(true)
  const [error, setError] = useState(false)

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      if (selected.length === 1) { setError(true); return }
      setSelected(selected.filter((s) => s !== id))
      setExpanded(null)
    } else {
      setSelected([...selected, id])
      setExpanded(id)
      setError(false)
    }
  }

  const toggleSub = (catId: string, skill: string) => {
    const current = subSkills[catId] ?? []
    setSubSkills({
      ...subSkills,
      [catId]: current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill],
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-10 pb-5 flex items-center gap-3" style={{ background: T.navy }}>
        <button onClick={onBack} style={{ color: '#94A3B8' }}>{Icons.arrowLeft}</button>
        <div>
          <h1 className="text-white font-600 text-xl" style={{ letterSpacing: '-0.02em' }}>What services do you offer?</h1>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Select all that apply. You can update this later.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <ProgressDots current={3} total={5} />

        {showBanner && (
          <div className="mt-2 mb-4">
            <InfoBanner
              text="Workers only receive job requests that match their registered categories and service area."
              onDismiss={() => setShowBanner(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          {CATEGORIES.map((cat) => {
            const sel = selected.includes(cat.id)
            return (
              <div key={cat.id}>
                <button
                  onClick={() => toggle(cat.id)}
                  className="w-full rounded-md p-3 text-left transition-all relative"
                  style={{
                    background: sel ? T.primaryLight : T.surface,
                    border: `${sel ? 2 : 1}px solid ${sel ? T.primary : T.border}`,
                  }}
                >
                  {sel && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: T.primary }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-2.5 h-2.5"><polyline points="20,6 9,17 4,12"/></svg>
                    </div>
                  )}
                  <div className="w-9 h-9 rounded-md flex items-center justify-center text-lg mb-2" style={{ background: T.primaryLight }}>
                    {cat.icon}
                  </div>
                  <p className="text-xs font-600" style={{ color: T.navy }}>{cat.label}</p>
                </button>

                {/* Sub-skills */}
                {sel && expanded === cat.id && SUB_SKILLS[cat.id]?.length > 0 && (
                  <div className="mt-1.5 p-2 rounded-md" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-600 mb-2 uppercase tracking-wide" style={{ color: T.gray }}>Specializations</p>
                    <div className="flex flex-wrap gap-1">
                      {SUB_SKILLS[cat.id].map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          selected={(subSkills[cat.id] ?? []).includes(skill)}
                          onClick={() => toggleSub(cat.id, skill)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <p className="text-xs mt-3" style={{ color: T.error }}>Please select at least one service category.</p>
        )}

        <PrimaryBtn onClick={onNext} className="w-full mt-4 mb-4" disabled={selected.length === 0}>
          Continue →
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Location Step ──────────────────────────────────────────────────────────────
function LocationStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [city, setCity] = useState('F-10, Islamabad')
  const [radius, setRadius] = useState('10')
  const [areas, setAreas] = useState<string[]>(['F-10, Islamabad'])
  const radiusOptions = ['2', '5', '10', '20', '30+']

  const addArea = () => {
    if (areas.length < 5) setAreas([...areas, 'G-9, Islamabad'])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-10 pb-5 flex items-center gap-3" style={{ background: T.navy }}>
        <button onClick={onBack} style={{ color: '#94A3B8' }}>{Icons.arrowLeft}</button>
        <div>
          <h1 className="text-white font-600 text-xl" style={{ letterSpacing: '-0.02em' }}>Where do you work?</h1>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>Set your service area so customers nearby can find you.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4">
        <ProgressDots current={4} total={5} />

        <div className="flex flex-col gap-4 mt-3">
          <Input
            label="Your City or Area"
            value={city}
            onChange={setCity}
            placeholder="e.g. F-10, Islamabad"
          />

          {/* Map placeholder */}
          <div>
            <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>Map Pin</label>
            <div className="rounded-md overflow-hidden relative" style={{ border: `1px solid ${T.border}`, height: 120 }}>
              <img
                src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=400&h=120&fit=crop"
                alt="Map"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-md" style={{ background: T.primary }}>
                  <span style={{ color: 'white' }}>{Icons.mapPin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Radius selector */}
          <div>
            <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>How far are you willing to travel?</label>
            <div className="flex rounded-md overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              {radiusOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className="flex-1 py-2.5 text-xs font-600 transition-all"
                  style={{
                    background: radius === r ? T.primary : T.surface,
                    color: radius === r ? 'white' : T.gray,
                    borderRight: r !== '30+' ? `1px solid ${T.border}` : 'none',
                  }}
                >
                  {r} km
                </button>
              ))}
            </div>
            <p className="text-xs mt-1.5" style={{ color: T.primary }}>Currently set to: {radius} km radius</p>
          </div>

          {/* Multiple areas */}
          <div>
            <label className="block text-xs font-500 mb-1.5" style={{ color: T.navy }}>Service Areas</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {areas.map((area, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs" style={{ background: T.primaryLight, border: `1px solid ${T.primary}`, color: T.primary }}>
                  {area}
                  {areas.length > 1 && (
                    <button onClick={() => setAreas(areas.filter((_, j) => j !== i))} style={{ color: T.primary }}>
                      {Icons.x}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {areas.length < 5 && (
              <GhostBtn onClick={addArea} className="flex items-center gap-1 text-xs">
                {Icons.plus} Add Another Area
              </GhostBtn>
            )}
          </div>
        </div>

        <PrimaryBtn onClick={onNext} className="w-full mt-6 mb-4" disabled={!city}>
          Submit for Verification →
        </PrimaryBtn>
      </div>
    </div>
  )
}

// ─── Pending Verification ──────────────────────────────────────────────────────
function PendingStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col h-full items-center justify-center px-6 text-center" style={{ background: T.bg }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: T.primaryLight }}>
        <div className="w-8 h-8" style={{ color: T.primary }}>{Icons.checkCircle}</div>
      </div>
      <h1 className="font-600 text-xl mb-2" style={{ color: T.navy, letterSpacing: '-0.02em' }}>Application Submitted</h1>
      <p className="text-sm leading-relaxed mb-2" style={{ color: T.gray }}>
        Your profile is under review. Our team will verify your credentials within 24–48 hours.
      </p>
      <div className="w-full rounded-md p-4 text-left mt-4 mb-8" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {[
          { label: 'Profile Submitted', done: true },
          { label: 'Identity Verification (CNIC)', done: false },
          { label: 'Admin Review & Approval', done: false },
          { label: 'Account Activated', done: false },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.done ? T.primary : T.bg, border: `1px solid ${s.done ? T.primary : T.border}` }}>
              {s.done && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3 h-3"><polyline points="20,6 9,17 4,12"/></svg>}
            </div>
            <p className="text-xs font-500" style={{ color: s.done ? T.primary : T.gray }}>{s.label}</p>
          </div>
        ))}
      </div>
      <PrimaryBtn onClick={onComplete} className="w-full">
        Go to Dashboard (Preview)
      </PrimaryBtn>
    </div>
  )
}
