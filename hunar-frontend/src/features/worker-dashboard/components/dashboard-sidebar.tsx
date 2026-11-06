"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Wallet,
  TrendingUp,
  User,
  ChevronRight,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import type { DashboardTab, WorkerDashboardProfile } from "../types";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/shared/rating-stars";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { logoutWorker } from "@/features/auth/api/auth-api";
import { useStoredUser } from "@/lib/use-stored-user";

export function DashboardSidebar({
  activeTab,
  onSelectTab,
  profile,
  unreadNotificationsCount = 0,
  upcomingJobsCount = 0,
  isOpen,
  onClose,
  onLogout,
  isLoadingProfile = false,
}: {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  profile: WorkerDashboardProfile;
  unreadNotificationsCount?: number;
  upcomingJobsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
  isLoadingProfile?: boolean;
}) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const router = useRouter();
  const storedUser = useStoredUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
          badge: upcomingJobsCount > 0 ? upcomingJobsCount : undefined,
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (onLogout) {
        onLogout();
      } else {
        await logoutWorker();
        router.push("/worker/sign-in");
      }
    } finally {
      if (onClose) onClose();
      setIsLoggingOut(false);
    }
  };

  const displayName =
    profile.fullName ||
    storedUser?.name ||
    storedUser?.phone ||
    (isUrdu ? "ورکر پروفائل" : "Worker Profile");
  const avatarLetter = (displayName ? displayName[0] : "W").toUpperCase();
  const hasRating =
    typeof profile.rating === "number" && !isNaN(profile.rating) && profile.rating > 0;
  const ratingValue = hasRating ? profile.rating : null;
  const completedCount =
    typeof profile.completedJobsCount === "number" && !isNaN(profile.completedJobsCount)
      ? profile.completedJobsCount
      : 0;

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
              <WorkerFixLogo variant="dark" size="sm" />
              <p className="text-[11px] font-medium text-slate-500 pl-0.5">
                Worker Portal
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

        {/* Worker Profile Section at Very Bottom with Logout */}
        <div className="border-t border-slate-100 pt-3 flex items-center gap-2">
          {isLoadingProfile && !profile.fullName && !storedUser?.name ? (
            <div
              className="flex-1 min-w-0 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 animate-pulse"
              aria-label={isUrdu ? "پروفائل لوڈ ہو رہی ہے..." : "Loading profile..."}
            >
              <div className="size-9 rounded-full bg-slate-200 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-2 w-16 bg-slate-200 rounded" />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleItemClick("profile")}
              className={`group min-w-0 flex-1 text-start flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "border-[#0F8B8D]/30 bg-[#0F8B8D]/10"
                  : "border-slate-100 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Avatar className="size-9 border border-[#0F8B8D]/20 shrink-0">
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback suppressHydrationWarning className="bg-[#0F8B8D]/10 font-bold text-[#0F8B8D] text-xs">
                    {avatarLetter}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <p suppressHydrationWarning className="text-xs font-bold text-[#123B5D] truncate leading-tight">
                    {displayName}
                  </p>

                  <div className="flex items-center gap-1">
                    {ratingValue !== null ? (
                      <>
                        <RatingStars rating={ratingValue} size="size-3" />
                        <span suppressHydrationWarning className="text-[10px] font-bold text-[#123B5D]">
                          {ratingValue.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span suppressHydrationWarning className="text-[10px] font-bold text-slate-400">
                        {isUrdu ? "نیا کاریگر" : "New Worker"}
                      </span>
                    )}
                  </div>

                  <p suppressHydrationWarning className="text-[10px] font-medium text-slate-500 truncate">
                    {isUrdu
                      ? `${completedCount} مکمل شدہ آرڈرز`
                      : `${completedCount} Completed Orders`}
                  </p>
                </div>
              </div>

              <ChevronRight className="size-4 text-slate-400 group-hover:text-[#0F8B8D] shrink-0 transition-colors" />
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="size-10 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
            title={isUrdu ? "لاگ آؤٹ" : "Sign Out"}
            aria-label={isUrdu ? "لاگ آؤٹ" : "Sign Out"}
          >
            {isLoggingOut ? (
              <Loader2 className="size-4 animate-spin text-red-600" />
            ) : (
              <LogOut className="size-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}