"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Clock, Menu, Search, ShieldCheck, X } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

interface CustomerHeaderProps {
  onOpenSidebar: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  titleUr: string;
  desc: string;
  descUr: string;
  time: string;
  timeUr: string;
  unread: boolean;
  link: string;
}

export function CustomerHeader({ onOpenSidebar }: CustomerHeaderProps) {
  const router = useRouter();
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "New Offer Received",
      titleUr: "نئی آفر موصول ہوئی",
      desc: "Rashid Ali sent an offer of Rs. 1,200 for Plumbing Repair.",
      descUr: "راشد علی نے پلمبنگ مرمت کے لیے 1,200 روپے کی آفر بھیجی ہے۔",
      time: "5m ago",
      timeUr: "5 منٹ پہلے",
      unread: true,
      link: "/customer/offers",
    },
    {
      id: "2",
      title: "Doorstep Visit Confirmed",
      titleUr: "ڈور اسٹیپ وزٹ کی تصدیق",
      desc: "Technician Ali Khan is en route. Security OTP PIN: 6492.",
      descUr: "ٹیکنیشن علی خان راستے میں ہے۔ سیکیورٹی پن: 6492",
      time: "25m ago",
      timeUr: "25 منٹ پہلے",
      unread: true,
      link: "/customer/visits",
    },
    {
      id: "3",
      title: "Job Request Published",
      titleUr: "جاب درخواست شائع ہو گئی",
      desc: "Your AC Deep Wash request is now visible to nearby pros.",
      descUr: "آپ کی اے سی ڈبلیو کی درخواست قریبی ورکرز کو دکھائی دے رہی ہے۔",
      time: "1h ago",
      timeUr: "1 گھنٹہ پہلے",
      unread: false,
      link: "/customer/jobs",
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/customer/post-job?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const placeholderText = isUrdu ? "سروس تلاش کریں..." : "Search services...";

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
        {/* Desktop / Expanded Search Form */}
        <form
          onSubmit={handleSearch}
          className={`relative transition-all duration-200 ${
            searchOpen
              ? "flex items-center w-48 sm:w-72"
              : "hidden sm:flex items-center w-56 sm:w-64"
          }`}
        >
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholderText}
            className="w-full h-10 ps-9 pe-8 text-xs font-medium rounded-xl border border-slate-200 bg-white/90 focus:bg-white focus:border-[#0F8B8D] focus:outline-none transition-all placeholder:text-slate-400 shadow-2xs"
          />
          {searchOpen ? (
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
              }}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full text-slate-400 hover:text-slate-700 flex items-center justify-center sm:hidden cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </form>

        {/* Mobile Search Toggle Icon Button */}
        {!searchOpen ? (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search Services"
            className="sm:hidden size-10 rounded-xl text-slate-700 hover:text-[#0F8B8D] hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            title="Search Services"
          >
            <Search className="size-5 stroke-[2.2]" />
          </button>
        ) : null}

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
                    {isUrdu ? "نوٹیفکیشنز" : "Notifications"}
                  </span>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 text-[#0F8B8D] text-[10px] font-bold">
                      {unreadCount} {isUrdu ? "نئے" : "New"}
                    </span>
                  ) : null}
                </div>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-[#0F8B8D] hover:underline cursor-pointer"
                  >
                    {isUrdu ? "سب پڑھے ہوئے نشان زد کریں" : "Mark all as read"}
                  </button>
                ) : null}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => setNotificationsOpen(false)}
                    className={`flex items-start gap-3 p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                      item.unread ? "bg-teal-50/40" : "bg-white"
                    }`}
                  >
                    <div className="size-8 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#123B5D] truncate">
                          {isUrdu ? item.titleUr : item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-0.5">
                          <Clock className="size-3" />
                          {isUrdu ? item.timeUr : item.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-0.5">
                        {isUrdu ? item.descUr : item.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                <Link
                  href="/customer/offers"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-bold text-[#0F8B8D] hover:underline"
                >
                  {isUrdu ? "تمام نوٹیفکیشنز اور آفرز دیکھیں →" : "View All Activity & Offers →"}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
