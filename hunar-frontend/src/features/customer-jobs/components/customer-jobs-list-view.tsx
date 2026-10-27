"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Tag,
  User,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
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
const CustomerReviewModal = dynamic(
  () => import("./customer-review-modal").then((m) => m.CustomerReviewModal),
  { ssr: false }
);
import { acceptWorkerOffer, rejectWorkerOffer, getCustomerJobs, getJobDetail } from "../api/customer-jobs-api";
import { getSocket } from "@/lib/socket";

interface CustomerJobsListViewProps {
  initialJobs?: CustomerJob[];
  jobs?: CustomerJob[];
  initialTab?: "scheduled" | "offers" | "completed" | string;
}

export function CustomerJobsListView({ initialJobs, jobs: jobsProp, initialTab }: CustomerJobsListViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const resolvedInitialJobs = initialJobs ?? jobsProp ?? [];
  const initialCounts = (resolvedInitialJobs as any).counts;
  const [tabCounts, setTabCounts] = useState<{ offers: number; scheduled: number; completed: number } | null>(
    initialCounts ?? null
  );

  const partitionJobs = (list: CustomerJob[]) => ({
    scheduled: list.filter((j) => j.status === "visit_scheduled" || j.status === "in_progress"),
    offers: list.filter((j) => j.status === "receiving_offers" || (j as any).status === "open"),
    completed: list.filter((j) => j.status === "completed" || (j as any).status === "cancelled"),
  });

  const determinedInitialFilter = (
    tabParam === "offers" || tabParam === "completed" || tabParam === "scheduled"
      ? tabParam
      : initialTab === "offers" || initialTab === "completed" || initialTab === "scheduled"
      ? initialTab
      : resolvedInitialJobs.some((j) => j.status === "receiving_offers" || (j as any).status === "open") &&
        !resolvedInitialJobs.some((j) => j.status === "visit_scheduled" || j.status === "in_progress")
      ? "offers"
      : "scheduled"
  ) as "scheduled" | "offers" | "completed";

  const [selectedFilter, setSelectedFilter] = useState<"scheduled" | "offers" | "completed">(determinedInitialFilter);
  const [searchQuery, setSearchQuery] = useState("");

  const [tabJobsCache, setTabJobsCache] = useState<Record<string, CustomerJob[]>>(() => {
    return partitionJobs(resolvedInitialJobs);
  });

  const [jobs, setJobs] = useState<CustomerJob[]>(() => {
    const partitioned = partitionJobs(resolvedInitialJobs);
    return partitioned[determinedInitialFilter] ?? resolvedInitialJobs;
  });

  const [isTabLoading, setIsTabLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(resolvedInitialJobs.length >= 20);

  // Sync state whenever fresh initialJobs arrive (e.g. background TanStack Query sync)
  useEffect(() => {
    if (!resolvedInitialJobs) return;
    const partitioned = partitionJobs(resolvedInitialJobs);
    setTabJobsCache(partitioned);
    setJobs(partitioned[selectedFilter] ?? []);
    if ((resolvedInitialJobs as any).counts) {
      setTabCounts((resolvedInitialJobs as any).counts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedInitialJobs]);

  // Instant 0ms Tab Switcher
  const handleSelectTab = (tab: "scheduled" | "offers" | "completed") => {
    setSelectedFilter(tab);
    const cached = tabJobsCache[tab];
    if (cached !== undefined) {
      setJobs(cached);
      setCurrentPage(1);
      setHasMore(cached.length >= 20);
    } else {
      const partitioned = partitionJobs(resolvedInitialJobs);
      setJobs(partitioned[tab] ?? []);
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tab") !== tab) {
        url.searchParams.set("tab", tab);
        window.history.replaceState(null, "", url.toString());
      }
    }
  };

  // Sync tab with URL parameter if present
  useEffect(() => {
    if (
      (tabParam === "offers" || tabParam === "scheduled" || tabParam === "completed") &&
      tabParam !== selectedFilter
    ) {
      handleSelectTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  // Always ensure fresh tab data from server, displaying cache immediately while revalidating
  useEffect(() => {
    let isMounted = true;
    const hasCache = tabJobsCache[selectedFilter] !== undefined;

    const fetchTab = async (silent: boolean = false) => {
      if (!silent && !hasCache) {
        setIsTabLoading(true);
      }
      try {
        const data = await getCustomerJobs({ tab: selectedFilter, page: 1, limit: 20 });
        if (!isMounted) return;
        if ((data as any).counts) {
          setTabCounts((data as any).counts);
        }
        setTabJobsCache((prev) => ({ ...prev, [selectedFilter]: data }));
        setJobs(data);
        setCurrentPage(1);
        setHasMore(data.length >= 20);
      } catch (err) {
        console.warn("Failed to load jobs for tab:", err);
      } finally {
        if (isMounted) setIsTabLoading(false);
      }
    };

    // Revalidate from server
    fetchTab(hasCache);

    // Socket listener for real-time live updates
    const socket = getSocket();
    const handleLiveUpdate = () => {
      if (isMounted) {
        void fetchTab(true);
      }
    };

    if (socket) {
      if (!socket.connected) socket.connect();
      socket.on("job:offer", handleLiveUpdate);
      socket.on("job:new", handleLiveUpdate);
      socket.on("job:statusChanged", handleLiveUpdate);
      socket.on("job:status:changed", handleLiveUpdate);
      socket.on("job:offer:accepted", handleLiveUpdate);
    }

    return () => {
      isMounted = false;
      if (socket) {
        socket.off("job:offer", handleLiveUpdate);
        socket.off("job:new", handleLiveUpdate);
        socket.off("job:statusChanged", handleLiveUpdate);
        socket.off("job:status:changed", handleLiveUpdate);
        socket.off("job:offer:accepted", handleLiveUpdate);
      }
    };
  }, [selectedFilter]);

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const moreJobs = await getCustomerJobs({ tab: selectedFilter, page: nextPage, limit: 20 });
      if (!moreJobs || moreJobs.length === 0) {
        setHasMore(false);
      } else {
        setJobs((prev) => {
          const existingIds = new Set(prev.map((j) => j.id));
          const newJobs = moreJobs.filter((j) => !existingIds.has(j.id));
          const combined = [...prev, ...newJobs];
          setTabJobsCache((c) => ({ ...c, [selectedFilter]: combined }));
          return combined;
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
  const [confirmingOfferId, setConfirmingOfferId] = useState<string | null>(null);
  const [reviewingJob, setReviewingJob] = useState<CustomerJob | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const queryClient = useQueryClient();

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastTone(tone);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // On-demand detail & offers loaders to keep list query light
  const handleOpenDetailsModal = async (job: CustomerJob) => {
    setSelectedJobForDetails(job);
    try {
      const fullJob = await getJobDetail(job.id);
      setSelectedJobForDetails(fullJob);
      setJobs((prev) => prev.map((j) => (j.id === fullJob.id ? fullJob : j)));
    } catch (err) {
      console.warn("Could not fetch full job detail:", err);
    }
  };

  const handleOpenOffersModal = async (job: CustomerJob) => {
    setSelectedJobForOffers(job);
    if ((job.offerCount ?? 0) > 0 && (!job.offers[0]?.worker?.bio || !job.offers[0]?.worker?.rating)) {
      try {
        const fullJob = await getJobDetail(job.id);
        setSelectedJobForOffers(fullJob);
        setJobs((prev) => prev.map((j) => (j.id === fullJob.id ? fullJob : j)));
      } catch (err) {
        console.warn("Could not fetch full offers:", err);
      }
    }
  };


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

  // Handle directly confirming booking / accepting offer (no intermediate popup)
  const handleConfirmBooking = async (targetJob: CustomerJob, offer: WorkerOffer) => {
    setConfirmingOfferId(offer.id);
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
      setConfirmingOfferId(null);
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

    setSelectedJobForOffers(null);
    setSelectedJobForDetails(null);
    setSelectedOfferForProfile(null);
    setConfirmingOfferId(null);

    void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });

    showToast(
      isUrdu
        ? `${offer.worker.name} کی بکنگ کامیابی سے ہو گئی! سیکیورٹی PIN فعال ہے۔`
        : `Successfully booked ${offer.worker.name}! Security PIN activated.`
    );
  };

  // Handle declining / rejecting an offer optimistically
  const handleRejectOffer = async (job: CustomerJob, offer: WorkerOffer) => {
    // 1. Mark declined instead of deleting, allowing the customer to still accept after declining
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === job.id) {
          return {
            ...j,
            offers: j.offers.map((o) => (o.id === offer.id ? { ...o, isDeclined: true } : o)),
          };
        }
        return j;
      })
    );

    setSelectedJobForOffers((prev) =>
      prev && prev.id === job.id
        ? {
            ...prev,
            offers: prev.offers.map((o) => (o.id === offer.id ? { ...o, isDeclined: true } : o)),
          }
        : prev
    );

    showToast(
      isUrdu
        ? `${offer.worker.name} کی آفر مسترد کر دی گئی۔ آپ ضرورت پڑنے پر اب بھی اسے قبول کر سکتے ہیں۔`
        : `Offer from ${offer.worker.name} was declined. You can still accept it if needed.`
    );

    // 2. Background API call
    try {
      await rejectWorkerOffer(job.id, offer.id);
    } catch (err) {
      console.warn("rejectWorkerOffer error:", err);
      // Rollback on failure
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === job.id) {
            return {
              ...j,
              offers: [offer, ...j.offers],
            };
          }
          return j;
        })
      );
      setSelectedJobForOffers((prev) =>
        prev && prev.id === job.id
          ? { ...prev, offers: [offer, ...prev.offers] }
          : prev
      );
      showToast(
        isUrdu
          ? "آفر مسترد کرنے میں ناکامی ہوئی۔ دوبارہ کوشش کریں۔"
          : "Could not decline offer. Please try again.",
        "error"
      );
    }
  };

  const handleRepostJob = (job: CustomerJob) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          "workerfix_customer_post_job_draft",
          JSON.stringify({
            title: job.title,
            description: job.description || "",
            address: job.address || "",
            area: job.area || "",
            city: job.city || "Peshawar",
            landmark: job.landmark || "",
            category: job.category || "",
            subCategory: job.subCategory || "",
            scheduleType: job.scheduleType || "asap",
            suggestedVisitFee: job.suggestedVisitCharge || 500,
            photos: job.photos || [],
          })
        );
      } catch {}
      router.push(
        `/customer/post-job?category=${encodeURIComponent(job.category || "")}&subCategory=${encodeURIComponent(job.subCategory || "")}`
      );
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter =
      (selectedFilter === "offers" && (job.status === "receiving_offers" || (job as any).status === "open")) ||
      (selectedFilter === "scheduled" && (job.status === "visit_scheduled" || job.status === "in_progress")) ||
      (selectedFilter === "completed" && (job.status === "completed" || (job as any).status === "cancelled"));

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesFilter;

    const matchesSearch =
      job.title?.toLowerCase().includes(query) ||
      job.area?.toLowerCase().includes(query) ||
      job.subCategory?.toLowerCase().includes(query) ||
      job.id?.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const partitioned = partitionJobs(resolvedInitialJobs);
  const activeCount = tabCounts?.offers ?? partitioned.offers.length;
  const scheduledCount = tabCounts?.scheduled ?? partitioned.scheduled.length;
  const completedCount = tabCounts?.completed ?? partitioned.completed.length;

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
            onClick={() => handleSelectTab("scheduled")}
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
            onClick={() => handleSelectTab("offers")}
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
            onClick={() => handleSelectTab("completed")}
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
      {isTabLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-slate-200 rounded" />
                    <div className="h-5 w-28 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-6 w-3/4 max-w-md bg-slate-200 rounded-md" />
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                </div>
                <div className="h-10 w-28 bg-slate-100 rounded-xl" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-16" />
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2.5">
                <div className="h-9 w-24 bg-slate-200 rounded-xl" />
                <div className="h-9 w-32 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <>
          <div className="space-y-4">
          {filteredJobs.map((job) => {
            const hasAssignedWorker = !!job.selectedOffer;
            const assignedWorker = job.selectedOffer?.worker;
            const totalOffers = job.offerCount || job.offers?.length || 0;

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
                          {isUrdu ? `${totalOffers} آفرز موصول ہوئیں` : `${totalOffers} Offers Received`}
                        </span>
                      )}

                      {job.status === "visit_scheduled" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                          <span className="size-1.5 rounded-full bg-[#F59E0B]" />
                          {isUrdu ? "وزٹ شیڈول اور PIN فعال ہے" : "Visit Scheduled & PIN Active"}
                        </span>
                      )}

                      {job.status === "in_progress" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          {isUrdu ? "کام جاری ہے" : "Service In Progress"}
                        </span>
                      )}

                      {job.status === "completed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="size-3.5" />
                          {isUrdu ? "مکمل اور تصدیق شدہ" : "Completed & Verified"}
                        </span>
                      )}

                      {job.status === "cancelled" && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            job.cancelReason === "EXPIRED_NO_WORKER_ACCEPTED"
                              ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {job.cancelReason === "EXPIRED_NO_WORKER_ACCEPTED" ? (
                            <>
                              <Clock className="size-3.5 text-amber-600" />
                              {isUrdu ? "میعاد ختم (کوئی کاریگر نہیں ملا)" : "Expired (No Worker Accepted)"}
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3.5 text-slate-500" />
                              {isUrdu ? "منسوخ شدہ" : "Cancelled"}
                            </>
                          )}
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
                  {job.status === "cancelled" ? (
                    <div className="flex items-center sm:flex-col sm:items-end rtl:sm:items-start justify-between bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0] shrink-0">
                      <span className="text-xs text-[#64748B]">
                        {isUrdu ? "حالت" : "Status"}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700">
                        {job.cancelReason === "EXPIRED_NO_WORKER_ACCEPTED" ? (
                          <>
                            <Clock className="size-4 text-amber-600" />
                            <span>{isUrdu ? "20 گھنٹے بعد میعاد ختم" : "Expired (20h Limit)"}</span>
                          </>
                        ) : (
                          <span className="text-slate-500">{isUrdu ? "منسوخ شدہ" : "Cancelled"}</span>
                        )}
                      </div>
                    </div>
                  ) : job.status === "completed" && job.selectedOffer ? (
                    <div className="flex items-center sm:flex-col sm:items-end rtl:sm:items-start justify-between bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0] shrink-0">
                      <span className="text-xs text-[#64748B]">
                        {isUrdu ? "کل ادائیگی" : "Total Paid"}
                      </span>
                      <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-[#1A1A2E]">
                        <ShieldCheck className="size-5 text-[#0F766E]" />
                        <span>
                          Rs. {(
                            (job.totalAmount && job.totalAmount > 0)
                              ? job.totalAmount
                              : (job.selectedOffer.visitFee + (job.repairCharge ?? 0))
                          ).toLocaleString()}
                        </span>
                      </div>
                      {Boolean(job.repairCharge && job.repairCharge > 0) ? (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {isUrdu
                            ? `وزٹ Rs. ${job.selectedOffer.visitFee} + مرمت Rs. ${job.repairCharge}`
                            : `Visit Rs. ${job.selectedOffer.visitFee} + Repair Rs. ${job.repairCharge}`}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#0F766E] font-semibold">
                          {isUrdu ? "تصدیق شدہ کام" : "Verified Handover"}
                        </span>
                      )}
                    </div>
                  ) : (job.status === "visit_scheduled" || job.status === "in_progress") && job.selectedOffer ? (
                    <div className="flex items-center sm:flex-col sm:items-end rtl:sm:items-start justify-between bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-[#E2E8F0] shrink-0">
                      <span className="text-xs text-[#64748B]">
                        {job.repairCharge && job.repairCharge > 0
                          ? (isUrdu ? "کل رقم (وزٹ + مرمت)" : "Total (Visit + Repair)")
                          : (isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee")}
                      </span>
                      <div className="flex items-center gap-1 text-lg sm:text-xl font-bold text-[#1A1A2E]">
                        <ShieldCheck className="size-5 text-[#0F766E]" />
                        <span>
                          Rs. {(
                            (job.totalAmount && job.totalAmount > 0)
                              ? job.totalAmount
                              : (job.selectedOffer.visitFee + (job.repairCharge ?? 0))
                          ).toLocaleString()}
                        </span>
                      </div>
                      {Boolean(job.repairCharge && job.repairCharge > 0) && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          {isUrdu
                            ? `وزٹ Rs. ${job.selectedOffer.visitFee} + مرمت Rs. ${job.repairCharge}`
                            : `Visit Rs. ${job.selectedOffer.visitFee} + Repair Rs. ${job.repairCharge}`}
                        </span>
                      )}
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
                    {job.status === "cancelled" && job.cancelReason === "EXPIRED_NO_WORKER_ACCEPTED" ? (
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                          <Clock className="size-5 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-[#1A1A2E] block">
                            {isUrdu ? "کوئی کاریگر دستیاب نہیں ہوا" : "No Worker Accepted in Time"}
                          </span>
                          <span className="text-xs text-amber-700/80">
                            {isUrdu
                              ? "20 گھنٹے مکمل ہو گئے ہیں۔ آپ دوبارہ پوسٹ کر سکتے ہیں۔"
                              : "Request timed out after 20 hours. You can repost anytime."}
                          </span>
                        </div>
                      </div>
                    ) : hasAssignedWorker && assignedWorker ? (
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
                              <span>
                                {assignedWorker.rating > 0
                                  ? assignedWorker.rating.toFixed(1)
                                  : isUrdu
                                  ? "نیا"
                                  : "New"}
                              </span>
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
                              ? `${totalOffers} تصدیق شدہ ماہرین نے آفر بھیجی`
                              : `${totalOffers} Verified Pros Responded`}
                          </span>
                          <span className="text-xs text-[#64748B]">
                            {job.offers && job.offers.length > 0
                              ? job.offers.map((o) => o.worker?.name).filter(Boolean).join(", ")
                              : isUrdu
                              ? "کاریگروں کی آفرز کا جائزہ لیں"
                              : "Tap Review Offers to view quotes"}
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
                            {isUrdu ? "فوری" : "Immediate"}
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
                        ? `${totalOffers} تصدیق شدہ ماہرین نے اس جاب کے لیے آفرز جمع کروائی ہیں۔`
                        : `${totalOffers} verified technicians submitted quotes for this job.`
                      : job.status === "visit_scheduled"
                      ? isUrdu
                        ? "کاریگر متعین ہو چکا ہے۔ دہلیز پر آمد کے وقت 4 ہندسوں کے سیکیورٹی PIN کی تصدیق کریں۔"
                        : "Technician confirmed. Verify 4-digit Doorstep PIN upon arrival."
                      : job.status === "in_progress"
                      ? isUrdu
                        ? "کاریگر احاطے کے اندر کام / معائنہ کر رہا ہے۔ لائیو پراگریس ٹریک کریں۔"
                        : "Technician is on-site performing inspection or repairs. Track live progress."
                      : job.status === "cancelled"
                      ? job.cancelReason === "EXPIRED_NO_WORKER_ACCEPTED"
                        ? isUrdu
                          ? "کوئی کاریگر دستیاب نہیں ہوا۔ آپ اسی تفصیلات کے ساتھ نئی درخواست دوبارہ پوسٹ کر سکتے ہیں۔"
                          : "No worker accepted within 20 hours. You can repost this request anytime."
                        : isUrdu
                        ? "یہ درخواست منسوخ کر دی گئی ہے۔"
                        : "This request was cancelled."
                      : isUrdu
                      ? "کام مکمل ہو چکا ہے اور تسلی بخش ادائیگی طے پا چکی ہے۔"
                      : "Job completed and payment successfully settled."}
                  </span>

                  <div className="flex items-center gap-2.5 ml-auto rtl:ml-0 rtl:mr-auto">
                    {/* View Details Button -> opens Details Modal */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetailsModal(job)}
                      className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-[#1A1A2E] bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer active:scale-98"
                    >
                      {isUrdu ? "تفصیلات دیکھیں" : "View Details"}
                    </button>

                    {/* Repost Button for Cancelled/Expired Jobs */}
                    {job.status === "cancelled" && (
                      <button
                        type="button"
                        onClick={() => handleRepostJob(job)}
                        className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-teal hover:bg-teal/90 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <RotateCcw className="size-3.5" />
                        <span>{isUrdu ? "دوبارہ پوسٹ کریں" : "Repost Request"}</span>
                      </button>
                    )}

                    {/* Review Offer Button -> opens in-context Offers Modal */}
                    {job.status === "receiving_offers" && (
                      <button
                        type="button"
                        onClick={() => handleOpenOffersModal(job)}
                        className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-teal hover:bg-teal/90 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <span>
                          {isUrdu
                            ? totalOffers === 1
                              ? "آفر کا جائزہ لیں"
                              : `${totalOffers} آفرز کا جائزہ لیں`
                            : totalOffers === 1
                            ? "Review Offer"
                            : `Review ${totalOffers} Offers`}
                        </span>
                        <ArrowRight className="size-3.5 rtl:rotate-180" />
                      </button>
                    )}

                    {(job.status === "visit_scheduled" || job.status === "in_progress") && (
                      <Link
                        href={`/customer/job/${job.id}/tracking`}
                        className="h-9 px-4 rounded-xl font-semibold text-xs sm:text-sm text-white bg-teal hover:bg-teal/90 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Clock className="size-3.5" />
                        <span>
                          {job.status === "in_progress"
                            ? (isUrdu ? "لائیو پراگریس دیکھیں" : "Track Live Progress")
                            : (isUrdu ? "لائیو وزٹ ٹریک کریں" : "Track Live Visit")}
                        </span>
                        <ArrowRight className="size-3.5 rtl:rotate-180" />
                      </Link>
                    )}

                    {/* Rate & Review Button for Completed Jobs */}
                    {job.status === "completed" && (
                      job.hasReviewed ? (
                        <div className="h-9 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                          <Star className="size-3.5 fill-emerald-600 text-emerald-600" />
                          <span>
                            {job.customerReview?.rating ?? 5}/5 {isUrdu ? "ریویو درج ہے" : "Reviewed"}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReviewingJob(job)}
                          className="h-9 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-amber-400 hover:bg-amber-500 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <Star className="size-3.5 fill-slate-950" />
                          <span>{isUrdu ? "ریویو دیں" : "Rate & Review"}</span>
                        </button>
                      )
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
              href="/customer/dashboard"
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
          onRepostJob={handleRepostJob}
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
          onSelectWorker={(job, offer) => handleConfirmBooking(job, offer)}
          onRejectOffer={handleRejectOffer}
          confirmingOfferId={confirmingOfferId}
        />
      )}

      {/* Worker Profile Modal - Loaded dynamically on demand */}
      {selectedOfferForProfile && (
        <WorkerProfileModal
          offer={selectedOfferForProfile}
          isOpen={Boolean(selectedOfferForProfile)}
          onClose={() => setSelectedOfferForProfile(null)}
          onSelectWorker={(offer) => {
            const targetJob =
              selectedJobForOffers ||
              jobs.find((j) => j.offers.some((o) => o.id === offer.id));
            setSelectedOfferForProfile(null);
            if (targetJob) {
              handleConfirmBooking(targetJob, offer);
            }
          }}
        />
      )}
      {/* Customer Review Modal for Completed Jobs */}
      {reviewingJob && (
        <CustomerReviewModal
          job={reviewingJob}
          isOpen={Boolean(reviewingJob)}
          onClose={() => setReviewingJob(null)}
          onReviewSubmitted={(review) => {
            const updatedId = reviewingJob.id;
            setJobs((prev) =>
              prev.map((j) =>
                j.id === updatedId
                  ? {
                      ...j,
                      hasReviewed: true,
                      customerReview: {
                        rating: review.rating,
                        comment: review.comment,
                        date: new Date().toISOString(),
                      },
                    }
                  : j
              )
            );
            void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });
            showToast(
              isUrdu
                ? "آپ کا ریویو کامیابی سے درج کر لیا گیا ہے!"
                : "Your review has been successfully recorded!"
            );
          }}
        />
      )}
    </div>
  );
}


