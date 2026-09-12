import { Store } from '../../app/state.js';
import { UI, fmtRs } from '../../shared/ui/ui.js';

export const VisitActions = {
  wTransition: function (jobId, to) {
    Store.workerTransition(jobId, to);
    const msgs = {
      on_the_way: 'Status updated: You are on the way.',
      arrived: 'Status updated: You arrived at customer location.',
      inspection: 'Status updated: Inspection started.'
    };
    UI.toast(msgs[to] || 'Job status updated.', 'ok', 'Status Updated');
    if (typeof window.R !== 'undefined') window.R();
  },

  submitInspection: function (jobId) {
    const resEl = document.getElementById('ins-res');
    const reqEl = document.getElementById('ins-req');
    const estEl = document.getElementById('ins-est');

    const result = resEl ? resEl.value.trim() : '';
    const required = reqEl ? reqEl.value.trim() : '';
    const estimate = parseInt(estEl ? estEl.value : '0', 10);

    const res = Store.submitInspection(jobId, { result: result, required: required, estimate: estimate });
    if (res.error) {
      UI.toast(res.error, 'danger');
      return;
    }
    UI.toast('Inspection report & repair quote submitted to customer.', 'ok', 'Report Sent');
    if (typeof window.R !== 'undefined') window.R();
  },

  cancelVisit: function (jobId, who) {
    UI.confirm({
      title: 'Cancel Visit Appointment',
      body: 'Are you sure you want to cancel this visit? Both parties will be notified.',
      danger: true,
      okText: 'Yes, cancel visit',
      icon: 'alert',
      onOk: function () {
        Store.cancelVisit(jobId, who === 'customer' ? 'Customer cancelled the visit.' : 'Worker cancelled the visit.');
        UI.toast('The visit has been cancelled.', 'danger', 'Cancelled');
        if (typeof window.go !== 'undefined') {
          window.go(who === 'customer' ? '/customer/jobs' : '/worker');
        }
      }
    });
  }
};
