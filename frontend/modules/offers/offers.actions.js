import { Store } from '../../app/state.js';
import { UI, uid } from '../../shared/ui/ui.js';

export const OfferActions = {
  selectWorker: function (jobId, offerId) {
    UI.confirm({
      title: 'Confirm Worker & Lock Visit Fee',
      body: 'Selecting this professional locks their visit charge. Both sides will be notified to begin the visit.',
      okText: 'Confirm & Lock Fee',
      icon: 'checkC',
      onOk: function () {
        const res = Store.selectWorker(jobId, offerId);
        if (res.error) {
          UI.toast(res.error, 'danger');
          return;
        }
        UI.toast('Worker selected! Visit confirmed.', 'ok', 'Visit Confirmed');
        if (typeof window.go !== 'undefined') {
          window.go('/customer/jobs/' + jobId);
        }
      }
    });
  },

  workerSendOffer: function (jobId) {
    const amtEl = document.getElementById('of-amount');
    const estEl = document.getElementById('of-estimate');
    const amt = parseInt(amtEl ? amtEl.value : '0', 10);
    const est = parseInt(estEl ? estEl.value : '0', 10) || 0;

    if (!amt || amt < 50) {
      UI.toast('Please enter a valid visit charge (minimum Rs. 50).', 'danger');
      return;
    }

    const j = Store.jobById(jobId);
    if (!j) return;
    const u = Store.currentUser();

    const offer = {
      id: uid('of'),
      workerId: u.id,
      amount: amt,
      estimate: est,
      status: 'sent',
      at: Date.now()
    };

    if (!j.offers) j.offers = [];
    j.offers.push(offer);
    j.status = 'offers_received';
    Store.save();

    Store.notify(j.customerId, 'chat', 'New offer received', u.name + ' sent an offer of Rs. ' + amt + ' for ' + j.title + '.', '/customer/jobs/' + j.id);
    UI.toast('Offer sent to customer!', 'ok', 'Offer Submitted');
    if (typeof window.go !== 'undefined') {
      window.go('/worker/offers/' + jobId);
    }
  }
};
