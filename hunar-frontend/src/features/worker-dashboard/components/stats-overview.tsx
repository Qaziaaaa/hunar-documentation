"use client";

import {
  Briefcase,
  Wallet,
  Star,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { formatRs } from "@/lib/design-tokens";
import type { WorkerDashboardProfile, DashboardTab } from "../types";

import { useLocale } from "next-intl";

export function StatsOverview({
  profile,
  onSelectTab,
}: {
  profile: WorkerDashboardProfile;
  onSelectTab: (tab: DashboardTab) => void;
}) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
      {/* 1. Active Jobs Card */}
      <div
        onClick={() => onSelectTab("jobs")}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-teal/40 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isUrdu ? "جاری کام" : "Active Jobs"}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-navy">
                {profile.activeJobsCount}
              </span>
              <span className="text-xs font-semibold text-teal">
                {isUrdu ? "جاری ہے" : "In Progress"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isUrdu ? "تفویض شدہ وزٹ اور مرمت" : "Assigned visits & repairs"}
            </p>
          </div>

          <div className="flex size-10 items-center justify-center rounded-2xl bg-navy/5 text-navy transition-colors group-hover:bg-teal group-hover:text-white">
            <Briefcase className="size-5" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-teal">
          <span>{isUrdu ? "جاب کیو دیکھیں" : "View job queue"}</span>
          <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5" />
        </div>
      </div>

      {/* 2. Total Earnings Card */}
      <div
        onClick={() => onSelectTab("earnings")}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-teal/40 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isUrdu ? "کل آمدنی" : "Total Earnings"}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-navy">
                {formatRs(profile.totalEarnings)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isUrdu
                ? `${profile.completedJobsCount} مکمل وزٹ سے`
                : `From ${profile.completedJobsCount} completed visits`}
            </p>
          </div>

          <div className="flex size-10 items-center justify-center rounded-2xl bg-teal/10 text-teal transition-colors group-hover:bg-teal group-hover:text-white">
            <Wallet className="size-5" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-teal">
          <TrendingUp className="size-3 text-success" />
          <span>{isUrdu ? "کمیشن تفصیلات (10%)" : "Commission details (10%)"}</span>
          <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5" />
        </div>
      </div>

      {/* 3. Rating & Reviews Card */}
      <div
        onClick={() => onSelectTab("profile")}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-orange/40 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isUrdu ? "کسٹمر ریٹنگ" : "Customer Rating"}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-navy">
                {profile.rating.toFixed(1)}
              </span>
              <div className="flex items-center text-orange">
                <Star className="size-4 fill-orange" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              {isUrdu
                ? `${profile.reviewCount} کسٹمر جائزہ کی بنیاد پر`
                : `Based on ${profile.reviewCount} customer reviews`}
            </p>
          </div>

          <div className="flex size-10 items-center justify-center rounded-2xl bg-orange/10 text-orange transition-colors group-hover:bg-orange group-hover:text-white">
            <Star className="size-5 fill-current" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-orange">
          <span>{isUrdu ? "پشاور میں اعلی ترین ریٹنگ" : "Top Rated Pro in Peshawar"}</span>
          <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
