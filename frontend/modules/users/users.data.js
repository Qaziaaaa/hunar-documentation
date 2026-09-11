export const AVATAR_COLORS = [
  '#0f8b8d', '#2563eb', '#d97706', '#7c3aed', '#db2777',
  '#0891b2', '#16a34a', '#c026d3', '#b91c1c', '#0f766e'
];

export function avatarColor(id) {
  if (!id) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export const WORKERS = [
  {
    id: 'w_ali', role: 'worker', name: 'Ali Khan', email: 'ali@hunar.pk', phone: '+92 300 1234567',
    tagline: 'Certified AC & refrigeration technician', skills: ['AC Repair', 'Electrician'], years: 8,
    rating: 4.9, ratingCount: 245, verified: true, area: 'Gulshan-e-Iqbal', radius: 12, visitCharge: 300,
    available: true, bio: 'Specialist in split & central AC systems. Fast diagnosis, honest pricing, and a 30-day work guarantee on every repair.',
    portfolio: ['AC gas refill & leak repair', 'Capacitor replacement', 'Full AC service & deep clean', 'Inverter PCB repair'],
    responses: '~20 min', avgJobTime: '1.5 hrs', jobsDone: 245, reviews: [
      { by: 'Bilal R.', rating: 5, text: 'Fixed my AC on the same day. Very professional and honest about what needed replacing.' },
      { by: 'Zainab S.', rating: 5, text: 'Reasonable price, quick work. AC is cooling perfectly now.' },
      { by: 'Fahad M.', rating: 4, text: 'Good service. Arrived a bit late but did everything cleanly.' }
    ]
  },
  {
    id: 'w_hamza', role: 'worker', name: 'Hamza Ahmed', email: 'hamza@hunar.pk', phone: '+92 300 7654321',
    tagline: 'Electrician • Wiring & appliance specialist', skills: ['Electrician', 'Appliance Repair'], years: 6,
    rating: 4.7, ratingCount: 180, verified: true, area: 'North Nazimabad', radius: 10, visitCharge: 250,
    available: true, bio: 'Licensed electrician handling wiring, MCBs, fans, geysers and appliance faults. Safety-first approach on every job.',
    portfolio: ['Full rewiring', 'Fan & motor repair', 'Geyser installation', 'Short-circuit tracing'],
    responses: '~15 min', avgJobTime: '1 hr', jobsDone: 180, reviews: [
      { by: 'Sana T.', rating: 5, text: 'Traced a dangerous short circuit quickly. Very careful with the wiring.' },
      { by: 'Omar A.', rating: 4, text: 'Good work, explained everything clearly before starting.' }
    ]
  },
  {
    id: 'w_usman', role: 'worker', name: 'Usman Services', email: 'usman@hunar.pk', phone: '+92 300 1122334',
    tagline: 'Multi-service professional • 10 yrs experience', skills: ['Plumbing', 'Electrician', 'Cleaning'], years: 10,
    rating: 4.8, ratingCount: 310, verified: true, area: 'Bahadurabad', radius: 15, visitCharge: 350,
    available: true, bio: 'Master of multiple trades with a small trusted team. One call covers plumbing, electrical and deep cleaning needs.',
    portfolio: ['Complete bathroom renovation', 'Kitchen pipeline replacement', 'Whole-home deep cleaning', 'Switchboard upgrade'],
    responses: '~10 min', avgJobTime: '2 hrs', jobsDone: 310, reviews: [
      { by: 'Hina K.', rating: 5, text: 'Handled 3 different issues in one visit. Saved me from hiring 3 people.' },
      { by: 'Arif N.', rating: 5, text: 'Very experienced. Fixed a 10 year old leak that 2 others could not.' },
      { by: 'Maha P.', rating: 4, text: 'Team was polite and thorough.' }
    ]
  },
  {
    id: 'w_bilal', role: 'worker', name: 'Bilal Carpenter', email: 'bilal@hunar.pk', phone: '+92 300 5566778',
    tagline: 'Carpenter & furniture maker', skills: ['Carpenter', 'Painter'], years: 5,
    rating: 4.6, ratingCount: 120, verified: true, area: 'Malir', radius: 9, visitCharge: 280,
    available: true, bio: 'Custom furniture, door fittings, locks and all woodwork. I bring my own tools and finish clean.',
    portfolio: ['Custom wardrobe', 'Door hinge & lock repair', 'Kitchen cabinet shelves', 'Bed restore'],
    responses: '~35 min', avgJobTime: '2 hrs', jobsDone: 120, reviews: [
      { by: 'Nouman Q.', rating: 5, text: 'Beautiful custom wardrobe. Attention to detail is amazing.' },
      { by: 'Asia F.', rating: 4, text: 'Fixed all our doors and locks in one morning.' }
    ]
  },
  {
    id: 'w_rashid', role: 'worker', name: 'Rashid Plumbing', email: 'rashid@hunar.pk', phone: '+92 300 9988776',
    tagline: 'Plumber • Drainage & water systems', skills: ['Plumbing'], years: 12,
    rating: 4.9, ratingCount: 290, verified: true, area: 'Saddar', radius: 11, visitCharge: 320,
    available: true, bio: 'Residential plumbing specialist — hidden leaks, blockages, water heater fixes and complete pipe replacements.',
    portfolio: ['Hidden leak detection', 'Bathroom drain clearance', 'Geyser repair', 'Overhead tank piping'],
    responses: '~18 min', avgJobTime: '1 hr 15 min', jobsDone: 290, reviews: [
      { by: 'Kashif B.', rating: 5, text: 'Found a leak two others missed. Masterclass plumbing.' },
      { by: 'Rubab D.', rating: 5, text: 'Blocked drain cleared in 20 minutes. Highly recommend.' }
    ]
  },
  {
    id: 'w_imran', role: 'worker', name: 'Imran Painter', email: 'imran@hunar.pk', phone: '+92 300 4455663',
    tagline: 'Painter • Interior & exterior finishes', skills: ['Painter', 'Other'], years: 6,
    rating: 4.5, ratingCount: 90, verified: true, area: 'Korangi', radius: 8, visitCharge: 240,
    available: true, bio: 'Smooth roller finishes, texture walls, ceiling touch-ups and waterproofing with good prep work.',
    portfolio: ['3-bed flat repaint', 'Texture wall accent', 'Ceiling waterproofing', 'Wooden door varnish'],
    responses: '~40 min', avgJobTime: '1 hr', jobsDone: 90, reviews: [
      { by: 'Saad V.', rating: 5, text: 'Neat lines, no paint drops on the floor. Very professional.' },
      { by: 'Farah C.', rating: 4, text: 'Great texture work on the accent wall.' }
    ]
  },
  {
    id: 'w_demo', role: 'worker', name: 'Your Profile', email: '', phone: '', tagline: '', skills: [], years: 0,
    rating: 0, ratingCount: 0, verified: false, area: '', radius: 10, visitCharge: 0, available: true, bio: '',
    portfolio: [], responses: '', avgJobTime: '', jobsDone: 0, reviews: [], isTemplate: true
  }
];

export const DEMO_CUSTOMER = {
  id: 'c_demo', role: 'customer', name: 'Sara Ahmed', email: 'sara@hunar.pk', phone: '+92 321 9988776', area: 'Clifton Block 4', joined: 2024
};

export function initialSeedReviewsFor(workerId) {
  const w = WORKERS.find(function (x) { return x.id === workerId; });
  return w ? w.reviews.map(function (r) {
    return {
      id: 'seed_' + workerId + '_' + r.by,
      workerId: workerId,
      customerName: r.by,
      rating: r.rating,
      text: r.text,
      at: Date.now() - (Math.random() * 30 + 5) * 86400000
    };
  }) : [];
}

export function wavUri(seconds) {
  const sr = 8000, n = Math.max(1, Math.round(seconds)) * sr, dataLen = n * 2;
  const buf = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buf);
  const wstr = function (o, s) { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wstr(0, 'RIFF'); v.setUint32(4, 36 + dataLen, true); wstr(8, 'WAVE');
  wstr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  wstr(36, 'data'); v.setUint32(40, dataLen, true);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = Math.sin(2 * Math.PI * 440 * t) * 0.15;
    v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, e)) * 0x7FFF, true);
  }
  const parts = [];
  for (let i = 0; i < buf.byteLength; i += 4096) {
    parts.push(String.fromCharCode.apply(null, new Uint8Array(buf, i, Math.min(4096, buf.byteLength - i))));
  }
  return 'data:audio/wav;base64,' + btoa(parts.join(''));
}

if (typeof window !== 'undefined') {
  window.WORKERS = WORKERS;
  window.DEMO_CUSTOMER = DEMO_CUSTOMER;
  window.AVATAR_COLORS = AVATAR_COLORS;
  window.avatarColor = avatarColor;
  window.initialSeedReviewsFor = initialSeedReviewsFor;
  window.wavUri = wavUri;
}
