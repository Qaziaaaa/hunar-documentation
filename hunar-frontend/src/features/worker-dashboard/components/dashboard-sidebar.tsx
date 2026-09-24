"use client";

import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  TrendingUp,
  User,
  ChevronRight,
  X,
} from "lucide-react";
import type { DashboardTab, WorkerDashboardProfile } from "../types";
import { OrderworkerLogo } from "@/components/shared/orderworker-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/shared/rating-stars";

import { useLocale } from "next-intl";

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
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const navSections: Array<{
    heading: string;
    items: Array<{
      id: DashboardTab;
      label: string;
      icon: any;
      badge?: number;
    }>;
  }> = [
    {
      heading: isUrdu ? "کام اور جابز" : "Work & Jobs",
      items: [
        {
          id: "dashboard" as DashboardTab,
          label: isUrdu ? "ڈیش بورڈ" : "Dashboard",
          icon: LayoutDashboard,
        },
        {
          id: "jobs" as DashboardTab,
          label: isUrdu ? "تمام جابز" : "All Jobs",
          icon: Briefcase,
        },
      ],
    },
    {
      heading: isUrdu ? "مالیات اور کمائی" : "Finances & Earnings",
      items: [
        {
          id: "wallet" as DashboardTab,
          label: isUrdu ? "والٹ" : "Wallet",
          icon: Wallet,
        },
        {
          id: "earnings" as DashboardTab,
          label: isUrdu ? "کمائی" : "Earnings",
          icon: TrendingUp,
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

  const ratingValue = profile.rating ?? 4.8;
  const completedCount = profile.completedJobsCount ?? 14;

  return (
    <>
      {/* Mobile Drawer Backdrop (z-40 behind sidebar z-50) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Full-Height Fixed Desktop Sidebar / Slide-over Mobile Drawer (z-50) */}
      <aside
        className={`fixed top-0 start-0 z-50 h-screen w-64 shrink-0 flex flex-col justify-between border-e border-slate-200 bg-white p-4 transition-transform duration-300 overflow-hidden ${
          isOpen
            ? "translate-x-0 shadow-2xl flex"
            : "-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0 lg:transform-none hidden lg:flex"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Logo & Portal Tag + Mobile Close button */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 pb-3 lg:border-none lg:pb-0">
            <div className="flex flex-col gap-0.5">
              <OrderworkerLogo variant="dark" size="sm" />
              <p className="text-[11px] font-medium text-slate-500 pl-0.5">
                Worker Portal · Peshawar
              </p>
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

        {/* Worker Profile Section at Very Bottom */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => handleItemClick("profile")}
            className={`group w-full text-start flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-[#0F8B8D]/30 bg-[#0F8B8D]/10"
                : "border-slate-100 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Avatar className="size-9 border border-[#0F8B8D]/20 shrink-0">
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                ) : null}
                <AvatarFallback className="bg-[#0F8B8D]/10 font-bold text-[#0F8B8D] text-xs">
                  {profile.fullName ? profile.fullName[0].toUpperCase() : "W"}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-xs font-bold text-[#123B5D] truncate leading-tight">
                  {profile.fullName || (isUrdu ? "ورکر پروفائل" : "Worker Profile")}
                </p>

                <div className="flex items-center gap-1">
                  <RatingStars rating={ratingValue} size="size-3" />
                  <span className="text-[10px] font-bold text-[#123B5D]">
                    {ratingValue.toFixed(1)}
                  </span>
                </div>

                <p className="text-[10px] font-medium text-slate-500">
                  {isUrdu ? `${completedCount} مکمل شدہ آرڈرز` : `${completedCount} Completed Orders`}
                </p>
              </div>
            </div>

            <ChevronRight className="size-4 text-slate-400 group-hover:text-[#0F8B8D] shrink-0 transition-colors" />
          </button>
        </div>
      </aside>
    </>
  );
}