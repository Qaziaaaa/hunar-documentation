import { ic } from '../../shared/icons/icons.js';
import { UI, esc, fmtRs, timeAgo } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';

export function offerBreakdownHtml(o) {
  if (!o) return '';
  const visit = o.amount || 0;
  const est = o.estimate || 0;
  return '<div class="est-box" style="border:1px solid #cde7e1;background:var(--brand-3);border-radius:13px;padding:14px;margin-top:12px">' +
    '<div class="smallnote" style="font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">' + ic('file', { s: 13 }) + ' Estimated Offer</div>' +
    '<div class="kv"><span class="k">Visit &amp; Diagnosis</span><span class="v">' + fmtRs(visit) + '</span></div>' +
    (est ? '<div class="kv"><span class="k">Estimated Repair</span><span class="v">' + fmtRs(est) + '</span></div>' : '') +
    '<div class="kv" style="border-bottom:none"><span class="k" style="font-weight:800">Estimated Total</span><span class="v" style="color:var(--brand);font-weight:800">' + fmtRs(visit + est) + '</span></div>' +
    '</div>';
}

export function offerStatus(j, of) {
  if (j.selectedOffer && j.selectedOffer.id === of.id) {
    return { label: 'Offer accepted · Visit confirmed', badge: 'b-ok' };
  }
  if (j.selectedOffer) {
    return { label: 'Another professional selected', badge: 'b-muted' };
  }
  return { label: 'Awaiting customer response', badge: 'b-amber' };
}

export function renderCustomerOffersView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const jobsWithOffers = (Store.state().jobs || []).filter(function (j) {
    return j.customerId === u.id && j.offers && j.offers.length > 0;
  });

  const html = jobsWithOffers.length ? '<div class="stack">' + jobsWithOffers.map(function (j) {
    return '<div class="card card-pad">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px"><div>' +
      '<h4>' + esc(j.title) + '</h4><div class="smallnote">' + j.offers.length + ' offers received · ' + esc(j.category) + '</div></div>' +
      '<a class="btn btn-outline btn-sm" href="#/customer/jobs/' + j.id + '">' + ic('eye', { s: 13 }) + ' View Job</a></div>' +
      '<div class="grid-2col">' + j.offers.map(function (o) {
        const w = Store.userById(o.workerId);
        return '<div class="wk-card">' +
          '<div class="wk-head">' + UI.avatar(w) +
          '<div><div class="wk-name">' + esc(w ? w.name : 'Worker') + '</div><div class="rating">' + UI.rating(w ? w.rating : 5, w ? w.ratingCount : 1) + '</div></div></div>' +
          offerBreakdownHtml(o) +
          '<div style="margin-top:14px">' +
          (j.selectedOffer ? (j.selectedOffer.id === o.id ? '<span class="badge b-ok">Selected</span>' : '')
            : '<button class="btn btn-primary btn-block btn-sm" onclick="A.selectWorker(\'' + j.id + '\',\'' + o.id + '\')">Select Worker (' + fmtRs(o.amount) + ')</button>') +
          '</div></div>';
      }).join('') + '</div></div>';
  }).join('') + '</div>' : UI.empty('chat', 'No offers yet', 'When workers send you visit charges, they will appear here.', '<a class="btn btn-primary" href="#/customer/post">Post a Job</a>');

  return { html: html };
}

export function renderWorkerOffersView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const myOffers = (Store.state().jobs || []).filter(function (j) {
    return j.offers && j.offers.some(function (o) { return o.workerId === u.id; });
  });

  const html = myOffers.length ? '<div class="stack">' + myOffers.map(function (j) {
    const of = j.offers.find(function (o) { return o.workerId === u.id; });
    const st = offerStatus(j, of);
    return '<div class="card card-pad">' +
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
      '<div><h4>' + esc(j.title) + '</h4><div class="smallnote">' + esc(j.category) + ' · Sent ' + timeAgo(of.at || j.createdAt) + '</div></div>' +
      '<span class="badge ' + st.badge + '">' + st.label + '</span></div>' +
      offerBreakdownHtml(of) +
      '<div style="margin-top:14px"><a class="btn btn-outline btn-sm" href="#/worker/offers/' + j.id + '">' + ic('eye', { s: 13 }) + ' View Offer Details</a></div>' +
      '</div>';
  }).join('') + '</div>' : UI.empty('send', 'No offers sent', 'You have not submitted offers on any jobs yet.', '<a class="btn btn-primary" href="#/worker/jobs">Find Nearby Jobs</a>');

  return { html: html };
}

export function renderWorkerOfferDetailView(params) {
  const j = Store.jobById(params.id);
  const u = Store.currentUser();
  if (!j || !u) {
    if (typeof window.go !== 'undefined') window.go('/worker/offers');
    return { html: '' };
  }
  const of = (j.offers || []).find(function (o) { return o.workerId === u.id; });
  if (!of) {
    if (typeof window.go !== 'undefined') window.go('/worker/offers');
    return { html: '' };
  }
  const st = offerStatus(j, of);
  const html = '<div class="card card-pad" style="max-width:540px;margin:0 auto">' +
    '<h3>' + esc(j.title) + '</h3>' +
    '<div class="smallnote" style="margin-bottom:14px">' + esc(j.category) + ' · ' + esc((j.location && j.location.area) || '') + '</div>' +
    '<div class="kv"><span class="k">Status</span><span class="v"><span class="badge ' + st.badge + '">' + st.label + '</span></span></div>' +
    offerBreakdownHtml(of) +
    '<div style="margin-top:18px;display:flex;gap:10px">' +
    '<a class="btn btn-ghost" href="#/worker/offers">' + ic('arrowL', { s: 14 }) + ' Back</a>' +
    (j.status === 'visit_confirmed' ? '<a class="btn btn-primary" href="#/worker/active/' + j.id + '">Go to Active Job</a>' : '') +
    '</div></div>';
  return { html: html };
}
