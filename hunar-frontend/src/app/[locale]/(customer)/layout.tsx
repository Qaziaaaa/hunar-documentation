"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { CustomerBottomNav } from "@/features/customer-dashboard/components/customer-bottom-nav";
import { CustomerHeader } from "@/features/customer-dashboard/components/customer-header";
import { CustomerSidebar } from "@/features/customer-dashboard/components/customer-sidebar";
import { CustomerArrivalOtpModal } from "@/features/customer-visits/components/customer-arrival-otp-modal";
import {
  arrivalService,
  SUCCESS_VERIFICATION_MESSAGE,
  SUCCESS_VERIFICATION_MESSAGE_UR,
  type ArrivalSession,
} from "@/features/jobs/services/arrival-verification-service";
import { CustomerRealtimeSync } from "@/features/customer-dashboard/components/customer-realtime-sync";

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

  useEffect(() => {
    // Check if an arrival session is currently pending on mount
    const current = arrivalService.getSession();
    if (current && current.status === "pending_otp") {
      setArrivalSession(current);
      setIsArrivalOtpOpen(true);
    }

    const unsubscribe = arrivalService.subscribe((session, eventType) => {
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

    return () => unsubscribe();
  }, [isUrdu]);

  const handleOtpVerified = (msg: string) => {
    setIsArrivalOtpOpen(false);
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

  return (
    <div className={`min-h-screen ${isChat ? "h-[100dvh] overflow-hidden" : ""} bg-white text-slate-900 font-sans antialiased`}>
      <CustomerRealtimeSync />
      {/* Desktop Sidebar & Mobile Drawer */}
      <CustomerSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area - uses logical padding-inline-start (ps) for auto LTR / RTL mirroring */}
      <div className={`w-full lg:ps-[260px] ${isChat ? "h-[100dvh] overflow-hidden pb-0" : "min-h-screen pb-16 lg:pb-0"} flex flex-col bg-white`}>
        {/* Minimal Header with Sidebar Toggle (Hidden on mobile chat for full WhatsApp view) */}
        <div className={isChat ? "hidden lg:block shrink-0" : "shrink-0"}>
          <CustomerHeader onOpenSidebar={() => setMobileMenuOpen((prev) => !prev)} />
        </div>

        {/* Page Content */}
        <main className={`w-full flex-1 bg-white ${isChat ? "overflow-hidden flex flex-col min-h-0" : ""}`}>
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

      {/* Customer Doorstep Arrival OTP Modal */}
      <CustomerArrivalOtpModal
        isOpen={isArrivalOtpOpen}
        session={arrivalSession}
        onSuccess={handleOtpVerified}
        onClose={() => setIsArrivalOtpOpen(false)}
        isUrdu={isUrdu}
      />
    </div>
  );
}
