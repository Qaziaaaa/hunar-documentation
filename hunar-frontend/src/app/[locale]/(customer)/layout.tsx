"use client";

import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { CustomerBottomNav } from "@/features/customer-dashboard/components/customer-bottom-nav";
import { CustomerHeader } from "@/features/customer-dashboard/components/customer-header";
import { CustomerSidebar } from "@/features/customer-dashboard/components/customer-sidebar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // If in Post-a-Job wizard, display full-screen focused layout
  if (pathname.includes("/customer/post-job")) {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
        {children}
      </div>
    );
  }

  const isChat = pathname.includes("/customer/chat");

  return (
    <div className={`min-h-screen ${isChat ? "h-[100dvh] overflow-hidden" : ""} bg-white text-slate-900 font-sans antialiased`}>
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
    </div>
  );
}
