import { ic } from '../../shared/icons/icons.js';
import { UI, esc } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';

export function openDisputeModal(jobId) {
  const j = Store.jobById(jobId);
  if (!j) return;

  const reasons = [
    'Customer refusing to pay',
    'Customer made false claims',
    'Scope of work disagreement',
    'Quality dispute raised by customer',
    'Other'
  ];

  const reasonOpts = reasons.map(function (r) {
    return '<option value="' + esc(r) + '">' + esc(r) + '</option>';
  }).join('');

  UI.openModal(
    '<div class="modal-h">' +
    '<div><h3 style="font-size:18px;font-weight:700;color:var(--navy)">Raise a Dispute</h3>' +
    '<div style="font-size:12.5px;color:var(--muted);margin-top:2px">Describe the issue clearly. Admin will review the case and contact both parties.</div></div>' +
    '<button class="icon-btn" onclick="UI.closeModal()">' + ic('x') + '</button></div>' +
    '<div class="modal-b">' +
    '<div class="field"><label>Reason for Dispute</label><select id="dsp-reason" class="select">' + reasonOpts + '</select></div>' +
    '<div class="field"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><label style="margin:0">Describe the issue</label><span id="dsp-char-cnt" class="smallnote">0 / 500</span></div>' +
    '<textarea id="dsp-desc" class="textarea" rows="4" maxlength="500" placeholder="Provide a clear description of the problem..." oninput="A.onDisputeInput(this)"></textarea></div>' +
    '<div class="field"><label>Attach Photos or Documents (Optional)</label><input type="file" id="dsp-file" class="input" accept="image/*" /></div>' +
    '<div style="display:flex;gap:10px;margin-top:18px">' +
    '<button class="btn btn-ghost" style="flex:1" onclick="UI.closeModal()">Cancel</button>' +
    '<button class="btn btn-danger-solid" style="flex:1" onclick="A.submitDispute(\'' + jobId + '\')">Submit Dispute</button>' +
    '</div></div>'
  );
}

export function disputeButtonHtml(job) {
  const canDispute = ['repair_approved', 'repair_in_progress', 'completed', 'paid'].indexOf(job.status) !== -1;
  if (!canDispute) return '';
  return '<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line);text-align:center">' +
    '<button class="btn btn-outline btn-sm" style="color:var(--danger);border-color:var(--danger)" onclick="A.openDispute(\'' + job.id + '\')">' +
    ic('alert', { s: 14 }) + ' Raise a Dispute</button></div>';
}
