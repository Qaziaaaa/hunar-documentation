"use client";

import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  MessageSquare,
  User,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import type { DashboardTab, WorkerDashboardProfile } from "../types";
import { OrderworkerLogo } from "@/components/shared/orderworker-logo";

export function DashboardSidebar({
  activeTab,
  onSelectTab,
  profile,
  unreadNotificationsCount = 0,
}: {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  profile: WorkerDashboardProfile;
  unreadNotificationsCount?: number;
}) {
  const navSections = [
    {
      heading: "Work & Jobs",
      items: [
        {
          id: "dashboard" as DashboardTab,
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          id: "jobs" as DashboardTab,
          label: "Active Jobs",
          icon: Briefcase,
          badge: profile.activeJobsCount > 0 ? profile.activeJobsCount : undefined,
        },
      ],
    },
    {
      heading: "Finances & Comms",
      items: [
        {
          id: "earnings" as DashboardTab,
          label: "Earnings & Wallet",
          icon: Wallet,
        },
        {
          id: "chat" as DashboardTab,
          label: "Messages",
          icon: MessageSquare,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        },
      ],
    },
    {
      heading: "Account",
      items: [
        {
          id: "profile" as DashboardTab,
          label: "Profile & Settings",
          icon: User,
        },
      ],
    },
  ];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-r border-teal/15 bg-white p-4">
      <div className="space-y-6">
        {/* Brand Logo & Portal Tag */}
        <div className="flex flex-col gap-1 px-2 py-1">
          <OrderworkerLogo variant="dark" size="sm" />
          <div className="flex items-center gap-1.5 pl-0.5">
            <span className="rounded-full bg-teal/15 px-2 py-0.2 text-[10px] font-extrabold uppercase tracking-wide text-teal">
              PRO
            </span>
            <p className="text-[11px] font-medium text-muted-foreground">
              Worker Portal · Peshawar
            </p>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="space-y-4 pt-2">
          {navSections.map((section) => (
            <div key={section.heading} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
                {section.heading}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-teal text-white shadow-xs shadow-teal/20"
                          : "text-foreground/80 hover:bg-background hover:text-navy"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`size-4 transition-colors ${
                            isActive
                              ? "text-white"
                              : "text-muted-foreground group-hover:text-teal"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                            isActive
                              ? "bg-white text-teal"
                              : "bg-orange text-white"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        isActive && (
                          <ChevronRight className="size-3.5 text-white/80" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Support Info */}
      <div className="border-t border-teal/15 pt-3 text-[11px] space-y-1 px-1">
        <div className="flex items-center gap-1.5 font-bold text-navy">
          <ShieldCheck className="size-3.5 text-teal" />
          <span>Orderworker Verified Portal</span>
        </div>
        <p className="text-[10px] text-muted-foreground/70">
          Peshawar Pro Network · v1.0
        </p>
      </div>
    </aside>
  );
}