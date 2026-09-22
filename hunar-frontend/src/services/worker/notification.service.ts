import { http } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type { AppNotification, NotificationType } from "@/types/notification";
import type { NotificationPreferences } from "@/types/settings";
import {
  mockNotificationPreferences,
  mockNotifications,
} from "@/mocks/notifications.mock";

type NotificationListener = (notification: AppNotification) => void;

const mockNotificationListeners = new Set<NotificationListener>();

export async function getNotifications(): Promise<AppNotification[]> {
  if (isMockMode()) {
    return simulateLatency(
      [...mockNotifications].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }
  return http.get<AppNotification[]>(`/notifications`);
}

export async function getUnreadCount(): Promise<number> {
  if (isMockMode()) {
    const count = mockNotifications.filter((n) => !n.read).length;
    return simulateLatency(count, 150, 300);
  }
  return http.get<number>(`/notifications/unread-count`);
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  if (isMockMode()) {
    await simulateLatency(undefined, 150, 300);
    const target = mockNotifications.find((n) => n.id === notificationId);
    if (target) target.read = true;
    return;
  }
  await http.put(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (isMockMode()) {
    await simulateLatency(undefined, 150, 400);
    for (const n of mockNotifications) n.read = true;
    return;
  }
  await http.put(`/notifications/read-all`);
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (isMockMode()) {
    return simulateLatency({
      enabled: { ...mockNotificationPreferences.enabled },
    });
  }
  return http.get<NotificationPreferences>(`/notifications/preferences`);
}

export async function updateNotificationPreferences(
  input: NotificationPreferences,
): Promise<NotificationPreferences> {
  if (isMockMode()) {
    await simulateLatency(undefined, 300, 700);
    mockNotificationPreferences.enabled = { ...input.enabled };
    return { enabled: { ...input.enabled } };
  }
  return http.put<NotificationPreferences>(
    `/notifications/preferences`,
    input,
  );
}

export function subscribeToNotifications(
  listener: NotificationListener,
): () => void {
  if (isMockMode()) {
    mockNotificationListeners.add(listener);
    return () => {
      mockNotificationListeners.delete(listener);
    };
  }
  const socket = getSocket();
  if (!socket) return () => undefined;
  const handle = (notification: AppNotification) => listener(notification);
  socket.on("notification:new", handle);
  return () => {
    socket.off("notification:new", handle);
  };
}

export function notifyMockListeners(
  notification: AppNotification,
): void {
  for (const listener of mockNotificationListeners) {
    listener(notification);
  }
}

export const NOTIFICATION_TYPES: NotificationType[] = [
  "new_job",
  "offer_accepted",
  "offer_rejected",
  "counter_offer",
  "counter_accepted",
  "visit_approaching",
  "new_message",
  "commission_reminder",
  "commission_verified",
  "earnings_recorded",
  "new_review",
  "verification_result",
];

export const queryKeys = {
  notifications: ["worker", "notifications"] as const,
  unreadCount: ["worker", "notifications", "unread"] as const,
  preferences: ["worker", "notifications", "preferences"] as const,
};