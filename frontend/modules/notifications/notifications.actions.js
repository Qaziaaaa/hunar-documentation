import { Store } from '../../app/state.js';
import { UI, timeAgo, esc } from '../../shared/ui/ui.js';
import { ic } from '../../shared/icons/icons.js';


export const NotificationActions = {
  markAllNotifs: function () {
    const u = Store.currentUser();
    if (u) {
      Store.markAllRead(u.id);
      UI.toast('All notifications marked as read.', 'ok');
    }
  },

  notifGo: function (nid) {
    const u = Store.currentUser();
    if (!u) return;
    const arr = Store.state().notifications[u.id] || [];
    const n = arr.find(function (x) { return x.id === nid; });
    if (n) {
      Store.markRead(u.id, nid);
      if (n.route && typeof window.go !== 'undefined') window.go(n.route);
    }
  },

  notifMenu: function () {
    const u = Store.currentUser();
    if (!u) return;
    const arr = (Store.state().notifications[u.id] || []).slice(0, 5);
    const unread = Store.unreadFor(u.id);
    const items = arr.length ? arr.map(function (n) {
      return '<div class="fmenu-item notif-drop' + (n.read ? '' : ' unread') + '" onclick="A.notifGo(\'' + n.id + '\'); A.closeMenu();">' +
        '<div style="flex:1"><b style="font-size:13px">' + esc(n.title) + '</b><div class="smallnote" style="line-height:1.3;margin-top:2px">' + esc(n.body) + '</div><div class="smallnote" style="margin-top:4px">' + timeAgo(n.at) + '</div></div></div>';
    }).join('') : '<div style="padding:18px;text-align:center;color:var(--muted);font-size:13px">No notifications</div>';

    const route = u.role === 'worker' ? '/worker/notifications' : '/customer/notifications';
    const html = '<div class="fmenu-pop" style="right:70px;top:54px;width:340px;max-width:90vw">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--line)"><b style="font-size:14px">Notifications (' + unread + ')</b><a href="#' + route + '" onclick="A.closeMenu()" style="font-size:12.5px;color:var(--brand);font-weight:600">View all</a></div>' +
      items + '</div>';

    const fm = document.getElementById('float-menu');
    if (fm) fm.innerHTML = html;
  }
};
