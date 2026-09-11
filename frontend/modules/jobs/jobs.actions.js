import { Store } from '../../app/state.js';
import { UI, wavUri } from '../../shared/ui/ui.js';
import { AREAS, randDist } from '../locations/locations.data.js';

let recState = null;

export function applyWorkerJobsFilter(all) {
  const catEl = document.getElementById('wflt-cat');
  const cat = catEl ? catEl.value : '';
  const dEl = document.getElementById('wflt-d');
  const md = parseFloat((dEl && dEl.value) || '15');
  const u = Store.currentUser();
  const list = all.filter(function (j) {
    if (cat && j.category !== cat) return false;
    const dist = (j.distance && j.distance[u.id]) || randDist(j.id + u.id, u.radius || 10);
    return dist <= md;
  });
  const cntEl = document.getElementById('nf-count');
  if (cntEl) cntEl.textContent = list.length + ' job' + (list.length === 1 ? '' : 's') + ' found nearby';
  const gridEl = document.getElementById('nf-grid');
  if (gridEl) {
    if (window.jobCardWorker) {
      gridEl.innerHTML = list.length ? list.map(window.jobCardWorker).join('') : UI.empty('map', 'No jobs found in your service area', 'Try a different category or widen your distance.', '<a class="btn btn-outline btn-sm" href="#/worker/profile">Edit profile</a>');
    }
  }
}

export const JobActions = {
  wiz: {
    start: function () {
      const u = Store.currentUser();
      Store.setDraft({
        step: 1,
        customerId: u ? u.id : '',
        category: '',
        title: '',
        description: '',
        images: [],
        audio: null,
        location: null,
        coords: { x: 52, y: 58 },
        area: '',
        prefDate: null,
        prefTime: null,
        flexible: false
      });
    },
    step: function (n) {
      const d = Store.draft();
      if (!d) { this.start(); return; }
      d.step = n;
      if (window.R) window.R();
    },
    next: function () {
      const d = Store.draft();
      if (!d) return;
      const st = d.step;
      const err = function (msg) { UI.toast(msg, 'danger', 'Almost there'); };
      if (st === 1 && !d.category) { err('Please select a service category.'); return; }
      if (st === 2) {
        if (!d.title.trim()) { err('Please enter a problem title.'); return; }
      }
      if (st === 3) {
        if (!d.area) { err('Please select your location area.'); return; }
      }
      if (st === 4) {
        if (!d.prefDate) { err('Please pick a preferred visit date.'); return; }
        if (!d.prefTime && !d.flexible) { err('Please pick a preferred time or enable flexible timing.'); return; }
      }
      d.step = st + 1;
      if (window.R) window.R();
    },
    prev: function () {
      const d = Store.draft();
      if (!d) return;
      d.step = Math.max(1, d.step - 1);
      if (window.R) window.R();
    },
    pick: function (k, v) {
      const d = Store.draft();
      if (!d) return;
      d[k] = v;
      if (window.R) window.R();
    },
    set: function (k, v) {
      const d = Store.draft();
      if (!d) return;
      d[k] = v;
    },
    pickService: function (name) {
      const d = Store.draft();
      if (!d) return;
      d.category = name;
      d.step = 2;
      if (window.R) window.R();
    },
    addImages: function (files) {
      const d = Store.draft();
      if (!d) return;
      Array.from(files).slice(0, 6 - d.images.length).forEach(function (f) {
        const rd = new FileReader();
        rd.onload = function () {
          d.images.push(rd.result);
          if (window.R) window.R();
        };
        rd.readAsDataURL(f);
      });
    },
    delImage: function (i) {
      const d = Store.draft();
      if (!d) return;
      d.images.splice(i, 1);
      if (window.R) window.R();
    },
    rec: function () {
      if (recState && recState.active) { this.stopRec(); return; }
      recState = { active: true, sec: 0, dataUrl: null };
      const timer = setInterval(function () {
        if (recState) {
          recState.sec++;
          const el = document.getElementById('recTimer');
          if (el) el.textContent = '0:' + String(Math.min(99, recState.sec)).padStart(2, '0');
        }
      }, 1000);
      recState.timer = timer;
      if (window.R) window.R();
      if (navigator.mediaDevices && window.MediaRecorder) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
          if (!recState || !recState.active) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
          const mr = new MediaRecorder(stream);
          const chunks = [];
          mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
          mr.onstop = function () {
            stream.getTracks().forEach(function (t) { t.stop(); });
            if (!recState) return;
            const bl = new Blob(chunks, { type: 'audio/webm' });
            if (bl.size > 0) { recState.dataUrl = URL.createObjectURL(bl); recState.real = true; }
            else { recState.dataUrl = wavUri(recState.sec || 1); }
          };
          mr.start();
          recState.mr = mr;
        }).catch(function () {
          UI.toast('Microphone unavailable — using simulated recording.', 'danger', 'Notice');
        });
      } else {
        UI.toast('Recording simulated — captured voice description.', 'ok', 'Recording');
      }
    },
    stopRec: function () {
      if (!recState) return;
      recState.active = false;
      clearInterval(recState.timer);
      const secs = Math.max(1, recState.sec);
      const d = Store.draft();
      if (recState.mr) {
        try { recState.mr.stop(); } catch (e) { }
        setTimeout(function () {
          const uri = recState && recState.dataUrl ? recState.dataUrl : wavUri(secs);
          if (d) d.audio = { uri: uri, duration: secs, label: 'Voice description' };
          recState = null;
          if (window.R) window.R();
        }, 350);
        return;
      }
      if (!recState.dataUrl) recState.dataUrl = wavUri(secs);
      if (d) d.audio = { uri: recState.dataUrl, duration: secs, label: 'Voice description' };
      recState = null;
      if (window.R) window.R();
    },
    delAudio: function () {
      const d = Store.draft();
      if (!d) return;
      d.audio = null;
      if (window.R) window.R();
    },
    mapClick: function (e) {
      const d = Store.draft();
      if (!d) return;
      const rect = e.currentTarget.getBoundingClientRect();
      d.coords = {
        x: Math.round(((e.clientX - rect.left) / rect.width) * 100),
        y: Math.round(((e.clientY - rect.top) / rect.height) * 100)
      };
      if (window.R) window.R();
    },
    useLocation: function () {
      const d = Store.draft();
      if (!d) return;
      UI.loader('Detecting your location…');
      setTimeout(function () {
        UI.clearLoader();
        if (Math.random() < 0.82) {
          const area = AREAS[Math.floor(Math.random() * (AREAS.length - 2))];
          d.area = area;
          d.coords = { x: 30 + Math.random() * 40, y: 40 + Math.random() * 30 };
          UI.toast('Location detected: ' + area + ', Karachi', 'ok', 'Location found');
          if (window.R) window.R();
        } else {
          UI.toast('Unable to access location. Please allow location permission or pick your area manually.', 'danger', 'Location error');
        }
      }, 1400);
    },
    submit: function () {
      const d = Store.draft();
      if (!d) return;
      const job = Store.postJob({
        customerId: d.customerId,
        category: d.category,
        title: d.title.trim(),
        description: d.description.trim(),
        images: d.images,
        audio: d.audio,
        location: { area: d.area, label: d.area },
        coords: d.coords,
        prefDate: d.prefDate,
        prefTime: d.flexible ? 'Flexible' : d.prefTime,
        flexible: d.flexible
      });
      Store.clearDraft();
      UI.toast('Your job was posted. Professionals are being notified.', 'ok', 'Job posted ' + job.id);
      UI.toast('Tip: switch to a worker account to see their side of the flow.', '', 'Demo tip');
      if (window.go) window.go('/customer/jobs/' + job.id);
    }
  },

  pickDate: function (iso) { JobActions.wiz.pick('prefDate', iso); },
  pickTime: function (t) { JobActions.wiz.pick('prefTime', t); JobActions.wiz.set('flexible', false); },
  toggleFlex: function () {
    const d = Store.draft();
    if (!d) return;
    d.flexible = !d.flexible;
    if (window.R) window.R();
  },

  wTransition: function (jobId, to) {
    Store.workerTransition(jobId, to);
    UI.toast('Status updated.', 'ok', 'Update');
    if (window.R) window.R();
  },

  submitInspection: function (jobId) {
    const resultEl = document.getElementById('ins-result');
    const requiredEl = document.getElementById('ins-required');
    const estEl = document.getElementById('ins-est');
    const result = resultEl ? resultEl.value.trim() : '';
    const required = requiredEl ? requiredEl.value.trim() : '';
    const est = estEl ? estEl.value : 0;
    const res = Store.submitInspection(jobId, { result: result, required: required, estimate: est });
    if (res.error) { UI.toast(res.error, 'danger', 'Inspection incomplete'); return; }
    UI.toast('Final quote submitted. Your customer can now review, negotiate, or reject it.', 'ok', 'Quote sent');
    if (window.R) window.R();
  },

  wfilter: function () {
    applyWorkerJobsFilter(Store.nearbyJobs());
  }
};
