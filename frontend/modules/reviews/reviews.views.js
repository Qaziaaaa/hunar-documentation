import { ic, starEmpty } from '../../shared/icons/icons.js';
import { UI, esc, timeAgo } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';

export function renderReviewView(params) {
  const j = Store.jobById(params.id);
  if (!j) {
    if (typeof window.go !== 'undefined') window.go('/customer');
    return { html: '' };
  }
  if (j.review) {
    return {
      html: '<div class="card" style="max-width:520px;margin:0 auto"><div class="card-pad" style="text-align:center">' +
        '<div class="e-ic" style="margin:0 auto 12px;background:var(--ok-bg);color:var(--ok)">' + ic('checkC', { s: 30 }) + '</div>' +
        '<h3 style="margin-bottom:6px">Review Submitted</h3>' +
        '<p style="color:var(--muted);font-size:13.5px;margin-bottom:14px">Thank you for rating this service.</p>' +
        '<div class="rating" style="margin-bottom:8px">' + UI.stars(j.review.rating, 18) + '</div>' +
        '<p style="font-size:14px;color:var(--ink-2)">' + esc(j.review.comment || '') + '</p>' +
        '<div style="margin-top:18px"><a class="btn btn-outline" href="#/customer/jobs/' + j.id + '">View Job</a></div>' +
        '</div></div>'
    };
  }

  const w = Store.userById(j.workerId);
  const html = '<div class="card" style="max-width:520px;margin:0 auto"><div class="card-pad" style="text-align:center">' +
    '<h3 style="font-size:20px;font-weight:800;margin-bottom:6px">How was your experience?</h3>' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">Your honest feedback helps other customers — and rewards good work.</p>' +
    (w ? '<div style="display:flex;gap:12px;align-items:center;justify-content:center;margin-bottom:8px">' + UI.avatar(w) + '<div style="text-align:left"><b>' + esc(w.name) + '</b><div class="smallnote">' + esc(j.category) + ' · ' + j.id + '</div></div></div>' : '') +
    '<div class="stars-input" style="margin:8px 0 18px">' + [1, 2, 3, 4, 5].map(function (n) {
      return '<span class="st" data-v="' + n + '" onclick="A.setStars(' + n + ')">' + starEmpty(34) + '</span>';
    }).join('') + '</div>' +
    '<textarea id="rv-text" class="textarea" placeholder="Write a short review… (optional)"></textarea>' +
    '<button class="btn btn-primary btn-lg btn-block" style="margin-top:12px" onclick="A.submitReview(\'' + j.id + '\')">' + ic('send', { s: 16 }) + ' Submit Review</button>' +
    '</div></div>';
  return { html: html };
}

export function renderCustomerReviewsView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const rvs = (Store.state().reviews || []).filter(function (r) {
    const j = Store.jobById(r.jobId);
    return j && j.customerId === u.id;
  });
  const html = '<div class="card">' + (rvs.length ? rvs.map(function (r) {
    const j = Store.jobById(r.jobId);
    const w = Store.userById(r.workerId);
    return '<div class="notif-item"><div class="n-ic" style="background:var(--amber-bg);color:#b45309">' + ic('star', { s: 18 }) + '</div><div style="flex:1"><h4>' +
      esc(j ? j.title : '') + (w ? ' · ' + esc(w.name) : '') + '</h4><div class="rating" style="margin:4px 0">' +
      UI.stars(r.rating, 14) + '</div><p>' + esc(r.text || 'No comment') + '</p><div class="n-t">' + timeAgo(r.at) + '</div></div></div>';
  }).join('') : UI.empty('star', 'No reviews yet', 'Reviews will appear after completing jobs.', '')) + '</div>';
  return { html: html };
}

export function renderWorkerReviewsView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const rvs = Store.reviewsFor(u.id).filter(function (r) { return r.text || r.rating; });
  const html = '<div class="card">' + (rvs.length ? rvs.map(function (r) {
    return '<div class="notif-item"><div class="n-ic" style="background:var(--amber-bg);color:#b45309">' + ic('star', { s: 18 }) + '</div><div style="flex:1"><h4>' +
      esc(r.customerName || 'Customer') + '</h4><div class="rating" style="margin:4px 0">' + UI.stars(r.rating, 14) +
      '</div><p>' + esc(r.text || '') + '</p><div class="n-t">' + timeAgo(r.at) + '</div></div></div>';
  }).join('') : UI.empty('star', 'No reviews yet', 'Reviews will appear after completing jobs.', '')) + '</div>';
  return { html: html };
}
