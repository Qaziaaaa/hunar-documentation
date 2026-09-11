import { UI } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';

export const AuthActions = {
  login: function () {
    const emEl = document.getElementById('lg-email');
    const pwEl = document.getElementById('lg-pass');
    const errEl = document.getElementById('lg-err');
    if (!emEl || !pwEl) return;
    const em = emEl.value.trim();
    const pw = pwEl.value;
    if (!em || !pw) {
      if (errEl) errEl.innerHTML = UI.errBanner('alert', 'Please enter both email and password.');
      return;
    }
    const res = Store.login(em, pw);
    if (res.error) {
      if (errEl) errEl.innerHTML = UI.errBanner('alert', res.error);
      pwEl.classList.add('err');
      setTimeout(function () { pwEl.classList.remove('err'); }, 2200);
      return;
    }
    UI.toast('Welcome back, ' + res.user.name + '!', 'ok', 'Login successful');
    if (typeof window.go !== 'undefined') {
      window.go(res.user.role === 'worker' ? '/worker' : '/customer');
    }
  },

  fillDemo: function (kind) {
    const emEl = document.getElementById('lg-email');
    const pwEl = document.getElementById('lg-pass');
    if (!emEl || !pwEl) return;
    if (kind === 'cust') {
      emEl.value = 'sara@hunar.pk';
      pwEl.value = 'demo123';
    } else {
      emEl.value = 'ali@hunar.pk';
      pwEl.value = 'demo123';
    }
  },

  fillLogin: function (email, pass) {
    const emEl = document.getElementById('lg-email');
    const pwEl = document.getElementById('lg-pass');
    if (emEl) emEl.value = email;
    if (pwEl) pwEl.value = pass;
  },


  register: function () {
    const nameEl = document.getElementById('rg-name');
    const emailEl = document.getElementById('rg-email');
    const phoneEl = document.getElementById('rg-phone');
    const passEl = document.getElementById('rg-pass');
    const roleRadio = document.querySelector('input[name="rg-role"]:checked');
    const errEl = document.getElementById('rg-err');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const pw = passEl ? passEl.value : '';
    const role = roleRadio ? roleRadio.value : 'worker';

    if (!name) { if (errEl) errEl.innerHTML = UI.errBanner('alert', 'Please enter your full name.'); return; }
    if (!email || !email.includes('@')) { if (errEl) errEl.innerHTML = UI.errBanner('alert', 'Please enter a valid email address.'); return; }
    if (pw.length < 6) { if (errEl) errEl.innerHTML = UI.errBanner('alert', 'Password must be at least 6 characters.'); return; }
    if (!role) { if (errEl) errEl.innerHTML = UI.errBanner('alert', 'Please choose an account type - Customer or Worker.'); return; }

    const res = Store.register({ name: name, email: email, phone: phone, password: pw, role: role });
    if (res.error) {
      if (errEl) errEl.innerHTML = UI.errBanner('alert', res.error);
      return;
    }
    UI.toast('Account created for ' + res.user.name + '!', 'ok', 'Welcome to HUNAR');
    if (typeof window.go !== 'undefined') {
      window.go(res.user.role === 'worker' ? '/worker/onboarding' : '/customer');
    }
  },

  logout: function () {
    Store.logout();
    UI.toast('You have been logged out.', 'info', 'Logged out');
    if (typeof window.go !== 'undefined') window.go('/');
  },

  switchTo: function (id) {
    const u = Store.userById(id);
    if (!u) return;
    Store.switchUser(id);
    UI.toast('Switched account to ' + u.name + ' (' + (u.role === 'customer' ? 'Customer' : 'Worker') + ')', 'ok', 'Account switched');
    if (typeof window.go !== 'undefined') {
      window.go(u.role === 'worker' ? '/worker' : '/customer');
    }
  },

  switchAccToCustomer: function () {
    const u = Store.state().users.find(function (x) { return x.role === 'customer'; });
    if (u) AuthActions.switchTo(u.id);
  },

  switchAccToWorker: function () {
    const u = Store.state().users.find(function (x) { return x.role === 'worker' && !x.isTemplate; });
    if (u) AuthActions.switchTo(u.id);
  }
};
