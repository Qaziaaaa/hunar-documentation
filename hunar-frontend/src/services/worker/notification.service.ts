import { http } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import type { AppNotification, NotificationType } from "@/types/notification";
import type { NotificationPreferences } from "@/types/settings";

type NotificationListener = (notification: AppNotification) => void;

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
  const res = await http.get<unknown>(`/notifications`);
  const rows: unknown[] = Array.isArray(res)
    ? res
    : (res as { items?: unknown[] })?.items ?? [];
  return rows.map(normalizeBackendNotification);
}

export async function getUnreadCount(): Promise<number> {
  return http.get<number>(`/notifications/unread-count`);
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: {
    system: true,
    new_job: true,
    offer_accepted: true,
    offer_rejected: true,
    counter_offer: true,
    counter_accepted: true,
    visit_approaching: true,
    new_message: true,
    commission_reminder: true,
    commission_verified: true,
    earnings_recorded: true,
    new_review: true,
    verification_result: true,
    new_offer: true,
    visit_scheduled: true,
    inspection_submitted: true,
    repair_estimate_ready: true,
    repair_approved: true,
    payment_confirmed: true,
    job_completed: true,
  },
};

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await http.patch(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await http.put(`/notifications/read`);
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    return await http.get<NotificationPreferences>(`/notifications/preferences`);
  } catch {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("workerfix.notification_preferences");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_PREFERENCES;
  }
}

export async function updateNotificationPreferences(
  input: NotificationPreferences,
): Promise<NotificationPreferences> {
  try {
    return await http.put<NotificationPreferences>(
      `/notifications/preferences`,
      input,
    );
  } catch {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("workerfix.notification_preferences", JSON.stringify(input));
    }
    return input;
  }
}

export function subscribeToNotifications(
  listener: NotificationListener,
): () => void {
  const socket = getSocket();
  if (!socket) return () => undefined;
  const handle = (payload: unknown) =>
    listener(normalizeBackendNotification(payload));
  socket.on("notification:new", handle);
  return () => {
    socket.off("notification:new", handle);
  };
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