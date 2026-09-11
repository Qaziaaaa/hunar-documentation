import { Store } from '../../app/state.js';
import { UI } from '../../shared/ui/ui.js';
import { openDisputeModal } from './disputes.views.js';

export const DisputeActions = {
  openDispute: function (jobId) {
    openDisputeModal(jobId);
  },

  onDisputeInput: function (el) {
    const cntEl = document.getElementById('dsp-char-cnt');
    if (cntEl) {
      cntEl.textContent = el.value.length + ' / 500';
    }
  },

  submitDispute: function (jobId) {
    const reasonEl = document.getElementById('dsp-reason');
    const descEl = document.getElementById('dsp-desc');
    const reason = reasonEl ? reasonEl.value : '';
    const desc = descEl ? descEl.value.trim() : '';

    if (!desc) {
      UI.toast('Please provide a description of the issue.', 'danger', 'Description required');
      return;
    }

    const j = Store.jobById(jobId);
    if (j) {
      j.dispute = {
        reason: reason,
        description: desc,
        status: 'under_review',
        at: Date.now()
      };
      Store.save();
      const u = Store.currentUser();
      Store.notify(u.id, 'alert', 'Dispute Submitted', 'Your dispute for ' + j.title + ' is now under admin review.', '/worker/active/' + jobId);
    }

    UI.closeModal();
    UI.toast('Dispute submitted. Admin will review the case.', 'ok', 'Dispute Registered');
    if (typeof window.R !== 'undefined') window.R();
  }
};
