import { ic, starFilled, starEmpty } from '../icons/icons.js';
export { ic, starFilled, starEmpty };

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

export function fmtRs(v) {
  return 'Rs. ' + (typeof v === 'number' ? Number(v).toLocaleString('en-PK') : v);
}

export function timeAgo(t) {
  if (!t) return '';
  const d = Date.now() - t, m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const dd = Math.floor(h / 24);
  if (dd < 7) return dd + 'd ago';
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function dateLabel(t) {
  const d = new Date(t);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function initials(name) {
  if (!name) return 'H';
  return name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
}

export function uid(prefix) {
  return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export function jobId() {
  return 'H-' + Math.floor(1000 + Math.random() * 9000);
}

export function nowISO(t) {
  return t != null ? t : Date.now();
}

export const UI = {
  esc: esc,
  money: fmtRs,
  fmtRs: fmtRs,
  timeAgo: timeAgo,
  dateLabel: dateLabel,
  initials: initials,

  toast: function (msg, type, title) {
    const root = document.getElementById('toasts') || document.body;
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    const icn = type === 'danger' ? 'alert' : type === 'ok' ? 'checkC' : 'bell';
    el.innerHTML = '<span>' + ic(icn, { s: 18 }) + '</span><div><div class="tt">' + esc(title || '') + '</div><div class="tb">' + esc(msg) + '</div></div>';
    root.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'all .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(function () { el.remove(); }, 300);
    }, 3800);
  },

  _modalEl: null,
  openModal: function (html, opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root') || document.body;
    const wasOpen = this._modalEl;
    if (wasOpen) wasOpen.remove();
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML = '<div class="modal' + (opts.lg ? ' lg' : '') + '">' + html + '</div>';
    ov.addEventListener('mousedown', function (e) {
      if (e.target === ov && opts.backdropClose !== false) ov.remove();
    });
    root.appendChild(ov);
    this._modalEl = ov;
    if (opts.onMount) setTimeout(opts.onMount, 0);
    return {
      close: function () { ov.remove(); },
      el: ov
    };
  },
  closeModal: function () {
    if (this._modalEl) this._modalEl.remove();
    this._modalEl = null;
  },

  confirm: function (opts) {
    const icn = opts.icon || 'alert';
    UI.openModal(
      '<div class="modal-b" style="text-align:center;padding:30px 26px 22px">' +
      '<div class="confirm-ic" style="' + (opts.danger ? '' : 'background:var(--brand-3);color:var(--brand);') + '">' + ic(icn, { s: 26 }) + '</div>' +
      '<h3 style="font-size:18px;font-weight:800;margin-bottom:8px">' + esc(opts.title) + '</h3>' +
      '<p style="color:var(--muted);font-size:14px;max-width:400px;margin:0 auto">' + esc(opts.body || '') + '</p>' +
      '</div>' +
      '<div class="modal-f">' +
      '<button class="btn btn-ghost" data-close="1">' + esc(opts.cancelText || 'Keep ') + '</button>' +
      '<button class="btn ' + (opts.danger ? 'btn-danger-solid' : 'btn-primary') + '" data-confirm="1">' + esc(opts.okText || 'Confirm') + '</button>' +
      '</div>',
      {
        onMount: function () {
          const el = UI._modalEl;
          if (!el) return;
          const okBtn = el.querySelector('[data-confirm]');
          const cancelBtn = el.querySelector('[data-close]');
          if (cancelBtn) cancelBtn.addEventListener('click', function () { el.remove(); opts.onCancel && opts.onCancel(); });
          if (okBtn) okBtn.addEventListener('click', function () { el.remove(); opts.onOk && opts.onOk(); });
        }
      }
    );
  },

  loader: function (html) {
    const root = document.getElementById('loading-root');
    if (!root) return;
    root.innerHTML = '<div class="modal-overlay" style="z-index:220;align-items:center"><div style="text-align:center;color:#fff"><div class="spin" style="margin:0 auto 16px;border-color:rgba(255,255,255,.25);border-top-color:#fff"></div><div style="font-weight:700">' + (html || 'Processing…') + '</div></div></div>';
  },
  clearLoader: function () {
    const root = document.getElementById('loading-root');
    if (root) root.innerHTML = '';
  },

  avatar: function (u, size, opts) {
    opts = opts || {};
    const cls = size === 'lg' ? ' av-lg' : size === 'xl' ? ' av-xl' : '';
    const col = (u && u.color) || '#123b5d';
    const inner = (u && u.avatar)
      ? '<img src="' + esc(u.avatar) + '" alt="" />'
      : esc(initials(u ? u.name : ''));
    let vb = '';
    if (u && u.verified) vb = '<span class="vbadge">' + ic('shield', { s: 11 }) + '</span>';
    let on = '';
    if (opts.online) on = '<span class="online"></span>';
    return '<span class="avatar' + cls + '" style="background:' + col + '">' + inner + on + vb + '</span>';
  },

  stars: function (r, s) {
    r = Math.round((r || 0) * 2) / 2;
    let out = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= r) out += starFilled(s);
      else if (i - r === 0.5) out += starFilled(s);
      else out += starEmpty(s);
    }
    return out;
  },

  rating: function (r, cnt) {
    return '<span class="rating">' + this.stars(r, 15) +
      (r ? '<span class="rtxt">' + (Number(r).toFixed(1)) + '</span>' : '<span class="rtxt">New</span>') +
      (cnt ? '<span class="rcnt">(' + cnt + ')</span>' : '') + '</span>';
  },

  statusBadge: function (st) {
    const m = {
      receiving_offers: ['Receiving Offers', 'b-amber', 'clock'],
      offers_received: ['Offers Received', 'b-amber', 'chat'],
      visit_confirmed: ['Visit Confirmed', 'b-info', 'checkC'],
      on_the_way: ['On The Way', 'b-brand', 'truck'],
      arrived: ['Worker Arrived', 'b-brand', 'pin'],
      inspection: ['Inspection', 'b-amber', 'search'],
      repair_negotiation: ['Repair Negotiation', 'b-brand', 'chat'],
      repair_agreed: ['Repair Agreed', 'b-info', 'checkC'],
      repair_approved: ['Repair Approved', 'b-ok', 'shield'],
      repair_in_progress: ['Repair In Progress', 'b-brand', 'wrench'],
      completed: ['Completed · Payment Due', 'b-amber', 'wallet'],
      paid: ['Paid', 'b-ok', 'checkC'],
      reviewed: ['Reviewed', 'b-muted', 'star'],
      cancelled: ['Cancelled', 'b-danger', 'x']
    }[st] || [st, 'b-muted', 'info'];
    const dot = (st === 'on_the_way' || st === 'arrived') ? '<span class="dot-pulse"></span>' : '';
    return '<span class="badge ' + m[1] + '">' + dot + ic(m[2], { s: 13 }) + ' ' + m[0] + '</span>';
  },

  empty: function (icon, title, text, actionHtml) {
    return '<div class="empty">' +
      '<div class="e-ic">' + ic(icon, { s: 30 }) + '</div>' +
      '<h3>' + esc(title) + '</h3>' +
      '<p>' + esc(text) + '</p>' +
      (actionHtml ? actionHtml : '') + '</div>';
  },

  jobTimeline: function (job) {
    if (job.cancelled) {
      return '<div class="tl"><div class="tl-item done"><span class="tl-dot">' + ic('x', { s: 12 }) + '</span><div class="t-title">Job Cancelled</div><div class="t-time">' + esc(job.cancelled.reason || '') + '</div></div></div>';
    }
    const prog = {
      receiving_offers: 0, offers_received: 0,
      visit_confirmed: 2, on_the_way: 2, arrived: 3,
      inspection: 4, repair_negotiation: 5, repair_agreed: 5, repair_approved: 6,
      repair_in_progress: 7, completed: 8, paid: 9, reviewed: 10
    };
    const cur = prog[job.status] !== undefined ? prog[job.status] : 0;
    const steps = [
      'Job Posted', 'Worker Selected', 'Visit Confirmed', 'Worker Arrived',
      'Inspection Completed', 'Repair Price Agreed', 'Repair Approved',
      'Repair In Progress', 'Job Completed', 'Payment', 'Review'
    ];
    let out = '<div class="tl">';
    steps.forEach(function (s, i) {
      const cls = i < cur ? 'done' : i === cur ? 'current' : 'todo';
      const cap = i === cur && cur === 0 ? '<span class="t-time">' + ((job.offers && job.offers.length) ? (job.offers.length + ' workers interested') : 'awaiting offers…') + '</span>' : '';
      out += '<div class="tl-item ' + cls + '"><span class="tl-dot">' + (i < cur ? ic('check', { s: 12 }) : '') + '</span><div class="t-title">' + s + '</div>' + cap + '</div>';
    });
    out += '</div>';
    return out;
  },

  sectionTitle: function (icon, title, sub, action) {
    return '<div class="sec-head"><div><h3 class="section-title" style="font-size:22px">' + (icon ? ic(icon, { s: 22, cls: 'ic', style: 'vertical-align:-3px;margin-right:8px;color:var(--brand)' }) : '') + title + '</h3>' +
      (sub ? '<p class="section-sub" style="font-size:13.5px;margin-bottom:0">' + esc(sub) + '</p>' : '') + '</div>' + (action || '') + '</div>';
  },

  mediaRow: function (job) {
    let out = '';
    if (job.images && job.images.length) {
      out += '<div class="jc-imgs">' + job.images.slice(0, 4).map(function (img, i) {
        return '<img class="thumb" src="' + img + '" alt="photo ' + (i + 1) + '" />';
      }).join('') + '</div>';
    }
    if (job.audio) {
      out += '<div class="voice-chips"><span class="voice-chip">' + ic('mic', { s: 13 }) + ' Voice note · ' + job.audio.duration + 's</span></div>';
    }
    return out;
  },

  errBanner: function (icon, msg) {
    return '<div class="err-banner" style="margin-bottom:14px">' + ic(icon, { s: 17 }) + '<span>' + esc(msg) + '</span></div>';
  },

  workerCard: function (u, opts) {
    opts = opts || {};
    const tags = (u.skills || []).slice(0, 2).map(function (s) {
      return '<span class="badge b-white">' + ic('wrench', { s: 12 }) + ' ' + esc(s) + '</span>';
    }).join(' ');
    return '<div class="wk-card" data-open-worker="' + u.id + '">' +
      '<div class="wk-head">' + UI.avatar(u) +
      '<div style="min-width:0"><div class="wk-name">' + esc(u.name) + (u.verified ? ' ' + ic('shield', { s: 14, style: 'color:var(--brand);vertical-align:-2px' }) : '') + '</div>' +
      '<div class="wk-role">' + esc(u.tagline || 'Professional') + '</div></div></div>' +
      '<div class="rating" style="margin-bottom:6px">' + UI.rating(u.rating, u.ratingCount) + '</div>' +
      '<div class="wk-meta"><span>' + ic('briefcase', { s: 13 }) + ' ' + (u.jobsDone || 0) + ' jobs</span><span>' + ic('clock', { s: 13 }) + ' ' + (u.years || 0) + ' yrs</span><span>' + ic('pin', { s: 13 }) + ' ' + esc(u.area || 'Nearby') + '</span></div>' +
      '<div class="split">' + tags + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:14px">' +
      '<button class="btn btn-outline btn-sm growy" data-open-worker="' + u.id + '" style="flex:1">' + ic('eye', { s: 14 }) + ' View Profile</button>' +
      (opts.offer ? '<button class="btn btn-primary btn-sm growy" data-open-worker="' + u.id + '" style="flex:1">View Profile</button>' : '') +
      '</div></div>';
  }
};


export function wavUri(seconds) {
  const sr = 8000, n = Math.max(1, Math.round(seconds)) * sr, dataLen = n * 2;
  const buf = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buf);
  const wstr = function (o, s) { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  wstr(0, 'RIFF'); v.setUint32(4, 36 + dataLen, true); wstr(8, 'WAVE');
  wstr(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  wstr(36, 'data'); v.setUint32(40, dataLen, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const e = (0.3 + 0.2 * Math.sin(t * 3.7)) * Math.sin(2 * Math.PI * 220 * t);
    v.setInt16(o, Math.max(-1, Math.min(1, e)) * 0x7FFF, true); o += 2;
  }
  const parts = [];
  for (let i = 0; i < buf.byteLength; i += 4096) parts.push(String.fromCharCode.apply(null, new Uint8Array(buf, i, Math.min(4096, buf.byteLength - i))));
  return 'data:audio/wav;base64,' + btoa(parts.join(''));
}

UI.wavUri = wavUri;

if (typeof window !== 'undefined') {
  window.UI = UI;
  window.esc = esc;
  window.fmtRs = fmtRs;
  window.timeAgo = timeAgo;
  window.dateLabel = dateLabel;
  window.initials = initials;
  window.uid = uid;
  window.jobId = jobId;
  window.nowISO = nowISO;
  window.wavUri = wavUri;
}

