"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Clock, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCustomerNotifications, markAllCustomerNotificationsRead } from "@/features/customer-jobs/services/customer-notification-service";
import { useCustomerSearch } from "./customer-search-context";

interface CustomerHeaderProps {
  onOpenSidebar: () => void;
}

export function CustomerHeader({ onOpenSidebar }: CustomerHeaderProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const t = useTranslations("CustomerPortal.Header");
  const queryClient = useQueryClient();
  const { searchQuery, setSearchQuery } = useCustomerSearch();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["customer", "notifications"],
    queryFn: getCustomerNotifications,
    staleTime: 30_000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllCustomerNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const placeholderText = isUrdu ? "سروس تلاش کریں..." : "Search services...";

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isUrdu ? "ابھی" : "Just now";
    if (diffMins < 60) return isUrdu ? `${diffMins} منٹ پہلے` : `${diffMins}m ago`;
    if (diffHours < 24) return isUrdu ? `${diffHours} گھنٹے پہلے` : `${diffHours}h ago`;
    return isUrdu ? `${diffDays} دن پہلے` : `${diffDays}d ago`;
  };

  return (
    <header className="sticky top-0 start-0 end-0 z-30 bg-transparent px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
      {/* Start: Sidebar Toggle Icon Button (Visible on mobile & tablet) */}
      <div className="flex items-center shrink-0 lg:hidden">
        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open Sidebar"
          className="size-10 rounded-xl text-slate-700 hover:text-[#123B5D] hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="size-5 stroke-[2.2]" />
        </button>
      </div>

      {/* End Corner: Search & Notifications */}
      <div className="flex items-center gap-2.5 ms-auto">
        {/* Single Live Search Bar */}
        <div className="relative flex items-center w-40 sm:w-56 lg:w-72">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholderText}
            aria-label={placeholderText}
            className="w-full h-10 ps-9 pe-9 text-xs font-medium rounded-xl border border-slate-200 bg-white/90 focus:bg-white focus:border-[#0F8B8D] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label={isUrdu ? "تلاش صاف کریں" : "Clear search"}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Interactive Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            aria-label="Notifications"
            className="relative size-10 rounded-xl text-slate-700 hover:text-[#0F8B8D] hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-slate-200/80 bg-white/90 shadow-2xs"
            title="Notifications"
          >
            <Bell className="size-5 stroke-[2]" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -end-1 size-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            ) : null}
          </button>

          {/* Dropdown Popup */}
          {notificationsOpen ? (
            <div className="absolute end-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#123B5D]">
                    {t("notifications")}
                  </span>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-[#0F8B8D] text-[10px] font-bold">
                      {unreadCount} {t("new")}
                    </span>
                  ) : null}
                </div>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-[11px] font-semibold text-[#0F8B8D] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {t("markAllRead")}
                  </button>
                ) : null}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {isLoading ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    {t("loading")}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    {t("noNotifications")}
                  </div>
                ) : (
                  notifications.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href || "/customer/jobs"}
                      onClick={() => setNotificationsOpen(false)}
                      className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !item.read ? "bg-teal-50/40" : "bg-white"
                      }`}
                    >
                      <div className="size-8 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-[#123B5D] truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-0.5">
                            <Clock className="size-3" />
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-0.5">
                          {item.message}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                <Link
                  href="/customer/jobs"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-bold text-[#0F8B8D] hover:underline"
                >
                  {t("viewAll")}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
