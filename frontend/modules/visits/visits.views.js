import { ic } from '../../shared/icons/icons.js';
import { UI, esc, fmtRs } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';

export function visitConfirmedCard(j) {
  const w = Store.userById(j.workerId);
  let statusLive = '';
  if (j.status === 'on_the_way') {
    statusLive = '<div class="notice amber" style="margin-bottom:12px">' + ic('truck') + '<span><b>' + esc(w ? w.name : 'Your worker') + ' is on the way.</b> You will be notified when they arrive.</span></div>';
  } else if (j.status === 'arrived') {
    statusLive = '<div class="notice brand" style="margin-bottom:12px">' + ic('pin') + '<span><b>' + esc(w ? w.name : 'Your worker') + ' has arrived.</b> They are about to start the inspection.</span></div>';
  } else if (j.status === 'inspection') {
    statusLive = '<div class="notice brand" style="margin-bottom:12px">' + ic('search') + '<span><b>Inspection in progress.</b> The report will appear here shortly.</span></div>';
  }
  return '<div class="card"><div class="card-h"><h3>Visit Confirmed</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' + statusLive +
    '<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">' + UI.avatar(w) +
    '<div><div style="font-weight:750">' + esc(w ? w.name : 'Worker') + ((w && w.verified) ? ' ' + ic('shield', { s: 14, style: 'color:var(--brand)' }) : '') + '</div><div class="smallnote">' + esc((w && w.tagline) || '') + '</div>' + UI.rating(w ? w.rating : 5, w ? w.ratingCount : 1) + '</div></div>' +
    '<div class="kv"><span class="k">Visit charge (locked)</span><span class="v" style="color:var(--brand)">' + fmtRs(j.visitCharge) + '</span></div>' +
    '<div class="kv"><span class="k">Date</span><span class="v">' + esc(j.prefDate || 'Flexible') + '</span></div>' +
    '<div class="kv"><span class="k">Time</span><span class="v">' + esc(j.prefTime || 'Flexible') + '</span></div>' +
    '<div class="kv" style="border-bottom:none"><span class="k">Location</span><span class="v">' + esc((j.location && j.location.area) || '-') + '</span></div>' +
    '<div style="display:flex;gap:10px;margin-top:16px"><a class="btn btn-outline" href="#/customer/jobs/' + j.id + '">' + ic('eye', { s: 15 }) + ' View Details</a>' +
    '<button class="btn btn-danger" onclick="A.cancelVisit(\'' + j.id + '\',\'customer\')">Cancel Visit</button></div></div></div>';
}

export function inspectionCard(j) {
  const w = Store.userById(j.workerId);
  const r = j.repair || {};
  const offerEst = j.selectedOffer && j.selectedOffer.estimate ? j.selectedOffer.estimate : 0;
  const agreed = j.status === 'repair_agreed';

  let actionHtml = '';
  if (!agreed) {
    actionHtml = '<div class="card card-pad" style="margin-top:14px">' +
      '<div class="kv"><span class="k">Inspection result</span><span class="v" style="text-align:left">' + esc(r.result || '') + '</span></div>' +
      '<div class="kv"><span class="k">Required repair</span><span class="v" style="text-align:left">' + esc(r.required || '') + '</span></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Final Repair Quote</span><span class="v" style="color:var(--brand);font-size:17px;font-weight:800">' + fmtRs(r.estimate || 0) + '</span></div>' +
      (offerEst ? '<div class="notice brand" style="margin-top:12px">' + ic('info') + '<span>This is the <b>final</b> quote after inspecting your ' + esc(j.category.toLowerCase()) + ' - it may differ from the offer estimate of ' + fmtRs(offerEst) + '. Approve to start the repair, or reject and the job ends.</span></div>' : '') +
      '<div class="divide"></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:17px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
      '<div class="btn-pair" style="margin-top:14px">' +
      '<button class="btn btn-primary" onclick="A.approveRepairAmount(\'' + j.id + '\')">' + ic('check', { s: 15 }) + ' Approve ' + fmtRs(r.estimate || 0) + '</button>' +
      '<button class="btn btn-danger-solid" onclick="A.rejectFinalQuote(\'' + j.id + '\')">' + ic('x', { s: 15 }) + ' Reject</button></div>' +
      '<div class="fhint" style="margin-top:8px">Your total will be visit charge + approved final quote.</div></div>';
  } else {
    actionHtml = '<div class="card card-pad" style="margin-top:14px;border-color:#bfe6cd">' +
      '<div class="kv"><span class="k">Visit charge</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
      '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(r.approvedEstimate || 0) + '</span></div>' +
      '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:17px">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
      '<button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="A.approveRepairFinal(\'' + j.id + '\')">' + ic('shield', { s: 16 }) + ' Approve Repair</button>' +
      '<div class="fhint" style="text-align:center;margin-top:8px">Approve to lock this price and start the repair.</div></div>';
  }

  return '<div class="card"><div class="card-h"><h3>Inspection Complete</h3>' + UI.statusBadge(j.status) + '</div>' +
    '<div class="card-pad">' + actionHtml + '</div></div>';
}

export function renderCustomerVisitsView() {
  const visits = Store.upcomingVisits('customer');
  const html = visits.length ? '<div class="stack">' + visits.map(function (v) {
    return visitConfirmedCard(v);
  }).join('') + '</div>' : UI.empty('calendar', 'No upcoming visits', 'When you confirm a worker offer, your appointment will appear here.', '<a class="btn btn-primary" href="#/customer/jobs">View My Jobs</a>');
  return { html: html };
}

export function renderWorkerVisitsView() {
  const visits = Store.upcomingVisits('worker');
  const html = visits.length ? '<div class="stack">' + visits.map(function (v) {
    const cust = Store.userById(v.customerId);
    return '<div class="job-card" style="cursor:pointer" onclick="go(\'/worker/active/' + v.id + '\')"><div class="jc-body">' +
      '<div class="jc-top"><b style="flex:1">' + esc(v.title) + '</b>' + UI.statusBadge(v.status) + '</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">' +
      (cust ? '<div style="display:flex;gap:10px;align-items:center">' + UI.avatar(cust) + '<div><b style="font-size:14px">' + esc(cust.name) + '</b><div class="smallnote">' + esc((v.location && v.location.area) || '') + '</div></div></div>' : '') +
      '<div class="smallnote" style="font-size:13px">' + ic('calendar', { s: 13 }) + ' ' + esc(v.prefDate || 'Flexible') + ' · ' + ic('clock', { s: 13 }) + ' ' + esc(v.prefTime || '') + '</div>' +
      (v.visitCharge ? '<div class="total-bar" style="margin-left:auto"><span>Visit charge</span><span class="v">' + fmtRs(v.visitCharge) + '</span></div>' : '') + '</div></div></div>';
  }).join('') + '</div>' : UI.empty('calendar', 'No upcoming visits', 'Confirmed visits will appear here, along with Start Visit actions.', '<a class="btn btn-primary" href="#/worker/jobs">Find jobs</a>');
  return { html: html };
}
