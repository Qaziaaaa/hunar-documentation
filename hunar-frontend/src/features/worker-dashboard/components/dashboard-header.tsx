"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, Settings, X } from "lucide-react";
import { cn } from "cn";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Switch } from "@/components/ui/switch";
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
  showRelevantJobs = false,
  onToggleShowRelevantJobs,
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
  showRelevantJobs?: boolean;
  onToggleShowRelevantJobs?: (enabled?: boolean) => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close Settings panel when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSettingsOpen(false);
      }
    }

    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsOpen]);

  const handleSelectLanguage = (nextLocale: "en" | "ur") => {
    if (nextLocale !== locale) {
      router.replace(pathname, { locale: nextLocale });
    }
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

        {/* RIGHT: Settings Button & Dropdown Panel */}
        <div className="relative flex items-center" ref={settingsRef}>
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className={cn(
              "p-2 rounded-xl text-slate-700 hover:text-slate-900 transition-colors cursor-pointer",
              isSettingsOpen && "text-teal"
            )}
            title="Settings"
            aria-label="Settings"
            aria-expanded={isSettingsOpen}
            aria-haspopup="true"
          >
            <Settings className={cn("size-5 transition-transform duration-200", isSettingsOpen && "rotate-45 text-teal")} />
          </button>

          {/* Compact Settings Panel */}
          {isSettingsOpen && (
            <div
              className="absolute end-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 text-start"
              role="dialog"
              aria-label="Settings"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Settings className="size-4 text-teal" />
                  <span className="text-sm font-extrabold text-navy">
                    {locale === "ur" ? "سیٹنگز" : "Settings"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Language Selection */}
              <div className="py-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {locale === "ur" ? "زبان (Language)" : "Language"}
                </label>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Language">
                  {/* Urdu Radio Option */}
                  <label
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold cursor-pointer transition-all",
                      locale === "ur"
                        ? "border-teal bg-teal/5 text-teal ring-1 ring-teal/30 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="dashboard-language-selection"
                      value="ur"
                      checked={locale === "ur"}
                      onChange={() => handleSelectLanguage("ur")}
                      className="accent-teal size-3.5 cursor-pointer"
                    />
                    <span>اردو</span>
                  </label>

                  {/* English Radio Option */}
                  <label
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold cursor-pointer transition-all",
                      locale === "en"
                        ? "border-teal bg-teal/5 text-teal ring-1 ring-teal/30 shadow-2xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="radio"
                      name="dashboard-language-selection"
                      value="en"
                      checked={locale === "en"}
                      onChange={() => handleSelectLanguage("en")}
                      className="accent-teal size-3.5 cursor-pointer"
                    />
                    <span>English</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-slate-100 my-1" />

              {/* Show Relevant Jobs Toggle */}
              <div className="pt-3">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="show-relevant-jobs-toggle"
                    className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer select-none"
                  >
                    Show Relevant Jobs
                  </label>
                  <Switch
                    id="show-relevant-jobs-toggle"
                    checked={showRelevantJobs}
                    onCheckedChange={(checked) => onToggleShowRelevantJobs?.(checked)}
                    aria-label="Show Relevant Jobs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
