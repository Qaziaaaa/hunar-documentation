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

// Backend NotificationType enum → frontend NotificationType
const BACKEND_TYPE_MAP: Record<string, NotificationType> = {
  JOB_MATCHED: "new_job",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_REJECTED: "offer_rejected",
  COUNTER_OFFER: "counter_offer",
  COUNTER_ACCEPTED: "counter_accepted",
  VISIT_WINDOW_APPROACHING: "visit_approaching",
  NEW_MESSAGE: "new_message",
  COMMISSION_HELD: "commission_reminder",
  COMMISSION_DEDUCTED: "commission_reminder",
  COMMISSION_REVERSED: "commission_reminder",
  INSUFFICIENT_BALANCE: "commission_reminder",
  TOPUP_SUBMITTED: "commission_reminder",
  TOPUP_APPROVED: "commission_verified",
  TOPUP_REJECTED: "commission_reminder",
  EARNINGS_RECORDED: "earnings_recorded",
  REVIEW_RECEIVED: "new_review",
  VERIFICATION_RESULT: "verification_result",
};

interface BackendNotificationRow {
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
  isRead?: boolean;
  resourceId?: string;
  resource_id?: string;
  href?: string;
}

/** Normalize a backend notification row (or socket payload) to AppNotification. */
export function normalizeBackendNotification(raw: unknown): AppNotification {
  const n = (raw ?? {}) as BackendNotificationRow;
  return {
    id: n.id ?? `notif-${Date.now()}`,
    type: BACKEND_TYPE_MAP[n.type ?? ""] ?? "new_job",
    title: n.title ?? "Notification",
    message: n.message ?? n.body ?? "",
    createdAt: n.createdAt ?? new Date().toISOString(),
    read: typeof n.read === "boolean" ? n.read : Boolean(n.isRead),
    resourceId: n.resourceId ?? n.resource_id,
    href: n.href,
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  if (isMockMode()) {
    return simulateLatency(
      [...mockNotifications].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  }
  const res = await http.get<unknown>(`/notifications`);
  const rows: unknown[] = Array.isArray(res)
    ? res
    : (res as { items?: unknown[] })?.items ?? [];
  return rows.map(normalizeBackendNotification);
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
  const handle = (payload: unknown) =>
    listener(normalizeBackendNotification(payload));
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