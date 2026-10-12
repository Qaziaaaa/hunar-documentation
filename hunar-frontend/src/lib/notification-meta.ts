import {
  BadgeCheck,
  Banknote,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock,
  Handshake,
  MessageSquare,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";
import type { NotificationType } from "@/types/notification";

export type NotificationCategory =
  | "jobs"
  | "offers"
  | "messages"
  | "commission"
  | "earnings"
  | "reviews"
  | "account"
  | "system";

export function notificationIcon(
  type: NotificationType,
): React.ComponentType<{ className?: string }> {
  switch (type) {
    case "new_job":
      return Briefcase;
    case "offer_accepted":
    case "counter_accepted":
      return CheckCircle2;
    case "offer_rejected":
      return XCircle;
    case "counter_offer":
      return Handshake;
    case "visit_approaching":
      return Clock;
    case "new_message":
      return MessageSquare;
    case "commission_reminder":
      return Bell;
    case "commission_verified":
      return BadgeCheck;
    case "earnings_recorded":
      return Banknote;
    case "new_review":
      return Star;
    case "verification_result":
      return ShieldCheck;
    case "new_offer":
    case "repair_estimate_ready":
      return Handshake;
    case "visit_scheduled":
      return Clock;
    case "inspection_submitted":
    case "job_completed":
      return CheckCircle2;
    case "repair_approved":
      return BadgeCheck;
    case "payment_confirmed":
      return Banknote;
    default:
      return Bell;
  }
}

export function notificationCategory(
  type: NotificationType,
): NotificationCategory {
  switch (type) {
    case "new_job":
    case "visit_approaching":
      return "jobs";
    case "offer_accepted":
    case "offer_rejected":
    case "counter_offer":
    case "counter_accepted":
      return "offers";
    case "new_message":
      return "messages";
    case "commission_reminder":
    case "commission_verified":
      return "commission";
    case "earnings_recorded":
      return "earnings";
    case "new_review":
      return "reviews";
    case "verification_result":
      return "account";
    case "new_offer":
    case "repair_estimate_ready":
    case "repair_approved":
      return "offers";
    case "visit_scheduled":
    case "inspection_submitted":
    case "job_completed":
      return "jobs";
    case "payment_confirmed":
      return "commission";
    default:
      return "system";
  }
}
