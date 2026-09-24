"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { WorkerAuthGuard } from "./auth-guard";
import { WorkerNav } from "./worker-nav";
import { NotificationBell } from "./notification-bell";
import {
  getUnreadCount,
  queryKeys as notificationKeys,
} from "@/services/worker/notification.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { isMockMode } from "@/lib/data-source";
import { cn } from "@/lib/utils";
import { OrderworkerLogo } from "@/components/shared/orderworker-logo";

function Brand() {
  return (
    <Link
      href="/worker"
      className="flex items-center gap-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <OrderworkerLogo variant="dark" size="sm" />
    </Link>
  );
}

export function WorkerShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Worker.nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unread = 0 } = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadCount,
  });

  useEffect(() => {
    if (!isMockMode()) {
      connectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <WorkerAuthGuard>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-border bg-card lg:flex">
          <div className="flex h-16 items-center border-b border-border px-4">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto">
            <WorkerNav unreadCount={unread} />
          </div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label={t("closeMenu")}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl">
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <Brand />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("closeMenu")}
                  onClick={() => setMobileOpen(false)}
                >
                  <X aria-hidden="true" className="size-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <WorkerNav
                  unreadCount={unread}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={t("openMenu")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu aria-hidden="true" className="size-5" />
            </Button>
            <div className="lg:hidden">
              <Brand />
            </div>
            <div className="flex-1" />
            <NotificationBell />
          </header>
          <main
            className={cn(
              "mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-6 lg:py-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </WorkerAuthGuard>
  );
}
