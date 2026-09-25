"use client";

import { useLocale } from "next-intl";
import { ActiveVisitBanner } from "./active-visit-banner";
import { WorkerFixBrandBanner } from "./hunar-brand-banner";
import { ServicesGrid } from "./services-grid";

export function CustomerDashboardView() {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 flex-1">
      {/* Top Greeting Header */}
      <div className="flex flex-col gap-1">
        {/* Removed welcome greeting */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123B5D]">
          {isUrdu ? "آج آپ کو کس سروس کی ضرورت ہے؟" : "What service do you need today?"}
        </h2>
      </div>

      {/* Active Visit & Doorstep OTP PIN Banner */}
      <ActiveVisitBanner />

      {/* Small Service Cards (3 in 1 line, max 3 lines with Show All button) */}
      <ServicesGrid />

      {/* WorkerFIX Branding Banner below service grid */}
      <WorkerFixBrandBanner />
    </div>
  );
}
