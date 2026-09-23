"use client";

import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  MessageSquare,
  User,
  ShieldCheck,
  ChevronRight,
  X,
} from "lucide-react";
import type { DashboardTab, WorkerDashboardProfile } from "../types";
import { OrderworkerLogo } from "@/components/shared/orderworker-logo";

export function DashboardSidebar({
  activeTab,
  onSelectTab,
  profile,
  unreadNotificationsCount = 0,
  isOpen,
  onClose,
}: {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  profile: WorkerDashboardProfile;
  unreadNotificationsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
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

  const handleItemClick = (id: DashboardTab) => {
    onSelectTab(id);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar (Desktop static / Mobile slide-over drawer) */}
      <aside
        className={`fixed lg:static top-0 start-0 z-50 lg:z-auto h-full min-h-screen w-64 shrink-0 flex flex-col justify-between border-r border-slate-200 bg-white p-4 transition-transform duration-300 ${
          isOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0 hidden lg:flex"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo & Portal Tag + Mobile Close button */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 pb-3 lg:border-none lg:pb-0">
            <div className="flex flex-col gap-1">
              <OrderworkerLogo variant="dark" size="sm" />
              <div className="flex items-center gap-1.5 pl-0.5">
                <span className="rounded-full bg-[#0F8B8D]/15 px-2 py-0.2 text-[10px] font-extrabold uppercase tracking-wide text-[#0F8B8D]">
                  PRO
                </span>
                <p className="text-[11px] font-medium text-slate-500">
                  Worker Portal · Peshawar
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Close Sidebar"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Grouped Navigation Links */}
          <nav className="space-y-4 pt-1">
            {navSections.map((section) => (
              <div key={section.heading} className="space-y-1">
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  {section.heading}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item.id)}
                        className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#0F8B8D] text-white shadow-xs shadow-[#0F8B8D]/20"
                            : "text-slate-700 hover:bg-slate-100 hover:text-[#123B5D]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`size-4 transition-colors ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-[#0F8B8D]"
                            }`}
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge ? (
                          <span
                            className={`rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                              isActive
                                ? "bg-white text-[#0F8B8D]"
                                : "bg-[#F59E0B] text-white"
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
        <div className="border-t border-slate-100 pt-3 text-[11px] space-y-1 px-1">
          <div className="flex items-center gap-1.5 font-bold text-[#123B5D]">
            <ShieldCheck className="size-3.5 text-[#0F8B8D]" />
            <span>Orderworker Verified Portal</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Peshawar Pro Network · v1.0
          </p>
        </div>
      </aside>
    </>
  );
}