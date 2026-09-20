"use client";

import {
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Tag,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { MOCK_CUSTOMER_STATS } from "../mock/customer-mock-data";

export function CustomerMetricsGrid() {
  const t = useTranslations("CustomerPortal.Dashboard");
  const locale = useLocale();
  const stats = MOCK_CUSTOMER_STATS;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
      {/* Card 1: Active Jobs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {t("activeJobs")}
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#123B5D]">
            <Briefcase className="size-4.5" />
          </div>
        </div>
        <div className="my-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#123B5D]">
            {stats.activeJobs}
          </span>
          <span className="text-[11px] font-semibold text-[#0F8B8D] bg-[#0F8B8D]/10 px-1.5 py-0.5 rounded">
            {stats.activeJobsDelta}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {locale === "ur" ? "جاری مرمتی کام" : "In-progress repairs"}
        </p>
      </div>

      {/* Card 2: Pending Offers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {locale === "ur" ? "موصولہ آفرز" : "Pending Offers"}
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Tag className="size-4.5" />
          </div>
        </div>
        <div className="my-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#123B5D]">
            {stats.pendingOffers}
          </span>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
            {stats.pendingOffersDelta}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {locale === "ur" ? "توجہ طلب آفرز" : "Action required"}
        </p>
      </div>

      {/* Card 3: Upcoming Bookings */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {t("bookedVisits")}
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#0F8B8D]/10 flex items-center justify-center text-[#0F8B8D]">
            <CalendarCheck className="size-4.5" />
          </div>
        </div>
        <div className="my-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#123B5D]">
            {stats.upcomingBookings}
          </span>
          <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
            {stats.upcomingBookingsLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {locale === "ur" ? "کاریگر کی آمد کا وقت طے ہے" : "Confirmed technician visit"}
        </p>
      </div>

      {/* Card 4: Completed Jobs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {t("completedRepairs")}
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="size-4.5" />
          </div>
        </div>
        <div className="my-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#123B5D]">
            {stats.completedJobs}
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
            {stats.completedJobsLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          {locale === "ur" ? "تمام مکمل شدہ کام" : "All-time completed"}
        </p>
      </div>

      {/* Card 5: Total Spent */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            {t("totalSpent")}
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#123B5D] flex items-center justify-center text-white">
            <Wallet className="size-4.5" />
          </div>
        </div>
        <div className="my-3 flex items-baseline gap-1">
          <span className="text-2xl sm:text-[26px] font-bold text-[#123B5D] tracking-tight">
            Rs. {stats.totalSpent.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-slate-100 mt-1">
          <span>{locale === "ur" ? "ادائیگی" : "Direct Payments"}</span>
          <span className="font-semibold text-slate-800">
            <span className="text-[#0F8B8D]">
              Rs. {stats.monthlySpent.toLocaleString()}
            </span>{" "}
            <span className="text-slate-400 font-normal">{stats.monthName}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
