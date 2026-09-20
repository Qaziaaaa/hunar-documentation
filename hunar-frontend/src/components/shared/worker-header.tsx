"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useWorkerJobs, workerStore } from "@/stores/worker-jobs-store";
import { formatRs } from "@/lib/design-tokens";
import {
  Bell,
  Search,
  Power,
  ShieldCheck,
  Wallet,
  Briefcase,
  Layers,
  Globe,
} from "lucide-react";

export function WorkerHeader() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const { workerOnline, walletBalance, offers } = useWorkerJobs();
  const [searchQuery, setSearchQuery] = useState("");

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "ur" : "en";
    router.replace(pathname, { locale: nextLocale });
  };

  // Unread badge count based on active counter offers or status
  const unreadAlerts = Object.values(offers).filter(
    (o) => o.status === "counter_received" || o.status === "accepted"
  ).length;

  const navItems = [
    { label: locale === "ur" ? "ڈیش بورڈ" : "Dashboard", href: "/worker", icon: Layers },
    { label: locale === "ur" ? "جابز" : "Jobs", href: "/worker/jobs", icon: Briefcase },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Start: Brand Logo & Tag */}
        <div className="flex items-center gap-6">
          <Link
            href="/worker"
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#123B5D] flex items-center justify-center text-white font-black text-lg shadow-xs group-hover:bg-[#0F8B8D] transition-colors">
              H
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  HUNAR
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0F8B8D] text-white font-bold tracking-wider">
                  PRO
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-[#123B5D] text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-2.5" />
          <input
            type="search"
            placeholder={locale === "ur" ? "جابز تلاش کریں..." : "Search jobs..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-xl border border-transparent focus:border-[#0F8B8D] focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 transition-all"
          />
        </div>

        {/* End: Online Toggle, Wallet, Notifications, Language & Profile */}
        <div className="flex items-center gap-3">
          {/* Online / Offline Switch Component */}
          <div
            onClick={() => workerStore.toggleOnline()}
            className={`cursor-pointer select-none px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
              workerOnline
                ? "bg-teal-50/90 border-teal-200 text-[#0F8B8D]"
                : "bg-slate-100 border-slate-200 text-slate-500"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                workerOnline ? "bg-[#0F8B8D] animate-ping" : "bg-slate-400"
              }`}
            />
            <span className="text-xs font-bold hidden sm:inline">
              {workerOnline
                ? locale === "ur"
                  ? "آن لائن اور دستیاب"
                  : "Online & Receiving"
                : locale === "ur"
                  ? "آف لائن"
                  : "Offline / Standby"}
            </span>
            <Power className="w-3.5 h-3.5" />
          </div>

          {/* Wallet Balance Display */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#123B5D]">
            <Wallet className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span>{formatRs(walletBalance)}</span>
          </div>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:border-[#0F8B8D] hover:bg-slate-50 active:scale-95 cursor-pointer"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span>{locale === "en" ? "اردو" : "EN"}</span>
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Worker Avatar & Name */}
          <div className="flex items-center gap-2 ps-2 border-s border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#123B5D] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              SA
            </div>
            <div className="hidden xl:block text-start">
              <span className="block text-xs font-bold text-slate-800 leading-tight">
                {locale === "ur" ? "شہزاد احمد" : "Shahzad Ahmad"}
              </span>
              <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5 text-teal-600" />
                {locale === "ur" ? "تصدیق شدہ پرو" : "Verified Pro"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
