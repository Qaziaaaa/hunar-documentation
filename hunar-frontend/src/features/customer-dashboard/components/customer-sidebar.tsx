"use client";

import {
  Calendar,
  Globe,
  Grid,
  HelpCircle,
  LogOut,
  Package,
  ShieldCheck,
  Tag,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { logoutCustomer } from "@/features/auth/api/auth-api";
import { MOCK_CUSTOMER_USER } from "../mock/customer-mock-data";

interface CustomerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CustomerSidebar({ isOpen, onClose }: CustomerSidebarProps) {
  const t = useTranslations("CustomerPortal.Nav");
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

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
      isActive: pathname === "/customer/dashboard" || pathname.includes("/customer/dashboard"),
    },
    {
      label: t("myJobs"),
      href: "/customer/jobs",
      icon: Package,
      badge: { text: "2", bg: "bg-slate-100 text-slate-800" },
      isActive: pathname.includes("/customer/jobs"),
    },
    {
      label: t("offers"),
      href: "/customer/offers",
      icon: Tag,
      badge: { text: "3", bg: "bg-amber-100 text-amber-700" },
      isActive: pathname.includes("/customer/offers"),
    },
    {
      label: t("visits"),
      href: "/customer/visits",
      icon: Calendar,
      badge: null,
      isActive: pathname.includes("/customer/visits"),
    },
    {
      label: t("profile"),
      href: "/customer/profile",
      icon: User,
      badge: null,
      isActive: pathname.includes("/customer/profile"),
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
      {/* Mobile Backdrop */}
      {isOpen ? (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      ) : null}

      <aside
        className={`fixed start-0 top-0 h-screen w-[260px] bg-white border-e border-slate-200 z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full rtl:translate-x-full lg:translate-x-0 lg:rtl:translate-x-0 rtl:lg:translate-x-0"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="p-5">
          {/* Brand Logo & Mobile Close */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200 mb-4">
            <Link
              href="/"
              className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
              title="Back to Landing Page"
            >
              <div className="w-9 h-9 rounded-xl bg-[#123B5D] flex items-center justify-center text-white text-base font-bold shadow-xs">
                <span>H</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B8D] ml-0.5"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-[#123B5D]">
                    HUNAR
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0F8B8D]/10 text-[#0F8B8D] uppercase tracking-wider">
                    PK
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {locale === "ur" ? "کسٹمر پورٹل" : "Customer Portal"}
                </p>
              </div>
            </Link>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Sidebar"
                className="lg:hidden size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Post a Job Primary CTA in Sidebar */}
          <div className="mb-4">
            <Link
              href="/customer/post-job"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98]"
            >
              <span>{t("postJob")}</span>
            </Link>
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
            <div className="pt-1">
              <span className="inline-flex items-center justify-center py-1 px-2.5 bg-[#0F8B8D] text-white text-[10px] font-bold rounded-md hover:bg-[#0F8B8D]/90 transition-colors">
                {t("qualityGuarantee")}
              </span>
            </div>
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

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#123B5D] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {locale === "ur" ? "ع" : MOCK_CUSTOMER_USER.avatarInitials}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {locale === "ur" ? "عبداللہ" : MOCK_CUSTOMER_USER.name}
                </span>
                <span className="text-[10px] font-medium text-slate-500 truncate">
                  {locale === "ur" ? "یونیورسٹی ٹاؤن، پشاور" : MOCK_CUSTOMER_USER.area}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-600 transition-colors p-1"
              title="Sign Out"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
