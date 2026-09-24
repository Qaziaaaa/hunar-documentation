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
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="size-5" />
            </button>
          )}
        </div>

        {/* MID: Online / Offline Segmented Pill Slider Toggle */}
        <div className="flex items-center justify-center">
          <div
            className="relative inline-flex h-9 sm:h-10 w-36 sm:w-44 shrink-0 items-center rounded-full bg-slate-200/80 shadow-inner select-none cursor-pointer overflow-hidden"
            title={
              locale === "ur"
                ? isOnline
                  ? "موجودہ اسٹیٹس: آن لائن (آف لائن ہونے کے لیے کلک کریں)"
                  : "موجودہ اسٹیٹس: آف لائن (آن لائن ہونے کے لیے کلک کریں)"
                : isOnline
                ? "Current Status: Online (Click to go offline)"
                : "Current Status: Offline (Click to go online)"
            }
          >
            {/* Left / Start Half Target */}
            <button
              type="button"
              onClick={() => onToggleOnline(false)}
              className="z-10 flex h-full flex-1 items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {!isOnline ? null : locale === "ur" ? "آف لائن" : "Offline"}
            </button>

            {/* Right / End Half Target */}
            <button
              type="button"
              onClick={() => onToggleOnline(true)}
              className="z-10 flex h-full flex-1 items-center justify-center text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              {isOnline ? null : locale === "ur" ? "آن لائن" : "Online"}
            </button>

            {/* Sliding Active Pill */}
            <div
              className={cn(
                "absolute top-0 bottom-0 start-0 z-20 w-1/2 rounded-full flex items-center justify-center text-xs sm:text-sm font-extrabold text-white shadow-md transition-all duration-300 ease-in-out pointer-events-none",
                isOnline
                  ? "translate-x-full rtl:-translate-x-full bg-[#16A34A]"
                  : "translate-x-0 bg-red-500"
              )}
            >
              {isOnline
                ? locale === "ur" ? "آن لائن" : "Online"
                : locale === "ur" ? "آف لائن" : "Offline"}
            </div>
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
