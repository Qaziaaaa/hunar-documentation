"use client";

import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Tag,
  Wrench,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatPostedAt } from "@/lib/format";
import { WorkerOfferCard } from "./worker-offer-card";
import { WorkerProfileModal } from "./worker-profile-modal";
import { acceptWorkerOffer } from "../api/customer-jobs-api";
import type { CustomerJob, WorkerOffer } from "../types";

interface CustomerOffersHubViewProps {
  initialJobs: CustomerJob[];
}

export function CustomerOffersHubView({ initialJobs }: CustomerOffersHubViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [jobs, setJobs] = useState<CustomerJob[]>(initialJobs);

  useEffect(() => {
    if (initialJobs) {
      setJobs(initialJobs);
    }
  }, [initialJobs]);

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted">("pending");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"lowest_fee" | "highest_rating" | "fastest_arrival">("lowest_fee");

  // Modals state
  const [selectedOfferForProfile, setSelectedOfferForProfile] = useState<WorkerOffer | null>(null);
  const [confirmingOfferId, setConfirmingOfferId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const queryClient = useQueryClient();

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setSuccessToast(message);
    setToastTone(tone);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  // Compute total offers & stats
  const allOffers = useMemo(() => {
    return jobs.flatMap((job) => job.offers);
  }, [jobs]);

  const activeOffersCount = allOffers.length;
  const lowestFee = useMemo(() => {
    if (allOffers.length === 0) return 0;
    return Math.min(...allOffers.map((o) => o.visitFee));
  }, [allOffers]);

  // Handle direct booking confirmation
  const handleConfirmBooking = async (offer: WorkerOffer) => {
    setConfirmingOfferId(offer.id);
    try {
      await acceptWorkerOffer(offer.jobId, offer.id);
    } catch (err) {
      console.warn("acceptWorkerOffer error:", err);
      showToast(
        isUrdu
          ? "بکنگ نہیں ہو سکی، براہِ کرم دوبارہ کوشش کریں۔"
          : "Booking failed — the visit was not scheduled. Please try again.",
        "error"
      );
      setConfirmingOfferId(null);
      return;
    }
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id === offer.jobId) {
          return {
            ...job,
            status: "visit_scheduled",
            selectedOffer: offer,
          };
        }
        return job;
      })
    );
    setSelectedOfferForProfile(null);
    setConfirmingOfferId(null);
    void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });
    showToast(
      isUrdu
        ? `${offer.worker.name} کی بکنگ کامیابی سے ہو گئی! سیکیورٹی PIN فعال ہے۔`
        : `Successfully booked ${offer.worker.name}! Security PIN activated.`
    );
  };

  // Filter jobs and their offers
  const filteredJobs = useMemo(() => {
    return jobs
      .map((job) => {
        // Filter offers within this job
        let offers = [...job.offers];

        // Filter expired urgent offers (>50s)
        const isUrgentJob =
          job.scheduleType === "asap" ||
          (job as any).urgency === "EMERGENCY" ||
          (job as any).urgency === "HIGH";
        if (isUrgentJob && job.status === "receiving_offers") {
          const nowMs = Date.now();
          offers = offers.filter((o) => {
            const createdMs = o.createdAt ? new Date(o.createdAt).getTime() : 0;
            return createdMs === 0 || nowMs - createdMs < 50000;
          });
        }

        // Status filter
        if (statusFilter === "pending" && job.status !== "receiving_offers") {
          return null;
        }
        if (statusFilter === "accepted" && job.status !== "visit_scheduled" && job.status !== "completed") {
          return null;
        }

        // Category filter
        if (categoryFilter !== "all") {
          const filterLower = categoryFilter.toLowerCase();
          const jobCatLower = (job.category || "").toLowerCase();
          const jobSubCatLower = (job.subCategory || "").toLowerCase();
          const matches =
            jobCatLower.includes(filterLower) ||
            jobSubCatLower.includes(filterLower) ||
            (filterLower.includes("plumb") && jobCatLower.includes("plumb")) ||
            (filterLower.includes("electr") && jobCatLower.includes("electr")) ||
            (filterLower.includes("ac") && (jobCatLower.includes("ac") || jobCatLower.includes("refriger")));
          if (!matches) {
            return null;
          }
        }

        // Search filter (matches job title, worker name, or trade tags)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesJob =
            job.title.toLowerCase().includes(query) ||
            job.area.toLowerCase().includes(query) ||
            job.subCategory.toLowerCase().includes(query);

          const matchingOffers = offers.filter(
            (o) =>
              o.worker.name.toLowerCase().includes(query) ||
              (o.worker.businessName || "").toLowerCase().includes(query) ||
              o.worker.expertiseTags.some((t) => t.toLowerCase().includes(query))
          );

          if (!matchesJob && matchingOffers.length === 0) {
            return null;
          }

          if (!matchesJob && matchingOffers.length > 0) {
            offers = matchingOffers;
          }
        }

        // Sort offers
        offers.sort((a, b) => {
          if (sortBy === "lowest_fee") return a.visitFee - b.visitFee;
          if (sortBy === "highest_rating") return b.worker.rating - a.worker.rating;
          if (sortBy === "fastest_arrival") return a.distanceKm - b.distanceKm;
          return 0;
        });

        return {
          ...job,
          filteredOffers: offers,
        };
      })
      .filter((job): job is CustomerJob & { filteredOffers: WorkerOffer[] } => job !== null);
  }, [jobs, statusFilter, categoryFilter, searchQuery, sortBy]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-16 animate-in fade-in-50 duration-300 text-[#123B5D]">
      {/* Toast Notification */}
      {successToast && (
        <div
          className={`fixed top-20 right-6 rtl:right-auto rtl:left-6 z-50 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
            toastTone === "error" ? "bg-rose-600" : "bg-[#0F766E]"
          }`}
        >
          {toastTone === "error" ? (
            <AlertTriangle className="size-5 shrink-0" />
          ) : (
            <CheckCircle2 className="size-5 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Header & Micro-Stats Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0F766E]/10 text-[#0F766E]">
              <span className="size-2 rounded-full bg-[#0F766E] animate-ping" />
              {isUrdu ? "لائیو انکوائریز" : "Live Inquiries"}
            </span>
            <span className="text-xs text-slate-400">
              {isUrdu ? "• ریئل ٹائم تصدیق شدہ آفرز" : "• Real-time Verified Bids"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#123B5D]">
            {isUrdu ? "ماہر کاریگروں کی آفرز اور ریٹس" : "Pro Offers & Quotes"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {isUrdu
              ? "تصدیق شدہ کاریگروں کے ریٹس کا موازنہ کریں، تصدیق شدہ اسناد دیکھیں اور WorkerFIX تحفظ کے ساتھ وزٹ بک کریں۔"
              : "Compare verified technician quotes, inspect verified credentials, and confirm bookings with WorkerFIX verified protection."}
          </p>
        </div>

        {/* Micro-Stats Strip */}
        <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-100 self-start md:self-auto">
          <div className="px-3 py-1 border-r rtl:border-r-0 rtl:border-l border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isUrdu ? "موصولہ آفرز" : "Active Offers"}
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-[#123B5D] leading-none mt-1">
              {activeOffersCount}
            </div>
          </div>
          <div className="px-3 py-1 border-r rtl:border-r-0 rtl:border-l border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isUrdu ? "کم از کم فیس" : "Lowest Fee"}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-[#0F766E] leading-none mt-1">
              Rs. {lowestFee}
            </div>
          </div>
          <div className="px-3 py-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {isUrdu ? "متوقع آمد" : "Avg Arrival"}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-[#123B5D] leading-none mt-1">
              {isUrdu ? "25 منٹ سے کم" : "< 25m"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Status Segment Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusFilter === "all"
                ? "bg-[#123B5D] text-white shadow-2xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{isUrdu ? "تمام آفرز" : "All Offers"}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {allOffers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusFilter === "pending"
                ? "bg-[#123B5D] text-white shadow-2xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="size-2 rounded-full bg-amber-400" />
            <span>{isUrdu ? "زیر غور" : "Pending Action"}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === "pending"
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {jobs.filter((j) => j.status === "receiving_offers").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("accepted")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              statusFilter === "accepted"
                ? "bg-[#123B5D] text-white shadow-2xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2
              className={`size-3.5 ${
                statusFilter === "accepted" ? "text-emerald-300" : "text-emerald-500"
              }`}
            />
            <span>{isUrdu ? "بُک شدہ وزٹس" : "Booked Visits"}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                statusFilter === "accepted"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {jobs.filter((j) => j.status === "visit_scheduled" || j.status === "completed").length}
            </span>
          </button>
        </div>

        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 xl:justify-end">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs min-w-[180px]">
            <Search className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? "کاریگر کا نام، مہارت یا علاقہ تلاش کریں..." : "Search pro name, skill or area..."}
              className="w-full pl-9 rtl:pl-3.5 rtl:pr-9 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 text-[#123B5D] border border-slate-100"
            />
          </div>

          {/* Service Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-[#123B5D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 cursor-pointer"
          >
            <option value="all">{isUrdu ? "تمام سروسز" : "All Services"}</option>
            <option value="ac-technician">{isUrdu ? "اے سی ریپئر و سروس" : "AC Repair & Maintenance"}</option>
            <option value="plumber">{isUrdu ? "پلمبنگ و سینیٹری" : "Plumbing & Sanitary"}</option>
            <option value="electrician">{isUrdu ? "الیکٹریکل کام" : "Electrical Fixes"}</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-[#123B5D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 cursor-pointer"
          >
            <option value="lowest_fee">{isUrdu ? "ترتیب: کم ترین وزٹ فیس" : "Sort: Lowest Visit Fee"}</option>
            <option value="highest_rating">{isUrdu ? "ترتیب: بہترین ریٹنگ" : "Sort: Highest Rated"}</option>
            <option value="fastest_arrival">{isUrdu ? "ترتیب: سب سے قریبی فاصلہ" : "Sort: Nearest Distance"}</option>
          </select>
        </div>
      </div>

      {/* Primary Workspace Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Job Request Groups (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <section
                key={job.id}
                className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-5"
              >
                {/* Job Meta Header Card */}
                <div className="border-b border-slate-100 pb-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {job.status === "receiving_offers" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0F766E]/10 text-[#0F766E]">
                          <span className="size-1.5 rounded-full bg-[#0F766E] animate-ping" />
                          {isUrdu ? `${job.offers.length} آفرز موصول ہوئیں` : `${job.offers.length} Offers Received`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="size-3.5" />
                          {isUrdu ? "وزٹ شیڈول ہو گیا" : "Visit Scheduled"}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        • {isUrdu ? `پوسٹ کی گئی: ${formatPostedAt(job.createdAt)}` : `Posted ${formatPostedAt(job.createdAt)}`}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {job.id}
                      </span>
                    </div>

                    <Link
                      href={`/customer/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline"
                    >
                      <span>{isUrdu ? "جاب کی تفصیلات دیکھیں" : "View Job Details"}</span>
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </Link>
                  </div>

                  <div className="pt-1">
                    <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
                      {job.title}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5 text-[#0F766E]" />
                        {job.area}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Wrench className="size-3.5 text-slate-400" />
                        {job.subCategory}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Offer Cards Stack */}
                {job.filteredOffers.length > 0 ? (
                  <div className="space-y-4">
                    {job.filteredOffers.map((offer) => (
                      <WorkerOfferCard
                        key={offer.id}
                        offer={offer}
                        isConfirming={confirmingOfferId === offer.id}
                        onViewProfile={(off) => setSelectedOfferForProfile(off)}
                        onSelectWorker={(off) => handleConfirmBooking(off)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      {job.offers.length === 0
                        ? isUrdu
                          ? "فی الوقت قریبی تصدیق شدہ کاریگروں کے ریٹس کا انتظار ہے۔"
                          : "Currently waiting for nearby verified technicians to submit quotes."
                        : isUrdu
                        ? "آپ کے سرچ کے مطابق کوئی آفر نہیں ملی۔"
                        : "No offers match your search criteria."}
                    </p>
                  </div>
                )}
              </section>
            ))
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center space-y-4 shadow-sm border border-slate-100">
              <div className="size-16 rounded-3xl bg-teal/10 text-teal flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#123B5D]">
                  {statusFilter === "pending"
                    ? isUrdu
                      ? "تمام زیر غور آفرز نمٹ چکی ہیں!"
                      : "All Caught Up! No Pending Offers"
                    : isUrdu
                    ? "کوئی آفر موجود نہیں ہے"
                    : "No offers found"}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {statusFilter === "pending"
                    ? isUrdu
                      ? "آپ کی تمام تصدیق شدہ جابز شیڈول ہو چکی ہیں۔ اپنے آنے والے وزٹس اور لائیو ٹریکنگ دیکھنے کے لیے وزٹس پر جائیں۔"
                      : "All your active bookings are confirmed and scheduled. You can track technicians live and view appointments in Visits."
                    : isUrdu
                    ? "آپ کے منتخب کردہ فلٹرز کے مطابق کوئی موصولہ آفر نہیں ملی۔"
                    : "You do not have any incoming technician offers matching the active filters."}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                {statusFilter === "pending" && (
                  <Link
                    href="/customer/jobs"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    <span>{isUrdu ? "شیڈول وزٹس دیکھیں" : "View Scheduled Visits"}</span>
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Link>
                )}
                <Link
                  href="/customer/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  <Plus className="size-4" />
                  <span>{isUrdu ? "نئی جاب پوسٹ کریں" : "Post a New Job"}</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Verified Security & Pro Tips (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* WorkerFIX Verified Security Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                <ShieldCheck className="size-6 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#123B5D]">
                  {isUrdu ? "WorkerFIX تصدیق شدہ سروس" : "WorkerFIX Verified Service"}
                </h4>
                <span className="text-xs font-semibold text-[#0F766E]">
                  {isUrdu ? "محفوظ اور شفاف" : "Safe & Transparent"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isUrdu ? (
                <>
                  آپ کی سروس <strong className="text-[#123B5D]">WorkerFIX تحفظ</strong> کے تحت محفوظ ہے۔ تمام کاریگر تصدیق شدہ ہیں اور موقع پر شفاف معائنہ فراہم کرتے ہیں۔
                </>
              ) : (
                <>
                  Your service is protected by <strong className="text-[#123B5D]">WorkerFIX Protection</strong>. Technicians are verified and provide transparent diagnosis directly on site.
                </>
              )}
            </p>

            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>
                  {isUrdu
                    ? "کاریگر کے پہنچنے سے پہلے کوئی ایڈوانس کیش کی ضرورت نہیں"
                    : "No advance direct cash required before technician arrives"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>
                  {isUrdu
                    ? "دہلیز پر 4 ہندسوں کا سیکیورٹی PIN تصدیق"
                    : "Doorstep 4-digit Security PIN handover confirmation"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>
                  {isUrdu
                    ? "100% تصدیق شدہ ماہرین"
                    : "100% Verified Pros"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Pro Hiring Tips Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
            <h4 className="text-sm font-bold text-[#123B5D] flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-500" />
              {isUrdu ? "رہنمائی اور مشورہ" : "Pro Hiring Tip"}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isUrdu ? (
                <>
                  انتخاب کرنے سے پہلے کاریگر کے سابقہ کام کی اصل تصاویر، کسٹمر ریٹنگز اور تصدیقی بیج دیکھنے کے لیے <strong className="text-[#123B5D]">پروفائل دیکھیں</strong> پر کلک کریں۔
                </>
              ) : (
                <>
                  Click <strong className="text-[#123B5D]">View Profile</strong> on any offer card to inspect the technician&apos;s real photos of past completed jobs, customer ratings, and verification badge before choosing.
                </>
              )}
            </p>
            <div className="pt-2">
              <Link
                href="/customer/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
              >
                <span>
                  {isUrdu ? "کسی اور کام کی ضرورت ہے؟ نئی جاب پوسٹ کریں" : "Need another service? Post a Job"}
                </span>
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Worker Full Profile Modal */}
      {selectedOfferForProfile && (
        <WorkerProfileModal
          offer={selectedOfferForProfile}
          isOpen={true}
          onClose={() => setSelectedOfferForProfile(null)}
          onSelectWorker={(offer: WorkerOffer) => {
            setSelectedOfferForProfile(null);
            handleConfirmBooking(offer);
          }}
        />
      )}
    </div>
  );
}

