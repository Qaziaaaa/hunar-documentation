import { ic } from '../../shared/icons/icons.js';
import { UI, esc, initials, timeAgo } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';
import { SERVICES, SKILL_ALL, svcByName } from '../services/services.data.js';
import { AREAS } from '../locations/locations.data.js';
import { AVATAR_COLORS, avatarColor } from './users.data.js';

export function workerProfileModal(wid) {
  const w = Store.userById(wid);
  if (!w) return;
  const can = Store.currentUser();
  const rv = Store.reviewsFor(w.id);
  const skills = (w.skills || []).map(function (s) {
    const sv = svcByName(s);
    return '<span class="tag-inline">' + ic(sv ? sv.icon : 'wrench', { s: 13 }) + ' ' + esc(s) + '</span>';
  }).join(' ');
  const port = (w.portfolio || []).slice(0, 3).map(function (p) {
    return '<div class="portfolio-chip" style="background:#f8fafc;border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:13px;font-weight:600">' +
      ic('image', { s: 15, style: 'vertical-align:-3px;margin-right:6px;color:var(--brand)' }) + esc(p) + '</div>';
  }).join(' ');
  const revHtml = rv.slice(0, 5).map(function (r) {
    return '<div style="border-bottom:1px solid var(--line);padding:12px 0">' +
      '<div style="display:flex;align-items:center;gap:8px">' + UI.avatar({ name: r.customerName, color: avatarColor(r.customerName), verified: false }) +
      '<div><div style="font-size:13px;font-weight:700">' + esc(r.customerName || 'Customer') + '</div><div class="rating">' + UI.stars(r.rating, 13) + ' <span class="rcnt">· ' + timeAgo(r.at) + '</span></div></div></div>' +
      '<p style="font-size:13px;color:var(--ink-2);margin-top:6px">' + esc(r.text || '') + '</p></div>';
  }).join('') || '<p style="color:var(--faint);font-size:13px">Reviews will appear after completing jobs.</p>';

  const offersRow = can && can.role === 'customer'
    ? '<button class="btn btn-primary btn-block" onclick="go(\'/customer/post\')">' + ic('plus', { s: 15 }) + ' Hire ' + esc(w.name.split(' ')[0]) + '</button>'
    : (can && can.role === 'worker' && can.id === w.id ? '<a class="btn btn-outline btn-block" href="#/worker/profile">Edit my profile</a>' : '');

  UI.openModal(
    '<div class="modal-h"><h3>Worker Profile</h3><button data-close="1" class="icon-btn">' + ic('x') + '</button></div>' +
    '<div class="modal-b" style="max-height:80vh;overflow-y:auto">' +
    '<div style="display:flex;gap:16px;align-items:center;margin-bottom:18px">' + UI.avatar(w, 'xl') +
    '<div style="min-width:0"><div style="font-size:20px;font-weight:800">' + esc(w.name) + (w.verified ? ' ' + ic('shield', { s: 17, style: 'color:var(--brand);vertical-align:-2px' }) : '') + '</div>' +
    '<div style="color:var(--muted);font-size:13.5px">' + esc(w.tagline || 'Skilled Professional') + '</div>' +
    '<div class="rating" style="margin-top:6px">' + UI.rating(w.rating, w.ratingCount) + '</div></div></div>' +
    '<div class="split" style="gap:10px;margin-bottom:18px">' +
    '<div class="kv-card" style="flex:1;background:#f8fafc;padding:12px;border-radius:12px;border:1px solid var(--line)"><div class="smallnote">Visit Charge</div><b style="font-size:17px;color:var(--navy)">' + (w.visitCharge ? UI.money(w.visitCharge) : 'Free visit') + '</b></div>' +
    '<div class="kv-card" style="flex:1;background:#f8fafc;padding:12px;border-radius:12px;border:1px solid var(--line)"><div class="smallnote">Experience</div><b style="font-size:17px;color:var(--navy)">' + (w.years || 0) + ' years</b></div>' +
    '<div class="kv-card" style="flex:1;background:#f8fafc;padding:12px;border-radius:12px;border:1px solid var(--line)"><div class="smallnote">Completed</div><b style="font-size:17px;color:var(--navy)">' + (w.jobsDone || 0) + ' jobs</b></div></div>' +
    '<h4 style="margin-bottom:8px">About</h4><p style="font-size:13.5px;color:var(--ink-2);line-height:1.5;margin-bottom:18px">' + esc(w.bio || 'Skilled professional registered on HUNAR.') + '</p>' +
    '<h4 style="margin-bottom:8px">Skills & Services</h4><div style="margin-bottom:18px">' + skills + '</div>' +
    (port ? '<h4 style="margin-bottom:8px">Recent Work</h4><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">' + port + '</div>' : '') +
    '<h4 style="margin-bottom:8px">Customer Reviews (' + rv.length + ')</h4>' + revHtml +
    '</div>' +
    (offersRow ? '<div class="modal-f">' + offersRow + '</div>' : '')
  );
}

export function renderWorkersView(params) {
  const hash = location.hash || '';
  const kwMatch = hash.match(/skill=([^&]+)/);
  const kw = kwMatch ? decodeURIComponent(kwMatch[1]) : '';
  const workers = (Store.state().users || []).filter(function (u) {
    return u.role === 'worker' && !u.onboarding && u.name !== 'Your Profile';
  });
  const cats = SKILL_ALL;
  const html =
    '<div class="card card-pad" style="margin-bottom:18px">' +
    '<div class="split" style="align-items:end;gap:14px">' +
    '<div class="field" style="margin:0;min-width:220px"><label>Skill / Service</label><select id="flt-skill" class="select"><option value="">All skills</option>' + cats.map(function (c) { return '<option value="' + esc(c) + '"' + (kw === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
    '<div class="field" style="margin:0;min-width:160px"><label>Min. rating</label><select id="flt-rate" class="select"><option value="">Any</option><option value="4.5">4.5+</option><option value="4.7">4.7+</option><option value="4.9">4.9+</option></select></div>' +
    '<div class="field" style="margin:0;flex:1"><label>Search</label><input id="flt-q" class="input" placeholder="Search workers…" value="' + esc(kw) + '" /></div>' +
    '<button class="btn btn-primary" onclick="A.fltWorkers()">' + ic('search', { s: 15 }) + ' Apply filters</button>' +
    '</div></div>' +
    '<div class="section-sub" style="margin-bottom:16px" id="wrk-count"></div>' +
    '<div class="dir-grid" id="wrk-grid">' + workers.map(function (w) { return UI.workerCard(w); }).join('') + '</div>';

  return {
    html: html,
    mount: function () {
      applyWorkerFilter(workers);
    }
  };
}

export function applyWorkerFilter(all) {
  const skillEl = document.getElementById('flt-skill');
  const rateEl = document.getElementById('flt-rate');
  const qEl = document.getElementById('flt-q');
  const skill = skillEl ? skillEl.value : '';
  const rate = parseFloat((rateEl ? rateEl.value : '') || '0');
  const q = (qEl ? qEl.value : '').toLowerCase().trim();
  const list = all.filter(function (w) {
    if (skill && (w.skills || []).indexOf(skill) === -1) return false;
    if (rate && (w.rating || 0) < rate) return false;
    if (q && (w.name + ' ' + (w.tagline || '') + ' ' + (w.bio || '')).toLowerCase().indexOf(q) === -1) return false;
    return true;
  });
  const countEl = document.getElementById('wrk-count');
  if (countEl) countEl.textContent = list.length + ' worker' + (list.length === 1 ? '' : 's') + ' found';
  const grid = document.getElementById('wrk-grid');
  if (grid) {
    grid.innerHTML = list.length ? list.map(function (w) { return UI.workerCard(w); }).join('') : UI.empty('search', 'No workers found', 'Try changing your filters or search term.');
  }
}

export function renderWorkerPublicView(params) {
  const w = Store.userById(params.id);
  if (!w || w.role !== 'worker') {
    return { html: UI.empty('alert', 'Worker not found', 'This profile may no longer be available.') + '<a class="btn btn-primary btn-block" style="max-width:220px;margin:0 auto" href="#/workers">Browse workers</a>' };
  }
  return {
    html: '',
    mount: function () {
      workerProfileModal(params.id);
      setTimeout(function () {
        if (!document.querySelector('.modal') && typeof window.go !== 'undefined') window.go('/workers');
      }, 250);
    }
  };
}

export function renderCustomerProfileView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const html = '<div class="grid-2col"><div class="card card-pad">' +
    '<h3 style="margin-bottom:14px">Personal Information</h3>' +
    '<div style="display:flex;gap:14px;align-items:center;margin-bottom:18px">' + UI.avatar(u, 'lg') +
    '<div><div style="font-weight:800;font-size:17px">' + esc(u.name) + '</div><div class="smallnote">Customer since ' + u.joined + ' · ' + esc(u.email) + '</div></div></div>' +
    '<div class="f-row"><div class="field"><label>Full name</label><input class="input" id="pf-name" value="' + esc(u.name) + '" /></div>' +
    '<div class="field"><label>Phone</label><input class="input" id="pf-phone" value="' + esc(u.phone || '') + '" /></div></div>' +
    '<div class="f-row"><div class="field"><label>Area</label><select class="select" id="pf-area">' + AREAS.map(function (a) { return '<option' + (u.area === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></div>' +
    '<div class="field"><label>Email</label><input class="input" disabled value="' + esc(u.email) + '" /></div></div>' +
    '<button class="btn btn-primary" onclick="A.saveProfile()">Save changes</button></div>' +
    '<div class="stack"><div class="card card-pad"><h3 style="margin-bottom:10px">Avatar</h3><div class="avatar-opts">' + AVATAR_COLORS.slice(0, 6).map(function (c) {
      return '<div class="avatar-opt' + (u.color === c ? ' on' : '') + '" style="background:' + c + '" onclick="A.pickColor(\'' + c + '\',this)">' + initials(u.name) + '</div>';
    }).join('') + '</div><button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="A.pickAvUpload()">' + ic('camera', { s: 14 }) + ' Upload photo</button><input type="file" id="av-up" accept="image/*" style="display:none" /></div>' +
    '<div class="card card-pad"><h3 style="margin-bottom:8px">Quick actions</h3>' +
    '<button class="btn btn-outline btn-block" style="margin-bottom:8px" onclick="go(\'/customer/payments\')">' + ic('wallet', { s: 16 }) + ' Payment history</button>' +
    '<button class="btn btn-outline btn-block" onclick="go(\'/customer/reviews\')">' + ic('star', { s: 16 }) + ' My reviews</button></div></div></div>';
  return { html: html };
}

export function renderWorkerProfileView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const html = '<div class="grid-2col"><div class="card card-pad">' +
    '<div style="display:flex;gap:16px;align-items:center;margin-bottom:20px">' + UI.avatar(u, 'xl') +
    '<div style="min-width:0"><div style="font-size:19px;font-weight:800">' + esc(u.name) + (u.verified ? ' ' + ic('shield', { s: 16, style: 'color:var(--brand)' }) : '<span class="badge b-muted" style="margin-left:6px">Unverified</span>') + '</div>' +
    '<div style="color:var(--muted);font-size:13px">' + esc(u.tagline || 'Professional at HUNAR') + '</div>' +
    (u.rating ? '<div style="margin-top:6px">' + UI.rating(u.rating, u.ratingCount) + '</div>' : '<div class="smallnote" style="margin-top:6px">No ratings yet — new workers appear as “New”.</div>') + '</div></div>' +
    '<div class="field"><label>Professional title</label><input class="input" id="wk-tag" value="' + esc(u.tagline || '') + '" /></div>' +
    '<div class="field"><label>Bio</label><textarea class="textarea" id="wk-bio">' + esc(u.bio || '') + '</textarea></div>' +
    '<div class="field"><label>Skills</label><div class="chips">' + SKILL_ALL.map(function (s) {
      const on = (u.skills || []).indexOf(s) !== -1;
      const sv = svcByName(s);
      return '<button class="chip' + (on ? ' on' : '') + '" onclick="A.wskill(\'' + s + '\',this)">' + ic(sv ? sv.icon : 'wrench', { s: 13 }) + ' ' + s + '</button>';
    }).join('') + '</div></div>' +
    '<div class="field"><label>Service areas</label><div class="chips">' + AREAS.map(function (a) {
      const on = (u.serviceAreas || []).indexOf(a) !== -1;
      return '<button class="chip' + (on ? ' on' : '') + '" onclick="A.warea(\'' + a + '\',this)">' + a + '</button>';
    }).join('') + '</div></div>' +
    '<div class="f-row"><div class="field"><label>Visit charge (Rs.)</label><input type="number" class="input" id="wk-vc" value="' + (u.visitCharge || '') + '" /></div>' +
    '<div class="field"><label>Phone</label><input class="input" id="wk-ph" value="' + esc(u.phone || '') + '" /></div></div>' +
    '<button class="btn btn-primary" onclick="A.wsave()">' + ic('check', { s: 15 }) + ' Save Profile</button></div>' +
    '<div class="stack"><div class="card card-pad"><h3 style="margin-bottom:10px">My Portfolio</h3>' +
    (u.portfolio && u.portfolio.length ? u.portfolio.map(function (p) { return '<div class="kv"><span class="k">' + esc(p) + '</span><span class="v">' + ic('check', { s: 13, style: 'color:var(--ok)' }) + '</span></div>'; }).join('') : '<p class="smallnote">Add portfolio entries after completing work.</p>') +
    '<button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="A.wport()">' + ic('plus', { s: 13 }) + ' Add portfolio item</button></div>' +
    '<div class="card card-pad"><h3 style="margin-bottom:10px">Stats</h3>' +
    '<div class="kv"><span class="k">Jobs completed</span><span class="v">' + (u.jobsDone || 0) + '</span></div>' +
    '<div class="kv"><span class="k">Response time</span><span class="v">' + esc(u.responses || '~20 min') + '</span></div>' +
    '<div class="kv" style="border-bottom:none"><span class="k">Member since</span><span class="v">' + u.joined + '</span></div></div></div></div>';
  return { html: html };
}

export function renderWorkerSettingsView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const html = '<div class="grid-2col"><div class="card"><div class="card-h"><h3>Availability & Notifications</h3></div><div class="card-pad">' +
    '<div class="setting-row" style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)"><span class="svc-icon" style="background:#eef1f4;color:var(--ink-2)">' + ic('clock', { s: 18 }) + '</span><div style="flex:1"><b style="font-size:14px">Accept new jobs</b><div class="smallnote">Show my profile for new nearby jobs</div></div><input type="checkbox" checked /></div>' +
    '<div class="setting-row" style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)"><span class="svc-icon" style="background:#eef1f4;color:var(--ink-2)">' + ic('bell', { s: 18 }) + '</span><div style="flex:1"><b style="font-size:14px">Nearby job alerts</b><div class="smallnote">Notify me when a new job is posted near me</div></div><input type="checkbox" checked /></div>' +
    '<div class="setting-row" style="display:flex;align-items:center;gap:14px;padding:12px 0"><span class="svc-icon" style="background:#eef1f4;color:var(--ink-2)">' + ic('wallet', { s: 18 }) + '</span><div style="flex:1"><b style="font-size:14px">Payment notifications</b><div class="smallnote">When a customer pays</div></div><input type="checkbox" checked /></div>' +
    '</div></div>' +
    '<div class="stack"><div class="card"><div class="card-h"><h3>Demo data</h3></div><div class="card-pad">' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">Reset the entire demo — jobs, offers, payments and reviews.</p>' +
    '<button class="btn btn-outline" style="color:var(--danger);border-color:#f3c7c8" onclick="A.resetDemo()">' + ic('refresh', { s: 15 }) + ' Reset demo data</button></div></div>' +
    '<div class="card card-pad"><b>Account</b>' +
    '<div class="kv" style="margin-top:8px"><span class="k">Account type</span><span class="v">Worker</span></div>' +
    '<div class="kv"><span class="k">Email</span><span class="v">' + esc(u.email) + '</span></div>' +
    '<div style="margin-top:12px"><button class="btn btn-danger-solid" onclick="A.logout()">' + ic('logout', { s: 15 }) + ' Log out</button></div></div></div></div>';
  return { html: html };
}

export function renderCustomerSettingsView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const html = '<div class="grid-2col"><div class="card"><div class="card-h"><h3>Notifications & Alerts</h3></div><div class="card-pad">' +
    '<div class="setting-row" style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)"><span class="svc-icon" style="background:#eef1f4;color:var(--ink-2)">' + ic('bell', { s: 18 }) + '</span><div style="flex:1"><b style="font-size:14px">Job offers alerts</b><div class="smallnote">Notify me when nearby workers send offers</div></div><input type="checkbox" checked /></div>' +
    '<div class="setting-row" style="display:flex;align-items:center;gap:14px;padding:12px 0"><span class="svc-icon" style="background:#eef1f4;color:var(--ink-2)">' + ic('truck', { s: 18 }) + '</span><div style="flex:1"><b style="font-size:14px">Visit updates</b><div class="smallnote">When a worker is on the way or has arrived</div></div><input type="checkbox" checked /></div>' +
    '</div></div>' +
    '<div class="stack"><div class="card"><div class="card-h"><h3>Demo data</h3></div><div class="card-pad">' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">Reset the entire demo to initial state.</p>' +
    '<button class="btn btn-outline" style="color:var(--danger);border-color:#f3c7c8" onclick="A.resetDemo()">' + ic('refresh', { s: 15 }) + ' Reset demo data</button></div></div>' +
    '<div class="card card-pad"><b>Account</b>' +
    '<div class="kv" style="margin-top:8px"><span class="k">Account type</span><span class="v">Customer</span></div>' +
    '<div class="kv"><span class="k">Email</span><span class="v">' + esc(u.email) + '</span></div>' +
    '<div style="margin-top:12px"><button class="btn btn-danger-solid" onclick="A.logout()">' + ic('logout', { s: 15 }) + ' Log out</button></div></div></div></div>';
  return { html: html };
}

export function renderWorkerOnboardingView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  if (!u.onboarding) {
    if (window.go) window.go('/worker');
    return { html: '' };
  }
  let onb = Store.draft();
  if (!onb || !onb.onb) {
    onb = { onb: true, step: 1, tagline: '', bio: '', phone: u.phone || '', skills: u.skills || [], areas: u.serviceAreas || [], years: u.years || 0, hi: '', avatar: '', avatarColor: u.color || '#123b5d', cnic: null, selfie: null, cnicDone: false };
    Store.setDraft(onb);
  }
  const d = onb;
  const steps = ['Basics', 'Skills', 'Areas', 'Experience', 'Photo', 'Verification'];
  const stepper = '<div class="stepper">' + steps.map(function (s, i) {
    const n = i + 1;
    const cls = n < d.step ? 'done' : n === d.step ? 'active' : '';
    return '<div class="stp ' + cls + '"><span class="tick">' + (n === 6 && d.cnicDone ? ic('check', { s: 15 }) : n < d.step ? ic('check', { s: 15 }) : n) + '</span><span class="sl">' + s + '</span></div>';
  }).join('') + '</div>';

  let body = '';
  if (d.step === 1) {
    body = '<div class="field"><label>Professional title / tagline</label><input class="input" value="' + esc(d.tagline) + '" placeholder="e.g. Certified AC technician" oninput="A.onb.set(\'tagline\',this.value)" /></div>' +
      '<div class="field"><label>Short bio</label><textarea class="textarea" placeholder="Tell customers about your experience and approach…" oninput="A.onb.set(\'bio\',this.value)">' + esc(d.bio) + '</textarea></div>' +
      '<div class="field"><label>Phone (for customers)</label><input class="input" value="' + esc(d.phone) + '" placeholder="+92 300 0000000" oninput="A.onb.set(\'phone\',this.value)" /></div>';
  }
  if (d.step === 2) {
    body = '<div class="field"><label>Select your skills <span class="req">*</span></label><div class="chips">' + SKILL_ALL.map(function (s) {
      const on = d.skills.indexOf(s) !== -1;
      return '<button class="chip' + (on ? ' on' : '') + '" onclick="A.onb.toggleSkill(\'' + s + '\')">' + ic(svcByName(s).icon, { s: 14 }) + ' ' + s + '</button>';
    }).join('') + '</div><div class="fhint">Highlight your expertise — nearby job alerts follow your skills, but you can browse and apply to any job.</div></div>';
  }
  if (d.step === 3) {
    body = '<div class="field"><label>Service areas <span class="req">*</span></label><div class="chips">' + AREAS.map(function (a) {
      const on = d.areas.indexOf(a) !== -1;
      return '<button class="chip' + (on ? ' on' : '') + '" onclick="A.onb.toggleArea(\'' + a + '\')">' + (on ? ic('check', { s: 13 }) : ic('pin', { s: 13 })) + ' ' + a + '</button>';
    }).join('') + '</div></div>';
  }
  if (d.step === 4) {
    body = '<div class="field"><label>Years of experience</label><select class="select" onchange="A.onb.set(\'years\',parseInt(this.value,10))">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(function (y) {
      return '<option value="' + y + '"' + (d.years === y ? ' selected' : '') + '>' + y + ' years</option>';
    }).join('') + '</select></div>' +
      '<div class="field"><label>Work history <span class="smallnote">(optional)</span></label><textarea class="textarea" placeholder="e.g. Worked with 3 appliance brands, handled 200+ AC repairs in Karachi…" oninput="A.onb.set(\'hi\',this.value)">' + esc(d.hi) + '</textarea></div>';
  }
  if (d.step === 5) {
    body = '<div class="field"><label>Profile picture</label><div class="avatar-opts">' + AVATAR_COLORS.map(function (c) {
      return '<div class="avatar-opt' + (d.avatarColor === c ? ' on' : '') + '" style="background:' + c + '" onclick="A.onb.pickColor(\'' + c + '\')">' + initials(u.name) + '</div>';
    }).join('') + '</div>' +
      '<button class="btn btn-outline btn-sm" style="margin-top:10px" onclick="A.onb.upload()">' + ic('camera', { s: 14 }) + ' Upload a photo</button>' +
      '<input type="file" id="onb-up" accept="image/*" style="display:none" /></div>' +
      (d.avatar ? '<div class="img-thumb" style="width:110px;height:110px;margin-top:10px"><img src="' + d.avatar + '" /></div>' : '');
  }
  if (d.step === 6) {
    body = '<div class="field"><label>CNIC (front) — for verification</label>' +
      uploadMock(d.cnic, 'cnic') + '</div>' +
      '<div class="field"><label>Selfie with your CNIC</label>' + uploadMock(d.selfie, 'selfie') + '</div>' +
      '<div class="notice brand">' + ic('shield') + '<span>Verification is instant in this demo. A verified badge appears on your profile and boosts customer trust.</span></div>';
  }

  function uploadMock(val, key) {
    if (val) {
      return '<div class="img-thumb" style="height:90px"><img src="' + val + '" /><button class="img-del" onclick="A.onb.delDoc(\'' + key + '\')">' + ic('trash', { s: 13 }) + '</button></div>';
    }
    return '<label class="upload-zone" style="padding:18px;display:block"><div style="display:flex;flex-direction:column;align-items:center;gap:5px">' + ic('file', { s: 22 }) + '<b style="font-size:13px">Upload document</b><span style="font-size:12px">JPG or PNG</span></div>' +
      '<input type="file" accept="image/*" style="display:none" onchange="A.onb.docs(\'' + key + '\',this.files[0])" /></label>';
  }

  const nav = '<div class="wiz-nav">' + (d.step > 1 ? '<button class="btn btn-outline" onclick="A.onb.prev()">' + ic('arrowL', { s: 15 }) + ' Back</button>' : '<span></span>') +
    (d.step < 6 ? '<button class="btn btn-primary" onclick="A.onb.next()">Continue ' + ic('arrowR', { s: 15 }) + '</button>' : '<button class="btn btn-primary btn-lg" onclick="A.onb.finish()">' + ic('shield', { s: 16 }) + ' Finish & Start Working</button>') + '</div>';

  const html = '<div class="card wiz-card"><div class="card-pad"><div class="wiz-wrap">' + stepper + '<div class="wiz-main"><div style="font-size:17px;font-weight:800;margin-bottom:14px">' + steps[d.step - 1] + '</div>' + body + nav + '</div></div></div></div>';
  return { html: html };
}

if (typeof window !== 'undefined') {
  window.workerProfileModal = workerProfileModal;
}

