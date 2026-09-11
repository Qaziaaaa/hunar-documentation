/* ============================================================
   HUNAR ADMIN PANEL — WORKERS MANAGEMENT PAGE
   JavaScript — Interactivity & State
   ============================================================ */

/* ---- Demo Worker Data ---- */
const WORKERS_DATA = [
  { id: 'WRK-1024', name: 'Muhammad Usman', email: 'usman@hunar.pk', phone: '+92 300 1234567', service: 'AC Technician', location: 'Peshawar, PK', verification: 'verified', availability: 'available', rating: 4.8, completed: 124, joined: 'Aug 24, 2026', experience: '8 years', services: ['AC Repair', 'AC Gas Refill', 'Split AC Installation'], color: '#0F766E', tags: ['Certified', 'Top Rated'] },
  { id: 'WRK-1089', name: 'Ali Raza Khan', email: 'ali.raza@hunar.pk', phone: '+92 331 4567890', service: 'Electrician', location: 'Lahore, PK', verification: 'verified', availability: 'busy', rating: 4.6, completed: 98, joined: 'Jul 12, 2026', experience: '6 years', services: ['Wiring', 'Switchboard', 'Appliance Repair'], color: '#123B5D', tags: ['Verified'] },
  { id: 'WRK-1156', name: 'Bilal Ahmed', email: 'bilal@hunar.pk', phone: '+92 321 9876543', service: 'Plumber', location: 'Islamabad, PK', verification: 'pending', availability: 'available', rating: 0, completed: 0, joined: 'Sep 02, 2026', experience: '3 years', services: ['Pipe Fitting', 'Leak Repair', 'Drain Cleaning'], color: '#2563EB', tags: ['New'] },
  { id: 'WRK-1003', name: 'Hamza Malik', email: 'hamza@hunar.pk', phone: '+92 300 5551234', service: 'Carpenter', location: 'Rawalpindi, PK', verification: 'verified', availability: 'available', rating: 4.9, completed: 210, joined: 'Mar 15, 2025', experience: '12 years', services: ['Furniture', 'Door Installation', 'Woodwork'], color: '#7C3AED', tags: ['Top Rated', 'Premium'] },
  { id: 'WRK-1201', name: 'Faisal Naveed', email: 'faisal@hunar.pk', phone: '+92 333 7778899', service: 'Painter', location: 'Faisalabad, PK', verification: 'verified', availability: 'offline', rating: 4.3, completed: 56, joined: 'Jun 08, 2026', experience: '4 years', services: ['Interior Painting', 'Exterior Painting', 'Wall Texture'], color: '#DB2777', tags: [] },
  { id: 'WRK-1078', name: 'Omar Farooq', email: 'omar@hunar.pk', phone: '+92 312 4445566', service: 'AC Technician', location: 'Multan, PK', verification: 'verified', availability: 'available', rating: 4.7, completed: 167, joined: 'May 20, 2025', experience: '10 years', services: ['Central AC', 'Inverter Repair', 'Duct Cleaning'], color: '#0891B2', tags: ['Certified'] },
  { id: 'WRK-1312', name: 'Saif Ullah', email: 'saif@hunar.pk', phone: '+92 345 1122334', service: 'Mechanic', location: 'Peshawar, PK', verification: 'pending', availability: 'available', rating: 0, completed: 0, joined: 'Sep 05, 2026', experience: '2 years', services: ['Bike Repair', 'Engine Tuning', 'General Maintenance'], color: '#EA580C', tags: ['New'] },
  { id: 'WRK-1045', name: 'Usman Ghani', email: 'usman.g@hunar.pk', phone: '+92 300 9988776', service: 'Electrician', location: 'Karachi, PK', verification: 'verified', availability: 'available', rating: 4.5, completed: 89, joined: 'Apr 03, 2026', experience: '5 years', services: ['Solar Installation', 'Wiring', 'MCB/Fuse'], color: '#16A34A', tags: ['Verified'] },
  { id: 'WRK-1199', name: 'Ahmed Shah', email: 'ahmed@hunar.pk', phone: '+92 332 6677889', service: 'Plumber', location: 'Quetta, PK', verification: 'rejected', availability: 'offline', rating: 3.2, completed: 12, joined: 'Aug 15, 2026', experience: '1 year', services: ['Tap Repair', 'Pipe Fitting'], color: '#64748B', tags: [] },
  { id: 'WRK-1067', name: 'Kamran Yousaf', email: 'kamran@hunar.pk', phone: '+92 311 3344556', service: 'Carpenter', location: 'Sialkot, PK', verification: 'verified', availability: 'busy', rating: 4.4, completed: 73, joined: 'Jul 28, 2026', experience: '7 years', services: ['Cabinet Making', 'Shelving', 'Furniture Repair'], color: '#B91C1C', tags: ['Verified'] },
  { id: 'WRK-1234', name: 'Tariq Mehmood', email: 'tariq@hunar.pk', phone: '+92 300 2233445', service: 'Painter', location: 'Gujranwala, PK', verification: 'verified', availability: 'available', rating: 4.1, completed: 34, joined: 'Aug 01, 2026', experience: '3 years', services: ['Wall Painting', 'Primer Work', 'Polish'], color: '#C026D3', tags: [] },
  { id: 'WRK-1091', name: 'Rashid Khan', email: 'rashid@hunar.pk', phone: '+92 334 8899001', service: 'AC Technician', location: 'Abbottabad, PK', verification: 'verified', availability: 'available', rating: 4.9, completed: 198, joined: 'Jan 10, 2025', experience: '15 years', services: ['All AC Types', 'Refrigeration', 'Gas Charging'], color: '#0F766E', tags: ['Top Rated', 'Premium', 'Certified'] },
  { id: 'WRK-1345', name: 'Zubair Ali', email: 'zubair@hunar.pk', phone: '+92 321 5566778', service: 'Mechanic', location: 'Hyderabad, PK', verification: 'pending', availability: 'available', rating: 0, completed: 0, joined: 'Sep 08, 2026', experience: '4 years', services: ['Car Repair', 'AC Mechanic', 'Electrical'], color: '#D97706', tags: ['New'] },
  { id: 'WRK-1012', name: 'Imran Shahid', email: 'imran@hunar.pk', phone: '+92 300 1100223', service: 'Electrician', location: 'Lahore, PK', verification: 'verified', availability: 'offline', rating: 4.6, completed: 142, joined: 'Feb 18, 2025', experience: '9 years', services: ['Industrial Wiring', 'Generator', 'Transformer'], color: '#1A1A2E', tags: ['Premium'] },
  { id: 'WRK-1278', name: 'Waseem Akram', email: 'waseem@hunar.pk', phone: '+92 346 7788990', service: 'Plumber', location: 'Lahore, PK', verification: 'verified', availability: 'available', rating: 4.2, completed: 45, joined: 'Jun 30, 2026', experience: '5 years', services: ['Bathroom Renovation', 'Water Tank', 'Pump Repair'], color: '#2563EB', tags: ['Verified'] },
  { id: 'WRK-1155', name: 'Naeem Ullah', email: 'naeem@hunar.pk', phone: '+92 313 4455667', service: 'Carpenter', location: 'Peshawar, PK', verification: 'verified', availability: 'available', rating: 4.7, completed: 112, joined: 'Apr 22, 2026', experience: '8 years', services: ['Custom Furniture', 'Door/Window', 'Flooring'], color: '#16A34A', tags: ['Top Rated'] },
];

const SERVICES_LIST = ['AC Technician', 'Electrician', 'Mechanic', 'Plumber', 'Carpenter', 'Painter'];
const VERIFICATION_LIST = ['All', 'Verified', 'Pending', 'Rejected'];
const AVAILABILITY_LIST = ['All', 'Available', 'Busy', 'Offline'];
const RATING_LIST = ['Any rating', '4.5+', '4.0+', '3.0+'];

/* ---- State ---- */
let state = {
  workers: [...WORKERS_DATA],
  filtered: [...WORKERS_DATA],
  search: '',
  filters: { verification: 'All', availability: 'All', service: 'All', rating: 'Any rating' },
  hideVerified: true,
  sort: 'name-asc',
  page: 1,
  perPage: 10,
  selected: new Set(),
  loading: false,
  error: false,
};

/* ---- Helpers ---- */
function initials(name) {
  return name.split(' ').map(function(w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
}

function fmtRating(r) {
  return r ? r.toFixed(1) : 'New';
}

function matchRating(worker, filter) {
  if (filter === 'Any rating') return true;
  const val = parseFloat(filter);
  return worker.rating >= val;
}

function applyFiltersAndSearch() {
  let list = [...WORKERS_DATA];

  if (state.search) {
    const q = state.search.toLowerCase();
    list = list.filter(function(w) {
      return w.name.toLowerCase().indexOf(q) !== -1 ||
             w.id.toLowerCase().indexOf(q) !== -1 ||
             w.service.toLowerCase().indexOf(q) !== -1 ||
             w.location.toLowerCase().indexOf(q) !== -1 ||
             w.email.toLowerCase().indexOf(q) !== -1;
    });
  }

  if (state.filters.verification !== 'All') {
    list = list.filter(function(w) { return w.verification === state.filters.verification.toLowerCase(); });
  } else if (state.hideVerified) {
    list = list.filter(function(w) { return w.verification !== 'verified'; });
  }
  if (state.filters.availability !== 'All') {
    list = list.filter(function(w) { return w.availability === state.filters.availability.toLowerCase(); });
  }
  if (state.filters.service !== 'All') {
    list = list.filter(function(w) { return w.service === state.filters.service; });
  }
  if (state.filters.rating !== 'Any rating') {
    list = list.filter(function(w) { return matchRating(w, state.filters.rating); });
  }

  /* Sort */
  if (state.sort === 'name-asc') list.sort(function(a, b) { return a.name.localeCompare(b.name); });
  else if (state.sort === 'name-desc') list.sort(function(a, b) { return b.name.localeCompare(a.name); });
  else if (state.sort === 'rating-desc') list.sort(function(a, b) { return b.rating - a.rating; });
  else if (state.sort === 'completed-desc') list.sort(function(a, b) { return b.completed - a.completed; });
  else if (state.sort === 'joined-desc') list.sort(function(a, b) { return b.joined.localeCompare(a.joined); });

  state.filtered = list;
  state.page = 1;
  state.selected.clear();

  var tag = document.getElementById('verified-hidden-tag');
  if (tag) {
    var showTag = state.hideVerified && state.filters.verification === 'All';
    tag.classList.toggle('hidden', !showTag);
    tag.textContent = showTag ? 'Verified workers hidden' : '';
  }

  renderTable();
  renderPagination();
  renderOverview();
  renderBulkBar();
  renderActiveFilters();
}

/* ---- SVG Icons (inline) ---- */
const ICONS = {
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  filter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  sort: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg>',
  plus: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  moreV: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  ban: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  pin: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>',
  menu: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>',
  bell: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  chevLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  chevRight: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  chevDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
  arrowDown: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  searchLg: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  alertCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  trash: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
  userPlus: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>',
  file: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
  refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
};

function ic(name, attrs) {
  let svg = ICONS[name] || '';
  if (attrs && svg) {
    svg = svg.replace('<svg', '<svg ' + attrs);
  }
  return svg;
}

/* ============================================================
   RENDER FUNCTIONS
   ============================================================ */

function renderOverview() {
  const total = WORKERS_DATA.length;
  const verified = WORKERS_DATA.filter(function(w) { return w.verification === 'verified'; }).length;
  const pending = WORKERS_DATA.filter(function(w) { return w.verification === 'pending'; }).length;
  const active = WORKERS_DATA.filter(function(w) { return w.availability === 'available'; }).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-verified').textContent = verified;
  document.getElementById('stat-pending').textContent = pending;
  document.getElementById('stat-active').textContent = active;
}

function renderActiveFilters() {
  const container = document.getElementById('active-filters');
  const chips = [];

  Object.keys(state.filters).forEach(function(key) {
    const val = state.filters[key];
    const defaultVal = key === 'rating' ? 'Any rating' : 'All';
    if (val !== defaultVal) {
      const label = key.charAt(0).toUpperCase() + key.slice(1) + ': ' + val;
      chips.push('<span class="filter-chip">' + label + '<button onclick="clearFilter(\'' + key + '\')">' + ic('x', 'width="14" height="14"') + '</button></span>');
    }
  });

  if (state.search) {
    chips.push('<span class="filter-chip">Search: "' + state.search + '"<button onclick="clearSearch()">' + ic('x', 'width="14" height="14"') + '</button></span>');
  }

  container.innerHTML = chips.join('');
}

function renderTable() {
  const start = (state.page - 1) * state.perPage;
  const end = start + state.perPage;
  const pageData = state.filtered.slice(start, end);
  const tbody = document.getElementById('workers-tbody');

  /* Table */
  if (pageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9">' +
      '<div class="empty-state">' +
      '<div class="empty-icon">' + ic('searchLg') + '</div>' +
      '<h3>No workers found</h3>' +
      '<p>Try adjusting your search or filters to find what you are looking for.</p>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
      '<button class="btn btn-outline" onclick="clearAllFilters()">Clear Filters</button>' +
      '<button class="btn btn-primary" onclick="openAddWorkerModal()">' + ic('plus') + ' Add Worker</button>' +
      '</div></div></td></tr>';
    return;
  }

  let html = '';
  pageData.forEach(function(w) {
    const checked = state.selected.has(w.id) ? ' checked' : '';

    const availDot = w.availability === 'available' ? 'green' : w.availability === 'busy' ? 'orange' : 'gray';
    const availLabel = w.availability.charAt(0).toUpperCase() + w.availability.slice(1);

    const ratingHtml = w.rating > 0
      ? '<div class="rating-cell"><span class="rating-star">' + ic('star') + '</span><span class="rating-num">' + fmtRating(w.rating) + '</span></div>'
      : '<span style="color:var(--text-muted);font-size:13px">New</span>';

    const verifiedInner = w.verification === 'verified'
      ? '<span class="worker-verified">' + ic('check') + '</span>' : '';

    html += '<tr data-id="' + w.id + '">' +
      '<td class="col-check"><input type="checkbox" class="cbx"' + checked + ' onchange="toggleSelect(\'' + w.id + '\')" /></td>' +
      '<td><div class="worker-cell">' +
        '<div class="worker-avatar" style="background:' + w.color + '">' + initials(w.name) + verifiedInner + '</div>' +
        '<div><div class="worker-name">' + w.name + '</div><div class="worker-id">' + w.id + '</div></div>' +
      '</div></td>' +
      '<td class="worker-service">' + w.service + '</td>' +
      '<td class="col-location"><div class="worker-location">' + ic('pin') + ' ' + w.location + '</div></td>' +
      '<td><span class="avail-text"><span class="avail-dot ' + availDot + '"></span>' + availLabel + '</span></td>' +
      '<td>' + ratingHtml + '</td>' +
      '<td class="col-completed"><span class="completed-num">' + w.completed + '</span></td>' +
      '<td class="col-joined"><span class="date-cell">' + w.joined + '</span></td>' +
      '<td><div class="action-menu-wrap">' +
        '<button class="action-btn" onclick="toggleActionMenu(event, \'' + w.id + '\')">' + ic('moreV') + '</button>' +
        '<div class="action-dropdown" id="menu-' + w.id + '">' +
          '<button class="action-dropdown-item" onclick="openDetailDrawer(\'' + w.id + '\')">' + ic('eye') + ' View Profile</button>' +
          '<button class="action-dropdown-item">' + ic('edit') + ' Edit Worker</button>' +
          (w.verification === 'pending' ? '<button class="action-dropdown-item" onclick="openVerifyModal(\'' + w.id + '\')">' + ic('checkCircle') + ' Review Verification</button>' : '') +
          (w.verification === 'pending' ? '<button class="action-dropdown-item danger" onclick="openRejectModal(\'' + w.id + '\')">' + ic('ban') + ' Reject</button>' : '') +
          (w.verification === 'verified' ? '<button class="action-dropdown-item danger" onclick="openSuspendModal(\'' + w.id + '\')">' + ic('ban') + ' Suspend Account</button>' : '') +
          (w.availability !== 'available' && w.verification !== 'rejected' ? '<button class="action-dropdown-item">' + ic('checkCircle') + ' Reactivate</button>' : '') +
        '</div>' +
      '</div></td>' +
    '</tr>';
  });
  tbody.innerHTML = html;
}

function renderPagination() {
  const total = state.filtered.length;
  const totalPages = Math.ceil(total / state.perPage) || 1;
  const start = Math.min((state.page - 1) * state.perPage + 1, total);
  const end = Math.min(state.page * state.perPage, total);

  document.getElementById('pag-info').textContent = total > 0
    ? 'Showing ' + start + '\u2013' + end + ' of ' + total + ' workers'
    : 'No workers to display';

  const controls = document.getElementById('pag-controls');
  let html = '';

  html += '<button class="page-btn" onclick="goPage(' + (state.page - 1) + ')"' + (state.page <= 1 ? ' disabled' : '') + '>' + ic('chevLeft') + '</button>';

  var pages = [];
  if (totalPages <= 7) {
    for (var i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (state.page > 3) pages.push('...');
    for (var p = Math.max(2, state.page - 1); p <= Math.min(totalPages - 1, state.page + 1); p++) pages.push(p);
    if (state.page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  pages.forEach(function(p) {
    if (p === '...') {
      html += '<span class="page-btn" style="cursor:default;opacity:.4">...</span>';
    } else {
      html += '<button class="page-btn' + (p === state.page ? ' active' : '') + '" onclick="goPage(' + p + ')">' + p + '</button>';
    }
  });

  html += '<button class="page-btn" onclick="goPage(' + (state.page + 1) + ')"' + (state.page >= totalPages ? ' disabled' : '') + '>' + ic('chevRight') + '</button>';

  controls.innerHTML = html;
}

function renderBulkBar() {
  const bar = document.getElementById('bulk-bar');
  const count = state.selected.size;
  if (count > 0) {
    bar.classList.add('show');
    document.getElementById('bulk-count').textContent = count + ' worker' + (count > 1 ? 's' : '') + ' selected';
  } else {
    bar.classList.remove('show');
  }
}

/* ============================================================
   ACTIONS
   ============================================================ */

function toggleSelect(id) {
  if (state.selected.has(id)) {
    state.selected.delete(id);
  } else {
    state.selected.add(id);
  }
  renderBulkBar();
  updateHeaderCheckbox();
}

function toggleSelectAll() {
  var start = (state.page - 1) * state.perPage;
  var end = start + state.perPage;
  var pageData = state.filtered.slice(start, end);
  var allSelected = pageData.every(function(w) { return state.selected.has(w.id); });

  if (allSelected) {
    pageData.forEach(function(w) { state.selected.delete(w.id); });
  } else {
    pageData.forEach(function(w) { state.selected.add(w.id); });
  }
  renderTable();
  renderBulkBar();
  updateHeaderCheckbox();
}

function updateHeaderCheckbox() {
  var headerCbx = document.getElementById('select-all-cbx');
  if (!headerCbx) return;
  var start = (state.page - 1) * state.perPage;
  var end = start + state.perPage;
  var pageData = state.filtered.slice(start, end);
  headerCbx.checked = pageData.length > 0 && pageData.every(function(w) { return state.selected.has(w.id); });
}

function clearSelection() {
  state.selected.clear();
  renderTable();
  renderBulkBar();
  updateHeaderCheckbox();
}

function goPage(n) {
  var totalPages = Math.ceil(state.filtered.length / state.perPage) || 1;
  if (n < 1 || n > totalPages) return;
  state.page = n;
  renderTable();
  renderPagination();
  updateHeaderCheckbox();
  document.querySelector('.table-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onPerPageChange(val) {
  state.perPage = parseInt(val, 10);
  state.page = 1;
  renderTable();
  renderPagination();
  updateHeaderCheckbox();
}

function onSearch(val) {
  state.search = val.trim();
  applyFiltersAndSearch();
}

function clearSearch() {
  state.search = '';
  document.getElementById('search-input').value = '';
  applyFiltersAndSearch();
}

function clearFilter(key) {
  var defaults = { verification: 'All', availability: 'All', service: 'All', rating: 'Any rating' };
  state.filters[key] = defaults[key];
  if (key === 'verification') state.hideVerified = true;
  applyFiltersAndSearch();
  syncFilterDrawer();
}

function clearAllFilters() {
  state.filters = { verification: 'All', availability: 'All', service: 'All', rating: 'Any rating' };
  state.hideVerified = true;
  state.search = '';
  document.getElementById('search-input').value = '';
  applyFiltersAndSearch();
  syncFilterDrawer();
}

function onSortChange(val) {
  state.sort = val;
  applyFiltersAndSearch();
  closeSortDropdown();
}

/* ---- Action Menu ---- */
function toggleActionMenu(e, id) {
  e.stopPropagation();
  var dropdown = document.getElementById('menu-' + id);
  var isOpen = dropdown.classList.contains('open');
  closeAllMenus();
  if (!isOpen) dropdown.classList.add('open');
}

function closeAllMenus() {
  document.querySelectorAll('.action-dropdown').forEach(function(el) {
    el.classList.remove('open');
  });
}

document.addEventListener('click', function() {
  closeAllMenus();
  closeSortDropdown();
  closeExportDropdown();
});

/* ---- Sort Dropdown ---- */
function toggleSortDropdown(e) {
  e.stopPropagation();
  var dd = document.getElementById('sort-dropdown');
  dd.classList.toggle('open');
}

function closeSortDropdown() {
  var dd = document.getElementById('sort-dropdown');
  if (dd) dd.classList.remove('open');
}

/* ---- Export Dropdown ---- */
function toggleExportDropdown(e) {
  e.stopPropagation();
  var dd = document.getElementById('export-dropdown');
  dd.classList.toggle('open');
}

function closeExportDropdown() {
  var dd = document.getElementById('export-dropdown');
  if (dd) dd.classList.remove('open');
}

/* ============================================================
   FILTER DRAWER
   ============================================================ */

function openFilterDrawer() {
  document.getElementById('filter-overlay').classList.add('open');
  document.getElementById('filter-drawer').classList.add('open');
  syncFilterDrawer();
}

function closeFilterDrawer() {
  document.getElementById('filter-overlay').classList.remove('open');
  document.getElementById('filter-drawer').classList.remove('open');
}

function syncFilterDrawer() {
  ['verification', 'availability', 'service', 'rating'].forEach(function(group) {
    var items = document.querySelectorAll('#filter-drawer [data-group="' + group + '"] .filter-option');
    items.forEach(function(item) {
      var val = item.getAttribute('data-value');
      if (val === state.filters[group]) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  });
}

function selectFilterOption(group, value) {
  state.filters[group] = value;
  if (group === 'verification') state.hideVerified = false;
  syncFilterDrawer();
}

function applyFilterDrawer() {
  closeFilterDrawer();
  applyFiltersAndSearch();
}

/* ============================================================
   WORKER DETAIL DRAWER
   ============================================================ */

function openDetailDrawer(id) {
  closeAllMenus();
  var w = WORKERS_DATA.find(function(x) { return x.id === id; });
  if (!w) return;

  var verifyBadge = w.verification === 'verified' ? '<span class="badge badge-verified">' + ic('check') + ' Verified</span>'
    : w.verification === 'pending' ? '<span class="badge badge-pending">' + ic('clock') + ' Pending Verification</span>'
    : '<span class="badge badge-rejected">' + ic('ban') + ' Rejected</span>';

  var availLabel = w.availability.charAt(0).toUpperCase() + w.availability.slice(1);
  var availBadge = w.availability === 'available' ? '<span class="badge badge-available">Available</span>'
    : w.availability === 'busy' ? '<span class="badge badge-busy">Busy</span>'
    : '<span class="badge badge-offline">Offline</span>';

  var ratingHtml = w.rating > 0
    ? '<div style="display:flex;align-items:center;gap:6px"><span style="color:var(--orange)">' + ic('star') + '</span><span style="font-weight:800;font-size:16px;color:var(--navy)">' + fmtRating(w.rating) + '</span><span style="color:var(--text-muted);font-size:13px">(' + w.completed + ' jobs)</span></div>'
    : '<span style="color:var(--text-muted);font-size:13px">No ratings yet</span>';

  var servicesHtml = w.services.map(function(s) {
    return '<span style="display:inline-flex;align-items:center;gap:5px;background:var(--border-light);border:1px solid var(--border);padding:5px 10px;border-radius:var(--radius-pill);font-size:12px;font-weight:600;color:var(--text-secondary)">' + s + '</span>';
  }).join(' ');

  var body = document.getElementById('detail-body');
  body.innerHTML =
    '<div class="detail-profile">' +
      '<div class="detail-avatar" style="background:' + w.color + '">' + initials(w.name) +
        (w.verification === 'verified' ? '<span class="worker-verified">' + ic('check') + '</span>' : '') +
      '</div>' +
      '<div class="detail-info">' +
        '<h2>' + w.name + '</h2>' +
        '<div class="sub">' + w.email + ' \u00B7 ' + w.phone + '</div>' +
        '<div class="detail-badges">' + verifyBadge + availBadge + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="detail-section">' +
      '<div class="detail-section-title">Rating</div>' +
      ratingHtml +
    '</div>' +
    '<div class="detail-section">' +
      '<div class="detail-section-title">Professional Information</div>' +
      '<div class="detail-grid">' +
        '<div class="detail-field"><div class="detail-field-label">Service</div><div class="detail-field-value">' + w.service + '</div></div>' +
        '<div class="detail-field"><div class="detail-field-label">Location</div><div class="detail-field-value">' + w.location + '</div></div>' +
        '<div class="detail-field"><div class="detail-field-label">Experience</div><div class="detail-field-value">' + w.experience + '</div></div>' +
        '<div class="detail-field"><div class="detail-field-label">Joined</div><div class="detail-field-value">' + w.joined + '</div></div>' +
        '<div class="detail-field"><div class="detail-field-label">Completed Jobs</div><div class="detail-field-value">' + w.completed + '</div></div>' +
        '<div class="detail-field"><div class="detail-field-label">Worker ID</div><div class="detail-field-value">' + w.id + '</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="detail-section">' +
      '<div class="detail-section-title">Services Offered</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' + servicesHtml + '</div>' +
    '</div>' +
    (w.tags.length ? '<div class="detail-section">' +
      '<div class="detail-section-title">Tags</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' + w.tags.map(function(t) {
        return '<span style="display:inline-flex;align-items:center;gap:4px;background:var(--teal-bg);border:1px solid rgba(15,118,110,.15);color:var(--teal);padding:4px 10px;border-radius:var(--radius-pill);font-size:12px;font-weight:650">' + t + '</span>';
      }).join('') + '</div></div>' : '') +
    (w.verification === 'pending' ? '<div class="detail-section">' +
      '<div class="detail-section-title">Verification Information</div>' +
      '<div style="background:var(--orange-light);border:1px solid rgba(245,158,110,.2);border-radius:var(--radius);padding:14px">' +
        '<div style="font-weight:700;font-size:13px;color:#B45309;margin-bottom:4px">Pending review</div>' +
        '<div style="font-size:13px;color:var(--text-secondary)">Submitted: ' + w.joined + '</div>' +
        '<div style="font-size:13px;color:var(--text-secondary)">Documents: 3 submitted</div>' +
        '<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="openVerifyModal(\'' + w.id + '\')">Review Verification</button>' +
      '</div></div>' : '');

  document.getElementById('detail-overlay').classList.add('open');
  document.getElementById('detail-drawer').classList.add('open');
}

function closeDetailDrawer() {
  document.getElementById('detail-overlay').classList.remove('open');
  document.getElementById('detail-drawer').classList.remove('open');
}

/* ============================================================
   ADD WORKER MODAL
   ============================================================ */

function openAddWorkerModal() {
  document.getElementById('add-worker-modal').classList.add('open');
}

function closeAddWorkerModal() {
  document.getElementById('add-worker-modal').classList.remove('open');
}

/* ============================================================
   CONFIRMATION MODALS
   ============================================================ */

function openSuspendModal(id) {
  closeAllMenus();
  var w = WORKERS_DATA.find(function(x) { return x.id === id; });
  document.getElementById('confirm-title').textContent = 'Suspend ' + w.name + '?';
  document.getElementById('confirm-body').textContent = 'This worker will no longer be able to receive jobs or interact with customers. You can reactivate their account later.';
  document.getElementById('confirm-icon-wrap').className = 'confirm-icon danger';
  document.getElementById('confirm-icon-wrap').innerHTML = ic('ban');
  document.getElementById('confirm-ok-btn').className = 'btn btn-danger';
  document.getElementById('confirm-ok-btn').textContent = 'Suspend Account';
  document.getElementById('confirm-modal').classList.add('open');
}

function openVerifyModal(id) {
  closeAllMenus();
  var w = WORKERS_DATA.find(function(x) { return x.id === id; });
  document.getElementById('confirm-title').textContent = 'Verify ' + w.name + '?';
  document.getElementById('confirm-body').textContent = 'This worker will receive a verified badge and full access to the platform. This action confirms their identity documents are valid.';
  document.getElementById('confirm-icon-wrap').className = 'confirm-icon teal';
  document.getElementById('confirm-icon-wrap').innerHTML = ic('checkCircle');
  document.getElementById('confirm-ok-btn').className = 'btn btn-primary';
  document.getElementById('confirm-ok-btn').textContent = 'Approve Verification';
  document.getElementById('confirm-modal').classList.add('open');
}

function openRejectModal(id) {
  closeAllMenus();
  var w = WORKERS_DATA.find(function(x) { return x.id === id; });
  document.getElementById('confirm-title').textContent = 'Reject ' + w.name + '?';
  document.getElementById('confirm-body').textContent = 'This worker\'s verification will be rejected. They will not be able to receive jobs until they re-submit their documents.';
  document.getElementById('confirm-icon-wrap').className = 'confirm-icon danger';
  document.getElementById('confirm-icon-wrap').innerHTML = ic('ban');
  document.getElementById('confirm-ok-btn').className = 'btn btn-danger';
  document.getElementById('confirm-ok-btn').textContent = 'Reject Verification';
  document.getElementById('confirm-modal').classList.add('open');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('open');
}

function confirmAction() {
  closeConfirmModal();
  /* In a real app this would perform the action */
  showToast('Action completed successfully');
}

/* ============================================================
   SIDEBAR TOGGLE (mobile)
   ============================================================ */

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('scrim').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('scrim').classList.remove('show');
}

/* ============================================================
   TOAST
   ============================================================ */

function showToast(msg) {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = '<div style="display:flex;align-items:center;gap:10px"><span style="color:#34D399">' + ic('checkCircle') + '</span><span style="font-weight:600;font-size:13.5px">' + msg + '</span></div>';
  toast.style.cssText = 'background:#0F1F26;color:#E8F1F4;border-radius:var(--radius);padding:12px 18px;box-shadow:var(--shadow-lg);font-size:13.5px;animation:fadeIn .25s ease;border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px;margin-bottom:8px;';
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all .3s';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

/* ============================================================
   KEYBOARD
   ============================================================ */

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeFilterDrawer();
    closeDetailDrawer();
    closeAddWorkerModal();
    closeConfirmModal();
    closeSidebar();
    closeAllMenus();
  }
});

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
  renderOverview();
  renderTable();
  renderPagination();
  renderActiveFilters();
  updateHeaderCheckbox();
});
