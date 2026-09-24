"use client";

import {
  LayoutDashboard,
  Briefcase,
} from "lucide-react";
import type { DashboardTab } from "../types";

import { useLocale } from "next-intl";

export function MobileNavBar({
  activeTab,
  onSelectTab,
  activeJobsCount,
}: {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  activeJobsCount: number;
  unreadMessagesCount?: number;
}) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const tabs: {
    id: DashboardTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: "dashboard", label: isUrdu ? "ہوم" : "Home", icon: LayoutDashboard },
    { id: "jobs", label: isUrdu ? "جابز" : "Jobs", icon: Briefcase, badge: activeJobsCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-6 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all cursor-pointer ${
                isActive ? "text-[#0F8B8D]" : "text-slate-500 hover:text-[#123B5D]"
              }`}
            >
              <div className="relative">
                <Icon className={`size-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2.5 flex size-4 items-center justify-center rounded-full bg-[#F59E0B] text-[9.5px] font-black text-white shadow-2xs">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[11px] mt-0.5 ${isActive ? "font-extrabold text-[#0F8B8D]" : "font-medium"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 size-1 rounded-full bg-[#0F8B8D]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

