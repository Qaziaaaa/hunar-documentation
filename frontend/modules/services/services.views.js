import { SERVICES } from './services.data.js';
import { ic } from '../../shared/icons/icons.js';
import { Store } from '../../app/state.js';

export function renderServicesView(params) {
  const users = (Store && Store.state() && Store.state().users) || [];

  const grid = SERVICES.map(function (s) {
    const skill = s.name;
    const count = users.filter(function (u) {
      return u.role === 'worker' && (u.skills || []).indexOf(skill) !== -1;
    }).length;
    return '<div class="svc-card" onclick="go(\'/workers?skill=' + encodeURIComponent(s.name) + '\')" style="flex-direction:column;align-items:flex-start">' +
      '<span class="svc-icon" style="background:' + s.bg + ';color:' + s.css + '">' + ic(s.icon, { s: 24 }) + '</span>' +
      '<h4>' + s.name + '</h4>' +
      '<p>' + s.desc + '</p>' +
      '<div class="svc-count">' + (count || s.count) + ' workers available</div>' +
      '</div>';
  }).join('');

  const html = '<section class="section"><div class="content">' +
    '<div class="section-title">All services</div>' +
    '<div class="section-sub">Three-step transparency: an upfront visit charge, a negotiated repair price, and approval before work begins.</div>' +
    '<div class="svc-grid">' + grid + '</div>' +
    '<div class="notice brand" style="margin-top:26px">' + ic('info') + '<span>Can\'t find your service? <a href="#/register" style="text-decoration:underline">Post it anyway</a> and professionals will still respond to you.</span></div>' +
    '</div></section>';

  return { html: html };
}
