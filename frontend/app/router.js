import { Store } from './state.js';
import { publicShell, appShell, renderLandingView, renderColorsView } from './shell.js';
import { renderServicesView } from '../modules/services/services.views.js';
import {
  renderWorkersView,
  renderWorkerPublicView,
  renderCustomerProfileView,
  renderCustomerSettingsView,
  renderWorkerProfileView,
  renderWorkerSettingsView,
  renderWorkerOnboardingView
} from '../modules/users/users.views.js';
import { renderLoginView, renderRegisterView, renderWrongRoleView } from '../modules/auth/auth.views.js';
import { renderCustomerOffersView, renderWorkerOffersView, renderWorkerOfferDetailView } from '../modules/offers/offers.views.js';
import { renderCustomerVisitsView, renderWorkerVisitsView } from '../modules/visits/visits.views.js';
import { renderPaymentCheckoutView, renderCustomerPaymentsView, renderWorkerEarningsView } from '../modules/payments/payments.views.js';
import { renderReviewView, renderCustomerReviewsView, renderWorkerReviewsView } from '../modules/reviews/reviews.views.js';
import { renderNotificationsView } from '../modules/notifications/notifications.views.js';
import {
  renderCustomerDashboardView,
  renderCustomerMyJobsView,
  renderWizardView,
  renderCustomerJobDetailView,
  renderWorkerDashboardView,
  renderWorkerJobsView,
  renderWorkerJobDetailView,
  renderWorkerActiveJobsView,
  renderWorkerActiveJobDetailView,
  renderWorkerCompletedJobsView
} from '../modules/jobs/jobs.views.js';

let currentMount = null;

export function go(route) {
  if (!route) return;
  if (route === location.hash.replace(/^#/, '')) { render(); return; }
  location.hash = route;
}

export function R() { render(); }

export function goBack() {
  if (history.length > 1) history.back();
  else go('/');
}

export function parseHash() {
  let h = location.hash.replace(/^#/, '') || '/';
  const q = h.indexOf('?');
  let qs = {};
  if (q !== -1) {
    const raw = h.slice(q + 1).split('&');
    raw.forEach(function (kv) {
      const p = kv.split('=');
      qs[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    h = h.slice(0, q);
  }
  return { segs: h.split('/').filter(Boolean), qs: qs };
}

export const Views = {
  landing: renderLandingView,
  colors: renderColorsView,
  services: renderServicesView,
  workers: renderWorkersView,
  workerPublic: renderWorkerPublicView,
  login: renderLoginView,
  register: renderRegisterView,
  wrongRole: renderWrongRoleView,
  customerDashboard: renderCustomerDashboardView,
  wizard: renderWizardView,
  customerMyJobs: renderCustomerMyJobsView,
  customerJob: renderCustomerJobDetailView,
  customerOffers: renderCustomerOffersView,
  customerVisits: renderCustomerVisitsView,
  customerPayments: renderCustomerPaymentsView,
  customerReviews: renderCustomerReviewsView,
  customerProfile: renderCustomerProfileView,
  customerSettings: renderCustomerSettingsView,
  payment: renderPaymentCheckoutView,
  review: renderReviewView,
  notifications: renderNotificationsView,
  workerDashboard: renderWorkerDashboardView,
  workerOnboarding: renderWorkerOnboardingView,
  workerJob: renderWorkerJobDetailView,
  workerJobs: renderWorkerJobsView,
  workerOffers: renderWorkerOffersView,
  workerOfferDetail: renderWorkerOfferDetailView,
  workerVisits: renderWorkerVisitsView,
  workerActive: renderWorkerActiveJobsView,
  workerActiveJob: renderWorkerActiveJobDetailView,
  workerCompleted: renderWorkerCompletedJobsView,
  workerEarnings: renderWorkerEarningsView,
  workerReviews: renderWorkerReviewsView,
  workerProfile: renderWorkerProfileView,
  workerSettings: renderWorkerSettingsView
};

export const mapTitle = {
  customerDashboard: ['Dashboard', 'Your jobs and visits at a glance'],
  wizard: ['Post a Job', 'Tell us what needs fixing'],
  customerMyJobs: ['My Jobs', 'Everything you have posted'],
  customerJob: ['Job Details', ''],
  customerOffers: ['Worker Offers', 'Professionals interested in your jobs'],
  customerVisits: ['Upcoming Visits', 'Confirmed appointments'],
  customerPayments: ['Payments', 'Your transaction history'],
  customerReviews: ['My Reviews', 'Reviews you have left'],
  notifications: ['Notifications', ''],
  customerProfile: ['My Profile', 'Your HUNAR account'],
  customerSettings: ['Settings', 'Preferences & account'],
  payment: ['Payment', 'Complete your payment securely'],
  review: ['Review', 'Rate your experience'],
  workerDashboard: ['Worker Dashboard', 'Nearby jobs & your day'],
  workerOnboarding: ['Welcome, Worker', 'Set up your professional profile'],
  workerJob: ['Job Details', 'Customer request'],
  workerJobs: ['Nearby Jobs', 'New requests near you'],
  workerOffers: ['My Offers', 'Track your visit offers'],
  workerOfferDetail: ['Offer Status', ''],
  workerVisits: ['Upcoming Visits', 'Confirmed appointments'],
  workerActive: ['Active Jobs', ''],
  workerActiveJob: ['Active Job', ''],
  workerCompleted: ['Completed Jobs', ''],
  workerEarnings: ['Earnings', 'Your income at a glance'],
  workerReviews: ['My Reviews', 'What customers say'],
  workerProfile: ['My Profile', 'Your professional profile'],
  workerSettings: ['Settings', 'Preferences & account'],
  colors: ['Color Reference', 'The HUNAR palette at a glance']
};

export function render() {
  const { segs } = parseHash();
  const path = segs.join('/');
  const u = Store.currentUser();
  let view = null;
  let params = {};

  if (segs.length === 0 || path === 'home') {
    view = u ? (u.role === 'worker' ? 'workerDashboard' : 'customerDashboard') : 'landing';
  } else if (segs[0] === 'services') view = 'services';
  else if (segs[0] === 'colors') view = 'colors';
  else if (segs[0] === 'workers') {
    if (segs.length === 1) view = 'workers';
    else if (segs.length === 2) { view = 'workerPublic'; params.id = segs[1]; }
  } else if (segs[0] === 'login') view = 'login';
  else if (segs[0] === 'register') view = 'register';

  else if (segs[0] === 'customer') {
    if (!u) { go('/login'); return; }
    if (u.role !== 'customer') { view = 'wrongRole'; params.want = 'customer'; }
    else if (segs.length === 1) view = 'customerDashboard';
    else if (segs[1] === 'post') view = 'wizard';
    else if (segs[1] === 'jobs' && segs[2] && segs[3] === 'payment') { view = 'payment'; params.id = segs[2]; }
    else if (segs[1] === 'jobs' && segs[2] && segs[3] === 'review') { view = 'review'; params.id = segs[2]; }
    else if (segs[1] === 'jobs' && segs[2]) { view = 'customerJob'; params.id = segs[2]; params.section = segs[3]; }
    else if (segs[1] === 'jobs') view = 'customerMyJobs';
    else if (segs[1] === 'offers') view = 'customerOffers';
    else if (segs[1] === 'visits') view = 'customerVisits';
    else if (segs[1] === 'payments') view = 'customerPayments';
    else if (segs[1] === 'reviews') view = 'customerReviews';
    else if (segs[1] === 'notifications') view = 'notifications';
    else if (segs[1] === 'profile') view = 'customerProfile';
    else if (segs[1] === 'settings') view = 'customerSettings';
    else { go('/customer'); return; }
  }

  else if (segs[0] === 'worker') {
    if (!u) { go('/login'); return; }
    if (u.role !== 'worker') { view = 'wrongRole'; params.want = 'worker'; }
    else if (segs.length === 1) view = 'workerDashboard';
    else if (segs[1] === 'onboarding') view = 'workerOnboarding';
    else if (segs[1] === 'jobs' && segs[2]) { view = 'workerJob'; params.id = segs[2]; }
    else if (segs[1] === 'jobs') view = 'workerJobs';
    else if (segs[1] === 'offers') { view = segs.length === 2 ? 'workerOffers' : 'workerOfferDetail'; params.id = segs[2]; }
    else if (segs[1] === 'visits') view = 'workerVisits';
    else if (segs[1] === 'active') { view = segs.length === 2 ? 'workerActive' : 'workerActiveJob'; params.id = segs[2]; }
    else if (segs[1] === 'completed') view = 'workerCompleted';
    else if (segs[1] === 'earnings') view = 'workerEarnings';
    else if (segs[1] === 'reviews') view = 'workerReviews';
    else if (segs[1] === 'notifications') view = 'notifications';
    else if (segs[1] === 'profile') view = 'workerProfile';
    else if (segs[1] === 'settings') view = 'workerSettings';
    else { go('/worker'); return; }
  }

  else { go('/'); return; }

  const app = document.getElementById('app');
  if (!app) return;
  currentMount = null;
  app.innerHTML = '';

  const builder = Views[view];
  if (!builder) { go('/'); return; }

  const res = builder(params);

  if (u && view !== 'login' && view !== 'register' && view !== 'landing' && view !== 'wrongRole') {
    const mt = mapTitle[view] || [''];
    const sub = params.id && (view === 'customerJob' || view === 'workerJob' || view === 'workerOfferDetail' || view === 'workerActiveJob') ? 'Ref: ' + params.id : mt[1];
    app.innerHTML = appShell(res.html, mt[0], sub || '');
    const page = app.querySelector('.page');
    if (page) page.innerHTML = res.html;
  } else if (view === 'landing') {
    app.innerHTML = publicShell(res.html);
  } else {
    app.innerHTML = publicShell(res.html);
  }

  if (res.mount) currentMount = res.mount;
  if (currentMount) { try { currentMount(); } catch (e) { /* */ } }
  window.scrollTo(0, 0);
}

if (typeof window !== 'undefined') {
  window.go = go;
  window.R = R;
  window.goBack = goBack;
  window.parseHash = parseHash;
  window.Views = Views;
}
