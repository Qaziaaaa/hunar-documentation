"use client";

import { Globe, Radio, LayoutList } from "lucide-react";
import { cn } from "cn";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import type {
  WorkerDashboardProfile,
  DashboardNotification,
  DashboardTab,
} from "../types";

export function DashboardHeader({
  profile,
  notifications,
  searchQuery,
  isOnline,
  viewMode = "feed",
  onToggleOnline,
  onSearchChange,
  onSelectTab,
  onMarkNotificationsRead,
  onSelectViewMode,
}: {
  profile?: WorkerDashboardProfile;
  notifications?: DashboardNotification[];
  searchQuery?: string;
  isOnline: boolean;
  viewMode?: "feed" | "radar";
  onToggleOnline: () => void;
  onSearchChange?: (q: string) => void;
  onSelectTab?: (tab: DashboardTab) => void;
  onMarkNotificationsRead?: () => void;
  onSelectViewMode?: (mode: "feed" | "radar") => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "ur" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* LEFT: Screen Switch Toggle (Feed vs Radar) */}
        <div className="flex items-center">
          {onSelectViewMode && (
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-100/90 p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => onSelectViewMode("feed")}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-all cursor-pointer",
                  viewMode === "feed"
                    ? "bg-navy text-white shadow-xs"
                    : "text-slate-500 hover:text-navy"
                )}
                title="Job Requests Feed"
                aria-label="Job Requests Feed"
              >
                <LayoutList className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectViewMode("radar")}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-all cursor-pointer",
                  viewMode === "radar"
                    ? "bg-teal text-white shadow-xs"
                    : "text-slate-500 hover:text-teal"
                )}
                title="Radar Searching Screen"
                aria-label="Radar Searching Screen"
              >
                <Radio className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* MID: Online / Offline Segmented Toggle */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            role="switch"
            aria-checked={isOnline}
            onClick={onToggleOnline}
            className="flex items-center rounded-full border-2 border-slate-200 bg-white p-1 cursor-pointer transition-all hover:border-slate-300 shadow-2xs"
            title={isOnline ? "Tap to go Offline" : "Tap to go Online"}
          >
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide transition-colors duration-200",
                !isOnline ? "bg-red-500 text-white shadow-sm" : "text-slate-400"
              )}
            >
              Offline
            </span>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide transition-colors duration-200",
                isOnline ? "bg-[#16A34A] text-white shadow-sm" : "text-slate-400"
              )}
            >
              Online
            </span>
          </button>
        </div>

        {/* RIGHT: Urdu / English Language Switcher */}
        <div className="flex items-center">
          <button
            onClick={toggleLocale}
            className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:border-teal/30 hover:bg-slate-50 cursor-pointer"
            title="Switch English / اردو"
          >
            <Globe className="size-3.5 text-teal" />
            <span>{locale === "en" ? "اردو" : "EN"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
