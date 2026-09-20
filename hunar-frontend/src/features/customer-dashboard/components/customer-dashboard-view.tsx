"use client";

import { useLocale } from "next-intl";
import { ActiveVisitBanner } from "./active-visit-banner";
import { HunarBrandBanner } from "./hunar-brand-banner";
import { ServicesGrid } from "./services-grid";

export function CustomerDashboardView() {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 flex-1">
      {/* Top Greeting Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#123B5D]">
          {isUrdu ? "خوش آمدید، عبداللہ" : "Welcome, Abdullah"}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          {isUrdu ? "آج آپ کو کس سروس کی ضرورت ہے؟" : "What service do you need today?"}
        </p>
      </div>

      {/* Active Visit & Doorstep OTP PIN Banner */}
      <ActiveVisitBanner />

      {/* Small Service Cards (3 in 1 line, max 3 lines with Show All button) */}
      <ServicesGrid />

      {/* HUNAR Branding Banner below service grid */}
      <HunarBrandBanner />
    </div>
  );
}
