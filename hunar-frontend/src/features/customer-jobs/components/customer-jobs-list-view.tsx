"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Star,
  User,
  Wrench,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import type { CustomerJob } from "../types";

interface CustomerJobsListViewProps {
  initialJobs: CustomerJob[];
}

export function CustomerJobsListView({ initialJobs }: CustomerJobsListViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredJobs = initialJobs.filter((job) => {
    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "active" && job.status === "receiving_offers") ||
      (selectedFilter === "scheduled" && job.status === "visit_scheduled") ||
      (selectedFilter === "completed" && job.status === "completed");

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(query) ||
      job.area.toLowerCase().includes(query) ||
      job.subCategory.toLowerCase().includes(query) ||
      job.id.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const activeCount = initialJobs.filter((j) => j.status === "receiving_offers").length;
  const scheduledCount = initialJobs.filter((j) => j.status === "visit_scheduled").length;
  const completedCount = initialJobs.filter((j) => j.status === "completed").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-24 lg:pb-8 animate-in fade-in-50 duration-300 text-[#123B5D]">
      {/* Main Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-[#123B5D]/10 text-[#123B5D]">
              {isUrdu ? "کسٹمر ہب" : "Customer Hub"}
            </span>
            <span className="text-xs text-slate-600 font-medium">
              {isUrdu ? "• پشاور، خیبر پختونخوا" : "• Peshawar, Khyber Pakhtunkhwa"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#123B5D]">
            {isUrdu ? "میری پوسٹ کردہ جابز" : "My Posted Jobs & Requests"}
          </h1>
        </div>

        <Link
          href="/customer/post-job"
          className="h-11 px-5 bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] shrink-0 self-start md:self-end cursor-pointer"
        >
          <Plus className="size-4.5" />
          <span>{isUrdu ? "+ نئی جاب پوسٹ کریں" : "Post a New Job"}</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-2xs border border-[#E2E8F0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === "all"
                ? "bg-[#0F8B8D] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-[#E2E8F0] hover:text-[#123B5D] hover:border-[#0F8B8D]"
            }`}
          >
            {isUrdu ? `تمام جابز (${initialJobs.length})` : `All Jobs (${initialJobs.length})`}
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("active")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFilter === "active"
                ? "bg-[#0F8B8D] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-[#E2E8F0] hover:text-[#123B5D] hover:border-[#0F8B8D]"
            }`}
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{isUrdu ? `موصولہ آفرز (${activeCount})` : `Receiving Offers (${activeCount})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("scheduled")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === "scheduled"
                ? "bg-[#0F8B8D] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-[#E2E8F0] hover:text-[#123B5D] hover:border-[#0F8B8D]"
            }`}
          >
            {isUrdu ? `شیڈول وزٹس (${scheduledCount})` : `Scheduled Visits (${scheduledCount})`}
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter("completed")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedFilter === "completed"
                ? "bg-[#0F8B8D] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-[#E2E8F0] hover:text-[#123B5D] hover:border-[#0F8B8D]"
            }`}
          >
            {isUrdu ? `مکمل شدہ (${completedCount})` : `Completed (${completedCount})`}
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isUrdu ? "عنوان، ریفرنس نمبر یا علاقہ تلاش کریں..." : "Search by title, ref ID or area..."}
            className="w-full pl-9 rtl:pl-3.5 rtl:pr-9 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 text-[#123B5D] font-medium border border-[#E2E8F0]"
          />
        </div>
      </div>

      {/* Work Orders List */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const hasAssignedWorker = !!job.selectedOffer;
            const assignedWorker = job.selectedOffer?.worker;

            return (
              <article
                key={job.id}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all duration-200"
              >
                {/* Top Row: Ref, Status Badge, Title & Price Callout */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-xs text-[#1A1A2E] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 rounded">
                        #{job.id}
                      </span>

                      {/* Status Badges */}
                      {job.status === "receiving_offers" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
                          <span className="size-1.5 rounded-full bg-[#0F766E] animate-ping" />
                          {isUrdu ? `${job.offers.length} آفرز موصول ہوئیں` : `${job.offers.length} Offers Received`}
                        </span>
                      )}

                      {job.status === "visit_scheduled" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                          <span className="size-1.5 rounded-full bg-[#F59E0B]" />
                          {isUrdu ? "وزٹ شیڈول اور PIN فعال ہے" : "Visit Scheduled & PIN Active"}
                        </span>
                      )}

                      {job.status === "completed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3.5" />
                          {isUrdu ? "مکمل اور تصدیق شدہ" : "Completed & Verified"}
                        </span>
                      )}

                      <span className="text-xs text-[#64748B]">
                        {isUrdu ? `پوسٹ کی گئی: ${job.createdAt}` : `Posted ${job.createdAt}`}
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-[#1A1A2E] leading-snug">
                      {job.title}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-[#64748B] flex-wrap">
                      <span className="inline-flex items-center gap-1 font-medium text-[#0F766E]">
                        <Wrench className="size-3.5" />
                        {job.subCategory}
                      </span>
                    </div>
                  </div>

                  {/* Pricing / Budget Detail Callout */}
                  <div className="flex items-center sm:flex-col sm:items-end rtl:sm:items-start justify-between bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0] shrink-0">
                    <span className="text-xs text-[#64748B]">
                      {job.status === "completed"
                        ? isUrdu ? "کل ادائیگی" : "Total Paid"
                        : isUrdu ? "وزٹ چارجز" : "Visit Charges"}
                    </span>
                    <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-[#1A1A2E]">
                      <ShieldCheck className="size-5 text-[#0F766E]" />
                      <span>
                        {job.status === "visit_scheduled" && job.selectedOffer
                          ? `Rs. ${job.selectedOffer.visitFee.toLocaleString()}`
                          : job.status === "completed" && job.selectedOffer
                          ? `Rs. ${job.selectedOffer.visitFee.toLocaleString()}`
                          : job.offers && job.offers.length > 0
                          ? `Rs. ${job.offers[0].visitFee.toLocaleString()}`
                          : "Rs. 300"}
                      </span>
                    </div>
                    {job.status === "completed" && (
                      <span className="text-[11px] text-[#0F766E] font-semibold">
                        {isUrdu ? "تصدیق شدہ کام" : "Verified Handover"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pro Info & Location Block */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  {/* Left Column: Pro Details or Offers Count */}
                  <div className="flex items-center gap-3">
                    {hasAssignedWorker && assignedWorker ? (
                      <>
                        <div className="size-10 rounded-full overflow-hidden shrink-0 border border-[#E2E8F0]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={assignedWorker.avatarUrl}
                            alt={assignedWorker.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#1A1A2E] truncate">
                              {assignedWorker.name}
                            </span>
                            <div className="flex items-center text-xs font-bold text-[#F59E0B]">
                              <Star className="size-3.5 fill-[#F59E0B] mr-0.5 rtl:mr-0 rtl:ml-0.5" />
                              <span>{assignedWorker.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <span className="text-xs text-[#64748B] truncate block">
                            {assignedWorker.businessName || (isUrdu ? "تصدیق شدہ کاریگر" : "Certified Pro")} • {isUrdu ? "متعین کردہ کاریگر" : "Assigned Pro"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold text-sm shrink-0">
                          <User className="size-5" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-[#1A1A2E] block">
                            {isUrdu
                              ? `${job.offers.length} تصدیق شدہ ماہرین نے آفر بھیجی`
                              : `${job.offers.length} Verified Pros Responded`}
                          </span>
                          <span className="text-xs text-[#64748B]">
                            {job.offers.map((o) => o.worker.name).join(", ")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Address & Schedule */}
                  <div className="space-y-1 text-xs text-[#64748B]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-[#0F766E] shrink-0" />
                      <span className="truncate">{job.address || job.area}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-slate-400 shrink-0" />
                      <span>
                        {job.preferredDate || (isUrdu ? "آج" : "Today")} • {job.preferredTimeSlot || (isUrdu ? "صبح (8:00 AM - 12:00 PM)" : "Morning (8:00 AM - 12:00 PM)")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                  <span className="text-xs text-[#64748B]">
                    {job.status === "receiving_offers"
                      ? isUrdu
                        ? `${job.offers.length} تصدیق شدہ ماہرین نے اس جاب کے لیے آفرز جمع کروائی ہیں۔`
                        : `${job.offers.length} verified technicians submitted quotes for this job.`
                      : job.status === "visit_scheduled"
                      ? isUrdu
                        ? "کاریگر منتخب ہو چکا ہے۔ دہلیز پر آمد کے وقت 4 ہندسوں کا سیکیورٹی PIN شیئر کریں۔"
                        : "Technician confirmed. Share 4-digit Security PIN on doorstep arrival."
                      : isUrdu
                      ? "کام مکمل ہو چکا ہے اور تسلی بخش ادائیگی طے پا چکی ہے۔"
                      : "Job completed and payment successfully settled."}
                  </span>

                  <div className="flex items-center gap-2.5 ml-auto rtl:ml-0 rtl:mr-auto">
                    <Link
                      href={`/customer/jobs/${job.id}`}
                      className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-[#1A1A2E] bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors flex items-center justify-center"
                    >
                      {isUrdu ? "تفصیلات دیکھیں" : "View Details"}
                    </Link>

                    {job.status === "receiving_offers" && (
                      <Link
                        href={`/customer/jobs/${job.id}`}
                        className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#0F766E] hover:bg-[#115E59] transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <span>{isUrdu ? `${job.offers.length} آفرز کا جائزہ لیں` : `Review ${job.offers.length} Offers`}</span>
                        <ArrowRight className="size-3.5 rtl:rotate-180" />
                      </Link>
                    )}

                    {job.status === "visit_scheduled" && (
                      <Link
                        href={`/customer/jobs/${job.id}`}
                        className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#0F766E] hover:bg-[#115E59] transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="size-3.5" />
                        <span>{isUrdu ? "وزٹ اور PIN دیکھیں" : "View Visit & PIN"}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 sm:p-12 text-center space-y-4 shadow-2xs border border-[#E2E8F0]">
          <div className="size-16 rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center mx-auto shadow-2xs">
            <Layers className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#123B5D]">
              {isUrdu ? "کوئی جاب یا درخواست نہیں ملی" : "No service requests found"}
            </h3>
            <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto">
              {isUrdu
                ? "آپ کے منتخب کردہ فلٹر یا سرچ کے مطابق کوئی کام موجود نہیں ہے۔"
                : "There are no jobs matching your active filter or search terms."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/customer/post-job"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
            >
              <Plus className="size-4" />
              <span>{isUrdu ? "نئی جاب پوسٹ کریں" : "Post a New Job in 2 Mins"}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

