"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  Wrench,
  CheckCircle2,
  ChevronDown,
  Globe,
  LogOut,
  ShieldCheck,
  User,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Briefcase,
  X,
} from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
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
  onSearchChange,
  onSelectTab,
  onMarkNotificationsRead,
}: {
  profile: WorkerDashboardProfile;
  notifications: DashboardNotification[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectTab: (tab: DashboardTab) => void;
  onMarkNotificationsRead: () => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "ur" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link
            href="/worker/dashboard"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-[#1a4a70] text-white shadow-xs">
              <Wrench className="size-5 text-teal" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-navy">
                  HUNAR
                </span>
                <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-teal">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground hidden sm:block">
                Worker Portal · Peshawar
              </p>
            </div>
          </Link>
        </div>

        {/* Middle: Quick Search Bar */}
        <div className="relative hidden md:block max-w-md flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 rtl:left-auto rtl:right-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search nearby jobs, Peshawar areas, or trades..."
            className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-9 text-xs text-dark placeholder:text-slate-400 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 rtl:pl-9 rtl:pr-10 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rtl:right-auto rtl:left-3"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Right: Actions (Language, Notification Bell, User Menu) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-teal/30 hover:bg-slate-50"
            title="Switch English / اردو"
          >
            <Globe className="size-3.5 text-teal" />
            <span>{locale === "en" ? "اردو" : "EN"}</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-2xs transition-colors hover:border-teal/30 hover:bg-slate-50"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-[#F59E0B] text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Modal */}
            {showNotifications && (
              <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl rtl:right-auto rtl:left-0 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-orange/15 px-2 py-0.2 text-[10px] font-bold text-orange">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkNotificationsRead}
                      className="text-[11px] font-semibold text-teal hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto py-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.linkTab) onSelectTab(n.linkTab);
                        setShowNotifications(false);
                      }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        n.read ? "hover:bg-slate-50 opacity-80" : "bg-teal/5 hover:bg-teal/10"
                      }`}
                    >
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 text-teal shadow-2xs">
                        {n.type === "job" && <Briefcase className="size-3.5" />}
                        {n.type === "offer" && <CheckCircle2 className="size-3.5 text-success" />}
                        {n.type === "commission" && <DollarSign className="size-3.5 text-orange" />}
                        {n.type === "chat" && <MessageSquare className="size-3.5 text-teal" />}
                        {n.type === "review" && <span className="text-xs">⭐</span>}
                        {n.type === "verification" && <ShieldCheck className="size-3.5 text-teal" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-navy truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-2 text-center">
                  <p className="text-[10px] text-slate-400">
                    Realtime updates via Socket.IO
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-2.5 shadow-2xs transition-colors hover:border-teal/30 hover:bg-slate-50"
            >
              <div className="relative flex size-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-2xs">
                <span>{profile.fullName.charAt(0)}</span>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white ${
                    profile.isOnline ? "bg-[#16A34A]" : "bg-slate-400"
                  }`}
                  title={profile.isOnline ? "Online" : "Offline"}
                />
              </div>
              <span className="text-xs font-bold text-navy max-w-[90px] truncate hidden sm:inline-block">
                {profile.fullName.split(" ")[0]}
              </span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl rtl:right-auto rtl:left-0 animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="text-xs font-bold text-navy truncate">
                    {profile.fullName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    +92 {profile.phone}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-teal">
                    <CheckCircle2 className="size-3" />
                    <span>Teal Verified Pro ({profile.workerId})</span>
                  </div>
                </div>

                <div className="py-1 space-y-0.5 text-xs">
                  <button
                    onClick={() => {
                      onSelectTab("profile");
                      setShowUserMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-navy"
                  >
                    <User className="size-3.5 text-teal" />
                    <span>View Profile</span>
                  </button>
                  <Link
                    href="/worker/verification-status"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-navy"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="size-3.5 text-teal" />
                      <span>Verification Status</span>
                    </span>
                    <ExternalLink className="size-3 text-slate-400" />
                  </Link>
                  <a
                    href="https://wa.me/923140837519?text=Hello%20HUNAR%20Support,%20I%20am%20Worker%20ID:%20HNR-PK-9824"
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 hover:text-navy"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="size-3.5 text-success" />
                      <span>WhatsApp Support</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">+92 314</span>
                  </a>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <Link
                    href="/worker/sign-in"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-error hover:bg-error/10"
                  >
                    <LogOut className="size-3.5 text-error" />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
