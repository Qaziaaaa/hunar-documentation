export type NotificationType =
  | "new_job"
  | "offer_accepted"
  | "offer_rejected"
  | "counter_offer"
  | "counter_accepted"
  | "visit_approaching"
  | "new_message"
  | "commission_reminder"
  | "commission_verified"
  | "earnings_recorded"
  | "new_review"
  | "verification_result"
  | "new_offer"
  | "visit_scheduled"
  | "inspection_submitted"
  | "repair_estimate_ready"
  | "repair_approved"
  | "payment_confirmed"
  | "job_completed";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  resourceId?: string;
  href?: string;
}

export interface UpdateNotificationPreferencesInput {
  channelTypes: Partial<
    Record<NotificationType | "system", boolean>
  >;
}