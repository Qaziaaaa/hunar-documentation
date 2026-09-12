import { ic } from '../shared/icons/icons.js';
import { UI, esc } from '../shared/ui/ui.js';
import { Store } from './state.js';
import { SERVICES } from '../modules/services/services.data.js';

export const NAV_ITEMS = {
  customer: [
    { icon: 'home', label: 'Dashboard', r: '/customer' },
    { icon: 'plus', label: 'Post a Job', r: '/customer/post' },
    { icon: 'list', label: 'My Jobs', r: '/customer/jobs' },
    { icon: 'chat', label: 'Offers', r: '/customer/offers', count: function () { const u = Store.currentUser(); return u ? Store.pendingOffersCount() : 0; } },
    { icon: 'calendar', label: 'Upcoming Visits', r: '/customer/visits' },
    { icon: 'wallet', label: 'Payments', r: '/customer/payments' },
    { icon: 'star', label: 'Reviews', r: '/customer/reviews' },
    { icon: 'bell', label: 'Notifications', r: '/customer/notifications', count: function () { const u = Store.currentUser(); return u ? Store.unreadFor(u.id) : 0; } },
    { icon: 'user', label: 'Profile', r: '/customer/profile' },
    { icon: 'settings', label: 'Settings', r: '/customer/settings' },
    { icon: 'sparkles', label: 'Color Reference', r: '/colors' }
  ],
  worker: [
    { icon: 'home', label: 'Dashboard', r: '/worker' },
    { icon: 'map', label: 'Nearby Jobs', r: '/worker/jobs' },
    { icon: 'send', label: 'My Offers', r: '/worker/offers' },
    { icon: 'briefcase', label: 'Active Jobs', r: '/worker/active' },
    { icon: 'calendar', label: 'Upcoming Visits', r: '/worker/visits' },
    { icon: 'checkC', label: 'Completed Jobs', r: '/worker/completed' },
    { icon: 'wallet', label: 'Earnings', r: '/worker/earnings' },
    { icon: 'star', label: 'Reviews', r: '/worker/reviews' },
    { icon: 'bell', label: 'Notifications', r: '/worker/notifications', count: function () { const u = Store.currentUser(); return u ? Store.unreadFor(u.id) : 0; } },
    { icon: 'user', label: 'Profile', r: '/worker/profile' },
    { icon: 'settings', label: 'Settings', r: '/worker/settings' },
    { icon: 'sparkles', label: 'Color Reference', r: '/colors' }
  ]
};

export function isActiveRoute(route, hash) {
  if (route === '/customer' || route === '/worker') return hash === route;
  return hash.indexOf(route) === 0;
}

export function footerHtml() {
  return '<footer class="foot"><div class="content">' +
    '<div><a class="brand" href="#/"><span class="brand-mark">' + ic('wrench') + '</span><span>HU<b>NAR</b></span></a>' +
    '<p class="fb">HUNAR connects customers with nearby skilled workers. Post a problem, get offers, negotiate the price, and get it fixed — on your terms.</p></div>' +
    '<div><h5>Services</h5>' + SERVICES.slice(0, 5).map(function (s) { return '<a href="#/workers?skill=' + encodeURIComponent(s.name) + '">' + s.name + '</a>'; }).join('') + '</div>' +
    '<div><h5>Company</h5><a href="#/">About HUNAR</a><a href="#/workers">Find a Professional</a><a href="#/register">Join as a Worker</a><a href="#/colors">Color Reference</a><a href="#/login">Login</a></div>' +
    '<div><h5>Support</h5><a href="#/">Help Center</a><a href="#/">Safety</a><a href="#/">Contact Us</a><a href="#/">Terms &amp; Privacy</a></div>' +
    '</div></footer>';
}

export function publicShell(body) {
  const hash = location.hash.replace(/^#/, '') || '/';
  const path = '/' + hash.split('/').filter(Boolean).join('/');
  const active = function (r) { return path.indexOf(r) === 0 ? ' active' : ''; };
  return '<div class="app pub">' +
    '<nav class="pub-nav"><div class="content">' +
    '<a class="brand" href="#/"><span class="brand-mark">' + ic('wrench') + '</span><span>HU<b>NAR</b></span></a>' +
    '<div class="pub-links">' +
    '<a class="btn-ghost' + active('/services') + '" href="#/services">Services</a>' +
    '<a class="btn-ghost' + active('/workers') + '" href="#/workers">Workers</a>' +
    '<a class="btn-ghost link-only" href="#/login">Login</a>' +
    '</div>' +
    '<span style="margin-left:auto"></span>' +
    '<a class="btn btn-outline link-only" href="#/login">Login</a>' +
    '<a class="btn btn-primary" href="#/register">Create Account</a>' +
    '</div></nav>' +
    body +
    footerHtml() +
    '</div>';
}

export function appShell(body, title, sub) {
  const u = Store.currentUser();
  const me = u.role === 'worker' ? 'worker' : 'customer';
  const items = NAV_ITEMS[me];
  const hash = '/' + (location.hash.replace(/^#/, '') || '/').split('/').filter(Boolean).join('/');
  const active = function (r) { return isActiveRoute(r, hash); };
  const unread = Store.unreadFor(u.id);
  const side = '<div class="scrim" onclick="A.closeSidebar()"></div>' +
    '<aside class="sidebar" id="sidebar">' +
    '<a class="brand" href="#/" onclick="A.closeSidebar()"><span class="brand-mark">' + ic('wrench') + '</span><span>HU<b>NAR</b></span></a>' +
    '<div class="side-sec">' + (me === 'customer' ? 'Customer' : 'Worker') + ' Portal</div>' +
    items.map(function (it) {
      const c = it.count ? it.count() : 0;
      return '<div class="side-row' + (active(it.r) ? ' on' : '') + '" onclick="A.menuGo(\'' + it.r + '\')">' + ic(it.icon, { s: 18 }) + '<span>' + it.label + '</span>' + (c ? '<span class="cnt">' + c + '</span>' : '') + '</div>';
    }).join('') +
    '<div class="side-sec">Account</div>' +
    '<div class="side-bottom">' +
    '<div class="side-user" onclick="A.toggleAccountMenu()">' + UI.avatar(u) +
    '<div style="min-width:0;flex:1"><div class="un" style="font-weight:800">' + esc(u.name) + '</div><div class="ur">' + (u.role === 'worker' ? 'Worker' : 'Customer') + ' · ' + (u.area || 'No area') + '</div></div>' +
    ic('chevD', { s: 16, style: 'color:#7fa1ae' }) + '</div></div></aside>';

  const top = '<div class="topbar">' +
    '<button class="icon-btn menu-btn" onclick="A.toggleSidebar()">' + ic('menu') + '</button>' +
    '<div><div class="ttl">' + title + '</div>' + (sub ? '<div class="ttl-sub">' + sub + '</div>' : '') + '</div>' +
    '<div class="top-right">' +
    '<div class="role-switch">' +
    '<button class="' + (me === 'customer' ? 'on' : '') + '" onclick="A.switchAccToCustomer()">Customer</button>' +
    '<button class="' + (me === 'worker' ? 'on' : '') + '" onclick="A.switchAccToWorker()">Worker</button></div>' +
    '<button class="icon-btn" onclick="A.notifMenu()">' + ic('bell') + (unread ? '<span class="ping">' + unread + '</span>' : '') + '</button>' +
    '<button class="icon-btn" onclick="A.accountMenu()">' + UI.avatar(u, '', {}) + '</button>' +
    '</div></div><div id="float-menu"></div>';

  return '<div class="shell">' + side + '<div class="main">' + top + '<div class="page">' + body + '</div></div></div>';
}

export function renderLandingView() {
  const svcCards = SERVICES.map(function (s) {
    return '<button class="svc-card" onclick="go(\'/workers?skill=' + encodeURIComponent(s.name) + '\')"><span class="svc-icon" style="background:' + s.bg + ';color:' + s.css + '">' + ic(s.icon, { s: 22 }) + '</span><span><h4>' + s.name + '</h4><p>' + s.desc + '</p><div class="svc-count">' + s.count + ' professionals nearby</div></span></button>';
  }).join('');

  const steps = [
    ['Post your problem', 'Tell us what needs fixing with photos, voice and your location.'],
    ['Receive offers', 'Nearby professionals send you visit charges. Compare profiles &amp; reviews.'],
    ['Pick your worker', 'Choose the best offer — the visit charge is locked the moment you select.'],
    ['Get it fixed &amp; pay', 'Track the visit, approve the repair, pay securely and review.']
  ].map(function (s, i) {
    return '<div class="step"><div class="step-num">' + (i + 1) + '</div><h4>' + s[0] + '</h4><p>' + s[1] + '</p></div>';
  }).join('');

  const demoW = (Store.state().users || []).filter(function (u) { return u.role === 'worker' && !u.onboarding; }).slice(0, 3);

  const html =
    '<section class="hero"><div class="content">' +
    '<div><span class="hero-eyebrow">' + ic('shield', { s: 15 }) + ' Verified &amp; rated professionals in your area</span>' +
    '<h1>Fix your home with <span class="hl">hunar</span> — not guesswork.</h1>' +
    '<p class="lead">Post a problem, get offers from nearby skilled workers, negotiate the price, and approve every rupee before work starts.</p>' +
    '<div class="search-bar">' + ic('search') + '<select id="hero-cat"><option value="">Choose a service…</option>' + SERVICES.map(function (s) { return '<option value="' + esc(s.name) + '">' + s.name + '</option>'; }).join('') + '</select>' +
    '<button class="btn btn-primary" onclick="A.heroSearch()">' + ic('arrowR', { s: 16 }) + ' Find a Professional</button></div>' +
    '<div class="hero-cta">' +
    '<a class="btn btn-primary btn-lg" href="#/register">Get Started Free</a>' +
    '<a class="btn btn-outline btn-lg" href="#/register">Become a Worker</a></div>' +
    '<div class="hero-stats"><div><div class="num">1,200+</div><div class="lbl">Verified workers</div></div><div><div class="num">48,000+</div><div class="lbl">Jobs completed</div></div><div><div class="num">4.8</div><div class="lbl">Avg rating</div></div></div>' +
    '</div>' +
    '<div class="hero-media"><div class="hero-phones">' +
    '<div class="phone-card"><div class="pc-top">' + UI.avatar({ name: 'Sara', color: '#7c3aed', verified: false }) + '<div><div style="font-weight:700">Your AC repair</div><div style="color:var(--muted)">Receiving offers</div></div>' + '<span class="badge b-amber" style="margin-left:auto">' + ic('clock', { s: 12 }) + ' 3 offers</span></div>' +
    '<div class="pc-job">' + ic('snow', { s: 18, style: 'color:#123b5d' }) + '<div style="font-size:12.5px"><b>AC running but not cooling</b><br><span style="color:var(--muted)">Gulshan-e-Iqbal · Today 4:00 PM</span></div></div>' +
    '<div style="display:flex;gap:8px"><div class="prog" style="flex:1"><i style="width:64%"></i></div><span style="font-size:11px;color:var(--muted)">Inspection</span></div></div>' +
    '<div class="phone-card"><div class="pc-top">' + UI.avatar({ name: 'Ali', color: '#123b5d', verified: true }) + '<div><div style="font-weight:700">Ali Khan</div><div style="color:var(--muted)">AC Technician</div></div><div class="rating" style="margin-left:auto">' + UI.stars(4.9, 13) + '</div></div>' +
    '<div style="display:flex;gap:10px;align-items:center"><div class="voice-chip" style="margin:0">' + ic('mic', { s: 12 }) + ' Voice note</div><span class="badge b-ok">' + ic('check', { s: 11 }) + ' Approved</span></div><div class="kv" style="border-bottom:none;padding:6px 0 0"><span class="k">Visit charge</span><span class="v">Rs. 300</span></div></div>' +
    '</div>' +
    '<div class="float-chip fc-1"><span class="dot"></span> Ali accepted<br>your job · Rs. 300</div>' +
    '<div class="float-chip fc-2">' + ic('wallet', { s: 16, style: 'color:var(--ok)' }) + ' Payment received Rs. 935</div>' +
    '</div></div></section>';

  const mid =
    '<section class="section"><div class="content">' +
    '<div class="sec-head"><div><div class="section-title">Popular services</div><div class="section-sub">Whatever is broken — there is a verified professional nearby.</div></div><a class="btn btn-outline btn-sm" href="#/services">View all services</a></div>' +
    '<div class="svc-grid">' + svcCards + '</div></div></section>' +
    '<section class="section" style="background:var(--bg)"><div class="content">' +
    '<div class="sec-head"><div><div class="section-title">How HUNAR works</div><div class="section-sub">A transparent fix, from problem to payment.</div></div></div>' +
    '<div class="steps">' + steps + '</div></div></section>' +
    '<section class="section"><div class="content">' +
    '<div class="sec-head"><div><div class="section-title">Meet top-rated workers</div><div class="section-sub">Verified skills, real reviews, upfront visit charges.</div></div><a class="btn btn-outline btn-sm" href="#/workers">Browse all</a></div>' +
    '<div class="dir-grid">' + demoW.map(function (w) { return UI.workerCard(w); }).join('') + '</div></div></section>' +
    '<section class="section" style="background:linear-gradient(135deg,#102f4a,#123b5d);color:#fff"><div class="content" style="display:flex;gap:30px;align-items:center;justify-content:space-between;flex-wrap:wrap">' +
    '<div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em">Need it fixed today?</div><p style="color:#a7bdc7;margin-top:6px">Post a job in 2 minutes and nearby workers will send you offers.</p></div>' +
    '<a class="btn btn-primary btn-lg" href="#/register" style="background:#fff;color:#123b5d">Post Your Problem</a></div></section>';

  return {
    html: html + mid,
    mount: function () {
      const heroCat = document.getElementById('hero-cat');
      if (heroCat) heroCat.addEventListener('change', function () { });
    }
  };
}

export function renderColorsView() {
  const swatch = function (name, hex, extra) {
    return '<div style="display:inline-flex;flex-direction:column;gap:6px;align-items:center;min-width:88px">' +
      '<span style="width:54px;height:54px;border-radius:14px;background:' + hex + (extra || '') + '"></span>' +
      '<b style="font-size:11.5px;color:var(--navy)">' + name + '</b>' +
      '<span style="font-size:11px;color:var(--muted)">' + hex + '</span></div>';
  };
  const card = function (title, sub, inner) {
    return '<div class="card" style="padding:20px;margin-bottom:16px"><div style="font-weight:800;font-size:16px;color:var(--navy)">' + title + '</div>' +
      '<div style="color:var(--muted);font-size:13px;margin:2px 0 14px">' + sub + '</div>' + inner + '</div>';
  };

  const html =
    '<section class="section"><div class="content" style="max-width:880px">' +
    '<div style="font-size:clamp(26px,3vw,34px);font-weight:800;color:var(--navy);letter-spacing:-.02em">HUNAR Button &amp; Color Reference</div>' +
    '<p style="color:var(--muted);margin:6px 0 26px">The 9 core colors and every button style from colors.md, live.</p>' +

    card('Palette', 'The color system behind the whole UI.',
      '<div style="display:flex;gap:16px;flex-wrap:wrap">' +
      swatch('Navy', '#123B5D') + swatch('Teal', '#0F8B8D') + swatch('Orange', '#F59E0B') +
      swatch('Background', '#F8FAFC', ';border:1.5px solid var(--line-2)') +
      swatch('White', '#FFFFFF', ';border:1.5px solid var(--line-2)') +
      swatch('Dark', '#172033') + swatch('Gray', '#64748B') +
      swatch('Success', '#16A34A') + swatch('Error', '#DC2626') +
      '</div>') +

    card('Action buttons', 'Teal = action &amp; trust. Every main CTA in HUNAR.',
      '<div class="stack" style="gap:10px">' +
      '<div><div class="btn btn-primary">' + ic('plus', { s: 16 }) + ' Post a Job</div></div>' +
      '<div><div class="btn btn-primary btn-lg">' + ic('check', { s: 16 }) + ' Accept Offer</div></div>' +
      '<div><div class="btn btn-primary btn-sm">Approve Repair</div> <div class="btn btn-primary btn-sm">Pay Rs. 0</div></div>' +
      '<div style="padding:12px 18px;border-radius:12px;display:inline-flex;gap:8px;align-items:center;font-weight:600;color:#fff;background:#0f8b8d">Solid teal #0F8B8D</div>' +
      '</div>') +

    card('Secondary &amp; outline', 'White + navy border = calm, trust-based options.',
      '<div class="stack" style="gap:10px">' +
      '<div><div class="btn btn-outline">Become a Worker</div> <div class="btn btn-outline btn-sm">View All</div></div>' +
      '<div><div class="btn btn-soft">' + ic('shield', { s: 15 }) + ' Verified</div> <div class="btn btn-ghost">Ghost / nav link</div></div>' +
      '</div>') +

    card('Status &amp; semantic colors', 'Orange draws the eye, green means done, red is a problem.',
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
      '<span class="badge b-amber">' + ic('clock', { s: 12 }) + ' Pending offer</span>' +
      '<span class="badge b-brand">' + ic('shield', { s: 12 }) + ' Verified</span>' +
      '<span class="badge b-ok">' + ic('check', { s: 12 }) + ' Completed</span>' +
      '<span class="badge b-danger">' + ic('x', { s: 12 }) + ' Cancelled</span>' +
      '<div class="btn btn-danger">Reject</div>' +
      '<div class="btn btn-danger-solid">Cancel Job</div>' +
      '<div class="btn btn-amber">Offer highlight</div>' +
      '</div>') +

    card('Quick rule (colors.md)', 'The whole identity in one line.',
      '<div style="color:var(--ink);font-size:13.5px;line-height:1.9">' +
      'Navy <b style="color:#123b5d">#123B5D</b> = trust &rarr; logo, headings, numbers, prices<br>' +
      'Teal <b style="color:#0f8b8d">#0F8B8D</b> = action &rarr; buttons, accept, pay, verified<br>' +
      'Orange <b style="color:#f59e0b">#F59E0B</b> = attention &rarr; ratings, offers, pending<br>' +
      'Green <b style="color:#16a34a">#16A34A</b> = success &rarr; completed, approved, online<br>' +
      'Red <b style="color:#dc2626">#DC2626</b> = problem &rarr; errors, cancelled, rejected</div>') +
    '</div></section>';

  return { html: html };
}

export const ShellActions = {
  toggleSidebar: function () {
    const sb = document.getElementById('sidebar');
    if (!sb) return;
    sb.classList.toggle('open');
    const scrim = sb.parentElement ? sb.parentElement.querySelector('.scrim') : null;
    if (scrim) scrim.classList.toggle('show');
  },

  closeSidebar: function () {
    const el = document.getElementById('sidebar');
    if (!el) return;
    el.classList.remove('open');
    const scr = el.parentElement ? el.parentElement.querySelector('.scrim') : null;
    if (scr) scr.classList.remove('show');
  },

  accountMenu: function () {
    const root = document.getElementById('float-menu');
    if (!root) return;
    const u = Store.currentUser();
    if (!u) return;
    const list = (Store.state().users || []).filter(function (x) { return x.id !== u.id && x.name !== 'Your Profile'; });
    let html = '<div class="menu">';
    html += '<div class="m-label">Switch demo account</div>';
    list.forEach(function (x) {
      html += '<div class="switch-acc" onclick="A.switchTo(\'' + x.id + '\')">' + UI.avatar(x) +
        '<div style="min-width:0"><div class="na">' + esc(x.name) + '</div><div class="nr">' + (x.role === 'customer' ? 'Customer' : 'Worker') + ' · ' + (x.email || '') + '</div></div></div>';
    });
    html += '<div class="mmi"><div class="mi" onclick="A.menuGo(\'' + (u.role === 'worker' ? '/worker/profile' : '/customer/profile') + '\')">' + ic('user', { s: 16 }) + ' My Profile</div>';
    html += '<div class="mi" onclick="A.menuGo(\'/' + u.role + '/settings\')">' + ic('settings', { s: 16 }) + ' Settings</div>';
    html += '<div class="mi" style="color:var(--danger)" onclick="A.logout()">' + ic('logout', { s: 16 }) + ' Logout</div></div>';
    html += '</div>';
    root.innerHTML = html;
    setTimeout(function () {
      document.addEventListener('mousedown', function h(ev) {
        const m = document.getElementById('float-menu');
        if (m && !m.contains(ev.target) && !ev.target.closest('.icon-btn')) {
          m.innerHTML = '';
          document.removeEventListener('mousedown', h);
        }
      });
    }, 0);
  },

  menuGo: function (r) {
    if (window.go) window.go(r);
    ShellActions.closeMenu();
    ShellActions.closeSidebar();
  },

  toggleSidebarClose: function () {
    ShellActions.closeSidebar();
  },

  closeMenu: function () {
    const m = document.getElementById('float-menu');
    if (m) m.innerHTML = '';
  },

  notifMenu: function () {
    const u = Store.currentUser();
    if (u && window.go) window.go('/' + u.role + '/notifications');
  },

  toggleAccountMenu: function () {
    const root = document.getElementById('float-menu');
    if (root && root.innerHTML) {
      root.innerHTML = '';
      return;
    }
    ShellActions.accountMenu();
  },

  switchTo: function (id) {
    Store.switchUser(id);
    ShellActions.closeMenu();
    const u = Store.currentUser();
    UI.toast('Now viewing the app as ' + u.name + ' (' + (u.role === 'worker' ? 'Worker' : 'Customer') + ').', 'ok', 'Demo account switched');
    const fm = document.getElementById('float-menu');
    if (fm) fm.innerHTML = '';
    ShellActions.closeSidebar();
  },

  switchAccToCustomer: function () {
    const u = Store.currentUser();
    if (u && u.role === 'customer') { ShellActions.accountMenu(); return; }
    const c = (Store.state().users || []).find(function (x) { return x.role === 'customer'; });
    if (c) ShellActions.switchTo(c.id); else ShellActions.accountMenu();
  },

  switchAccToWorker: function () {
    const u = Store.currentUser();
    if (u && u.role === 'worker') { ShellActions.accountMenu(); return; }
    const w = (Store.state().users || []).find(function (x) { return x.role === 'worker' && !x.onboarding; });
    if (w) ShellActions.switchTo(w.id); else ShellActions.accountMenu();
  },

  logout: function () {
    Store.logout();
    ShellActions.closeMenu();
    UI.toast('You have been logged out.', 'ok', 'Signed out');
    if (window.go) window.go('/');
  },

  resetDemo: function () {
    UI.confirm({
      icon: 'refresh',
      title: 'Reset demo data?',
      body: 'All jobs, offers, payments and reviews will be cleared. Demo accounts will be restored.',
      okText: 'Reset',
      cancelText: 'Cancel',
      danger: true,
      onOk: function () {
        Store.reset();
        UI.toast('Demo data has been reset.', 'ok', 'Done');
        if (window.go) window.go('/');
      }
    });
  },

  toggleSetting: function (el) {
    el.style.background = el.style.background === 'rgb(14, 122, 110)' ? '#cbd5e1' : 'var(--brand)';
    const span = el.querySelector('span');
    if (span) span.style.marginLeft = span.style.marginLeft === '22px' ? '2px' : '22px';
    UI.toast('Preference saved.', 'ok', 'Updated');
  },

  heroSearch: function () {
    const sel = document.getElementById('hero-cat');
    const v = sel ? sel.value : '';
    if (window.go) window.go('/workers' + (v ? '?skill=' + encodeURIComponent(v) : ''));
  }
};
