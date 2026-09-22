"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getUnreadCount,
  queryKeys as notificationKeys,
  subscribeToNotifications,
} from "@/services/worker/notification.service";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const t = useTranslations("Worker.nav");
  const tNotif = useTranslations("Worker.notifications");
  const queryClient = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadCount,
  });

  useEffect(() => {
    return subscribeToNotifications(() => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount,
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.notifications,
      });
    });
  }, [queryClient]);

  return (
    <Link
      href="/worker/notifications"
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-navy focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      aria-label={
        unread > 0 ? `${t("notifications")} — ${tNotif("unread")}` : t("notifications")
      }
    >
      <Bell aria-hidden="true" className="size-5" />
      {unread > 0 ? (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[0.65rem] font-semibold leading-4 text-white"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
