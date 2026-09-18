"use client";

import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  MessageSquare,
  User,
} from "lucide-react";
import type { DashboardTab } from "../types";

export function MobileNavBar({
  activeTab,
  onSelectTab,
  activeJobsCount,
  unreadMessagesCount = 0,
}: {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  activeJobsCount: number;
  unreadMessagesCount?: number;
}) {
  const tabs: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "jobs", label: "Jobs", icon: Briefcase, badge: activeJobsCount },
    { id: "earnings", label: "Earnings", icon: Wallet },
    { id: "chat", label: "Chat", icon: MessageSquare, badge: unreadMessagesCount },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                isActive ? "text-teal" : "text-slate-500 hover:text-navy"
              }`}
            >
              <div className="relative">
                <Icon className={`size-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex size-4 items-center justify-center rounded-full bg-orange text-[9px] font-bold text-white">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? "font-extrabold" : "font-medium"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 size-1 rounded-full bg-teal" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
