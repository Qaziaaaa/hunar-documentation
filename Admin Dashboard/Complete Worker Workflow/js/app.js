const $ = (sel, el = document) => el.querySelector(sel)
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel))

const fmt = (n) => n.toLocaleString('en-US')

const STATUS_MAP = {
  'offer-sent': { label: 'OFFER SENT', cls: 'badge-offer' },
  'visit-negotiation': { label: 'NEGOTIATING', cls: 'badge-offer' },
  'visit-scheduled': { label: 'SCHEDULED', cls: 'badge-scheduled' },
  'on-the-way': { label: 'EN ROUTE', cls: 'badge-scheduled' },
  'visit-in-progress': { label: 'INSPECTING', cls: 'badge-inspecting' },
  'repair-negotiating': { label: 'QUOTE SENT', cls: 'badge-offer' },
  'repair-approved': { label: 'APPROVED', cls: 'badge-approved' },
  'in-progress': { label: 'IN PROGRESS', cls: 'badge-scheduled' },
  completed: { label: 'COMPLETED', cls: 'badge-completed' },
  paid: { label: 'PAID', cls: 'badge-paid' },
  disputed: { label: 'DISPUTED', cls: 'badge-urgent' },
}

function statusBadge(status) {
  const s = STATUS_MAP[status] || { label: status.toUpperCase(), cls: 'badge-gray' }
  return `<span class="badge ${s.cls}">${s.label}</span>`
}

function urgencyBadge(urgency) {
  if (urgency !== 'urgent') return ''
  return '<span class="badge badge-urgent">URGENT</span>'
}

function categoryIcon(category) {
  const map = {
    Plumbing: '🔧', Electrician: '⚡', 'AC Repair': '❄️', Carpenter: '🪚',
    'Appliance Repair': '🛠️', Painter: '🖌️', Cleaning: '🧹', Other: '📦',
  }
  return map[category] || '🛠️'
}

function stars(rating, size = 'small') {
  let html = '<div class="stars">'
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= rating ? 'lit' : ''}" style="font-size:${size === 'lg' ? 20 : 14}px">★</span>`
  }
  return html + '</div>'
}

function avatar(initials, size = 40) {
  return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.35)}px">${initials}</div>`
}

function elIcon(name, cls = '') {
  return `<span class="${cls}" style="display:inline-flex">${window.ICONS[name]}</span>`
}

function progressDots(current, total) {
  let html = '<div class="flex gap-2 justify-center" style="padding:16px 0">'
  for (let i = 0; i < total; i++) {
    html += `<div style="width:${i === current ? 20 : 6}px;height:6px;border-radius:999px;background:${i <= current ? 'var(--primary)' : 'var(--border)'}"></div>`
  }
  return html + '</div>'
}

function chartBars(bars) {
  let html = '<div class="chart">'
  bars.forEach((h, i) => {
    html += `<div class="chart-bar ${i === bars.length - 1 ? 'hot' : ''}" style="height:${h}%"></div>`
  })
  return html + '</div>'
}

/* ─── Shared persistent state ───────────────────────────────────────────── */
const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('hunar_' + key)
      return v === null ? fallback : JSON.parse(v)
    } catch { return fallback }
  },
  set(key, value) {
    localStorage.setItem('hunar_' + key, JSON.stringify(value))
  },
}

/* ─── Bottom nav ────────────────────────────────────────────────────────── */
function renderBottomNav(active) {
  const tabs = [
    { id: 'dashboard', href: 'index.html', label: 'Home', icon: 'home' },
    { id: 'active-job', href: 'active-job.html', label: 'Jobs', icon: 'briefcase' },
    { id: 'reviews', href: 'reviews.html', label: 'Reviews', icon: 'star' },
    { id: 'earnings', href: 'earnings.html', label: 'Earnings', icon: 'wallet' },
    { id: 'profile', href: 'profile.html', label: 'Profile', icon: 'user' },
  ]
  const jobScreens = ['job-details', 'inspection', 'repair-quote', 'active-job']
  const reviewScreens = ['reviews']
  const isActive = (t) =>
    active === t.id ||
    (t.id === 'active-job' && jobScreens.includes(active)) ||
    (t.id === 'reviews' && reviewScreens.includes(active))

  const html =
    '<nav class="bottom-nav">' +
    tabs
      .map(
        (t) =>
          `<a class="nav-tab ${isActive(t) ? 'active' : ''}" href="${t.href}">${window.ICONS[t.icon]}<span>${t.label}</span></a>`
      )
      .join('') +
    '</nav>'
  const mount = $('#app-nav')
  if (mount) mount.innerHTML = html
}

/* ─── Toast ─────────────────────────────────────────────────────────────── */
function showToast(message, type = 'success') {
  const el = $('#toast')
  if (!el) return
  el.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="color:${type === 'success' ? 'var(--success)' : 'var(--error)'}">${window.ICONS[type === 'success' ? 'checkCircle' : 'alertTriangle']}</div>
      <p style="flex:1;font-size:12px;line-height:1.5;color:var(--navy)">${message}</p>
      <button onclick="this.closest('#toast').classList.add('hidden')" style="color:var(--gray)">${window.ICONS.x}</button>
    </div>`
  el.classList.remove('hidden')
}

/* ─── Shared page bootstrap ─────────────────────────────────────────────── */
function initPage(activeNav) {
  renderBottomNav(activeNav || document.body.dataset.nav || null)
}

/* Expose helpers globally for inline HTML handlers */
window.App = {
  elIcon,
  stars,
  avatar,
  statusBadge,
  urgencyBadge,
  categoryIcon,
  fmt,
  Store,
  showToast,
  chartBars,
  progressDots,
  renderBottomNav,
  initPage,
}

function boot() {
  const activeNav = document.body ? (document.body.dataset.nav || null) : null
  if (activeNav) renderBottomNav(activeNav)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot)
} else {
  boot()
}