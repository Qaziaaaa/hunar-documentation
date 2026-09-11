import { Store } from '../../app/state.js';
import { UI, fmtRs } from '../../shared/ui/ui.js';

export const PaymentActions = {
  payMethod: function (m) {
    document.querySelectorAll('.pay-opt').forEach(function (x) { x.classList.remove('on'); });
    const sel = document.querySelector('.pay-opt[data-m="' + m + '"]');
    if (sel) sel.classList.add('on');
    const inp = document.getElementById('pay-method');
    if (inp) inp.value = m;
  },

  pay: function (jobId) {
    const inp = document.getElementById('pay-method');
    const m = inp ? inp.value : 'wallet';
    UI.loader('Processing payment…');
    setTimeout(function () {
      UI.clearLoader();
      const res = Store.customerPay(jobId, m);
      if (res.error) {
        UI.toast(res.error, 'danger');
        return;
      }
      UI.toast('Payment of ' + fmtRs(Store.jobTotal(jobId)) + ' confirmed.', 'ok', 'Payment Successful');
      if (typeof window.go !== 'undefined') {
        window.go('/customer/jobs/' + jobId + '/payment');
      }
    }, 700);
  }
};
