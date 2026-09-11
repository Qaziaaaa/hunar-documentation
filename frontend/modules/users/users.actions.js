import { Store } from '../../app/state.js';
import { UI } from '../../shared/ui/ui.js';
import { ic } from '../../shared/icons/icons.js';
import { applyWorkerFilter } from './users.views.js';


export const UserActions = {
  saveProfile: function () {
    const u = Store.currentUser();
    if (!u) return;
    const nameEl = document.getElementById('pf-name');
    const phoneEl = document.getElementById('pf-phone');
    const areaEl = document.getElementById('pf-area');
    Store.updateUser(u.id, {
      name: nameEl ? nameEl.value.trim() : u.name,
      phone: phoneEl ? phoneEl.value.trim() : u.phone,
      area: areaEl ? areaEl.value : u.area
    });
    UI.toast('Your personal details have been updated.', 'ok', 'Profile saved');
  },

  pickColor: function (c, el) {
    document.querySelectorAll('.avatar-opt').forEach(function (x) { x.classList.remove('on'); });
    if (el) el.classList.add('on');
    const u = Store.currentUser();
    if (u) Store.updateUser(u.id, { color: c });
    if (typeof window.R !== 'undefined') window.R();
  },

  pickAvUpload: function () {
    const inp = document.getElementById('av-up');
    if (inp) inp.click();
  },

  wskill: function (s, el) {
    const u = Store.currentUser();
    if (!u) return;
    const skills = (u.skills || []).slice();
    const i = skills.indexOf(s);
    if (i === -1) skills.push(s); else skills.splice(i, 1);
    Store.updateUser(u.id, { skills: skills });
    if (el) el.classList.toggle('on');
    UI.toast('Skills updated.', 'ok', 'Saved');
  },

  warea: function (a, el) {
    const u = Store.currentUser();
    if (!u) return;
    const areas = (u.serviceAreas || []).slice();
    const i = areas.indexOf(a);
    if (i === -1) areas.push(a); else areas.splice(i, 1);
    Store.updateUser(u.id, { serviceAreas: areas });
    if (el) el.classList.toggle('on');
  },

  wsave: function () {
    const u = Store.currentUser();
    if (!u) return;
    const tagEl = document.getElementById('wk-tag');
    const bioEl = document.getElementById('wk-bio');
    const vcEl = document.getElementById('wk-vc');
    const phEl = document.getElementById('wk-ph');
    Store.updateUser(u.id, {
      tagline: tagEl ? tagEl.value.trim() : u.tagline,
      bio: bioEl ? bioEl.value.trim() : u.bio,
      visitCharge: vcEl ? (parseInt(vcEl.value, 10) || u.visitCharge) : u.visitCharge,
      phone: phEl ? phEl.value.trim() : u.phone
    });
    UI.toast('Professional profile saved.', 'ok', 'Saved');
  },

  wport: function () {
    UI.openModal('<div class="modal-h"><h3>Add Portfolio Item</h3><button class="icon-btn" onclick="UI.closeModal(); if (typeof window.R !== \'undefined\') window.R();">' + ic('x') + '</button></div>' +
      '<div class="modal-b"><div class="field"><label>Description</label><input class="input" id="port-in" placeholder="e.g. Fixed central AC at British Council" /></div>' +
      '<button class="btn btn-primary btn-block" onclick="A.wportAdd()">Add</button></div>');
  },

  wportAdd: function () {
    const inp = document.getElementById('port-in');
    const v = inp ? inp.value.trim() : '';
    if (!v) return;
    const u = Store.currentUser();
    if (u) {
      const port = (u.portfolio || []).slice();
      port.push(v);
      Store.updateUser(u.id, { portfolio: port });
    }
    UI.closeModal();
    if (typeof window.R !== 'undefined') window.R();
  },

  fltWorkers: function () {
    const workers = (Store.state().users || []).filter(function (u) {
      return u.role === 'worker' && !u.onboarding && u.name !== 'Your Profile';
    });
    applyWorkerFilter(workers);
  },

  onb: {
    set: function (k, v) { const d = Store.draft(); if (d) { d[k] = v; Store.emit(); } },
    toggleSkill: function (s) { const d = Store.draft(); const i = d.skills.indexOf(s); if (i === -1) d.skills.push(s); else d.skills.splice(i, 1); if (window.R) window.R(); },
    toggleArea: function (a) { const d = Store.draft(); const i = d.areas.indexOf(a); if (i === -1) d.areas.push(a); else d.areas.splice(i, 1); if (window.R) window.R(); },
    pickColor: function (c) { const d = Store.draft(); d.avatarColor = c; if (window.R) window.R(); },
    upload: function () {
      const inp = document.getElementById('onb-up');
      if (!inp) return;
      inp.onchange = function () {
        const f = inp.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = function () { const d = Store.draft(); d.avatar = rd.result; if (window.R) window.R(); };
        rd.readAsDataURL(f);
      };
      inp.click();
    },
    docs: function (key, f) {
      if (!f) return;
      const rd = new FileReader();
      rd.onload = function () { const d = Store.draft(); d[key] = rd.result; if (key === 'selfie') d.cnicDone = true; if (window.R) window.R(); };
      rd.readAsDataURL(f);
    },
    delDoc: function (key) { const d = Store.draft(); d[key] = null; if (window.R) window.R(); },
    prev: function () { const d = Store.draft(); if (d) d.step = Math.max(1, d.step - 1); if (window.R) window.R(); },
    next: function () {
      const d = Store.draft();
      const err = function (m) { UI.toast(m, 'danger', 'Almost there'); };
      if (d.step === 2 && !d.skills.length) { err('Please select at least one skill.'); return; }
      if (d.step === 3 && !d.areas.length) { err('Please select your service areas.'); return; }
      if (d.step === 6 && !d.cnicDone) { err('Please upload your CNIC and selfie to finish verification.'); return; }
      d.step = d.step + 1;
      if (window.R) window.R();
    },
    finish: function () {
      const d = Store.draft();
      const u = Store.currentUser();
      Store.updateUser(u.id, {
        tagline: d.tagline || 'Professional at HUNAR',
        bio: d.bio, phone: d.phone, skills: d.skills, serviceAreas: d.areas, years: d.years,
        area: d.areas[0] || u.area, avatar: d.avatar, color: d.avatarColor, verified: true
      });
      Store.finishOnboarding(u.id);
      Store.clearDraft();
      UI.toast('Profile complete + verified. Start browsing nearby jobs!', 'ok', 'You’re live');
      if (window.go) window.go('/worker');
    }
  }
};

