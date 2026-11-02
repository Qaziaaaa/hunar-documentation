"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import {
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  UserCheck,
  Wrench,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { formatJobDate } from "@/lib/format";
import { formatRs } from "@/lib/design-tokens";
import { connectSocket, getSocket } from "@/lib/socket";
import { CustomerVisitProgressTimeline } from "./customer-visit-progress-timeline";
import dynamic from "next/dynamic";

const CustomerLiveTrackingMap = dynamic(
  () =>
    import("./customer-live-tracking-map").then(
      (m) => m.CustomerLiveTrackingMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] sm:h-[400px] bg-slate-50 border border-slate-200/60 animate-pulse rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 text-xs font-semibold">
        <MapPin className="size-6 text-teal animate-bounce" />
        <span>Loading live technician map...</span>
      </div>
    ),
  }
);
import { CustomerArrivalOtpModal } from "./customer-arrival-otp-modal";
const QuickChatDrawer = dynamic(
  () => import("./quick-chat-drawer").then((m) => m.QuickChatDrawer),
  { ssr: false }
);
import {
  getCustomerJobVisitTracking,
} from "../api/customer-visits-api";
import {
  arrivalService,
  type ArrivalSession,
} from "@/features/jobs/services/arrival-verification-service";
import { customerReviewService } from "@/features/customer-jobs/services/customer-review-service";
import type { CustomerVisitTrackingData, ScheduledVisit } from "../types";

interface CustomerJobTrackingViewProps {
  jobId: string;
}

export function CustomerJobTrackingView({ jobId }: CustomerJobTrackingViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const router = useRouter();

  const [data, setData] = useState<CustomerVisitTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Doorstep arrival session & modal state
  const [arrivalSession, setArrivalSession] = useState<ArrivalSession | null>(() => {
    const s = arrivalService.getSession();
    return s && (!s.jobId || s.jobId.toLowerCase() === jobId?.toLowerCase()) ? s : null;
  });
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [userDismissedModal, setUserDismissedModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasReviewedLocally, setHasReviewedLocally] = useState<boolean>(() => {
    return customerReviewService.isReviewCompleted(jobId);
  });

  useEffect(() => {
    const unsub = customerReviewService.subscribe((_job, isOpen) => {
      if (customerReviewService.isReviewCompleted(jobId)) {
        setHasReviewedLocally(true);
      }
    });
    return unsub;
  }, [jobId]);

  // Live worker GPS coordinates (updated dynamically via Socket.IO)
  const [liveWorkerLat, setLiveWorkerLat] = useState<number | null>(null);
  const [liveWorkerLng, setLiveWorkerLng] = useState<number | null>(null);
  const isFetchingRef = useRef(false);

  const fetchTracking = useCallback(
    async (isBackground = false) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const session = arrivalService.getSession();
        const isJobSessionPending =
          session && session.jobId === jobId && session.status === "pending_otp";

        const tracking = await getCustomerJobVisitTracking(jobId, {
          isDoorstepPendingOtp: Boolean(isJobSessionPending),
          doorstepOtp: isJobSessionPending ? session.otp : undefined,
        });

        setData(tracking);
        setError(null);

        // Seed initial genuine coordinates
        if (tracking.workerLocation) {
          setLiveWorkerLat(tracking.workerLocation.latitude);
          setLiveWorkerLng(tracking.workerLocation.longitude);
        }

        const normJobStatus = String((tracking as any).jobStatus || "").toUpperCase();
        const normVisitStatus = String((tracking as any).visitStatus || "").toUpperCase();

        if (tracking.hasReviewed || customerReviewService.isReviewCompleted(jobId)) {
          setHasReviewedLocally(true);
        }

        const isCompletedState =
          tracking.currentStageId === "COMPLETED" ||
          normJobStatus === "COMPLETED" ||
          normJobStatus === "PAID" ||
          normJobStatus === "REVIEWED";

        if (
          isCompletedState &&
          !tracking.hasReviewed &&
          normJobStatus !== "REVIEWED" &&
          !customerReviewService.isReviewCompleted(jobId) &&
          !customerReviewService.isDismissedInSession(jobId)
        ) {
          void customerReviewService.promptReviewByJobId(jobId);
        }

        // Auto-activate arrival session & auto-open OTP modal if worker has arrived
        const isPastArrival =
          tracking.currentStageId === "IN_PREMISES" ||
          tracking.currentStageId === "INSPECTION_DONE" ||
          tracking.currentStageId === "COMPLETED" ||
          tracking.currentStageId === "CANCELLED" ||
          [
            "VISIT_COMPLETED",
            "INSPECTION_DONE",
            "REPAIR_NEGOTIATING",
            "REPAIR_APPROVED",
            "IN_PROGRESS",
            "COMPLETED",
            "PAID",
            "REVIEWED",
            "CANCELLED",
          ].includes(normJobStatus) ||
          normVisitStatus === "COMPLETED" ||
          normVisitStatus === "CANCELLED";

        if (!isPastArrival && (tracking.isDoorstepPendingOtp || tracking.currentStageId === "ARRIVED")) {
          const resolvedOtp = tracking.doorstepOtp || session?.otp || "";
          const activeSession: ArrivalSession = {
            jobId,
            visitId: session?.visitId,
            otp: resolvedOtp,
            arrivedAt: session?.arrivedAt || Date.now(),
            status: "pending_otp",
            workerName: tracking.technician?.name || "Technician",
            workerPhone: tracking.technician?.phone || undefined,
            customerAddress: tracking.customerAddress,
          };
          setArrivalSession(activeSession);
          arrivalService.startArrivalSession(activeSession);
          if (!userDismissedModal) {
            setIsOtpModalOpen(true);
          }
        } else if (isPastArrival) {
          setArrivalSession(null);
          setIsOtpModalOpen(false);
          arrivalService.clearArrivalSession();
        }
      } catch (err: any) {
        console.warn("Failed to load visit tracking:", err);
        // Only set error state if we don't already have live data on screen
        if (!isBackground) {
          setData((currentData) => {
            if (!currentData) {
              setError(
                err?.message ||
                  (isUrdu
                    ? "وزٹ ٹریکنگ کی معلومات حاصل نہیں ہو سکیں۔"
                    : "Unable to load live visit tracking.")
              );
            }
            return currentData;
          });
        }
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [jobId, isUrdu, userDismissedModal]
  );

  const dataRef = useRef(data);
  dataRef.current = data;
  const fetchTrackingRef = useRef(fetchTracking);
  fetchTrackingRef.current = fetchTracking;

  // Auto-refresh: Initial fetch + rapid background auto-polling (2.5s while active/arriving, 8s otherwise)
  useEffect(() => {
    void fetchTracking(false);

    const isPendingStage =
      !data ||
      data.currentStageId === "ARRIVED" ||
      data.currentStageId === "EN_ROUTE" ||
      isOtpModalOpen;
    const intervalMs = isPendingStage ? 2500 : 8000;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void fetchTracking(true);
    }, intervalMs);

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void fetchTracking(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchTracking, data?.currentStageId, isOtpModalOpen]);

  // Real-time Socket.IO and ArrivalService synchronization with stable listeners
  useEffect(() => {
    if (!jobId) return;

    // Helper: case-insensitive job/visit matcher
    const isMatchingJob = (payloadJobId?: string, payloadVisitId?: string) => {
      if (!payloadJobId && !payloadVisitId) return true;
      if (payloadJobId && payloadJobId.toLowerCase() === jobId?.toLowerCase()) return true;
      const currentVisitId = (dataRef.current as any)?.visitId;
      if (payloadVisitId && currentVisitId && payloadVisitId === currentVisitId) return true;
      return false;
    };

    // 1. Listen for arrival session changes from local service
    const unsubscribeArrival = arrivalService.subscribe((s, eventType) => {
      if (eventType === "SESSION_CLEARED" || !s) {
        setIsOtpModalOpen(false);
        setArrivalSession(null);
        return;
      }
      if (s && (!s.jobId || s.jobId.toLowerCase() === jobId?.toLowerCase())) {
        setArrivalSession(s);
        if (eventType === "ARRIVAL_STARTED" || s.status === "pending_otp") {
          setUserDismissedModal(false);
          setIsOtpModalOpen(true);
          void fetchTrackingRef.current(true);
        } else if (eventType === "OTP_VERIFIED" || s.status === "otp_verified") {
          setIsOtpModalOpen(false);
          setArrivalSession(null);
          void fetchTrackingRef.current(true);
        }
      }
    });

    // 2. Real-time Socket.IO listeners
    const socket = connectSocket();
    if (socket) {
      // Start listening to location & status updates for this job room
      socket.emit("location:track:start", { jobId });

      const onConnect = () => {
        socket.emit("location:track:start", { jobId });
      };
      socket.on("connect", onConnect);

      const handleJobStatusChanged = (payload: any) => {
        if (isMatchingJob(payload?.jobId, payload?.visitId)) {
          if (payload?.arrivalPending) {
            const newSession: ArrivalSession = {
              jobId,
              visitId: payload.visitId,
              otp: payload.otp || "",
              arrivedAt: Date.now(),
              status: "pending_otp",
              workerName: payload.workerName || dataRef.current?.technician?.name || "Technician",
            };
            setArrivalSession(newSession);
            setUserDismissedModal(false);
            setIsOtpModalOpen(true);
            arrivalService.startArrivalSession(newSession);
          } else if (
            payload?.newStatus === "VISIT_COMPLETED" ||
            payload?.newStatus === "COMPLETED" ||
            payload?.newStatus === "INSPECTION_DONE" ||
            payload?.newStatus === "REPAIR_NEGOTIATING" ||
            payload?.newStatus === "REPAIR_APPROVED" ||
            payload?.newStatus === "IN_PROGRESS" ||
            payload?.newStatus === "CANCELLED"
          ) {
            setArrivalSession(null);
            setIsOtpModalOpen(false);
            arrivalService.clearArrivalSession();
            if (payload?.newStatus === "COMPLETED") {
              void customerReviewService.promptReviewByJobId(jobId, { force: true });
            }
          }
          void fetchTrackingRef.current(true);
        }
      };

      const handleVisitArrived = (payload: any) => {
        if (isMatchingJob(payload?.jobId, payload?.visitId)) {
          const newSession: ArrivalSession = {
            jobId,
            visitId: payload.visitId,
            otp: payload.otp || "",
            arrivedAt: payload.arrivedAt || Date.now(),
            status: "pending_otp",
            workerName: payload.workerName || dataRef.current?.technician?.name || "Technician",
            workerPhone: payload.workerPhone,
          };
          setArrivalSession(newSession);
          setUserDismissedModal(false);
          setIsOtpModalOpen(true);
          arrivalService.startArrivalSession(newSession);
          void fetchTrackingRef.current(true);
        }
      };

      const handleOtpVerified = (payload: any) => {
        if (isMatchingJob(payload?.jobId, payload?.visitId)) {
          setArrivalSession(null);
          setIsOtpModalOpen(false);
          arrivalService.clearArrivalSession();
          void fetchTrackingRef.current(true);
        }
      };

      const handleLocationUpdate = (payload: any) => {
        if (isMatchingJob(payload?.jobId) && payload?.latitude && payload?.longitude) {
          setLiveWorkerLat(payload.latitude);
          setLiveWorkerLng(payload.longitude);
        }
      };

      socket.on("job:status:changed", handleJobStatusChanged);
      socket.on("job:statusChanged", handleJobStatusChanged);
      socket.on("visit:arrived", handleVisitArrived);
      socket.on("visit.arrived", handleVisitArrived);
      socket.on("visit:otp:verified", handleOtpVerified);
      socket.on("visit.otp.verified", handleOtpVerified);
      socket.on("location:update", handleLocationUpdate);

      return () => {
        unsubscribeArrival();
        socket.off("connect", onConnect);
        socket.emit("location:track:stop", { jobId });
        socket.off("job:status:changed", handleJobStatusChanged);
        socket.off("job:statusChanged", handleJobStatusChanged);
        socket.off("visit:arrived", handleVisitArrived);
        socket.off("visit.arrived", handleVisitArrived);
        socket.off("visit:otp:verified", handleOtpVerified);
        socket.off("visit.otp.verified", handleOtpVerified);
        socket.off("location:update", handleLocationUpdate);
      };
    }

    return () => {
      unsubscribeArrival();
    };
  }, [jobId]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded-lg" />
            <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
              <div className="h-20 w-full bg-slate-100 rounded-2xl" />
              <div className="h-40 w-full bg-slate-100 rounded-2xl" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="h-16 w-full bg-slate-100 rounded-2xl" />
              <div className="h-28 w-full bg-slate-100 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State (only shown if initial data load failed)
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="size-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <AlertCircle className="size-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-[#123B5D]">
            {isUrdu ? "وزٹ ٹریکنگ لوڈ نہیں ہو سکی" : "Unable to Load Visit Tracking"}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {error ||
              (isUrdu
                ? "اس جاب کے لیے ٹریکنگ ڈیٹا دستیاب نہیں ہے۔ براہ کرم انٹرنیٹ چیک کریں یا دوبارہ کوشش کریں۔"
                : "Tracking data for this job reference could not be retrieved.")}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => void fetchTracking()}
            className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0d655e] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            {isUrdu ? "دوبارہ کوشش کریں" : "Retry"}
          </button>
          <Link
            href={`/customer/jobs/${jobId}`}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#123B5D] font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
          >
            {isUrdu ? "جاب پر واپس جائیں" : "Back to Job Details"}
          </Link>
        </div>
      </div>
    );
  }

  const isDoorstepPending =
    data.currentStageId === "ARRIVED" || Boolean(arrivalSession?.status === "pending_otp");

  const isEnRoute = data.currentStageId === "EN_ROUTE";

  // Synthetic ScheduledVisit for chat drawer compatibility
  const chatVisit: ScheduledVisit = {
    id: data.jobId,
    jobId: data.jobId,
    jobTitle: data.jobTitle,
    jobTitleUr: data.jobTitleUr,
    category: data.category,
    subCategory: data.category,
    status: (data.visitStatus || "scheduled").toLowerCase() as any,
    scheduledDate: data.scheduledDate || "Scheduled",
    scheduledTimeSlot: data.scheduledTimeSlot || "",
    etaMinutes: 0,
    remainingDistanceKm: 0,
    securityPin: "",
    visitCharges: data.visitCharges || 0,
    escrowAmount: data.visitCharges || 0,
    customerAddress: data.customerAddress,
    customerArea: data.customerArea,
    customerLat: data.customerLat || 0,
    customerLng: data.customerLng || 0,
    originLat: 0,
    originLng: 0,
    technician: data.technician || {
      id: "unassigned",
      name: "Technician",
      businessName: "",
      avatarUrl: "",
      phone: "",
      rating: 0,
      totalReviews: 0,
      tradeCategory: data.category,
      hunarBadgeId: "",
      vehicleModel: "",
      vehiclePlate: "",
      isCnicVerified: false,
      isBiometricChecked: false,
      currentLat: 0,
      currentLng: 0,
      speedKmh: 0,
    },
    currentStreetLandmark: "",
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 pb-20 text-[#123B5D]">
      {/* A. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#123B5D]/5 text-[#123B5D] border border-[#123B5D]/10">
              #{data.jobId}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
              {isUrdu ? (data.categoryUr ?? data.category) : data.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D] tracking-tight">
            {isUrdu ? "اپنے وزٹ کو ٹریک کریں" : "Track Your Visit"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Back to Bookings */}
          <Link
            href="/customer/jobs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#123B5D] hover:bg-[#0e2f4a] text-white shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <span>{isUrdu ? "میری بکنگز" : "My Bookings"}</span>
          </Link>
        </div>
      </div>

      {/* TWO-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: HERO TRACKING CARD + MAP + INSPECTION (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* B. MAIN TRACKING CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Top Status Gradient Bar */}
            <div
              className={`h-2 w-full ${
                data.currentStageId === "COMPLETED"
                  ? "bg-gradient-to-r from-[#16A34A] to-[#15803D]"
                  : data.currentStageId === "ARRIVED"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                  : data.currentStageId === "EN_ROUTE"
                  ? "bg-gradient-to-r from-[#0F766E] to-[#14B8A6]"
                  : "bg-gradient-to-r from-[#123B5D] to-[#0F766E]"
              }`}
            />

            <div className="p-5 sm:p-6 space-y-6">
              {/* Doorstep PIN Action Callout (Triggered on doorstep arrival) */}
              {isDoorstepPending && (
                <div className="p-4.5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 animate-in fade-in-50 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MapPin className="size-5 animate-bounce" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                        {isUrdu
                          ? `${data.technician?.name || "کاریگر"} آپ کی دہلیز پر پہنچ چکے ہیں!`
                          : `${data.technician?.name || "Technician"} has arrived at your doorstep!`}
                      </h4>
                      <p className="text-[11.5px] text-amber-800 leading-tight">
                        {isUrdu
                          ? "احاطے میں داخلے کی اجازت دینے کے لیے کاریگر کا دیا گیا 4 ہندسوں کا دہلیز PIN درج کریں۔"
                          : "Enter the 4-digit Doorstep PIN provided by the technician to verify identity and allow entry."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDismissedModal(false);
                      setIsOtpModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 active:scale-98"
                  >
                    {isUrdu ? "دہلیز PIN درج کریں" : "Enter Doorstep PIN"}
                  </button>
                </div>
              )}

              {/* Job Completed Rate & Review Callout */}
              {(data.currentStageId === "COMPLETED" ||
                String(data.jobStatus || "").toUpperCase() === "COMPLETED" ||
                String(data.jobStatus || "").toUpperCase() === "REVIEWED") && (
                <div
                  className={`p-4.5 sm:p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in-50 duration-300 ${
                    hasReviewedLocally || data.hasReviewed || String(data.jobStatus || "").toUpperCase() === "REVIEWED"
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                      : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`size-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                        hasReviewedLocally || data.hasReviewed || String(data.jobStatus || "").toUpperCase() === "REVIEWED"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {hasReviewedLocally || data.hasReviewed || String(data.jobStatus || "").toUpperCase() === "REVIEWED" ? (
                        <CheckCircle2 className="size-6" />
                      ) : (
                        <Star className="size-6 fill-white" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-[#123B5D]">
                          {hasReviewedLocally || data.hasReviewed || String(data.jobStatus || "").toUpperCase() === "REVIEWED"
                            ? isUrdu
                              ? "آپ کا ریویو درج ہو چکا ہے!"
                              : "Service Reviewed & Recorded!"
                            : isUrdu
                            ? "کام مکمل ہو گیا! کاریگر کو ریویو دیں"
                            : "Job Completed! Rate & Review Technician"}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-white/80 border border-emerald-300 text-emerald-700">
                          {isUrdu ? "مکمل سروس" : "Completed"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">
                        {hasReviewedLocally || data.hasReviewed || String(data.jobStatus || "").toUpperCase() === "REVIEWED"
                          ? isUrdu
                            ? `آپ نے ${data.technician?.name || "کاریگر"} کی کارکردگی پر تصدیق شدہ رائے درج کر دی ہے۔ شکریہ!`
                            : `You have submitted verified feedback for ${data.technician?.name || "the technician"}. Thank you!`
                          : isUrdu
                          ? `براہِ کرم ${data.technician?.name || "کاریگر"} کی مہارت، وقت کی پابندی اور کام کے معیار پر اپنی ریٹنگ درج کریں۔`
                          : `Help others by rating ${data.technician?.name || "the technician"}'s skill, punctuality and service quality.`}
                      </p>
                    </div>
                  </div>

                  {!(hasReviewedLocally || data.hasReviewed || String(data.jobStatus || "").toUpperCase() === "REVIEWED") && (
                    <button
                      type="button"
                      onClick={() => {
                        void customerReviewService.promptReviewByJobId(jobId, { force: true });
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer shrink-0 active:scale-98 flex items-center justify-center gap-2"
                    >
                      <Star className="size-4 fill-slate-950" />
                      <span>{isUrdu ? "ریٹنگ اور ریویو دیں" : "Rate & Review Now"}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Status Header & Headline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-3.5">
                    {data.currentStageId === "EN_ROUTE" ||
                    data.currentStageId === "ARRIVED" ||
                    data.currentStageId === "IN_PREMISES" ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                        <span className="relative inline-flex rounded-full size-3.5 bg-[#16A34A]" />
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full size-3.5 bg-[#0F766E]" />
                    )}
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#123B5D] leading-tight">
                    {isUrdu ? data.stageHeadlineUr : data.stageHeadline}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6 rtl:pl-0 rtl:pr-6">
                  {isUrdu ? data.stageExplanationUr : data.stageExplanation}
                </p>
              </div>

              {/* Progress Timeline */}
              <div className="pt-2 border-t border-slate-100">
                <CustomerVisitProgressTimeline
                  steps={data.timelineSteps}
                  isUrdu={isUrdu}
                />
              </div>

              {/* Next Step Information Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="size-8 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {isUrdu ? "اگلا مرحلہ" : "What to expect next"}
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {isUrdu ? data.nextStepTextUr : data.nextStepText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* D. LOCATION / LIVE MAP SECTION (Status-aware) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123B5D]">
                    {isUrdu ? "لوکیشن اور لائیو ٹریکنگ" : "Location & Live Tracking"}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {isEnRoute
                      ? isUrdu
                        ? "کاریگر کے سفر کی لائیو اپڈیٹ"
                        : "Live GPS approach updates"
                      : isUrdu
                      ? "تصدیق شدہ سروس کا پتہ"
                      : "Confirmed service address"}
                  </span>
                </div>
              </div>

              {isEnRoute && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16A34A]/10 text-[#16A34A]">
                  <span className="size-1.5 rounded-full bg-[#16A34A] animate-ping" />
                  <span>{isUrdu ? "سفر جاری ہے" : "Active Trip"}</span>
                </span>
              )}
            </div>

            {/* Status-aware Map Renderer */}
            <CustomerLiveTrackingMap
              workerLat={liveWorkerLat}
              workerLng={liveWorkerLng}
              customerLat={data.customerLat}
              customerLng={data.customerLng}
              customerAddress={data.customerAddress}
              technicianName={data.technician?.name || "Technician"}
              isTraveling={isEnRoute}
              isUrdu={isUrdu}
            />
          </div>

          {/* ON-SITE INSPECTION REPORT (Rendered ONLY when inside premises or inspection done) */}
          {data.inspection && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#123B5D]">
                      {isUrdu ? "آن سائٹ معائنہ رپورٹ" : "On-Site Diagnostic Report"}
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      {isUrdu ? "کاریگر کی جانب سے جمع کردہ رپورٹ" : "Submitted by assigned technician"}
                    </span>
                  </div>
                </div>

                {data.inspection.submittedAt && (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {formatJobDate(data.inspection.submittedAt)}
                  </span>
                )}
              </div>

              {/* Diagnosis Finding */}
              {data.inspection.diagnosis ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-[#123B5D] block">
                    {isUrdu ? "تشخیص و نقص کی تفصیل:" : "Diagnosis & Fault Inspection:"}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {data.inspection.diagnosis}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                  {isUrdu
                    ? "کاریگر اس وقت احاطے کے اندر خرابی کا معائنہ کر رہا ہے۔ تفصیلی رپورٹ جلد دستیاب ہوگی۔"
                    : "Technician is on-site inspecting the issue. The diagnostic report will appear here once submitted."}
                </div>
              )}

              {/* Repair Plan */}
              {data.inspection.repairPlan && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-xs font-bold text-[#123B5D] block">
                    {isUrdu ? "تجویز کردہ مرمتی منصوبہ:" : "Proposed Repair Plan:"}
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {data.inspection.repairPlan}
                  </p>
                </div>
              )}

              {/* Estimated Repair Time */}
              {data.inspection.estimatedRepairTimeMin && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="size-4 text-[#0F766E]" />
                  <span>
                    {isUrdu ? "متوقع وقت: " : "Estimated repair duration: "}
                    <strong className="text-[#123B5D]">
                      {data.inspection.estimatedRepairTimeMin} {isUrdu ? "منٹ" : "mins"}
                    </strong>
                  </span>
                </div>
              )}

              {/* Inspection Photos (if uploaded by technician) */}
              {data.inspection.inspectionPhotos && data.inspection.inspectionPhotos.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
                    <ImageIcon className="size-3.5 text-[#0F766E]" />
                    <span>{isUrdu ? "معائنہ کی تصاویر" : "Inspection Photos"}</span>
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {data.inspection.inspectionPhotos.map((photoUrl, pIdx) => (
                      <div
                        key={pIdx}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoUrl}
                          alt={`Inspection photo ${pIdx + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TECHNICIAN INFO + VISIT DETAILS + SAFETY (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* C. TECHNICIAN INFORMATION CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isUrdu ? "متعین کردہ کاریگر" : "Assigned Technician"}
              </h3>
              {data.technician ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F766E] bg-[#0F766E]/10 px-2 py-0.5 rounded-full">
                  <UserCheck className="size-3" />
                  <span>{isUrdu ? "مقرر شدہ" : "Confirmed"}</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {isUrdu ? "زیر التواء" : "Pending"}
                </span>
              )}
            </div>

            {data.technician ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <div className="size-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-2 ring-[#0F766E]/20 bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                      {data.technician.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={data.technician.avatarUrl}
                          alt={data.technician.name}
                          width={56}
                          height={56}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.technician?.name || "Tech")}&background=0F766E&color=fff`;
                          }}
                        />
                      ) : (
                        <span className="text-base font-bold text-[#0F766E]">
                          {data.technician.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-[#123B5D] truncate">
                        {isUrdu ? (data.technician.nameUr ?? data.technician.name) : data.technician.name}
                      </h4>
                      {data.technician.hunarBadgeId && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#0F766E]/10 text-[#0F766E]"
                          title="Verified Badge"
                        >
                          <ShieldCheck className="size-3" />
                          {data.technician.hunarBadgeId}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-medium truncate">
                      {isUrdu
                        ? (data.technician.businessNameUr ?? data.technician.businessName)
                        : data.technician.businessName}
                    </p>

                    {data.technician.rating !== null && data.technician.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 pt-0.5">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-amber-600">
                          {data.technician.rating.toFixed(1)}
                        </span>
                        {data.technician.totalReviews !== null && data.technician.totalReviews > 0 && (
                          <span className="text-slate-400">
                            ({data.technician.totalReviews})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Actions (Only if technician data available) */}
                <div className="flex items-center gap-2 pt-1">
                  {data.technician.phone ? (
                    <a
                      href={`tel:${data.technician.phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-98"
                    >
                      <Phone className="size-3.5" />
                      <span>{isUrdu ? "کال کریں" : "Call"}</span>
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border border-[#0F766E] hover:bg-[#0F766E]/5 text-[#0F766E] text-xs font-bold transition-all cursor-pointer active:scale-98"
                  >
                    <MessageSquare className="size-3.5" />
                    <span>{isUrdu ? "پیغام بھیجیں" : "Message"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isUrdu
                    ? "اس جاب کے لیے کاریگر کا تقرر ابھی عمل میں لایا جا رہا ہے۔ پیشکشیں قبول ہوتے ہی کاریگر کی تفصیلات یہاں دکھائی دیں گی۔"
                    : "Technician assignment is in progress. Verified professional credentials will appear here once an offer is confirmed."}
                </p>
                <Link
                  href={`/customer/jobs/${data.jobId}`}
                  className="inline-block text-xs font-bold text-[#0F766E] hover:underline"
                >
                  {isUrdu ? "پیشکشیں دیکھیں ←" : "View Job Offers →"}
                </Link>
              </div>
            )}
          </div>

          {/* E. VISIT DETAILS CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
              {isUrdu ? "وزٹ کی تفصیلات" : "Visit Details"}
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Job Title & Category */}
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                  <Wrench className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {isUrdu ? "سروس کا عنوان" : "Service Requested"}
                  </span>
                  <p className="font-bold text-[#123B5D] leading-tight mt-0.5">
                    {data.jobTitle}
                  </p>
                </div>
              </div>

              {/* Scheduled Date & Time Slot */}
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                  <Calendar className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {isUrdu ? "شیڈول وقت اور تاریخ" : "Scheduled Date & Time"}
                  </span>
                  <p className="font-bold text-[#123B5D] leading-tight mt-0.5">
                    {data.scheduledDate ? formatJobDate(data.scheduledDate) : "To be scheduled"}
                    {data.scheduledTimeSlot ? ` • ${data.scheduledTimeSlot}` : ""}
                  </p>
                </div>
              </div>

              {/* Visit Charges */}
              {data.visitCharges !== null && (
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="font-bold text-xs">Rs</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      {isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Charge"}
                    </span>
                    <p className="font-extrabold text-[#0F766E] text-sm mt-0.5">
                      {formatRs(data.visitCharges)}
                    </p>
                  </div>
                </div>
              )}

              {/* Service Address */}
              {data.customerAddress && (
                <div className="flex items-start gap-3 pt-1 border-t border-slate-100">
                  <div className="size-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <MapPin className="size-4 text-[#0F766E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      {isUrdu ? "سروس کا پتہ" : "Service Address"}
                    </span>
                    <p className="font-semibold text-[#123B5D] leading-relaxed mt-0.5">
                      {data.customerAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* F. DOORSTEP SAFETY & TRUST CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="size-9 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#123B5D]">
                  {isUrdu ? "ڈور سٹیپ حفاظتی رہنمائی" : "Doorstep Safety Checklist"}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isUrdu ? "احاطے میں داخلے سے پہلے تصدیق کریں" : "Verify before granting home entrance"}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#123B5D] block">
                    {isUrdu ? "1. شناختی تصویر اور بیج چیک کریں" : "1. Match Identity & Badge"}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu
                      ? "یقینی بنائیں کہ کاریگر کا چہرہ اور ہنر شناختی کارڈ ایپ کی معلومات سے مطابقت رکھتا ہے۔"
                      : "Confirm technician face matches the profile picture and verified badge shown above."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#123B5D] block">
                    {isUrdu ? "2. دہلیز PIN کوڈ لازمی مانگیں" : "2. Demand Doorstep PIN"}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu
                      ? "دروازہ کھولنے سے پہلے کاریگر سے 4 ہندسوں کا دہلیز PIN کوڈ طلب کر کے ایپ میں درج کریں۔"
                      : "Ask the technician for their 4-digit Doorstep PIN to authenticate entry."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#123B5D] block">
                    {isUrdu ? "3. آن سائٹ معائنہ اور تسلی" : "3. On-Site Quality Check"}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu
                      ? "کاریگر کے کام کی تسلی کرنے کے بعد ہی ادائیگی کی تصدیق کریں۔"
                      : "Inspect and confirm satisfaction with the visit before concluding service."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Doorstep Arrival OTP Modal - Loaded dynamically on demand */}
      {isOtpModalOpen && (
        <CustomerArrivalOtpModal
          isOpen={isOtpModalOpen}
          session={arrivalSession}
          jobId={jobId || arrivalSession?.jobId}
          onSuccess={() => {
            setIsOtpModalOpen(false);
            setArrivalSession(null);
            arrivalService.clearArrivalSession();
            setUserDismissedModal(true);
            void fetchTracking(true);
          }}
          onClose={() => {
            setIsOtpModalOpen(false);
            setUserDismissedModal(true);
          }}
          isUrdu={isUrdu}
        />
      )}

      {/* Quick In-Page Chat Drawer */}
      {isChatOpen && (
        <QuickChatDrawer
          visit={chatVisit}
          isOpen={true}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}
