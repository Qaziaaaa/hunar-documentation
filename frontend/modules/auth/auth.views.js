import { ic } from '../../shared/icons/icons.js';
import { UI } from '../../shared/ui/ui.js';
import { Store as GlobalStore } from '../../app/state.js';

export function roleCard(r, icon, title, desc, on) {
  return '<label class="' + (on ? 'on' : '') + '" style="display:flex;gap:14px;align-items:center;border:2px solid ' + (on ? 'var(--brand)' : 'var(--line-2)') + ';border-radius:16px;padding:16px;cursor:pointer;background:' + (on ? 'var(--brand-3)' : '#fff') + ';transition:.14s">' +
    '<input type="radio" name="rg-role" value="' + r + '" ' + (on ? 'checked' : '') + ' style="display:none">' +
    '<span style="width:46px;height:46px;border-radius:13px;display:grid;place-items:center;background:' + (on ? 'var(--brand)' : '#eef1f4') + ';color:' + (on ? '#fff' : 'var(--muted)') + '">' + ic(icon, { s: 22 }) + '</span>' +
    '<span><b style="font-size:15px">' + title + '</b><br><span style="font-size:12.5px;color:var(--muted)">' + desc + '</span></span></label>';
}

export function renderLoginView() {
  const html = '<div class="card" style="max-width:440px;margin:40px auto;padding:32px">' +
    '<div style="text-align:center;margin-bottom:24px"><div class="brand-mark" style="margin:0 auto 12px;width:48px;height:48px;border-radius:14px">' + ic('wrench', { s: 22 }) + '</div>' +
    '<h2 style="font-size:22px;font-weight:800">Welcome Back to HUNAR</h2><p style="color:var(--muted);font-size:13.5px;margin-top:4px">Login to manage your bookings or service requests</p></div>' +
    '<div id="lg-err"></div>' +
    '<div class="field"><label>Email address</label><input type="email" id="lg-email" class="input" placeholder="e.g. sara@hunar.pk" value="sara@hunar.pk" /></div>' +
    '<div class="field"><label>Password</label><input type="password" id="lg-pass" class="input" placeholder="••••••••" value="demo123" /></div>' +
    '<button class="btn btn-primary btn-block btn-lg" style="margin-top:6px" onclick="A.login()">Sign In ' + ic('arrowR', { s: 15 }) + '</button>' +
    '<div class="divide" style="margin:22px 0 16px"></div>' +
    '<div class="smallnote" style="font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:.04em">Demo Quick Fill</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
    '<button class="btn btn-soft btn-sm" onclick="A.fillLogin(\'sara@hunar.pk\',\'demo123\')">Customer (Sara)</button>' +
    '<button class="btn btn-soft btn-sm" onclick="A.fillLogin(\'ali@hunar.pk\',\'demo123\')">Worker (Ali)</button>' +
    '<button class="btn btn-soft btn-sm" onclick="A.fillLogin(\'hamza@hunar.pk\',\'demo123\')">Worker (Hamza)</button>' +
    '<button class="btn btn-soft btn-sm" onclick="A.fillLogin(\'usman@hunar.pk\',\'demo123\')">Worker (Usman)</button>' +
    '</div>' +
    '<div style="text-align:center;margin-top:20px;font-size:13.5px;color:var(--muted)">Don’t have an account? <a href="#/register" style="color:var(--brand);font-weight:700">Create one</a></div>' +
    '</div>';
  return { html: html };
}

export function renderRegisterView() {
  const html = '<div class="card" style="max-width:480px;margin:30px auto;padding:34px">' +
    '<div style="text-align:center;margin-bottom:24px"><div class="brand-mark" style="margin:0 auto 12px;width:48px;height:48px;border-radius:14px">' + ic('shield', { s: 22 }) + '</div>' +
    '<h2 style="font-size:22px;font-weight:800">Join HUNAR</h2><p style="color:var(--muted);font-size:13.5px;margin-top:4px">Hire reliable workers or find customers for your skills</p></div>' +
    '<div id="rg-err"></div>' +
    '<div class="field"><label>I want to:</label>' +
    '<div class="role-cards" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
    roleCard('customer', 'home', 'Hire Help', 'I need repairs & services', true) +
    roleCard('worker', 'wrench', 'Offer Services', 'I am a skilled professional', false) +
    '</div></div>' +
    '<div class="field"><label>Full name</label><input type="text" id="rg-name" class="input" placeholder="e.g. Usman Ghani" /></div>' +
    '<div class="field"><label>Email address</label><input type="email" id="rg-email" class="input" placeholder="e.g. usman@example.com" /></div>' +
    '<div class="field"><label>Password</label><input type="password" id="rg-pass" class="input" placeholder="Minimum 6 characters" /></div>' +
    '<button class="btn btn-primary btn-block btn-lg" style="margin-top:6px" onclick="A.register()">Create My Account ' + ic('arrowR', { s: 15 }) + '</button>' +
    '<div style="text-align:center;margin-top:18px;font-size:13.5px;color:var(--muted)">Already have an account? <a href="#/login" style="color:var(--brand);font-weight:700">Sign in</a></div>' +
    '</div>';
  return {
    html: html,
    mount: function () {
      document.querySelectorAll('.role-cards label').forEach(function (lbl) {
        lbl.addEventListener('click', function () {
          document.querySelectorAll('.role-cards label').forEach(function (x) { x.classList.remove('on'); });
          this.classList.add('on');
        });
      });
    }
  };
}

export function renderWrongRoleView(params, customStore) {
  const Store = customStore || GlobalStore;
  const want = params.want;
  const u = Store.currentUser();
  const other = (Store.state().users || []).find(function (x) {
    return (want === 'customer' ? x.role === 'customer' : x.role === 'worker') && x.id !== (u ? u.id : null);
  });
  const title = want === 'customer' ? 'This is the customer area' : 'This is the worker area';
  const html = '<div class="card" style="max-width:480px;margin:40px auto;padding:34px;text-align:center">' +
    '<div class="e-ic" style="margin:0 auto 18px">' + ic('users', { s: 30 }) + '</div>' +
    '<h3 style="font-size:18px;font-weight:800;margin-bottom:8px">' + title + '</h3>' +
    '<p style="color:var(--muted);font-size:13.5px;margin-bottom:20px">You are logged in as <b>' + UI.esc(u ? u.name : '') + '</b> (' + ((u && u.role === 'customer') ? 'Customer' : 'Worker') + '). The ' + (want === 'customer' ? 'customer' : 'worker') + ' experience is behind a different account — switch below to keep the demo connected.</p>' +
    (other ? '<button class="btn btn-primary btn-block" onclick="A.switchTo(\'' + other.id + '\')">Switch to ' + UI.esc(other.name.split(' ')[0]) + ' (' + (other.role === 'customer' ? 'Customer' : 'Worker') + ')</button>' : '') +
    '<a class="btn btn-ghost btn-block" style="margin-top:8px" href="#/register">Or create a new account</a></div>';
  return { html: html };
}
