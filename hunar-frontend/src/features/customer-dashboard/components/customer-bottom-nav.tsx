"use client";

import { Briefcase, Home, MessageSquare } from "lucide-react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function CustomerBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const isHome = pathname.includes("/customer/dashboard") || pathname === "/customer";
  const isJobs = pathname.includes("/customer/jobs") || pathname.includes("/customer/job/");
  const isChat = pathname.includes("/customer/chat");

  // Hide bottom navigation bar on mobile when inside chat screen
  if (isChat) {
    return null;
  }

  const navItems = [
    {
      label: isUrdu ? "ہوم" : "Home",
      href: "/customer/dashboard",
      icon: Home,
      isActive: isHome,
    },
    {
      label: isUrdu ? "جابز" : "Jobs",
      href: "/customer/jobs",
      icon: Briefcase,
      isActive: isJobs,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-2 lg:hidden flex items-center justify-around shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-2xl transition-all ${
              item.isActive
                ? "text-[#0F766E] font-bold bg-[#0F766E]/10 shadow-2xs"
                : "text-slate-500 hover:text-slate-900 font-medium"
            }`}
          >
            <Icon className={`size-5 ${item.isActive ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-xs font-bold leading-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
