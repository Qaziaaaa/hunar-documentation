"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  CheckCircle2,
  Plus,
  Shield,
  UserCheck,
} from "lucide-react";
import {
  MOCK_ACTIVE_TICKET,
  MOCK_CUSTOMER_JOBS,
  MOCK_FAQS,
  MOCK_HELPLINE_INFO,
} from "../data/mock-help-data";
import { SupportTicket } from "../types";
import { ActiveCaseCard } from "./active-case-card";
import { FaqAccordion } from "./faq-accordion";
import { HelplineCard } from "./helpline-card";
import { SubmitTicketModal } from "./submit-ticket-modal";

export function CustomerHelpView() {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [faqs] = useState(MOCK_FAQS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(
    MOCK_ACTIVE_TICKET
  );
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTicketCreated = (newTicket: SupportTicket) => {
    setActiveTicket(newTicket);
    setToastMessage(
      isUrdu
        ? `سپورٹ ٹکٹ #${newTicket.caseNumber} کامیابی سے درج ہو گیا!`
        : `Support Ticket #${newTicket.caseNumber} registered successfully!`
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 bg-[#123B5D] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="size-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="size-5 rounded-full hover:bg-white/20 flex items-center justify-center text-xs ml-2 rtl:ml-0 rtl:mr-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full">

        {/* Header & Main Page Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 rtl:text-right">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>{isUrdu ? "کسٹمر ہب" : "Customer Hub"}</span>
              <span>/</span>
              <span className="text-[#123B5D] font-bold">
                {isUrdu ? "مدد اور عمومی سوالات" : "Help & FAQs"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D] tracking-tight">
              {isUrdu
                ? "کسٹمر ہیلپ سینٹر اور سپورٹ ہب"
                : "Customer Help Center & Support Hub"}
            </h1>
          </div>

          {/* Primary Modal Action */}
          <button
            type="button"
            onClick={() => setIsTicketModalOpen(true)}
            className="self-start sm:self-auto h-11 px-5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer shrink-0"
          >
            <Plus className="size-4" />
            <span>{isUrdu ? "سپورٹ ٹکٹ درج کریں" : "Open Support Ticket"}</span>
          </button>
        </div>

        {/* Active Support Case / Dispute Tracker (if any active) */}
        {activeTicket && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse"></span>
                <h2 className="text-sm font-bold text-[#123B5D]">
                  {isUrdu ? "زیرِ کارروائی سپورٹ کیس" : "Active Support Case In Progress"}
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">
                {isUrdu ? "آپریشنز مصالحتی ڈیسک" : "Operations Mediation Desk"}
              </span>
            </div>
            <ActiveCaseCard ticket={activeTicket} />
          </div>
        )}

        {/* 2-Column Main Section: FAQ Accordion & Right Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Left Column: Interactive FAQ Accordion */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <FaqAccordion
              faqs={faqs}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Doorstep Checklist / Trust Card */}
            <div className="bg-slate-50 rounded-2xl p-5 sm:p-6 border border-slate-200 flex flex-col gap-4 rtl:text-right">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-[#0F8B8D] text-white flex items-center justify-center shrink-0">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123B5D]">
                    {isUrdu
                      ? "WorkerFIX کسٹمر اطمینان کے 4 بنیادی اصول"
                      : "WorkerFIX Customer Peace of Mind Checklist"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu
                      ? "ہر ہوم سروس بکنگ کے لیے آسان ہدایات"
                      : "4 easy steps for every home service booking"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="font-bold text-[#123B5D] block">
                      {isUrdu ? "4 ہندسوں کے PIN کی تصدیق" : "Verify 4-Digit PIN"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isUrdu
                        ? "کاریگر کے پہنچنے پر چیک کریں کہ وہ آپ کا منفرد سیکیورٹی کوڈ بتائے۔"
                        : "Check that the technician provides your unique booking Safety PIN upon arrival."}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span className="font-bold text-[#123B5D] block">
                      {isUrdu ? "300 روپے وزٹ فیس + کوٹیشن" : "Rs. 300 Visit Fee + Quote"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isUrdu
                        ? "300 روپے معائنہ فیس طے شدہ ہے، پھر کام شروع ہونے سے قبل مکمل کوٹیشن منظور کریں۔"
                        : "Pay Rs. 300 inspection baseline, then approve fixed quote before repair begins."}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <span className="font-bold text-[#123B5D] block">
                      {isUrdu ? "ادائیگی سے قبل تسلی" : "Inspect Before Payment"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isUrdu
                        ? "براہِ راست ادائیگی کرنے سے قبل مرمت شدہ چیز کو تسلی سے چیک کریں۔"
                        : "Inspect the fixed appliance or fixture thoroughly before handing over direct payment."}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <span className="font-bold text-[#123B5D] block">
                      {isUrdu ? "5 روزہ وارنٹی فعال" : "5-Day Warranty Active"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {isUrdu
                        ? "5 دنوں کے اندر دوبارہ خرابی کی صورت میں WorkerFIX بلا معاوضہ کاریگر بھیجے گا۔"
                        : "Any recurring fault within 5 days is resolved free of charge by WorkerFIX."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 24/7 Helpline Card + Local Mediation Info */}
          <div className="lg:col-span-4 flex flex-col gap-6 sticky top-20 rtl:text-right">
            <HelplineCard
              info={MOCK_HELPLINE_INFO}
              onOpenTicketModal={() => setIsTicketModalOpen(true)}
            />

            {/* Verified Safety & Support Note */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-[#123B5D] text-white flex items-center justify-center shrink-0">
                <UserCheck className="size-5 text-[#0F8B8D]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "100% فیلڈ نگران نگرانی" : "100% Field-Mediated Resolution"}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isUrdu
                    ? "تجربہ کار تکنیکی نگران جو بجلی، پلمبنگ اور ہوم سروسز کے مسائل بخوبی سمجھتے ہیں۔"
                    : "Experienced technical supervisors who understand home electrical, HVAC, and plumbing infrastructure."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Support Ticket Creation Modal */}
      <SubmitTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        jobOptions={MOCK_CUSTOMER_JOBS}
        onSubmitSuccess={handleTicketCreated}
      />
    </div>
  );
}

