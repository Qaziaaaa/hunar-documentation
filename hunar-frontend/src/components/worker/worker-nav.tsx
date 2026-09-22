"use client";

import {
  Banknote,
  Bell,
  Briefcase,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Star,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface WorkerNavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

export const WORKER_NAV_ITEMS: WorkerNavItem[] = [
  { href: "/worker", labelKey: "dashboard", icon: LayoutDashboard, exact: true },
  { href: "/worker/jobs", labelKey: "jobs", icon: Briefcase },
  { href: "/worker/chat", labelKey: "chat", icon: MessageSquare },
  { href: "/worker/notifications", labelKey: "notifications", icon: Bell },
  { href: "/worker/earnings", labelKey: "earnings", icon: Banknote },
  { href: "/worker/reviews", labelKey: "reviews", icon: Star },
  { href: "/worker/profile", labelKey: "profile", icon: User },
  { href: "/worker/settings", labelKey: "settings", icon: Settings },
];

export function isNavItemActive(
  pathname: string,
  item: WorkerNavItem,
): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function WorkerNav({
  onNavigate,
  unreadCount = 0,
}: {
  onNavigate?: () => void;
  unreadCount?: number;
}) {
  const t = useTranslations("Worker.nav");
  const tNotif = useTranslations("Worker.notifications");
  const pathname = usePathname();

  return (
    <nav aria-label={t("menuLabel")} className="flex flex-col gap-1 p-3">
      {WORKER_NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-teal/10 text-teal"
                : "text-muted-foreground hover:bg-muted hover:text-navy"
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="flex-1 truncate">{t(item.labelKey)}</span>
            {item.labelKey === "notifications" && unreadCount > 0 ? (
              <span
                aria-label={tNotif("unread")}
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-orange px-1.5 text-[0.7rem] font-semibold text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
