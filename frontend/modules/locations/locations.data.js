export const AREAS = [
  'Clifton Block 4', 'Clifton Block 3', 'Gulshan-e-Iqbal', 'Bahadurabad',
  'North Nazimabad', 'DHA Phase 2', 'DHA Phase 6', 'Gulberg',
  'Malir', 'Saddar', 'Korangi', 'Shah Faisal Colony',
  'Nazimabad', 'FB Area', 'PECHS'
];

export const TIME_SLOTS = [
  '9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'
];

export function randDist(seedKey, r) {
  let h = 0;
  for (let i = 0; i < seedKey.length; i++) h = (h * 33 + seedKey.charCodeAt(i)) % 997;
  const km = (h % ((r || 10) * 20)) / 10;
  return km < 0.8 ? km + 0.8 : km;
}

if (typeof window !== 'undefined') {
  window.AREAS = AREAS;
  window.TIME_SLOTS = TIME_SLOTS;
  window.randDist = randDist;
}
