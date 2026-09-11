import { ic } from '../../shared/icons/icons.js';
import { UI, esc, timeAgo } from '../../shared/ui/ui.js';
import { Store } from '../../app/state.js';

export function renderNotificationsView() {
  const u = Store.currentUser();
  if (!u) return { html: '' };
  const arr = (Store.state().notifications[u.id] || []).slice(0, 30);
  const html = '<div class="card">' +
    '<div class="card-h"><h3>Notifications</h3><button class="btn btn-outline btn-sm" onclick="A.markAllNotifs()">' + ic('check', { s: 13 }) + ' Mark all read</button></div>' +
    (arr.length ? arr.map(function (n) {
      return '<div class="notif-item' + (n.read ? '' : ' unread') + '" onclick="A.notifGo(\'' + n.id + '\')">' +
        '<div class="n-ic" style="background:var(--brand-3);color:var(--brand)">' + ic(n.icon || 'bell', { s: 18 }) + '</div>' +
        '<div style="flex:1;min-width:0"><h4>' + esc(n.title) + '</h4><p>' + esc(n.body) + '</p>' +
        '<div class="n-t">' + ic('clock', { s: 12 }) + ' ' + timeAgo(n.at) + (n.read ? '' : ' · new') + '</div></div>' +
        (n.read ? '' : '<span class="ndot"></span>') + '</div>';
    }).join('') : UI.empty('bell', "You're all caught up", 'New updates about offers, visits and repairs will appear here.')) + '</div>';
  return { html: html };
}
