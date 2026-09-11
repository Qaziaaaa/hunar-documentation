import { Store } from './state.js';
import { UI, esc, fmtRs, timeAgo, dateLabel, initials, uid, jobId, nowISO, wavUri } from '../shared/ui/ui.js';
import { ic, starFilled, starEmpty } from '../shared/icons/icons.js';
import { go, R, goBack, parseHash, render, Views } from './router.js';

import { ShellActions } from './shell.js';
import { AuthActions } from '../modules/auth/auth.actions.js';
import { UserActions } from '../modules/users/users.actions.js';
import { JobActions } from '../modules/jobs/jobs.actions.js';
import { OfferActions } from '../modules/offers/offers.actions.js';
import { VisitActions } from '../modules/visits/visits.actions.js';
import { RepairsActions } from '../modules/repairs/repairs.actions.js';
import { PaymentActions } from '../modules/payments/payments.actions.js';
import { ReviewActions } from '../modules/reviews/reviews.actions.js';
import { NotificationActions } from '../modules/notifications/notifications.actions.js';
import { DisputeActions } from '../modules/disputes/disputes.actions.js';

export const A = Object.assign(
  {},
  ShellActions,
  AuthActions,
  UserActions,
  JobActions,
  OfferActions,
  VisitActions,
  RepairsActions,
  PaymentActions,
  ReviewActions,
  NotificationActions,
  DisputeActions
);

if (typeof window !== 'undefined') {
  window.A = A;
  window.Store = Store;
  window.UI = UI;
  window.ic = ic;
  window.starFilled = starFilled;
  window.starEmpty = starEmpty;
  window.esc = esc;
  window.fmtRs = fmtRs;
  window.timeAgo = timeAgo;
  window.dateLabel = dateLabel;
  window.initials = initials;
  window.uid = uid;
  window.jobId = jobId;
  window.nowISO = nowISO;
  window.wavUri = wavUri;
  window.go = go;
  window.R = R;
  window.goBack = goBack;
  window.parseHash = parseHash;
  window.Views = Views;
}

export function initApp() {
  Store.boot();
  let signedRole = Store.currentUser() ? Store.currentUser().role : null;

  Store.onChange(function () {
    const u = Store.currentUser();
    if (!u) {
      signedRole = null;
      const seg0 = parseHash().segs[0];
      if (seg0 === 'customer' || seg0 === 'worker') { render(); }
      return;
    }
    if (u.role !== signedRole) {
      signedRole = u.role;
      go('/' + u.role);
      return;
    }
    render();
  });

  window.addEventListener('hashchange', render);
  render();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
