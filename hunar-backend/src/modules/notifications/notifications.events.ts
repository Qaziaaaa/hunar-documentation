// Socket.IO event names for the worker notification inbox (Task 6).
// Delivery channel is the realtime module's per-user rooms (user:<userId>).

export const NOTIFICATION_EVENTS = {
  new: 'notification:new',
  read: 'notification:read',
  readAll: 'notification:readAll',
} as const;

// How far ahead of a scheduled visit the "visit window approaching" notification fires.
export const VISIT_WINDOW_AHEAD_MINUTES = 60;

// Worker notifications are pushed to the `user:<id>` room via RealtimeService.emitToUsers.
export function notificationRoom(userId: string): string {
  return `user:${userId}`;
}
