import { http } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import type { AppNotification, NotificationType } from "@/types/notification";

type NotificationListener = (notification: AppNotification) => void;

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

function normalizeBackendNotification(raw: unknown): AppNotification {
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

export async function getCustomerNotifications(): Promise<AppNotification[]> {
  const res = await http.get<unknown>(`/notifications`);
  const rows: unknown[] = Array.isArray(res)
    ? res
    : (res as { items?: unknown[] })?.items ?? [];
  return rows.map(normalizeBackendNotification);
}

export async function getCustomerUnreadCount(): Promise<number> {
  return http.get<number>(`/notifications/unread-count`);
}

export async function markCustomerNotificationRead(
  notificationId: string,
): Promise<void> {
  await http.patch(`/notifications/${notificationId}/read`);
}

export async function markAllCustomerNotificationsRead(): Promise<void> {
  await http.patch(`/notifications/read-all`);
}


export function subscribeToCustomerNotifications(
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