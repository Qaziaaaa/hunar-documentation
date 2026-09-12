import { ic } from '../../shared/icons/icons.js';
import { UI, esc, fmtRs, timeAgo } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';
import { svcByName } from '../services/services.data.js';

export function extraBadge(st) {
  const m = {
    requested: ['Awaiting Quote', 'b-amber', 'clock'],
    quote_sent: ['Quote Sent', 'b-brand', 'chat'],
    approved: ['Approved', 'b-ok', 'check'],
    declined: ['Declined', 'b-danger', 'x']
  }[st] || [st, 'b-muted', 'info'];
  return '<span class="badge ' + m[1] + '">' + ic(m[2], { s: 12 }) + ' ' + m[0] + '</span>';
}

export function extraRow(ex, side, jobId) {
  const isCust = side === 'customer';
  let action = '';
  if (isCust) {
    if (ex.state === 'quote_sent') {
      action = '<div style="display:flex;gap:8px;margin-top:10px">' +
        '<button class="btn btn-primary btn-sm" style="flex:1" onclick="A.decideExtra(\'' + jobId + '\',\'' + ex.id + '\',\'approve\')">' + ic('check', { s: 14 }) + ' Approve ' + fmtRs(ex.quote) + '</button>' +
        '<button class="btn btn-outline btn-sm" onclick="A.decideExtra(\'' + jobId + '\',\'' + ex.id + '\',\'decline\')">Decline</button></div>';
    } else if (ex.state === 'approved') {
      action = '<div class="smallnote" style="margin-top:8px;color:var(--ok);font-weight:700">' + ic('check', { s: 13 }) + ' Added to your booking at ' + fmtRs(ex.quote) + '</div>';
    }
  } else if (ex.state === 'requested') {
    action = '<div class="field" style="margin-top:10px;margin-bottom:0"><label>Quote for this extra work (Rs.)</label>' +
      '<div style="display:flex;gap:8px;margin-top:8px"><input type="number" id="exq-' + ex.id + '" class="input" placeholder="e.g. 800" min="50" />' +
      '<button class="btn btn-soft" onclick="A.sendExtraQuote(\'' + jobId + '\',\'' + ex.id + '\')">Send Quote</button></div></div>';
  } else if (ex.state === 'quote_sent') {
    action = '<div class="smallnote" style="margin-top:8px">Quote of ' + fmtRs(ex.quote) + ' sent — waiting for customer approval.</div>';
  }
  return '<div class="ext-row" style="border:1px solid var(--line-2);border-radius:14px;padding:14px;display:flex;gap:12px">' +
    '<span class="svc-icon" style="flex:none;width:38px;height:38px;border-radius:11px;background:#eef1f4;color:var(--muted)">' + ic('toolbox', { s: 17 }) + '</span>' +
    '<div style="flex:1;min-width:0">' +
    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:14px">' + esc(ex.title) + '</b>' + extraBadge(ex.state) + '</div>' +
    (ex.note ? '<p style="font-size:13px;color:var(--muted);margin-top:6px">' + esc(ex.note) + '</p>' : '') +
    '<div class="smallnote" style="margin-top:4px">' + timeAgo(ex.requestedAt) + ' · extra work gets its own separate quote &amp; approval</div>' +
    action + '</div></div>';
}

export function extraWorkCard(j, side) {
  const extras = j.extras || [];
  const isCust = side === 'customer';
  const active = ['visit_confirmed', 'on_the_way', 'arrived', 'inspection', 'repair_negotiation', 'repair_agreed', 'repair_approved', 'repair_in_progress'].indexOf(j.status) !== -1;
  if (side === 'worker' && !extras.length) return '';
  if (isCust && !extras.length && !(active && j.workerId)) return '';
  const rows = extras.map(function (ex) { return extraRow(ex, side, j.id); }).join('');
  const addBtn = (isCust && active && j.workerId)
    ? '<button class="btn btn-outline" style="width:100%" onclick="A.openExtraModal(\'' + j.id + '\')">' + ic('plus', { s: 15 }) + ' Request Additional Work</button>'
    : '';
  const intro = (!extras.length && isCust)
    ? '<p class="smallnote" style="padding:6px 2px">Found something else while the professional is there — like fixing a tap too? Request it here. Each extra work gets its own quote and approval, so it never mixes with the original repair price.</p>'
    : '';
  const el = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="font-size:16.5px;font-weight:750">Additional Work</h3>' + (extras.length ? '<span class="badge b-white">' + extras.length + '</span>' : '') + '</div>';
  return '<div class="card"><div class="card-h"><div>' + el + '<p>Each request is priced &amp; approved separately</p></div></div>' +
    '<div class="card-pad"><div class="stack" style="gap:12px">' + intro + rows + addBtn + '</div></div></div>';
}

export function extraBillingRows(j) {
  return (j.extras || []).filter(function (x) { return x.state === 'approved'; }).map(function (x) {
    return '<div class="kv"><span class="k">' + esc(x.title) + '</span><span class="v">' + fmtRs(x.quote) + '</span></div>';
  }).join('');
}

export function proofSectionHtml(j) {
  if (!j.completion) return '';
  const imgs = (j.completion.images || []).map(function (img) {
    return '<img class="thumb" src="' + img + '" alt="proof" style="width:72px;height:72px;border-radius:10px;object-fit:cover" />';
  }).join('');
  return '<div class="card card-pad" style="margin-bottom:18px;background:#f8fafc"><div class="smallnote" style="font-weight:700;margin-bottom:8px">Completion Proof</div>' +
    (j.completion.note ? '<p style="font-size:13.5px;margin-bottom:8px">' + esc(j.completion.note) + '</p>' : '') +
    (imgs ? '<div style="display:flex;gap:8px">' + imgs + '</div>' : '') +
    '</div>';
}

export function approvedCard(j) {
  const w = Store.userById(j.workerId);
  const inProg = j.status === 'repair_in_progress';
  return '<div class="card"><div class="card-h"><h3>Repair Agreement</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
    '<div class="kv"><span class="k">Visit</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
    '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(j.repair ? j.repair.approvedEstimate : 0) + '</span></div>' +
    extraBillingRows(j) +
    '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:18px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div>' +
    (inProg ? '<div class="notice amber" style="margin-top:14px">' + ic('wrench') + '<span>' + esc(w ? w.name : 'Worker') + ' is currently repairing your ' + esc(j.category.toLowerCase()) + '. Updates will appear here.</span></div>' :
      '<div class="notice brand" style="margin-top:14px">' + ic('shield') + '<span>Repair approved. ' + esc(w ? w.name : 'Worker') + ' can now start the work.</span></div>') +
    '</div></div>';
}

export function jobCompleteCard(j) {
  const w = Store.userById(j.workerId);
  return '<div class="card"><div class="card-h"><h3>Job Completed</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad" style="text-align:center">' +
    '<div class="success-ring" style="margin:6px auto 16px;width:68px;height:68px;border-radius:50%;background:var(--ok-bg);color:var(--ok);display:grid;place-items:center">' + ic('check', { s: 32 }) + '</div>' +
    '<h3 style="font-size:18px;font-weight:800;margin-bottom:6px">Great — your repair is done!</h3>' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">' + esc(w ? w.name : 'Worker') + ' completed the ' + esc(j.category) + ' job. Please complete the payment to close this job.</p>' +
    '<div class="card-pad" style="background:#f8fafc;border:1px solid var(--line);border-radius:14px;text-align:left;margin-bottom:18px">' +
    '<div class="kv"><span class="k">Service</span><span class="v">' + esc(j.category) + '</span></div>' +
    '<div class="kv"><span class="k">Visit</span><span class="v">' + fmtRs(j.visitCharge) + '</span></div>' +
    '<div class="kv"><span class="k">Repair</span><span class="v">' + fmtRs(j.repair ? j.repair.approvedEstimate : 0) + '</span></div>' +
    extraBillingRows(j) +
    '<div class="kv" style="border-bottom:none"><span class="k">Total</span><span class="v" style="font-size:18px;color:var(--brand)">' + fmtRs(Store.jobTotal(j.id)) + '</span></div></div>' +
    proofSectionHtml(j) +
    '<a class="btn btn-primary btn-lg btn-block" href="#/customer/jobs/' + j.id + '/payment">' + ic('wallet', { s: 17 }) + ' Proceed to Payment</a></div></div>';
}

export function paidCard(j) {
  return '<div class="card"><div class="card-h"><h3>Payment Complete</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad" style="text-align:center">' +
    '<div class="success-ring" style="margin:6px auto 16px;width:68px;height:68px;border-radius:50%;background:var(--ok-bg);color:var(--ok);display:grid;place-items:center">' + ic('checkC', { s: 36 }) + '</div>' +
    '<h3 style="font-size:18px;font-weight:800;margin-bottom:6px">Paid ' + fmtRs(j.payment ? j.payment.amount : 0) + '</h3>' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">Paid via ' + ((j.payment && j.payment.method === 'wallet') ? 'Demo Wallet' : (j.payment && j.payment.method === 'cash') ? 'Cash' : 'Card') + ' · ' + new Date((j.payment && j.payment.at) || Date.now()).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</p>' +
    (j.review ? '<p style="color:var(--ok);font-weight:700;font-size:14px">Reviewed · ' + j.review.rating + ' stars</p>' :
      '<a class="btn btn-primary btn-lg" href="#/customer/jobs/' + j.id + '/review">' + ic('star', { s: 17 }) + ' Leave a Review</a>') +
    '</div></div>';
}

export function reviewedCard(j) {
  return '<div class="card"><div class="card-h"><h3>Reviewed</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad" style="text-align:center">' +
    '<div style="display:flex;gap:4px;justify-content:center;margin:6px 0 12px">' + UI.stars(j.review ? j.review.rating : 5, 22) + '</div>' +
    '<p style="color:var(--ink-2);font-size:14px;max-width:440px;margin:0 auto 6px">' + esc((j.review && j.review.comment) || '') + '</p>' +
    '<p class="smallnote">Your review is now visible on the worker’s profile.</p>' +
    '</div></div>';
}

export function cancelledCard(j) {
  if (j.cancelled && j.cancelled.kind === 'quote_rejected') {
    return '<div class="card"><div class="card-h"><h3>Job Ended</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad" style="text-align:center">' +
      '<div class="e-ic" style="margin:8px auto 16px">' + ic('x', { s: 30 }) + '</div>' +
      '<h3 style="font-size:18px;font-weight:800;margin-bottom:6px">Final quote rejected</h3>' +
      '<p style="color:var(--muted);font-size:13.5px;max-width:420px;margin:0 auto 18px">No repair was started and the job has been closed. You can post a new job or browse other professionals whenever you are ready.</p>' +
      '<div class="split" style="max-width:420px;margin:0 auto">' +
      '<a class="btn btn-primary btn-block" href="#/customer/post">' + ic('plus', { s: 15 }) + ' Post a new job</a>' +
      '<a class="btn btn-outline btn-block" href="#/workers">' + ic('users', { s: 15 }) + ' Browse workers</a></div>' +
      '</div></div>';
  }
  return '<div class="card"><div class="card-h"><h3>Cancelled</h3>' + UI.statusBadge(j.status) + '</div><div class="card-pad">' +
    '<div class="err-banner">' + ic('alert') + '<span>' + esc((j.cancelled && j.cancelled.reason) || 'Cancelled.') + '</span></div>' +
    '<a class="btn btn-primary" href="#/customer/post">' + ic('plus', { s: 15 }) + ' Post a new job</a></div></div>';
}

export function openExtraModal(jobId) {
  UI.openModal(
    '<div class="modal-h"><h3>Request Additional Work</h3><button data-close="1" class="icon-btn">' + ic('x') + '</button></div>' +
    '<div class="modal-b">' +
    '<p class="smallnote" style="margin-bottom:14px">Additional work gets its own separate price quote and approval from you before work begins.</p>' +
    '<div class="field"><label>What needs fixing?</label><input id="ex-title" class="input" placeholder="e.g. Fix leaking kitchen tap as well" /></div>' +
    '<div class="field"><label>Notes for worker (optional)</label><textarea id="ex-note" class="textarea" rows="2" placeholder="Any details..."></textarea></div>' +
    '<button class="btn btn-primary btn-block" onclick="A.requestExtra(\'' + jobId + '\')">' + ic('send', { s: 15 }) + ' Send Request to Worker</button>' +
    '</div>'
  );
}
