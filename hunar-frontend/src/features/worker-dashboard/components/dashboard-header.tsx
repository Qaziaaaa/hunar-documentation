"use client";

import { Globe, Menu } from "lucide-react";
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
  onToggleOnline,
  onSearchChange,
  onSelectTab,
  onMarkNotificationsRead,
  onOpenSidebar,
}: {
  profile?: WorkerDashboardProfile;
  notifications?: DashboardNotification[];
  searchQuery?: string;
  isOnline: boolean;
  onToggleOnline: (status?: boolean) => void;
  onSearchChange?: (q: string) => void;
  onSelectTab?: (tab: DashboardTab) => void;
  onMarkNotificationsRead?: () => void;
  onOpenSidebar?: () => void;
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
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 gap-2">
        {/* LEFT: Mobile Menu Button */}
        <div className="flex items-center">
          {onOpenSidebar && (
            <button
              type="button"
              onClick={onOpenSidebar}
              className="lg:hidden size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="size-5" />
            </button>
          )}
        </div>

        {/* MID: Online / Offline Segmented Toggle */}
        <div className="flex items-center justify-center">
          <div
            className="flex items-center rounded-full border-2 border-slate-200 bg-slate-100/90 p-1 shadow-2xs select-none"
            title={isOnline ? "Current Status: Online (Tap Offline to disconnect)" : "Current Status: Offline (Tap Online to connect)"}
          >
            <button
              type="button"
              onClick={() => onToggleOnline(false)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer active:scale-95",
                !isOnline
                  ? "bg-red-500 text-white shadow-xs"
                  : "text-slate-500 hover:text-red-600"
              )}
            >
              Offline
            </button>
            <button
              type="button"
              onClick={() => onToggleOnline(true)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer active:scale-95",
                isOnline
                  ? "bg-[#16A34A] text-white shadow-xs"
                  : "text-slate-500 hover:text-[#16A34A]"
              )}
            >
              Online
            </button>
          </div>
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
