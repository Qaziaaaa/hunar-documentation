import type { AppNotification, NotificationType } from "@/types/notification";
import type { NotificationPreferences } from "@/types/settings";
import { isoDaysAgo, isoHoursAgo } from "./utils";

type NotificationSeed = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  resourceId?: string;
  href?: string;
};

function hrefFor(type: NotificationType, resourceId?: string): string {
  switch (type) {
    case "new_job":
      return "/worker/jobs";
    case "new_message":
      return resourceId ? `/worker/chat/${resourceId}` : "/worker/chat";
    case "new_review":
      return "/worker/reviews";
    case "verification_result":
      return "/worker/profile";
    case "commission_reminder":
    case "commission_verified":
    case "earnings_recorded":
      return "/worker/earnings";
    case "offer_accepted":
    case "offer_rejected":
    case "counter_offer":
    case "counter_accepted":
    case "visit_approaching":
      return resourceId
        ? `/worker/jobs/${resourceId}/negotiation`
        : "/worker/jobs";
    default:
      return "/worker/notifications";
  }
}

const seeds: NotificationSeed[] = [
  {
    id: "notif-1",
    type: "new_message",
    title: "New message from Ayesha Khan",
    message: "Can you come earlier if the repair is approved?",
    createdAt: isoHoursAgo(1),
    read: false,
    resourceId: "conv-elc-101",
  },
  {
    id: "notif-2",
    type: "counter_offer",
    title: "Counter offer on your repair estimate",
    message: "Customer countered your repair estimate: Rs. 1,400.",
    createdAt: isoHoursAgo(2),
    read: false,
    resourceId: "job-elc-101",
  },
  {
    id: "notif-3",
    type: "visit_approaching",
    title: "Visit window approaching",
    message: "Your AC repair visit starts in 2 hours.",
    createdAt: isoHoursAgo(3),
    read: true,
    resourceId: "job-ac-202",
  },
  {
    id: "notif-4",
    type: "new_review",
    title: "You received a 5-star review",
    message: "Sana Malik rated your work 5 stars.",
    createdAt: isoDaysAgo(8, 18),
    read: true,
  },
  {
    id: "notif-5",
    type: "earnings_recorded",
    title: "Earnings recorded",
    message: "Rs. 1,650 earned for job #job-plumb-303.",
    createdAt: isoDaysAgo(9, 17),
    read: true,
  },
  {
    id: "notif-6",
    type: "commission_reminder",
    title: "Commission due",
    message:
      "Commission Rs. 30 is due. Pay to HUNAR bank account and send the screenshot on WhatsApp +92 314 0837519.",
    createdAt: isoDaysAgo(9, 17),
    read: true,
    resourceId: "job-plumb-303",
  },
  {
    id: "notif-7",
    type: "offer_accepted",
    title: "Offer accepted",
    message: "Customer accepted your offer for the AC repair job.",
    createdAt: isoDaysAgo(12, 15),
    read: true,
    resourceId: "job-ac-202",
  },
  {
    id: "notif-8",
    type: "verification_result",
    title: "Profile verified",
    message: "Your profile was verified by the HUNAR team.",
    createdAt: isoDaysAgo(20, 10),
    read: true,
  },
  {
    id: "notif-9",
    type: "new_job",
    title: "New matching job nearby",
    message: "New job: Leaking pipe in Hayatabad.",
    createdAt: isoDaysAgo(25, 9),
    read: true,
  },
];

export const mockNotifications: AppNotification[] = seeds.map((seed) => ({
  id: seed.id,
  type: seed.type,
  title: seed.title,
  message: seed.message,
  createdAt: seed.createdAt,
  read: seed.read,
  resourceId: seed.resourceId,
  href: hrefFor(seed.type, seed.resourceId),
}));

export const mockNotificationPreferences: NotificationPreferences = {
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
  },
};