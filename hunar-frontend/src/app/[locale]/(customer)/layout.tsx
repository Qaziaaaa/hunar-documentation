"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { CustomerBottomNav } from "@/features/customer-dashboard/components/customer-bottom-nav";
import { CustomerHeader } from "@/features/customer-dashboard/components/customer-header";
import { CustomerSidebar } from "@/features/customer-dashboard/components/customer-sidebar";
import dynamic from "next/dynamic";

import { CustomerArrivalOtpModal } from "@/features/customer-visits/components/customer-arrival-otp-modal";
import { useQueryClient } from "@tanstack/react-query";
import type { CustomerJob } from "@/features/customer-jobs/types";
import { customerReviewService } from "@/features/customer-jobs/services/customer-review-service";
const CustomerRepairQuoteModal = dynamic(
  () =>
    import(
      "@/features/customer-jobs/components/customer-repair-quote-modal"
    ).then((m) => m.CustomerRepairQuoteModal),
  { ssr: false }
);
const CustomerReviewModal = dynamic(
  () =>
    import(
      "@/features/customer-jobs/components/customer-review-modal"
    ).then((m) => m.CustomerReviewModal),
  { ssr: false }
);
import {
  customerQuoteService,
  type PendingRepairQuote,
} from "@/features/customer-jobs/services/customer-quote-service";
import {
  arrivalService,
  SUCCESS_VERIFICATION_MESSAGE,
  SUCCESS_VERIFICATION_MESSAGE_UR,
  type ArrivalSession,
} from "@/features/jobs/services/arrival-verification-service";
import { CustomerRealtimeSync } from "@/features/customer-dashboard/components/customer-realtime-sync";
import { CustomerSearchProvider } from "@/features/customer-dashboard/components/customer-search-context";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [arrivalSession, setArrivalSession] = useState<ArrivalSession | null>(null);
  const [isArrivalOtpOpen, setIsArrivalOtpOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastToastRef = useRef<{ msg: string; time: number }>({ msg: "", time: 0 });

  const showSuccessToast = (msg: string) => {
    const now = Date.now();
    // Guard against identical notification triggering twice within 3 seconds
    if (lastToastRef.current.msg === msg && now - lastToastRef.current.time < 3000) {
      return;
    }
    lastToastRef.current = { msg, time: now };

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setSuccessToast(msg);
    toastTimerRef.current = setTimeout(() => {
      setSuccessToast(null);
      toastTimerRef.current = null;
    }, 6000);
  };

  // Mandatory Repair Quote Modal state
  const [activeQuote, setActiveQuote] = useState<PendingRepairQuote | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Review & Rating Modal state for completed jobs
  const queryClient = useQueryClient();
  const [reviewJob, setReviewJob] = useState<CustomerJob | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    // Check if an arrival session is currently pending on mount
    const current = arrivalService.getSession();
    if (current && current.status === "pending_otp") {
      setArrivalSession(current);
      setIsArrivalOtpOpen(true);

      // Validate in background that the job is not cancelled/completed
      void arrivalService.validateActiveSession().then((isValid) => {
        if (!isValid) {
          setIsArrivalOtpOpen(false);
          setArrivalSession(null);
        }
      });
    }

    // Also verify with backend /visits/my to clear stale session if cancelled or past arrival
    void arrivalService.checkBackendPendingArrival().then((backendSession) => {
      if (backendSession && backendSession.status === "pending_otp") {
        setArrivalSession(backendSession);
        setIsArrivalOtpOpen(true);
      } else {
        setIsArrivalOtpOpen(false);
        setArrivalSession(null);
      }
    });

    const unsubscribeArrival = arrivalService.subscribe((session, eventType) => {
      if (eventType === "ARRIVAL_STARTED" && session && session.status === "pending_otp") {
        setArrivalSession(session);
        setIsArrivalOtpOpen(true);
      } else if (eventType === "OTP_VERIFIED" || session?.status === "otp_verified") {
        setIsArrivalOtpOpen(false);
        const msg = isUrdu ? SUCCESS_VERIFICATION_MESSAGE_UR : SUCCESS_VERIFICATION_MESSAGE;
        showSuccessToast(msg);
      } else if (eventType === "SESSION_CLEARED") {
        setIsArrivalOtpOpen(false);
        setArrivalSession(null);
      }
    });

    // Check if a repair quote is currently pending on mount
    const currentQuote = customerQuoteService.getActiveQuote();
    if (currentQuote && (currentQuote.status === "PROPOSED" || currentQuote.status === "COUNTERED")) {
      setActiveQuote(currentQuote);
      setIsQuoteModalOpen(true);
    }


    const unsubscribeQuote = customerQuoteService.subscribe((quote, eventType) => {
      if (eventType === "PROPOSED" && quote) {
        setActiveQuote(quote);
        setIsQuoteModalOpen(true);
      } else if (eventType === "DECIDED" || eventType === "CLEARED") {
        setIsQuoteModalOpen(false);
        setActiveQuote(null);
      }
    });

    // Check if a review prompt is currently active
    const currentReviewJob = customerReviewService.getActiveJob();
    if (currentReviewJob && customerReviewService.isOpen()) {
      setReviewJob(currentReviewJob);
      setIsReviewModalOpen(true);
    }

    const unsubscribeReview = customerReviewService.subscribe((job, isOpen) => {
      setReviewJob(job);
      setIsReviewModalOpen(isOpen);
    });

    return () => {
      unsubscribeArrival();
      unsubscribeQuote();
      unsubscribeReview();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [isUrdu]);

  const handleOtpVerified = (msg: string) => {
    setIsArrivalOtpOpen(false);
    setArrivalSession(null);
    arrivalService.clearArrivalSession();
    showSuccessToast(msg);
  };

  const handleQuoteDecision = (decision: "ACCEPTED" | "REJECTED", msg: string) => {
    setIsQuoteModalOpen(false);
    setActiveQuote(null);
    showSuccessToast(msg);
  };

  // If in Post-a-Job wizard, display full-screen focused layout
  if (pathname.includes("/customer/post-job")) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
        <CustomerRealtimeSync />
        {children}
      </div>
    );
  }

  const isChat = pathname.includes("/customer/chat");
  const isTrackingPage = pathname.includes("/tracking");

  return (
    <CustomerSearchProvider>
      <div
        data-portal="customer"
        className={`min-h-screen ${isChat ? "h-[100dvh] overflow-hidden" : ""} bg-white text-slate-900 font-sans antialiased scrollbar-none no-scrollbar`}
      >
        <CustomerRealtimeSync />
        {/* Desktop Sidebar & Mobile Drawer */}
        <CustomerSidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area - uses logical padding-inline-start (ps) for auto LTR / RTL mirroring */}
        <div className={`w-full lg:ps-[260px] ${isChat ? "h-[100dvh] overflow-hidden pb-0" : "min-h-screen pb-24 lg:pb-0"} flex flex-col bg-white`}>
          {/* Minimal Header with Sidebar Toggle (Hidden on mobile chat for full WhatsApp view) */}
          <div className={isChat ? "hidden lg:block shrink-0" : "shrink-0"}>
            <CustomerHeader onOpenSidebar={() => setMobileMenuOpen((prev) => !prev)} />
          </div>

          {/* Page Content */}
          <main className={`w-full flex-1 bg-white flex flex-col items-stretch ${isChat ? "overflow-hidden min-h-0" : ""}`}>
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar (Home | Jobs | + Post | Messages | Me) */}
        <CustomerBottomNav />

        {/* Premises Entry Success Toast Notification */}
        {successToast && (
          <div className="fixed top-5 inset-x-4 z-50 max-w-lg mx-auto bg-[#0F766E] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 border border-teal-400/40">
            <CheckCircle2 className="size-6 text-emerald-300 shrink-0" />
            <p className="text-xs sm:text-sm font-extrabold leading-snug">{successToast}</p>
          </div>
        )}

        {/* Customer Doorstep Arrival OTP Modal - Loaded dynamically on demand across customer portal */}
        {isArrivalOtpOpen && !isTrackingPage && (
          <CustomerArrivalOtpModal
            isOpen={isArrivalOtpOpen}
            session={arrivalSession}
            jobId={arrivalSession?.jobId}
            onSuccess={handleOtpVerified}
            onClose={() => {
              setIsArrivalOtpOpen(false);
              setArrivalSession(null);
            }}
            isUrdu={isUrdu}
          />
        )}

        {/* Mandatory Customer Repair Quote Approval Modal - Loaded dynamically on demand */}
        {isQuoteModalOpen && (
          <CustomerRepairQuoteModal
            isOpen={isQuoteModalOpen}
            quote={activeQuote}
            onDecision={handleQuoteDecision}
            isUrdu={isUrdu}
          />
        )}

        {/* Mandatory / Realtime Review & Rating Modal for Completed Jobs */}
        {isReviewModalOpen && reviewJob && (
          <CustomerReviewModal
            job={reviewJob}
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false);
              customerReviewService.dismissReview(reviewJob.id);
            }}
            onReviewSubmitted={(review) => {
              setIsReviewModalOpen(false);
              customerReviewService.completeReview(reviewJob.id, review);
              void queryClient.invalidateQueries({ queryKey: ["customer"] });
              void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });
              void queryClient.invalidateQueries({ queryKey: ["customer", "job", reviewJob.id] });
              const msg = isUrdu
                ? "بہت شکریہ! آپ کا ریویو اور ریٹنگ کامیابی سے درج ہو گئی ہے۔"
                : "Thank you! Your rating and review have been submitted successfully.";
              showSuccessToast(msg);
            }}
          />
        )}
      </div>
    </CustomerSearchProvider>
  );
}
