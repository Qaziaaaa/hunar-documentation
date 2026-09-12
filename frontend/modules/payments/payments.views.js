import { ic } from '../../shared/icons/icons.js';
import { UI, esc, fmtRs, timeAgo } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';

export function renderPaymentCheckoutView(params) {
  const j = Store.jobById(params.id);
  if (!j) {
    if (typeof window.go !== 'undefined') window.go('/customer');
    return { html: '' };
  }
  const total = Store.jobTotal(j.id);
  const w = Store.userById(j.workerId);

  const html = '<div class="grid-2col"><div class="stack">' +
    (j.payment ? '<div class="card card-pad" style="text-align:center">' +
      '<div class="e-ic" style="margin:0 auto 12px;background:var(--ok-bg);color:var(--ok)">' + ic('checkC', { s: 32 }) + '</div>' +
      '<h3>Payment Complete</h3>' +
      '<p style="color:var(--muted);font-size:14px;margin:8px 0 16px">You paid ' + fmtRs(j.payment.amount) + ' via ' + (j.payment.method === 'wallet' ? 'Demo Wallet' : j.payment.method === 'cash' ? 'Cash' : 'Card') + '.</p>' +
      '<a class="btn btn-primary" href="#/customer/jobs/' + j.id + '/review">' + ic('star', { s: 15 }) + ' Leave a Review</a></div>'
      : '<div class="card card-pad">' +
      '<h3 style="margin-bottom:6px">Select Payment Method</h3>' +
      '<p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">Choose how you want to settle the payment with ' + esc(w ? w.name : 'the worker') + '.</p>' +
      '<div class="pay-options">' +
      '<div class="pay-opt on" data-m="wallet" onclick="A.payMethod(\'wallet\')"><span class="p-ic" style="background:var(--brand-3);color:var(--brand)">' + ic('wallet', { s: 22 }) + '</span><h4>Demo Wallet</h4><p>Instant · balance Rs. ' + (25000).toLocaleString('en-PK') + '</p></div>' +
      '<div class="pay-opt" data-m="cash" onclick="A.payMethod(\'cash\')"><span class="p-ic" style="background:var(--amber-bg);color:#b45309">' + ic('cash', { s: 22 }) + '</span><h4>Cash</h4><p>Pay on completion</p></div>' +
      '<div class="pay-opt" data-m="card" onclick="A.payMethod(\'card\')"><span class="p-ic" style="background:var(--info-bg);color:var(--info)">' + ic('card', { s: 22 }) + '</span><h4>Card</h4><p>Visa · Mastercard</p></div></div>' +
      '<input type="hidden" id="pay-method" value="wallet" />' +
      '</div></div>') +
    (j.status === 'completed' ? '<a class="btn btn-ghost" href="#/customer/jobs/' + j.id + '">' + ic('arrowL', { s: 15 }) + ' Back to job</a>' : '') +
    '</div><div class="stack">' +
    '<div class="pay-summary"><div class="row"><span>Service</span><span>' + esc(j.category) + '</span></div>' +
    '<div class="row"><span>Visit charge</span><span>' + fmtRs(j.visitCharge) + '</span></div>' +
    '<div class="row"><span>Repair</span><span>' + fmtRs(j.repair ? j.repair.approvedEstimate : 0) + '</span></div>' +
    (j.extras || []).filter(function (x) { return x.state === 'approved'; }).map(function (x) {
      return '<div class="row"><span>' + esc(x.title) + '</span><span>' + fmtRs(x.quote) + '</span></div>';
    }).join('') +
    '<div class="row strong"><span>Total Payable</span><span>' + fmtRs(total) + '</span></div>' +
    '<div style="margin-top:18px;display:flex;gap:10px">' +
    (j.payment ? '<a class="btn btn-outline btn-block" href="#/customer/jobs/' + j.id + '/review">' + ic('star', { s: 15 }) + ' Leave a Review</a>'
      : '<button class="btn btn-block" style="background:#fff;color:#0f1f26;font-weight:800" onclick="A.pay(\'' + j.id + '\')">' + ic('wallet', { s: 16 }) + ' Pay ' + fmtRs(total) + '</button>') + '</div></div>' +
    '<div class="card card-pad"><h3 style="margin-bottom:6px">About this payment</h3><p style="color:var(--muted);font-size:13px">This is a demo payment — no real money moves. The full journey, from negotiation to receipt, works exactly like the real thing.</p></div>' +
    '</div></div>';

  return { html: html };
}

export function renderCustomerPaymentsView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const pays = (Store.state().payments || []).filter(function (p) { return p.customerId === u.id; });
  const html = '<div class="card">' +
    '<div class="card-h"><h3>Payment History</h3><span class="badge b-brand">Total: ' + fmtRs(Store.totalSpent()) + '</span></div>' +
    (pays.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Job</th><th>Method</th><th>Date</th><th class="right">Amount</th></tr></thead><tbody>' +
    pays.map(function (p) {
      const j = Store.jobById(p.jobId);
      return '<tr><td><b>' + esc(j ? j.title : p.jobId) + '</b><div class="smallnote">' + p.jobId + '</div></td><td><span class="badge b-white">' +
        ic(p.method === 'wallet' ? 'wallet' : p.method === 'cash' ? 'cash' : 'card', { s: 13 }) + ' ' +
        (p.method === 'wallet' ? 'Demo Wallet' : p.method === 'cash' ? 'Cash' : 'Card') + '</span></td><td>' +
        timeAgo(p.at) + '</td><td class="right"><b>' + fmtRs(p.amount) + '</b></td></tr>';
    }).join('') + '</tbody></table></div>' : UI.empty('wallet', 'No payments yet', 'Your payments will appear here after jobs are completed and paid.')) + '</div>';
  return { html: html };
}

export function renderWorkerEarningsView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const earn = Store.earnings();
  const pays = (Store.state().payments || []).filter(function (p) { return p.workerId === u.id; });
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = (d.getMonth() + 1) + '-' + d.getFullYear();
    months.push({ key: key, label: d.toLocaleDateString('en-GB', { month: 'short' }) });
  }
  const maxV = Math.max.apply(null, months.map(function (m) { return earn.monthly[m.key] || 0; }).concat([100]));
  const chart = '<div style="display:flex;gap:10px;align-items:flex-end;height:140px;padding:10px 4px 0">' + months.map(function (m) {
    const v = earn.monthly[m.key] || 0;
    const h = Math.max(6, Math.round(v / maxV * 110));
    return '<div style="flex:1;text-align:center"><div style="height:110px;display:flex;align-items:flex-end;justify-content:center"><div style="width:60%;background:var(--brand-grad);border-radius:6px 6px 0 0;height:' + h + 'px;min-width:18px" title="' + fmtRs(v) + '"></div></div><div style="font-size:11px;color:var(--muted);font-weight:700;margin-top:6px">' + m.label + '</div></div>';
  }).join('') + '</div>';

  const commissionRate = 0.15;
  const platformCut = Math.round(earn.total * commissionRate);
  const workerNet = earn.total - platformCut;

  const html = '<div class="stats cols-3" style="margin-bottom:18px">' +
    '<div class="stat"><span class="si si-g">' + ic('wallet', { s: 22 }) + '</span><div><div class="sv">' + fmtRs(workerNet) + '</div><div class="sl">Net Payout (85%)</div></div></div>' +
    '<div class="stat"><span class="si si-t">' + ic('checkC', { s: 22 }) + '</span><div><div class="sv">' + (Store.statsForWorker().completed) + '</div><div class="sl">Jobs completed</div></div></div>' +
    '<div class="stat"><span class="si si-a">' + ic('star', { s: 22 }) + '</span><div><div class="sv">' + (u.rating || 'New') + '</div><div class="sl">Rating</div></div></div></div>' +
    '<div class="grid-2col"><div class="card card-pad"><h3 style="margin-bottom:10px">Earnings Overview</h3>' + chart + '</div>' +
    '<div class="card card-pad"><h3 style="margin-bottom:12px">Settlement Breakdown</h3>' +
    '<div class="kv"><span class="k">Gross Revenue</span><span class="v">' + fmtRs(earn.total) + '</span></div>' +
    '<div class="kv"><span class="k">Platform Fee (15%)</span><span class="v" style="color:var(--muted)">- ' + fmtRs(platformCut) + '</span></div>' +
    '<div class="kv" style="font-weight:700;color:var(--ok)"><span class="k">Worker Balance</span><span class="v">' + fmtRs(workerNet) + '</span></div>' +
    '</div></div>' +
    '<div class="card" style="margin-top:18px"><div class="card-h"><h3>Payout Transactions</h3></div>' +
    (pays.length ? '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Job</th><th>Method</th><th>Date</th><th class="right">Paid Amount</th></tr></thead><tbody>' +
    pays.map(function (p) {
      const j = Store.jobById(p.jobId);
      return '<tr><td><b>' + esc(j ? j.title : p.jobId) + '</b></td><td><span class="badge b-white">' + (p.method === 'wallet' ? 'Wallet' : p.method === 'cash' ? 'Cash' : 'Card') + '</span></td><td>' + timeAgo(p.at) + '</td><td class="right"><b>' + fmtRs(p.amount) + '</b></td></tr>';
    }).join('') + '</tbody></table></div>' : UI.empty('wallet', 'No earnings recorded yet', 'Earnings will appear as customers pay for completed work.')) + '</div>';

  return { html: html };
}
