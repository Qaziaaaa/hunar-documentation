"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { CustomerBottomNav } from "@/features/customer-dashboard/components/customer-bottom-nav";
import { CustomerHeader } from "@/features/customer-dashboard/components/customer-header";
import { CustomerSidebar } from "@/features/customer-dashboard/components/customer-sidebar";
import dynamic from "next/dynamic";

import { CustomerArrivalOtpModal } from "@/features/customer-visits/components/customer-arrival-otp-modal";
const CustomerRepairQuoteModal = dynamic(
  () =>
    import(
      "@/features/customer-jobs/components/customer-repair-quote-modal"
    ).then((m) => m.CustomerRepairQuoteModal),
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

  // Mandatory Repair Quote Modal state
  const [activeQuote, setActiveQuote] = useState<PendingRepairQuote | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  useEffect(() => {
    // Check if an arrival session is currently pending on mount
    const current = arrivalService.getSession();
    if (current && current.status === "pending_otp") {
      setArrivalSession(current);
      setIsArrivalOtpOpen(true);
    }

    const unsubscribeArrival = arrivalService.subscribe((session, eventType) => {
      if (eventType === "ARRIVAL_STARTED" && session && session.status === "pending_otp") {
        setArrivalSession(session);
        setIsArrivalOtpOpen(true);
      } else if (eventType === "OTP_VERIFIED" || session?.status === "otp_verified") {
        setIsArrivalOtpOpen(false);
        const msg = isUrdu ? SUCCESS_VERIFICATION_MESSAGE_UR : SUCCESS_VERIFICATION_MESSAGE;
        setSuccessToast(msg);
        setTimeout(() => setSuccessToast(null), 6000);
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

    return () => {
      unsubscribeArrival();
      unsubscribeQuote();
    };
  }, [isUrdu]);

  const handleOtpVerified = (msg: string) => {
    setIsArrivalOtpOpen(false);
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 6000);
  };

  const handleQuoteDecision = (decision: "ACCEPTED" | "REJECTED", msg: string) => {
    setIsQuoteModalOpen(false);
    setActiveQuote(null);
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 6000);
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
      <div className={`min-h-screen ${isChat ? "h-[100dvh] overflow-hidden" : ""} bg-white text-slate-900 font-sans antialiased`}>
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
            onSuccess={handleOtpVerified}
            onClose={() => setIsArrivalOtpOpen(false)}
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
      </div>
    </CustomerSearchProvider>
  );
}
