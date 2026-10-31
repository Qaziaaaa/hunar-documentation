"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ChevronRight,
  Globe,
  Grid,
  HelpCircle,
  LogOut,
  MessageSquare,
  Package,
  ShieldCheck,
  Tag,
  User,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { logoutCustomer } from "@/features/auth/api/auth-api";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";
import { useStoredUser } from "@/lib/use-stored-user";
import { getCustomerJobs } from "@/features/customer-jobs/api/customer-jobs-api";
import { getCustomerProfile } from "@/features/customer-profile/api/customer-profile-api";
import { getAccessToken, getRefreshToken } from "@/lib/api-client";
import { resolveAvatarUrl } from "@/lib/avatar";

interface CustomerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CustomerSidebar({ isOpen, onClose }: CustomerSidebarProps) {
  const t = useTranslations("CustomerPortal.Nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const storedUser = useStoredUser();
  const hasCustomerAuth = Boolean(getAccessToken("CUSTOMER") || getRefreshToken("CUSTOMER"));
  const isCustomer = storedUser?.role === "CUSTOMER" && hasCustomerAuth;
  const guestLabel = locale === "ur" ? "مہمان" : "Guest";

  const { data: customerProfile } = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: getCustomerProfile,
    staleTime: 60_000,
    enabled: isCustomer,
  });

  const activeAvatarUrl = customerProfile?.avatarUrl || storedUser?.avatarUrl;
  const fullCustomerName = isCustomer
    ? customerProfile?.fullName || storedUser?.name || storedUser?.phone || (locale === "ur" ? "کسٹمر" : "Customer")
    : guestLabel;

  // Show only the first name in the sidebar profile card
  const customerFirstName = isCustomer && fullCustomerName
    ? fullCustomerName.trim().split(/\s+/)[0]
    : fullCustomerName;

  const customerInitial = isCustomer
    ? customerProfile?.avatarInitials || fullCustomerName.charAt(0).toUpperCase() || "C"
    : "G";

  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [activeAvatarUrl]);

  const { data: jobs = [] } = useQuery({
    queryKey: ["customer", "jobs", "sidebar"],
    queryFn: () => getCustomerJobs({ scheduleType: "scheduled" }),
    staleTime: 60_000,
    enabled: isCustomer,
  });

  const activeBookingsCount = jobs.filter(
    (j) =>
      (j.status === "receiving_offers" || j.status === "visit_scheduled") &&
      j.scheduleType !== "asap"
  ).length;

  const handleLogout = async () => {
    await logoutCustomer();
    router.push("/customer/sign-in");
  };

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "ur" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  const navItems = [
    {
      label: t("dashboard"),
      href: "/customer/dashboard",
      icon: Grid,
      badge: null,
      isActive:
        pathname === "/customer" ||
        pathname === "/customer/dashboard" ||
        pathname.includes("/customer/dashboard"),
    },
    {
      label: locale === "ur" ? "میری بکنگز" : "My Bookings",
      href: "/customer/jobs",
      icon: Package,
      badge: activeBookingsCount > 0
        ? { text: locale === "ur" ? `${activeBookingsCount} فعال` : `${activeBookingsCount} Active`, bg: "bg-teal/10 text-teal font-bold" }
        : null,
      isActive: pathname.includes("/customer/jobs"),
    },
    {
      label: locale === "ur" ? "چیٹ و پیغامات" : "Messages",
      href: "/customer/chat",
      icon: MessageSquare,
      badge: null,
      isActive: pathname.includes("/customer/chat"),
    },
    {
      label: t("help"),
      href: "/customer/help",
      icon: HelpCircle,
      badge: null,
      isActive: pathname.includes("/customer/help"),
    },
  ];

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
        className={`fixed top-0 start-0 z-50 h-screen w-64 lg:w-[260px] shrink-0 flex flex-col justify-between border-e border-slate-200 bg-white transition-transform duration-300 overflow-y-auto scrollbar-none no-scrollbar ${
          isOpen
            ? "translate-x-0 shadow-2xl flex"
            : "-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0 lg:transform-none hidden lg:flex"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="p-4 sm:p-5">
          {/* Brand Logo & Mobile Close */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <Link
              href="/"
              className="flex flex-col gap-1 group cursor-pointer hover:opacity-90 transition-opacity"
              title="Back to Landing Page"
            >
              <WorkerFixLogo variant="dark" size="sm" />
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider pl-0.5">
                {locale === "ur" ? "کسٹمر پورٹل" : "Customer Portal"}
              </p>
            </Link>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Sidebar"
                title="Close Sidebar"
                className="lg:hidden size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>


          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  onMouseEnter={() => {
                    if (item.href === "/customer/jobs") {
                      void queryClient.prefetchQuery({
                        queryKey: ["customer", "jobs", "feed"],
                        queryFn: () => getCustomerJobs({ limit: 50, scheduleType: "scheduled" }),
                        staleTime: 60_000,
                      });
                    }
                  }}
                  onTouchStart={() => {
                    if (item.href === "/customer/jobs") {
                      void queryClient.prefetchQuery({
                        queryKey: ["customer", "jobs", "feed"],
                        queryFn: () => getCustomerJobs({ limit: 50, scheduleType: "scheduled" }),
                        staleTime: 60_000,
                      });
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    item.isActive
                      ? "bg-[#0F8B8D] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4.5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badge.bg}`}
                    >
                      {item.badge.text}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Trust Card & User Info */}
        <div className="p-4 border-t border-slate-200 flex flex-col gap-3">
          <div className="bg-[#123B5D] text-white p-3.5 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4.5 text-[#0F8B8D]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F8B8D]">
                {t("verifiedBadge")}
              </span>
            </div>
            <p className="text-[11px] leading-snug text-slate-300">
              {t("verifiedDesc")}
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#123B5D]">
              <Globe className="size-4 text-[#0F8B8D]" />
              <span>{t("language")}</span>
            </div>
            <button
              type="button"
              onClick={toggleLanguage}
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#0F8B8D] text-[#0F8B8D] shadow-2xs transition-all active:scale-95"
            >
              {locale === "en" ? "اردو (Urdu)" : "English"}
            </button>
          </div>

          {/* Customer Profile Section at Bottom */}
          <div className="flex items-center gap-2 pt-1">
            <Link
              href={isCustomer ? "/customer/profile" : "/customer/sign-in"}
              onClick={onClose}
              aria-label={
                isCustomer
                  ? locale === "ur"
                    ? "کسٹمر پروفائل"
                    : "Customer Profile"
                  : locale === "ur"
                  ? "لاگ ان کریں"
                  : "Sign In"
              }
              title={
                isCustomer
                  ? locale === "ur"
                    ? "پروفائل دیکھیں"
                    : "View Profile"
                  : locale === "ur"
                  ? "اکاؤنٹ میں لاگ ان کریں"
                  : "Sign In to Account"
              }
              className={`group flex-1 flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                pathname.includes("/customer/profile")
                  ? "border-[#0F8B8D]/40 bg-[#0F8B8D]/10"
                  : "border-slate-100 bg-slate-50/80 hover:bg-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#123B5D] flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden ring-1 ring-slate-200">
                  {isCustomer && activeAvatarUrl && !imageError ? (
                    <img
                      src={resolveAvatarUrl(activeAvatarUrl)}
                      alt={customerFirstName}
                      className="size-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    customerInitial
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {customerFirstName}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 truncate">
                    {isCustomer
                      ? locale === "ur"
                        ? "کسٹمر پروفائل"
                        : "Customer Profile"
                      : locale === "ur"
                      ? "لاگ ان کریں"
                      : "Sign In"}
                  </span>
                </div>
              </div>
              <ChevronRight className="size-4 text-slate-400 group-hover:text-[#0F8B8D] shrink-0 transition-colors" />
            </Link>

            {isCustomer && (
              <button
                type="button"
                onClick={handleLogout}
                className="size-9 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                title={locale === "ur" ? "لاگ آؤٹ" : "Sign Out"}
                aria-label={locale === "ur" ? "لاگ آؤٹ" : "Sign Out"}
              >
                <LogOut className="size-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
