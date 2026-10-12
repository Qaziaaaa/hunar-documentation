"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Tag,
  User,
  Wrench,
  Zap,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatJobDate, formatPostedAt } from "@/lib/format";
import type { CustomerJob, WorkerOffer } from "../types";
import dynamic from "next/dynamic";

const CustomerJobDetailsModal = dynamic(
  () => import("./customer-job-details-modal").then((m) => m.CustomerJobDetailsModal),
  { ssr: false }
);
const CustomerReviewOffersModal = dynamic(
  () => import("./customer-review-offers-modal").then((m) => m.CustomerReviewOffersModal),
  { ssr: false }
);
const WorkerProfileModal = dynamic(
  () => import("./worker-profile-modal").then((m) => m.WorkerProfileModal),
  { ssr: false }
);
const SelectWorkerModal = dynamic(
  () => import("./select-worker-modal").then((m) => m.SelectWorkerModal),
  { ssr: false }
);
import { acceptWorkerOffer, rejectWorkerOffer, getCustomerJobs } from "../api/customer-jobs-api";

interface CustomerJobsListViewProps {
  initialJobs?: CustomerJob[];
  jobs?: CustomerJob[];
}

export function CustomerJobsListView({ initialJobs, jobs: jobsProp }: CustomerJobsListViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const resolvedInitialJobs = initialJobs ?? jobsProp ?? [];
  const [jobs, setJobs] = useState<CustomerJob[]>(resolvedInitialJobs);
  const [selectedFilter, setSelectedFilter] = useState<"scheduled" | "offers" | "completed">("scheduled");
  const [searchQuery, setSearchQuery] = useState("");

  // Incremental pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(resolvedInitialJobs.length >= 20);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const moreJobs = await getCustomerJobs({ page: nextPage, limit: 20 });
      if (!moreJobs || moreJobs.length === 0) {
        setHasMore(false);
      } else {
        setJobs((prev) => {
          const existingIds = new Set(prev.map((j) => j.id));
          const newJobs = moreJobs.filter((j) => !existingIds.has(j.id));
          return [...prev, ...newJobs];
        });
        setCurrentPage(nextPage);
        if (moreJobs.length < 20) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.warn("Failed to load more jobs:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Modals state
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<CustomerJob | null>(null);
  const [selectedJobForOffers, setSelectedJobForOffers] = useState<CustomerJob | null>(null);
  const [selectedOfferForProfile, setSelectedOfferForProfile] = useState<WorkerOffer | null>(null);
  const [bookingSelection, setBookingSelection] = useState<{ job: CustomerJob; offer: WorkerOffer } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const queryClient = useQueryClient();

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastTone(tone);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync state if props change
  useEffect(() => {
    if (initialJobs) {
      setJobs(initialJobs);
    } else if (jobsProp) {
      setJobs(jobsProp);
    }
  }, [initialJobs, jobsProp]);

  // Keep modal jobs synced with updated state
  useEffect(() => {
    if (selectedJobForDetails) {
      const updated = jobs.find((j) => j.id === selectedJobForDetails.id);
      if (updated) setSelectedJobForDetails(updated);
    }
    if (selectedJobForOffers) {
      const updated = jobs.find((j) => j.id === selectedJobForOffers.id);
      if (updated) setSelectedJobForOffers(updated);
    }
  }, [jobs]);

  // Handle confirming booking / accepting offer
  const handleConfirmBooking = async (offer: WorkerOffer) => {
    if (!bookingSelection) return;
    const targetJob = bookingSelection.job;

    try {
      await acceptWorkerOffer(targetJob.id, offer.id);
    } catch (err) {
      console.warn("acceptWorkerOffer error:", err);
      showToast(
        isUrdu
          ? "بکنگ نہیں ہو سکی، براہِ کرم دوبارہ کوشش کریں۔"
          : "Booking failed — the visit was not scheduled. Please try again.",
        "error"
      );
      return;
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === targetJob.id) {
          return {
            ...j,
            status: "visit_scheduled",
            selectedOffer: offer,
          };
        }
        return j;
      })
    );

    setBookingSelection(null);
    setSelectedJobForOffers(null);
    setSelectedJobForDetails(null);

    void queryClient.invalidateQueries({ queryKey: ["customer"] });

    showToast(
      isUrdu
        ? `${offer.worker.name} کی بکنگ کامیابی سے ہو گئی! سیکیورٹی PIN فعال ہے۔`
        : `Successfully booked ${offer.worker.name}! Security PIN activated.`
    );
  };

  // Handle declining / rejecting an offer
  const handleRejectOffer = async (job: CustomerJob, offer: WorkerOffer) => {
    try {
      await rejectWorkerOffer(job.id, offer.id);
    } catch (err) {
      console.warn("rejectWorkerOffer error:", err);
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === job.id) {
          return {
            ...j,
            offers: j.offers.filter((o) => o.id !== offer.id),
          };
        }
        return j;
      })
    );

    setSelectedJobForOffers((prev) =>
      prev && prev.id === job.id
        ? { ...prev, offers: prev.offers.filter((o) => o.id !== offer.id) }
        : prev
    );

    showToast(
      isUrdu
        ? `${offer.worker.name} کی آفر مسترد کر دی گئی۔`
        : `Offer from ${offer.worker.name} was declined.`
    );
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter =
      (selectedFilter === "offers" && job.status === "receiving_offers") ||
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

  const activeCount = jobs.filter((j) => j.status === "receiving_offers").length;
  const scheduledCount = jobs.filter((j) => j.status === "visit_scheduled").length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-24 lg:pb-8 animate-in fade-in-50 duration-300 text-[#123B5D]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 rtl:right-auto rtl:left-6 z-60 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
            toastTone === "error" ? "bg-rose-600" : "bg-[#0F766E]"
          }`}
        >
          {toastTone === "error" ? (
            <AlertTriangle className="size-5 shrink-0" />
          ) : (
            <CheckCircle2 className="size-5 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 3 Proper Segmented Tabs Bar & Search */}
      <div className="w-full flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
        {/* Proper Tabs Segmented Control */}
        <div className="w-full sm:w-auto bg-slate-100/90 p-1 sm:p-1.5 rounded-2xl grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 border border-slate-200/80 shadow-2xs">
          {/* Tab 1: Scheduled Visits */}
          <button
            type="button"
            onClick={() => setSelectedFilter("scheduled")}
            className={`w-full min-w-0 py-2 px-1 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 ${
              selectedFilter === "scheduled"
                ? "bg-white text-[#123B5D] font-bold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-[#123B5D] hover:bg-white/50"
            }`}
          >
            <Clock className={`size-3.5 sm:size-4 shrink-0 ${selectedFilter === "scheduled" ? "text-teal" : "text-slate-400"}`} />
            <span className="truncate">
              {isUrdu ? (
                <>
                  <span>شیڈول</span>
                  <span className="hidden sm:inline"> وزٹس</span>
                </>
              ) : (
                <>
                  <span>Scheduled</span>
                  <span className="hidden sm:inline"> Visits</span>
                </>
              )}
            </span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold shrink-0 ${
                selectedFilter === "scheduled"
                  ? "bg-teal text-white shadow-2xs"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {scheduledCount}
            </span>
          </button>

          {/* Tab 2: Offers to Review */}
          <button
            type="button"
            onClick={() => setSelectedFilter("offers")}
            className={`w-full min-w-0 py-2 px-1 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 ${
              selectedFilter === "offers"
                ? "bg-white text-[#123B5D] font-bold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-[#123B5D] hover:bg-white/50"
            }`}
          >
            <Tag className={`size-3.5 sm:size-4 shrink-0 ${selectedFilter === "offers" ? "text-teal" : "text-slate-400"}`} />
            <span className="truncate">
              {isUrdu ? (
                <>
                  <span>آفرز</span>
                  <span className="hidden sm:inline"> موصولہ</span>
                </>
              ) : (
                <>
                  <span>Offers</span>
                  <span className="hidden sm:inline"> to Review</span>
                </>
              )}
            </span>
            {activeCount > 0 ? (
              <span
                className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 shrink-0 ${
                  selectedFilter === "offers"
                    ? "bg-teal text-white shadow-2xs"
                    : "bg-teal/10 text-teal"
                }`}
              >
                <span className={`size-1.5 rounded-full ${selectedFilter === "offers" ? "bg-white" : "bg-teal"} animate-ping`} />
                <span>{activeCount}</span>
              </span>
            ) : (
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-slate-200 text-slate-700 shrink-0">
                0
              </span>
            )}
          </button>

          {/* Tab 3: Completed */}
          <button
            type="button"
            onClick={() => setSelectedFilter("completed")}
            className={`w-full min-w-0 py-2 px-1 sm:px-4 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-2 ${
              selectedFilter === "completed"
                ? "bg-white text-[#123B5D] font-bold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-[#123B5D] hover:bg-white/50"
            }`}
          >
            <CheckCircle2 className={`size-3.5 sm:size-4 shrink-0 ${selectedFilter === "completed" ? "text-teal" : "text-slate-400"}`} />
            <span className="truncate">
              {isUrdu ? (
                <>
                  <span>مکمل</span>
                  <span className="hidden sm:inline"> شدہ</span>
                </>
              ) : (
                <span>Completed</span>
              )}
            </span>
            <span
              className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold shrink-0 ${
                selectedFilter === "completed"
                  ? "bg-teal text-white shadow-2xs"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {completedCount}
            </span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-auto md:min-w-[260px]">
          <Search className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isUrdu ? "عنوان، ریفرنس یا علاقہ تلاش کریں..." : "Search title, ref ID or area..."}
            className="w-full pl-9 rtl:pl-3.5 rtl:pr-9 pr-3.5 py-2.5 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 text-[#123B5D] font-medium border border-slate-200 shadow-2xs"
          />
        </div>
      </div>

      {/* Work Orders List */}
      {filteredJobs.length > 0 ? (
        <>
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
                        {isUrdu ? `پوسٹ کی گئی: ${formatPostedAt(job.createdAt)}` : `Posted ${formatPostedAt(job.createdAt)}`}
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
                  {job.status === "completed" && job.selectedOffer ? (
                    <div className="flex items-center sm:flex-col sm:items-end rtl:sm:items-start justify-between bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0] shrink-0">
                      <span className="text-xs text-[#64748B]">
                        {isUrdu ? "کل ادائیگی" : "Total Paid"}
                      </span>
                      <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-[#1A1A2E]">
                        <ShieldCheck className="size-5 text-[#0F766E]" />
                        <span>Rs. {job.selectedOffer.visitFee.toLocaleString()}</span>
                      </div>
                      <span className="text-[11px] text-[#0F766E] font-semibold">
                        {isUrdu ? "تصدیق شدہ کام" : "Verified Handover"}
                      </span>
                    </div>
                  ) : job.status === "visit_scheduled" && job.selectedOffer ? (
                    <div className="flex items-center sm:flex-col sm:items-end rtl:sm:items-start justify-between bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0] shrink-0">
                      <span className="text-xs text-[#64748B]">
                        {isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee"}
                      </span>
                      <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-[#1A1A2E]">
                        <ShieldCheck className="size-5 text-[#0F766E]" />
                        <span>Rs. {job.selectedOffer.visitFee.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : job.offers && job.offers.length > 0 ? (
                    <div className="flex items-center sm:flex-col sm:items-end rtl:sm:items-start justify-between bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0] shrink-0">
                      <span className="text-xs text-[#64748B]">
                        {isUrdu ? "موصولہ آفر فیس" : "Quoted Offer"}
                      </span>
                      <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-[#1A1A2E]">
                        <ShieldCheck className="size-5 text-[#0F766E]" />
                        <span>Rs. {job.offers[0].visitFee.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center sm:flex-col sm:items-end rtl:sm:items-start justify-between bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0] shrink-0">
                      <span className="text-xs text-[#64748B]">
                        {isUrdu ? "وزٹ چارجز" : "Visit Charges"}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
                        <Clock className="size-4 text-amber-500" />
                        <span>{isUrdu ? "آفرز کا انتظار ہے" : "Awaiting Offers"}</span>
                      </div>
                    </div>
                  )}
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
                            width={40}
                            height={40}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedWorker.name)}&background=0F766E&color=fff`;
                            }}
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
                      {job.scheduleType === "asap" ? (
                        <>
                          <Zap className="size-3.5 text-amber-600 fill-current shrink-0" />
                          <span className="font-bold text-amber-700">
                            {isUrdu ? "فوری آمد (30 تا 60 منٹ)" : "Immediate (Within 30–60 mins)"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="size-3.5 text-slate-400 shrink-0" />
                          <span>
                            {formatJobDate(job.preferredDate) || (isUrdu ? "آج" : "Today")} • {job.preferredTimeSlot || (isUrdu ? "مناسب وقت" : "Flexible Timing")}
                          </span>
                        </>
                      )}
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
                        ? "کاریگر متعین ہو چکا ہے۔ دہلیز پر آمد کے وقت 4 ہندسوں کے سیکیورٹی PIN کی تصدیق کریں۔"
                        : "Technician confirmed. Verify 4-digit Doorstep PIN upon arrival."
                      : isUrdu
                      ? "کام مکمل ہو چکا ہے اور تسلی بخش ادائیگی طے پا چکی ہے۔"
                      : "Job completed and payment successfully settled."}
                  </span>

                  <div className="flex items-center gap-2.5 ml-auto rtl:ml-0 rtl:mr-auto">
                    {/* View Details Button -> opens Details Modal */}
                    <button
                      type="button"
                      onClick={() => setSelectedJobForDetails(job)}
                      className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-[#1A1A2E] bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer active:scale-98"
                    >
                      {isUrdu ? "تفصیلات دیکھیں" : "View Details"}
                    </button>

                    {/* Review Offer Button -> opens in-context Offers Modal */}
                    {job.status === "receiving_offers" && (
                      <button
                        type="button"
                        onClick={() => setSelectedJobForOffers(job)}
                        className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-teal hover:bg-teal/90 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <span>
                          {isUrdu
                            ? job.offers.length === 1
                              ? "آفر کا جائزہ لیں"
                              : `${job.offers.length} آفرز کا جائزہ لیں`
                            : job.offers.length === 1
                            ? "Review Offer"
                            : `Review ${job.offers.length} Offers`}
                        </span>
                        <ArrowRight className="size-3.5 rtl:rotate-180" />
                      </button>
                    )}

                    {job.status === "visit_scheduled" && (
                      <Link
                        href={`/customer/job/${job.id}/tracking`}
                        className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-teal hover:bg-teal/90 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Clock className="size-3.5" />
                        <span>{isUrdu ? "لائیو وزٹ ٹریک کریں" : "Track Live Visit"}</span>
                        <ArrowRight className="size-3.5 rtl:rotate-180" />
                      </Link>
                    )}

                  </div>
                </div>
              </article>
            );
          })}
        </div>

          {/* Incremental Pagination: Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#123B5D] text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <span className="size-4 rounded-full border-2 border-teal border-t-transparent animate-spin" />
                    <span>{isUrdu ? "مزید لوڈ ہو رہا ہے..." : "Loading more bookings..."}</span>
                  </>
                ) : (
                  <span>{isUrdu ? "مزید جابز دیکھیں" : "Load More Bookings"}</span>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="w-full bg-white rounded-2xl p-10 sm:p-12 text-center space-y-4 shadow-2xs border border-[#E2E8F0]">
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

      {/* Customer Job Details Modal - Loaded dynamically on demand */}
      {selectedJobForDetails && (
        <CustomerJobDetailsModal
          job={selectedJobForDetails}
          isOpen={Boolean(selectedJobForDetails)}
          onClose={() => setSelectedJobForDetails(null)}
          onReviewOffers={(job) => {
            setSelectedJobForDetails(null);
            setSelectedJobForOffers(job);
          }}
        />
      )}

      {/* Customer Review Offers Modal - Loaded dynamically on demand */}
      {selectedJobForOffers && (
        <CustomerReviewOffersModal
          job={selectedJobForOffers}
          isOpen={Boolean(selectedJobForOffers)}
          onClose={() => setSelectedJobForOffers(null)}
          onViewJobDetails={(job) => {
            setSelectedJobForOffers(null);
            setSelectedJobForDetails(job);
          }}
          onViewProfile={(offer) => setSelectedOfferForProfile(offer)}
          onSelectWorker={(job, offer) => setBookingSelection({ job, offer })}
          onRejectOffer={handleRejectOffer}
        />
      )}

      {/* Worker Profile Modal - Loaded dynamically on demand */}
      {selectedOfferForProfile && (
        <WorkerProfileModal
          offer={selectedOfferForProfile}
          isOpen={Boolean(selectedOfferForProfile)}
          onClose={() => setSelectedOfferForProfile(null)}
          onSelectWorker={(offer) => {
            setSelectedOfferForProfile(null);
            if (selectedJobForOffers) {
              setBookingSelection({ job: selectedJobForOffers, offer });
            }
          }}
        />
      )}

      {/* Select Worker / Booking Confirmation Modal - Loaded dynamically on demand */}
      {bookingSelection && (
        <SelectWorkerModal
          job={bookingSelection.job}
          offer={bookingSelection.offer}
          isOpen={Boolean(bookingSelection)}
          onClose={() => setBookingSelection(null)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </div>
  );
}


