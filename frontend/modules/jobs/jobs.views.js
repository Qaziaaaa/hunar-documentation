import { ic } from '../../shared/icons/icons.js';
import { UI, esc, fmtRs, timeAgo } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';
import { SERVICES, SKILL_ALL, svcByName } from '../services/services.data.js';
import { AREAS, TIME_SLOTS, randDist } from '../locations/locations.data.js';
import {
  extraWorkCard,
  extraBillingRows,
  proofSectionHtml,
  approvedCard,
  jobCompleteCard,
  paidCard,
  reviewedCard,
  cancelledCard
} from '../repairs/repairs.views.js';
import { visitConfirmedCard, inspectionCard } from '../visits/visits.views.js';
import { offerBreakdownHtml, offerStatus } from '../offers/offers.views.js';
import { applyWorkerJobsFilter } from './jobs.actions.js';

export function bookingItemRow(icon, done, lbl, amt, st) {
  const badge = st === 'declined'
    ? '<span class="badge b-danger">' + ic('x', { s: 11 }) + ' Declined</span>'
    : done
      ? '<span class="badge b-ok">' + ic('checkC', { s: 11 }) + ' Approved</span>'
      : (amt ? '<span class="badge b-amber">' + ic('clock', { s: 11 }) + ' Pending</span>' : '<span class="badge b-white">Pending quote</span>');
  return '<div style="display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:10px 12px">' +
    '<span class="svc-icon" style="flex:none;width:32px;height:32px;border-radius:9px;background:var(--brand-3);color:var(--brand)">' + ic(icon, { s: 15 }) + '</span>' +
    '<div style="flex:1;min-width:0;font-weight:650;font-size:13.5px">' + lbl + '</div>' +
    (amt ? '<b style="font-size:13.5px">' + fmtRs(amt) + '</b>' : '<span class="smallnote">—</span>') +
    badge + '</div>';
}

export function bookingItemsCard(j) {
  const extras = j.extras || [];
  const mainTotal = (j.visitCharge || 0) + (j.repair ? j.repair.approvedEstimate || 0 : 0);
  const mainApproved = j.visitCharge && j.repair && j.repair.status === 'approved';
  let rows = '';
  if (mainTotal) {
    rows += bookingItemRow(svcByName(j.category).icon, !!mainApproved, esc(j.title), mainTotal, 'repair');
  }
  extras.forEach(function (x) {
    if (x.state === 'declined') rows += bookingItemRow('toolbox', false, esc(x.title), 0, 'declined');
    else rows += bookingItemRow('toolbox', x.state === 'approved', esc(x.title), x.quote || 0, x.state);
  });
  if (!rows) return '';
  return '<div class="card"><div class="card-h"><div><h3>Booking Items</h3><p>' + j.id + ' · one quote &amp; approval per item</p></div></div>' +
    '<div class="card-pad"><div class="stack" style="gap:8px">' + rows +
    '<div class="total-bar" style="margin-top:4px"><span>Booking total</span><span class="v">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
    '</div></div></div>';
}

export function jobCardWorker(j) {
  const cust = Store.userById(j.customerId);
  const u = Store.currentUser();
  const dist = (j.distance && u && j.distance[u.id]) ? j.distance[u.id] : null;
  return '<div class="job-card" style="cursor:pointer" onclick="go(\'/worker/jobs/' + j.id + '\')"><div class="jc-body">' +
    '<div class="jc-top">' + ic(svcByName(j.category).icon, { s: 17, style: 'color:' + svcByName(j.category).css }) + '<b style="flex:1;font-size:15px">' + esc(j.title) + '</b>' + (dist ? '<span class="badge b-white">' + ic('navigation', { s: 12 }) + ' ' + dist.toFixed(1) + ' km</span>' : '') + '</div>' +
    '<div class="jc-desc">' + esc(j.description || '') + '</div>' +
    UI.mediaRow(j) +
    UI.jobMetaRow(j, { dist: dist ? { km: dist.toFixed(1) } : null }) +
    '<div style="display:flex;gap:8px;margin-top:10px"><span class="smallnote" style="flex:1;align-self:center">' + esc(cust ? cust.name.slice(0, 1) + '…' : 'Customer') + ' · ' + timeAgo(j.createdAt) + '</span>' +
    ((u && j.offers && j.offers.some(function (o) { return o.workerId === u.id; }))
      ? '<button class="btn btn-soft btn-sm" onclick="go(\'/worker/offers/' + j.id + '\')">' + ic('eye', { s: 14 }) + ' View My Offer</button>'
      : '<button class="btn btn-primary btn-sm" onclick="go(\'/worker/jobs/' + j.id + '\')">' + ic('send', { s: 14 }) + ' Send Offer</button>') +
    '</div></div></div>';
}

if (typeof window !== 'undefined') {
  window.jobCardWorker = jobCardWorker;
}

export function renderCustomerDashboardView() {
  const u = Store.currentUser();
  const active = Store.activeJobs('customer');
  const visits = Store.upcomingVisits('customer');
  const pend = Store.pendingOffersCount();
  const spent = Store.totalSpent();
  const recent = Store.historyJobs('customer').slice(0, 3);

  const statRow =
    '<div class="stats">' +
    '<div class="stat"><span class="si si-t">' + ic('briefcase', { s: 22 }) + '</span><div><div class="sv">' + active.length + '</div><div class="sl">Active jobs</div></div></div>' +
    '<div class="stat"><span class="si si-a">' + ic('chat', { s: 22 }) + '</span><div><div class="sv">' + pend + '</div><div class="sl">Pending offers</div></div></div>' +
    '<div class="stat"><span class="si si-o">' + ic('calendar', { s: 22 }) + '</span><div><div class="sv">' + visits.length + '</div><div class="sl">Upcoming visits</div></div></div>' +
    '<div class="stat"><span class="si si-g">' + ic('wallet', { s: 22 }) + '</span><div><div class="sv">Rs. ' + spent.toLocaleString('en-PK') + '</div><div class="sl">Total spent</div></div></div></div>';

  const activeHtml = active.length ? active.map(function (j) {
    const w = j.workerId ? Store.userById(j.workerId) : null;
    return '<div class="job-card" onclick="go(\'/customer/jobs/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top">' + ic(svcByName(j.category).icon, { s: 18, style: 'color:' + svcByName(j.category).css }) + '<b style="font-size:15px;flex:1">' + esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      UI.jobMetaRow(j) +
      '<div class="jc-desc" style="margin-top:8px">' + esc(j.description || '') + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center"><span class="smallnote">' + j.id + ' · ' + timeAgo(j.createdAt) + '</span>' +
      (w ? '<span style="margin-left:auto;display:inline-flex;gap:6px;align-items:center"><span class="smallnote">Worker:</span>' + UI.avatar(w, '', {}) + '<span style="font-weight:700;font-size:13px">' + esc(w.name) + '</span></span>' : '') + '</div></div></div>';
  }).join('') : UI.empty('briefcase', 'No active jobs yet', 'Post your first job and nearby professionals will send you offers within minutes.', '<a class="btn btn-primary" href="#/customer/post">' + ic('plus', { s: 16 }) + ' Post Your First Job</a>');

  const visitsHtml = visits.length ? visits.map(function (v) {
    const w = Store.userById(v.workerId);
    return '<div class="job-card" style="cursor:pointer" onclick="go(\'/customer/jobs/' + v.id + '\')"><div class="jc-body">' +
      '<div style="display:flex;gap:12px;align-items:center">' + (w ? UI.avatar(w) : UI.avatar({ name: '?', color: '#64748b', verified: false })) +
      '<div style="min-width:0;flex:1"><b style="font-size:14.5px">' + esc(v.title) + '</b><div class="smallnote">' + (w ? w.name : '') + ' · ' + (v.prefDate || '') + ' · ' + (v.prefTime || '') + '</div></div>' +
      UI.statusBadge(v.status) + '</div>' +
      (v.visitCharge ? '<div class="total-bar" style="margin-top:12px"><span>Visit charge</span><span class="v">' + fmtRs(v.visitCharge) + '</span></div>' : '') +
      '</div></div>';
  }).join('') : UI.empty('calendar', 'No upcoming visits', 'Your confirmed appointments will appear here.', '');

  const recentHtml = recent.length ? recent.map(function (j) {
    const total = j.payment ? j.payment.amount : Store.jobTotal(j.id);
    return '<div class="job-card" style="cursor:pointer" onclick="go(\'/customer/jobs/' + j.id + '\')"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1;font-size:14.5px">' + esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      '<div style="display:flex;gap:10px;align-items:center"><span class="smallnote">' + timeAgo(j.createdAt) + '</span>' +
      (j.review ? '<span class="badge b-brand">' + ic('star', { s: 12 }) + ' ' + j.review.rating + '.0 rated</span>' : '') +
      (total ? '<span class="smallnote" style="margin-left:auto">Paid ' + fmtRs(total) + '</span>' : '') + '</div></div></div>';
  }).join('') : '<p class="smallnote" style="padding:8px 4px">Completed services will show up here.</p>';

  const html =
    '<button class="btn btn-primary btn-lg" style="max-width:280px;width:100%;margin-bottom:20px" onclick="go(\'/customer/post\')">' + ic('plus', { s: 18 }) + ' Post a Job</button>' +
    statRow +
    '<div class="grid-2col" style="margin-top:20px">' +
    '<div class="stack"><div class="card card-h"><div><h3>Active Jobs</h3><p>Track every stage of your repairs</p></div><a class="btn btn-outline btn-sm" href="#/customer/jobs">View all</a></div>' + activeHtml + '</div>' +
    '<div class="stack"><div class="card card-h"><h3>Upcoming Visits</h3></div>' + visitsHtml +
    '<div class="card card-h"><h3>Recent Jobs</h3></div>' + recentHtml + '</div></div>';

  return { html: html };
}

export function renderCustomerMyJobsView() {
  const u = Store.currentUser();
  const all = Store.state().jobs.filter(function (j) { return j.customerId === u.id; });
  const grouped = [];
  const ordered = ['receiving_offers', 'offers_received', 'visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress', 'completed', 'paid', 'reviewed', 'cancelled'];
  ordered.forEach(function (st) {
    all.filter(function (j) { return j.status === st; }).forEach(function (j) { grouped.push(j); });
  });
  const html = grouped.length ? '<div class="stack">' + grouped.map(function (j) {
    const w = j.workerId ? Store.userById(j.workerId) : null;
    return '<div class="job-card" onclick="go(\'/customer/jobs/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      UI.jobMetaRow(j) +
      '<div style="display:flex;gap:8px;align-items:center;margin-top:8px"><span class="smallnote">' + j.id + ' · ' + timeAgo(j.createdAt) + '</span>' +
      (w ? '<span style="margin-left:auto;display:inline-flex;gap:6px;align-items:center"><span class="smallnote">Worker:</span>' + UI.avatar(w, '', {}) + '<span style="font-weight:700;font-size:13px">' + esc(w.name) + '</span></span>' : '') +
      (j.payment ? '<span class="badge b-ok" style="margin-left:auto">' + ic('wallet', { s: 12 }) + ' ' + fmtRs(j.payment.amount) + '</span>' : '') + '</div></div></div>';
  }).join('') + '</div>' : UI.empty('list', 'No jobs yet', 'Post your first job and nearby professionals will send offers.', '<a class="btn btn-primary" href="#/customer/post">' + ic('plus', { s: 16 }) + ' Post Your First Job</a>');
  return { html: html };
}

export function renderWizardView() {
  let d = Store.draft();
  if (!d) {
    const u = Store.currentUser();
    Store.setDraft({ step: 1, customerId: u ? u.id : '', category: '', title: '', description: '', images: [], audio: null, location: null, coords: { x: 52, y: 58 }, area: '', prefDate: null, prefTime: null, flexible: false });
    d = Store.draft();
  }
  const st = d.step;
  const steps = ['Service', 'Problem & Media', 'Location', 'Visit', 'Review'];
  const stepper = '<div class="stepper">' + steps.map(function (s, i) {
    const n = i + 1;
    const cls = n < st ? 'done' : n === st ? 'active' : '';
    return '<div class="stp ' + cls + '"><span class="tick">' + (n < st ? ic('check', { s: 15 }) : n) + '</span><span class="sl">' + s + '</span></div>';
  }).join('') + '</div>';

  const svcStep = '<div class="wiz-svc-step">' + SERVICES.map(function (s) {
    return '<button class="svc-card" style="' + (d.category === s.name ? 'border-color:var(--brand);background:var(--brand-3);box-shadow:0 0 0 3px rgba(15,139,141,.15)' : '') + '" onclick="A.wiz.pickService(\'' + s.name + '\')"><span class="svc-icon" style="background:' + s.bg + ';color:' + s.css + '">' + ic(s.icon, { s: 22 }) + '</span><span><h4>' + s.name + '</h4><p>' + s.desc + '</p></span></button>';
  }).join('') + '</div>';

  function voicePreviewHtml(a) {
    return '<div class="rec-box"><div class="wave-box">' +
      '<button class="btn btn-soft btn-sm" onclick="A.audioPlay(\'rec-prev\')">' + ic('play', { s: 13 }) + '</button>' +
      '<div style="flex:1"><audio id="rec-prev" src="' + a.uri + '" preload="metadata"></audio><div class="smallnote">Voice description · ' + a.duration + 's</div></div></div>' +
      '<button class="btn btn-outline btn-sm" onclick="A.wiz.rec()">' + ic('refresh', { s: 13 }) + ' Re-record</button>' +
      '<button class="btn btn-danger btn-sm" onclick="A.wiz.delAudio()">' + ic('trash', { s: 13 }) + '</button></div>';
  }

  const problemStep = '<div class="field"><label>Problem title <span class="req">*</span></label>' +
    '<input class="input" placeholder="e.g. AC is running but not cooling" value="' + esc(d.title) + '" oninput="A.wiz.set(\'title\', this.value)" />' +
    '<div class="fhint">Short &amp; specific — professionals scan titles first.</div></div>' +
    '<div class="field"><label>Detailed description</label>' +
    '<textarea class="textarea" placeholder="Add details: when it started, sounds, what you have already tried…" oninput="A.wiz.set(\'description\', this.value)">' + esc(d.description) + '</textarea></div>' +
    '<div class="divide"></div>' +
    '<div style="display:flex;gap:14px;align-items:stretch;flex-wrap:wrap">' +
    '<label class="upload-zone" style="display:block;flex:1;min-width:200px;padding:18px"><div style="display:flex;flex-direction:column;align-items:center;gap:6px">' + ic('camera', { s: 22 }) + '<b>Add photos</b><span style="font-size:12px">Capture or upload images (JPG, PNG)</span></div>' +
    '<input type="file" accept="image/*" multiple style="display:none" onchange="A.wiz.addImages(this.files)" /></label>' +
    '<div style="flex:1;min-width:200px;display:flex;flex-direction:column;justify-content:center"><label style="font-weight:650;font-size:13px;color:var(--ink-2)">Voice description</label>' +
    (d.audio
      ? voicePreviewHtml(d.audio)
      : '<div class="drop-pill" style="margin-top:8px" onclick="A.wiz.rec()">' + ic('mic', { s: 15 }) + ' Record Voice</div>') + '</div>' +
    '</div>' +
    (d.images.length ? '<div class="grid-3" style="margin-top:12px">' + d.images.map(function (im, i) {
      return '<div class="img-thumb"><img src="' + im + '" /><button class="img-del" onclick="A.wiz.delImage(' + i + ')">' + ic('trash', { s: 13 }) + '</button></div>';
    }).join('') + (d.images.length < 6 ? '<label class="img-add"><input type="file" accept="image/*" style="display:none" onchange="A.wiz.addImages(this.files)" />' + ic('plus') + '<span>Add more</span></label>' : '') + '</div>' : '') +
    (d.images.length ? '<div class="fhint" style="margin-top:8px">' + d.images.length + ' photo' + (d.images.length > 1 ? 's' : '') + ' added' + '</div>' : '');

  const mapStep = '<div class="field"><label>Select your area <span class="req">*</span></label>' +
    '<select class="select" id="wiz-area" onchange="A.wiz.set(\'area\', this.value)">' +
    '<option value="">Choose area…</option>' + AREAS.map(function (a) { return '<option' + (d.area === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Pin your exact location</label>' +
    '<div class="map-wrap" onclick="A.wiz.mapClick(event)">' +
    '<svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 100 60" preserveAspectRatio="none">' +
    '<path d="M0 18 C 20 10, 40 26, 60 16 S 95 8, 100 14" stroke="#d7e0e6" stroke-width="1" fill="none"/><path d="M0 42 C 25 50, 50 34, 80 46 S 95 44, 100 46" stroke="#d7e0e6" stroke-width="1" fill="none"/><path d="M22 0 C 18 20, 30 40, 24 60" stroke="#d7e0e6" stroke-width="1" fill="none"/><path d="M70 0 C 74 16, 62 30, 72 60" stroke="#d7e0e6" stroke-width="1" fill="none"/></svg>' +
    '<div class="map-ring" style="left:' + (d.coords.x || 50) + '%;top:' + (d.coords.y || 55) + '%"><div class="mpt"></div></div>' +
    '<div class="map-loc">' + ic('pin', { s: 14 }) + (d.area || 'Tap the map to drop a pin') + '</div></div></div>' +
    '<div class="split"><button class="btn btn-outline" onclick="A.wiz.useLocation()">' + ic('navigation', { s: 15 }) + ' Detect my location</button>' +
    '<span class="smallnote" style="align-self:center">We only show your area, never your full address.</span></div>';

  function nextDaysHtml(sel) {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(Date.now() + i * 86400000);
      const iso = dt.toISOString().slice(0, 10);
      const lbl = i === 0 ? 'Today' : i === 1 ? 'Tomrw' : dt.toLocaleDateString('en-GB', { weekday: 'short' });
      const on = sel === iso ? ' on' : '';
      out.push('<button class="date-pill' + on + '" onclick="A.pickDate(\'' + iso + '\')"><div class="d">' + lbl + '</div><div class="n">' + dt.getDate() + '</div><div class="m">' + dt.toLocaleDateString('en-GB', { month: 'short' }) + '</div></button>');
    }
    return out.join('');
  }

  const visitStep =
    '<div class="field"><label>Preferred date <span class="req">*</span></label><div class="date-row">' + nextDaysHtml(d.prefDate) + '</div></div>' +
    '<div class="field"><label>Preferred time</label><div class="time-row" id="time-row">' + TIME_SLOTS.map(function (t, tix) {
      const off = tix === 1 || tix === 5 ? ' off' : '';
      const on = d.prefTime === t ? ' on' : '';
      return '<button class="time-pill' + off + on + '"' + (off ? ' disabled' : '') + ' onclick="A.pickTime(\'' + t + '\')">' + t + '</button>';
    }).join('') + '</div></div>' +
    '<label style="display:flex;gap:10px;align-items:center;font-weight:600;font-size:14px;cursor:pointer;margin-top:6px">' +
    '<input type="checkbox" style="width:17px;height:17px;accent-color:var(--brand)" ' + (d.flexible ? 'checked' : '') + ' onchange="A.toggleFlex()" /> I’m flexible with timing</label>' +
    (d.flexible ? '<div class="fhint">The worker can pick a time that suits both of you.</div>' : '');

  const reviewRows = [
    ['Category', d.category ? '<span class="badge b-brand">' + ic((svcByName(d.category) || {}).icon || 'wrench', { s: 13 }) + ' ' + d.category + '</span>' : '—'],
    ['Problem', d.title || '—'],
    ['Description', d.description || '—'],
    ['Photos', d.images.length ? d.images.length + ' image(s)' : 'None'],
    ['Voice', d.audio ? 'Voice note (' + d.audio.duration + 's)' : 'None'],
    ['Location', d.area || '—'],
    ['Visit window', (d.flexible ? 'Flexible' : (d.prefDate || '') + ' · ' + (d.prefTime || ''))]
  ].map(function (r, i) {
    return '<div class="rv-item"><span class="rk">' + ic(['target', 'chat', 'pen', 'camera', 'mic', 'pin', 'clock'][i], { s: 16 }) + '</span><div><div class="rv-l">' + r[0] + '</div><div class="rv-v">' + r[1] + '</div></div></div>';
  }).join('');

  const reviewStep = '<div class="review-grid">' + reviewRows + '</div>' +
    (d.images.length ? '<div class="jc-imgs" style="margin-top:12px">' + d.images.slice(0, 4).map(function (x) { return '<img class="thumb" src="' + x + '" />'; }).join('') + '</div>' : '') +
    (d.audio ? '<div style="margin-top:12px">' + voicePreviewHtml(d.audio) + '</div>' : '');

  const contentHtml = st === 1 ? svcStep : st === 2 ? problemStep : st === 3 ? mapStep : st === 4 ? visitStep : reviewStep;

  const navHtml = '<div class="wiz-nav">' +
    (st > 1 ? '<button class="btn btn-outline" onclick="A.wiz.prev()">' + ic('arrowL', { s: 15 }) + ' Back</button>' : '<span></span>') +
    (st < 5 ? '<button class="btn btn-primary" onclick="A.wiz.next()">Continue ' + ic('arrowR', { s: 15 }) + '</button>' :
      '<button class="btn btn-primary btn-lg" onclick="A.wiz.submit()">' + ic('send', { s: 16 }) + ' Post Job</button>') + '</div>';

  const html = '<div class="card wiz-card"><div class="card-pad"><div class="wiz-wrap">' + stepper + '<div class="wiz-main"><div id="wiz-body">' + contentHtml + '</div>' + navHtml + '</div></div></div></div>';

  return {
    html: html,
    mount: function () {
      const area = document.getElementById('wiz-area');
      if (area) area.value = (Store.draft() && Store.draft().area) || '';
    }
  };
}

export function renderCustomerJobDetailView(params) {
  const j = Store.jobById(params.id);
  const u = Store.currentUser();
  if (!j || !u || j.customerId !== u.id) {
    return { html: UI.empty('alert', 'Job not found', 'This job may have been removed.') + '<a class="btn btn-primary" href="#/customer">Back to dashboard</a>' };
  }
  const sec = params.section || '';
  const w = j.workerId ? Store.userById(j.workerId) : null;
  const svcI = svcByName(j.category);

  let panel = '';
  if (j.status === 'receiving_offers' || j.status === 'offers_received') {
    if (j.offers && j.offers.length) {
      panel = '<div class="card"><div class="card-h"><div><h3>Worker Offers</h3><p>' + j.offers.length + ' professionals are interested · tap View Profile to compare</p></div>' + UI.statusBadge(j.status) + '</div>' +
        '<div class="offer-workers" style="padding:16px">' + j.offers.map(function (o) {
          const ow = Store.userById(o.workerId);
          return '<div class="ow-card"><div class="wk-head">' + UI.avatar(ow) + '<div style="min-width:0"><div class="wk-name">' + esc(ow ? ow.name : 'Worker') + ((ow && ow.verified) ? ' ' + ic('shield', { s: 13, style: 'color:var(--brand)' }) : '') + '</div><div class="wk-role">' + esc((ow && ow.tagline) || '') + '</div></div></div>' +
            '<div>' + UI.rating(ow ? ow.rating : 5, ow ? ow.ratingCount : 1) + '</div>' +
            '<div class="wk-meta"><span>' + ic('briefcase', { s: 13 }) + ' ' + ((ow && ow.jobsDone) || 0) + ' jobs</span><span>' + ic('pin', { s: 13 }) + ' ' + esc((ow && ow.area) || '') + '</span></div>' +
            offerBreakdownHtml(o) +
            '<div style="display:flex;gap:8px;margin-top:14px">' +
            '<button class="btn btn-outline btn-sm" style="flex:1" data-open-worker="' + (ow ? ow.id : '') + '">' + ic('eye', { s: 14 }) + ' View Profile</button>' +
            '<button class="btn btn-primary btn-sm" style="flex:1" onclick="A.selectWorker(\'' + j.id + '\',\'' + o.id + '\')">Select Worker</button></div></div>';
        }).join('') + '</div></div>';
    } else {
      panel = '<div class="card card-pad"><div style="display:flex;gap:14px;align-items:center">' + ic('clock', { s: 28, style: 'color:var(--amber)' }) + '<div><b style="font-size:15.5px">Receiving offers…</b><p style="color:var(--muted);font-size:13px;margin-top:4px">Professionals have been notified. When a worker sends a visit offer it appears here instantly. Try a worker demo account to send one.</p></div><div class="spin" style="margin-left:auto;width:22px;height:22px"></div></div></div>';
    }
  } else if (j.status === 'visit_confirmed' || j.status === 'on_the_way' || j.status === 'arrived' || j.status === 'inspection') {
    panel = visitConfirmedCard(j);
  } else if (j.status === 'repair_negotiation' || j.status === 'repair_agreed') {
    panel = inspectionCard(j);
  } else if (j.status === 'repair_approved' || j.status === 'repair_in_progress') {
    panel = approvedCard(j);
  } else if (j.status === 'completed') {
    panel = jobCompleteCard(j);
  } else if (j.status === 'paid') {
    panel = paidCard(j);
  } else if (j.status === 'reviewed') {
    panel = reviewedCard(j);
  } else if (j.status === 'cancelled') {
    panel = cancelledCard(j);
  }

  const detailCard = '<div class="card"><div class="card-h"><h3>Job Details</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
    '<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><span class="svc-icon" style="background:' + svcI.bg + ';color:' + svcI.css + '">' + ic(svcI.icon, { s: 20 }) + '</span><div><div style="font-weight:750;font-size:16px">' + esc(j.title) + '</div><div class="smallnote">' + svcI.name + ' · Posted ' + timeAgo(j.createdAt) + '</div></div></div>' +
    '<p style="font-size:14px;color:var(--ink-2);margin-bottom:12px">' + esc(j.description || 'No additional description.') + '</p>' +
    UI.mediaRow(j) +
    '<div class="kv"><span class="k">Location</span><span class="v">' + esc((j.location && j.location.area) || '—') + '</span></div>' +
    '<div class="kv"><span class="k">Preferred visit</span><span class="v">' + esc(j.prefDate || 'Flexible') + (j.prefTime !== 'Flexible' ? ' · ' + esc(j.prefTime) : '') + '</span></div>' +
    '<div class="kv"><span class="k">Job ID</span><span class="v">' + j.id + '</span></div>' +
    (w ? '<div class="kv" style="border-bottom:none"><span class="k">Selected worker</span><span class="v" style="display:inline-flex;gap:6px;align-items:center">' + UI.avatar(w, '', {}) + ' ' + esc(w.name) + '</span></div>' : '') + '</div></div>';

  const repairEst = j.repair ? j.repair.approvedEstimate : 0;
  const costCard = (j.visitCharge || repairEst) ? '<div class="card"><div class="card-h"><h3>Cost Summary</h3></div><div class="card-pad">' +
    (j.visitCharge ? '<div class="kv"><span class="k">Visit &amp; Diagnosis</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' : '') +
    (repairEst ? '<div class="kv"><span class="k">Final Repair</span><span class="v">' + fmtRs(repairEst) + '</span></div>' : '') +
    extraBillingRows(j) +
    ((j.visitCharge || repairEst) ? '<div class="kv" style="border-bottom:none"><span class="k" style="font-weight:800">Total</span><span class="v" style="font-size:18px;color:var(--brand);font-weight:800">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' : '') + '</div></div>' : '';

  const timelineCard = '<div class="card"><div class="card-h"><h3>Job Timeline</h3></div><div class="card-pad">' + UI.jobTimeline(j) + '</div></div>';

  const html = '<div class="grid-2col"><div class="main-col stack">' +
    (j.cancelled ? '<div class="err-banner">' + ic('alert') + '<span>This job was cancelled — ' + esc((j.cancelled && j.cancelled.reason) || '') + '</span></div>' : '') +
    (sec === 'repair' ? '<div class="notice brand">' + ic('wrench') + '<span>Repair price negotiation — agree before approving any work.</span></div>' : '') +
    panel +
    extraWorkCard(j, 'customer') +
    detailCard + '</div>' +
    '<div class="stack">' + timelineCard + bookingItemsCard(j) + costCard + '</div></div>';

  return {
    html: html,
    mount: function () {
      if (sec === 'offers') { Store.markOffersViewed(j.id); }
      document.querySelectorAll('[data-open-worker]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const wid = this.getAttribute('data-open-worker');
          if (window.workerProfileModal) window.workerProfileModal(wid);
        });
      });
    }
  };
}

export function renderWorkerDashboardView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  if (u.onboarding) {
    if (window.go) window.go('/worker/onboarding');
    return { html: '' };
  }
  const nearby = Store.nearbyJobs();
  const active = Store.activeJobs('worker');
  const visits = Store.upcomingVisits('worker');
  const earn = Store.earnings();

  const stats = '<div class="stats">' +
    '<div class="stat"><span class="si si-t">' + ic('map', { s: 22 }) + '</span><div><div class="sv">' + nearby.length + '</div><div class="sl">Nearby jobs</div></div></div>' +
    '<div class="stat"><span class="si si-o">' + ic('briefcase', { s: 22 }) + '</span><div><div class="sv">' + active.length + '</div><div class="sl">Active jobs</div></div></div>' +
    '<div class="stat"><span class="si si-a">' + ic('calendar', { s: 22 }) + '</span><div><div class="sv">' + visits.length + '</div><div class="sl">Upcoming visits</div></div></div>' +
    '<div class="stat"><span class="si si-g">' + ic('wallet', { s: 22 }) + '</span><div><div class="sv">Rs. ' + earn.total.toLocaleString('en-PK') + '</div><div class="sl">Total earnings</div></div></div></div>';

  const nearbyHtml = nearby.length ? nearby.slice(0, 3).map(jobCardWorker).join('') : UI.empty('map', 'No jobs found near you', 'Open jobs near you will appear here. Try browsing all nearby jobs or widening your distance.', '');

  const activeHtml = active.length ? active.map(function (j) {
    return '<div class="job-card" style="cursor:pointer" onclick="go(\'/worker/active/' + j.id + '\')"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      UI.jobMetaRow(j) +
      (j.visitCharge ? '<div class="total-bar" style="margin-top:8px"><span>Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' : '') +
      '<div style="margin-top:10px"><button class="btn btn-outline btn-sm" onclick="go(\'/worker/active/' + j.id + '\')">Open Active Job</button></div></div></div>';
  }).join('') : '<p class="smallnote" style="padding:8px 4px">When a customer selects you, the job moves here to be driven through inspection &amp; repair.</p>';

  const html = stats +
    '<div class="grid-2col" style="margin-top:20px">' +
    '<div class="stack"><div class="card card-h"><div><h3>Nearby Jobs</h3><p>New requests from customers near you</p></div><a class="btn btn-outline btn-sm" href="#/worker/jobs">Browse all</a></div>' + nearbyHtml + '</div>' +
    '<div class="stack"><div class="card card-h"><h3>Active Jobs</h3></div>' + activeHtml +
    '<div class="card card-h"><h3>Quick stats</h3></div>' +
    '<div class="card card-pad"><div class="kv"><span class="k">Completed jobs</span><span class="v">' + (u.jobsDone || 0) + '</span></div>' +
    '<div class="kv"><span class="k">Rating</span><span class="v">' + UI.rating(u.rating, u.ratingCount) + '</span></div>' +
    '<div class="kv" style="border-bottom:none"><span class="k">Avg response</span><span class="v">~20 min</span></div></div></div></div>';

  return { html: html };
}

export function renderWorkerJobsView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  if (u.onboarding) {
    if (window.go) window.go('/worker/onboarding');
    return { html: '' };
  }
  const all = Store.nearbyJobs();
  const html =
    '<div class="card card-pad" style="margin-bottom:18px">' +
    '<div class="split" style="align-items:end;gap:12px">' +
    '<div class="field" style="margin:0;min-width:170px"><label>Category</label><select id="wflt-cat" class="select"><option value="">All</option>' + SKILL_ALL.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
    '<div class="field" style="margin:0;min-width:150px;flex:1"><label>Max distance: <span id="wflt-dl">15 km</span></label><input type="range" id="wflt-d" min="1" max="20" value="15" step="1" style="width:100%;accent-color:var(--brand)" /></div>' +
    '<button class="btn btn-primary" onclick="A.wfilter()">' + ic('search', { s: 15 }) + ' Apply</button></div></div>' +
    '<div class="section-sub" id="nf-count" style="margin-bottom:16px"></div>' +
    '<div id="nf-grid" class="stack" style="gap:14px">' + all.map(jobCardWorker).join('') + '</div>';

  return {
    html: html,
    mount: function () {
      const d = document.getElementById('wflt-d');
      if (d) d.addEventListener('input', function () { document.getElementById('wflt-dl').textContent = this.value + ' km'; });
      applyWorkerJobsFilter(all);
    }
  };
}

export function renderWorkerJobDetailView(params) {
  const j = Store.jobById(params.id);
  const u = Store.currentUser();
  if (!j || !u) return { html: UI.empty('alert', 'Job not found', '') + '<a class="btn btn-primary" href="#/worker">Back</a>' };
  const myOffer = j.offers ? j.offers.find(function (o) { return o.workerId === u.id; }) : null;
  if (myOffer && j.selectedOffer && j.selectedOffer.workerId === u.id) {
    if (['visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress', 'completed'].indexOf(j.status) !== -1) {
      if (window.go) window.go('/worker/active/' + j.id);
      return { html: '' };
    }
  }
  const cust = Store.userById(j.customerId);
  const dist = (j.distance && j.distance[u.id]) || randDist(j.id + u.id, u.radius || 10);

  const requestCard = '<div class="card"><div class="card-h"><h3>Customer Request</h3>' + ((j.offers && j.offers.some(function (o) { return o.workerId === u.id; })) ? '<span class="badge b-ok">' + ic('check', { s: 12 }) + ' Offer sent</span>' : '') + '</div><div class="card-pad">' +
    '<div style="display:flex;gap:10px;align-items:center;margin-bottom:12px"><span class="svc-icon" style="background:' + svcByName(j.category).bg + ';color:' + svcByName(j.category).css + '">' + ic(svcByName(j.category).icon, { s: 18 }) + '</span><div><b style="font-size:15.5px">' + esc(j.title) + '</b><div class="smallnote">' + j.category + ' · Posted ' + timeAgo(j.createdAt) + ' · ' + j.id + '</div></div></div>' +
    '<p style="font-size:14px;color:var(--ink-2);margin-bottom:12px">' + esc(j.description || 'No additional description provided.') + '</p>' +
    UI.mediaRow(j) + '</div></div>';

  const infoCard = '<div class="card"><div class="card-h"><h3>Job Details</h3></div><div class="card-pad">' +
    '<div class="kv"><span class="k">Customer</span><span class="v">' + esc(cust ? cust.name : 'Customer') + '</span></div>' +
    '<div class="kv"><span class="k">Location</span><span class="v">' + esc((j.location && j.location.area) || '—') + '</span></div>' +
    '<div class="kv"><span class="k">Distance from you</span><span class="v">' + dist.toFixed(1) + ' km</span></div>' +
    '<div class="kv"><span class="k">Preferred visit</span><span class="v">' + esc(j.prefDate || 'Flexible') + (j.prefTime && j.prefTime !== 'Flexible' ? ' · ' + esc(j.prefTime) : '') + '</span></div>' +
    '<div class="kv" style="border-bottom:none"><span class="k">Posted</span><span class="v">' + timeAgo(j.createdAt) + '</span></div></div></div>';

  let offerPanel = '';
  if (myOffer) {
    const st = offerStatus(j, myOffer);
    offerPanel = '<div class="card"><div class="card-h"><div><h3>My Estimated Offer</h3><p>The customer has been notified</p></div>' + st.badge + '</div><div class="card-pad">' +
      offerBreakdownHtml(myOffer) +
      '<div class="kv" style="border-bottom:none"><span class="k">Status</span><span class="v">' + st.label + '</span></div>' +
      '<a class="btn btn-outline btn-sm" style="margin-top:12px" href="#/worker/offers/' + j.id + '">' + ic('eye', { s: 14 }) + ' Track my offer status</a></div></div>';
  } else if (j.selectedOffer && j.selectedOffer.workerId !== u.id) {
    offerPanel = '<div class="notice amber">' + ic('info') + '<span>A worker has already been selected for this job. It may be removed from nearby jobs at any time.</span></div>';
  } else {
    offerPanel = '<div class="card"><div class="card-h"><h3>Send Estimated Offer</h3></div><div class="card-pad">' +
      '<label style="font-weight:650;font-size:13px;color:var(--ink-2)">Visit &amp; Diagnosis (Rs.)</label>' +
      '<input type="number" id="of-amount" class="input" placeholder="e.g. 300" min="50" value="' + (u.visitCharge || 300) + '" style="margin-top:8px" />' +
      '<label style="font-weight:650;font-size:13px;color:var(--ink-2);display:block;margin-top:10px">Estimated Repair (Rs.)</label>' +
      '<input type="number" id="of-estimate" class="input" placeholder="e.g. 1200" min="50" style="margin-top:8px" />' +
      '<div class="total-bar" style="margin-top:12px"><span>Estimated Total</span><span class="v" id="of-total">Rs. 0</span></div>' +
      '<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="A.workerSendOffer(\'' + j.id + '\')">' + ic('send', { s: 15 }) + ' Submit Offer</button>' +
      '<div class="fhint">The visit &amp; diagnosis charge covers travel and the on-site inspection. The estimated repair is your best guess — the final quote is given after you inspect the problem.</div></div></div>';
  }

  return {
    html: '<div class="grid-2col"><div class="main-col stack">' + requestCard + offerPanel + '</div><div class="stack">' + infoCard + '<div class="card card-pad"><b>Tip</b><p style="font-size:13px;color:var(--muted);margin-top:4px">Send a competitive visit charge to win the job — customers compare all offers before choosing.</p></div></div></div>',
    mount: function () {
      const amt = document.getElementById('of-amount');
      const est = document.getElementById('of-estimate');
      const tot = document.getElementById('of-total');
      if (!amt || !est || !tot) return;
      const upd = function () { tot.textContent = 'Rs. ' + ((parseInt(amt.value, 10) || 0) + (parseInt(est.value, 10) || 0)); };
      amt.addEventListener('input', upd);
      est.addEventListener('input', upd);
      upd();
    }
  };
}

export function renderWorkerActiveJobsView() {
  const active = Store.activeJobs('worker');
  const html = active.length ? '<div class="stack">' + active.map(function (j) {
    return '<div class="job-card" onclick="go(\'/worker/active/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      UI.jobMetaRow(j) +
      (j.visitCharge ? '<div class="total-bar" style="margin-top:8px"><span>Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' : '') +
      '<div style="margin-top:10px"><button class="btn btn-outline btn-sm" onclick="go(\'/worker/active/' + j.id + '\')">' + ic('eye', { s: 14 }) + ' Open Job</button></div></div></div>';
  }).join('') + '</div>' : UI.empty('briefcase', 'No active jobs', 'Once a customer selects you, the job appears here and you drive it through inspection, repair and payment.', '<a class="btn btn-primary" href="#/worker/jobs">Browse Nearby Jobs</a>');
  return { html: html };
}

export function renderWorkerActiveJobDetailView(params) {
  const j = Store.jobById(params.id);
  const u = Store.currentUser();
  if (!j || !u || j.workerId !== u.id) {
    return { html: UI.empty('alert', 'Job not found', 'You are not assigned to this job.') + '<a class="btn btn-primary" href="#/worker">Back</a>' };
  }
  const cust = Store.userById(j.customerId);

  let panel = '';
  if (j.status === 'visit_confirmed' || j.status === 'on_the_way') {
    panel = '<div class="card"><div class="card-h"><h3>Visit Appointment</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="kv"><span class="k">Customer</span><span class="v">' + esc(cust ? cust.name : 'Customer') + '</span></div>' +
      '<div class="kv"><span class="k">Date / Time</span><span class="v">' + esc(j.prefDate || 'Flexible') + ' · ' + esc(j.prefTime) + '</span></div>' +
      '<div class="kv"><span class="k">Location</span><span class="v">' + esc((j.location && j.location.area) || '—') + '</span></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Visit charge</span><span class="v" style="color:var(--brand)">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">' +
      (j.status === 'visit_confirmed' ? '<button class="btn btn-primary" onclick="A.wTransition(\'' + j.id + '\',\'on_the_way\')">' + ic('truck', { s: 16 }) + ' Start Visit</button>' : '<button class="btn btn-primary" onclick="A.wTransition(\'' + j.id + '\',\'arrived\')">' + ic('pin', { s: 16 }) + ' I&rsquo;ve Arrived</button>') +
      '<button class="btn btn-danger" onclick="A.cancelVisit(\'' + j.id + '\',\'worker\')">Cancel</button></div>' +
      '<div class="fhint" style="margin-top:10px">Clicking ' + (j.status === 'visit_confirmed' ? 'Start Visit' : 'I&rsquo;ve Arrived') + ' updates the customer in real time.</div>' +
      '</div></div>';
  } else if (j.status === 'arrived' || j.status === 'inspection') {
    panel = '<div class="card"><div class="card-h"><div><h3>Inspection</h3><p>Diagnose the problem and quote a repair price</p></div>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="notice brand">' + ic('search') + '<span><b>Problem:</b> ' + esc(j.title) + '</span></div>' +
      '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">' + esc(j.description || '') + '</p>' +
      '<div class="field"><label>Inspection result</label><input class="input" id="ins-result" placeholder="e.g. AC capacitor is damaged" /></div>' +
      '<div class="field"><label>Required repair</label><input class="input" id="ins-required" placeholder="e.g. Replace capacitor" /></div>' +
      '<div class="field"><label>Final Repair Quote (Rs.)</label><input type="number" id="ins-est" class="input" placeholder="e.g. 700" min="50" /></div>' +
      '<div class="fhint">After inspecting, give the customer the final quote — it can differ from your offer estimate.</div>' +
      '<button class="btn btn-primary btn-lg btn-block" style="margin-top:12px" onclick="A.submitInspection(\'' + j.id + '\')">' + ic('send', { s: 16 }) + ' Submit Final Quote</button>' +
      '</div></div>';
  } else if (j.status === 'repair_negotiation' || j.status === 'repair_agreed') {
    const r = j.repair || {};
    panel = '<div class="card"><div class="card-h"><h3>' + (j.status === 'repair_agreed' ? 'Repair Agreed' : 'Quote Sent') + '</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="notice brand">' + ic('search') + '<span><b>Inspection result:</b> ' + esc(r.result || '') + '</span></div>' +
      '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">' + esc(r.required || '') + '</p>' +
      '<div class="kv"><span class="k">Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Final Repair Quote</span><span class="v" style="color:var(--brand);font-size:17px;font-weight:800">' + fmtRs(r.estimate || 0) + '</span></div>' +
      (j.status === 'repair_agreed'
        ? '<div class="notice amber" style="margin-top:14px">' + ic('clock') + '<span>Waiting for the customer to approve the final quote. You’ll be able to start instantly after approval.</span></div>'
        : '<div class="notice amber" style="margin-top:14px">' + ic('clock') + '<span>Quote sent to the customer. They can approve to start the repair, or reject and the job ends.</span></div>') +
      '</div></div>';
  } else if (j.status === 'repair_approved') {
    panel = '<div class="card"><div class="card-h"><h3>Approved — Ready to Repair</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="kv"><span class="k">Visit</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(j.repair ? j.repair.approvedEstimate : 0) + '</span></div>' +
      extraBillingRows(j) +
      '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:17px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
      '<button class="btn btn-primary btn-lg btn-block" style="margin-top:14px" onclick="A.startRepair(\'' + j.id + '\')">' + ic('wrench', { s: 16 }) + ' Start Repair</button>' +
      '</div></div>';
  } else if (j.status === 'repair_in_progress') {
    panel = '<div class="card"><div class="card-h"><div><h3>Repair In Progress</h3><p>The customer is tracking this live</p></div>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      '<div class="notice brand">' + ic('wrench') + '<span>' + esc(j.repair ? j.repair.required : '') + '</span></div>' +
      '<button class="btn btn-primary btn-lg btn-block" style="margin-top:14px" onclick="A.completeRepair(\'' + j.id + '\')">' + ic('checkC', { s: 17 }) + ' Mark Repair Complete</button>' +
      '</div></div>';
  } else if (j.status === 'completed' || j.status === 'paid' || j.status === 'reviewed') {
    panel = '<div class="card"><div class="card-h"><h3>' + (j.status === 'paid' ? 'Paid' : 'Completed') + '</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
      (j.status === 'completed'
        ? '<div class="notice amber">' + ic('wallet') + '<span>Repair is complete — awaiting customer payment. You’ll be notified instantly when it arrives.</span></div>'
        : '<div class="notice ok" style="background:var(--ok-bg)">' + ic('checkC') + (j.status === 'paid' ? '<span>The customer has paid ' + fmtRs(j.payment ? j.payment.amount : 0) + '. Money is on its way to your wallet.</span>' : '<span>Job complete and reviewed.</span>') + '</div>') +
      (j.payment ? '<div class="kv" style="margin-top:12px"><span class="k">Payment received</span><span class="v" style="color:var(--ok)">' + fmtRs(j.payment.amount) + '</span></div>' : '') +
      proofSectionHtml(j) +
      '</div></div>';
  }

  const timelineCard = '<div class="card"><div class="card-h"><h3>Job Stage</h3></div><div class="card-pad">' + UI.jobTimeline(j) + '</div></div>';

  const infoCard = '<div class="card"><div class="card-h"><h3>Customer &amp; Job</h3></div><div class="card-pad">' +
    '<div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">' + UI.avatar(cust) + '<div><b>' + esc(cust ? cust.name : 'Customer') + '</b><div class="smallnote">' + esc((j.location && j.location.area) || '') + '</div></div></div>' +
    '<p style="font-size:14px;color:var(--ink-2);margin-bottom:10px">' + esc(j.title) + '</p>' +
    UI.mediaRow(j) +
    '<div class="kv" style="border-bottom:none"><span class="k">Preferred time</span><span class="v">' + esc(j.prefDate || 'Flexible') + ' · ' + esc(j.prefTime) + '</span></div></div></div>';

  const repairApprovedEst = j.repair ? j.repair.approvedEstimate : 0;
  const costCard = (j.visitCharge || repairApprovedEst) ? '<div class="card"><div class="card-h"><h3>Money</h3></div><div class="card-pad">' +
    (j.visitCharge ? '<div class="kv"><span class="k">Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' : '') +
    (repairApprovedEst ? '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(repairApprovedEst) + '</span></div>' : '') +
    extraBillingRows(j) +
    '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:17px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div></div></div>' : '';

  const html = '<div class="grid-2col"><div class="main-col stack">' + panel + extraWorkCard(j, 'worker') + infoCard + '</div><div class="stack">' + timelineCard + costCard + '</div></div>';
  return { html: html };
}

export function renderWorkerCompletedJobsView() {
  const done = Store.historyJobs('worker');
  const html = done.length ? '<div class="stack">' + done.map(function (j) {
    return '<div class="job-card" onclick="go(\'/worker/active/' + j.id + '\')" style="cursor:pointer"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + esc(j.title) + '</b>' + UI.statusBadge(j.status) + '</div>' +
      (j.cancelled ? '<div class="smallnote" style="margin-top:4px">' + esc(j.cancelled.reason || 'Cancelled') + '</div>' : '') +
      '<div style="display:flex;gap:10px;align-items:center;margin-top:8px"><span class="smallnote">' + timeAgo(j.createdAt) + '</span>' +
      (j.completion ? '<span class="badge b-ok" style="margin-left:auto">' + ic('camera', { s: 12 }) + ' Proof sent</span>' : '') +
      (j.payment ? '<span class="badge b-ok">' + ic('wallet', { s: 12 }) + ' +' + fmtRs(j.payment.amount) + '</span>' : '') +
      (j.review ? '<span class="badge b-brand">' + ic('star', { s: 12 }) + ' ' + j.review.rating + '.0</span>' : '') + '</div></div></div>';
  }).join('') + '</div>' : UI.empty('checkC', 'No completed jobs yet', 'Completed and paid jobs will appear here.', '<a class="btn btn-primary" href="#/worker/jobs">Find Jobs</a>');
  return { html: html };
}
