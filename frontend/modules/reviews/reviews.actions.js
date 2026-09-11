import { Store } from '../../app/state.js';
import { UI } from '../../shared/ui/ui.js';
import { starFilled, starEmpty } from '../../shared/icons/icons.js';

let currentRating = 5;

export const ReviewActions = {
  setStars: function (n) {
    currentRating = n;
    document.querySelectorAll('.stars-input .st').forEach(function (el, i) {
      el.innerHTML = (i < n) ? starFilled(34) : starEmpty(34);
    });
  },

  submitReview: function (jobId) {
    const txtEl = document.getElementById('rv-text');
    const text = txtEl ? txtEl.value.trim() : '';
    const res = Store.submitReview(jobId, currentRating, text);
    if (res.error) {
      UI.toast(res.error, 'danger');
      return;
    }
    UI.toast('Thank you for submitting your review!', 'ok', 'Review recorded');
    if (typeof window.go !== 'undefined') {
      window.go('/customer/jobs/' + jobId);
    }
  }
};
