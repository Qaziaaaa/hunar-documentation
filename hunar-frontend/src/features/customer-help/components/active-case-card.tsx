"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  Lock,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";
import { SupportTicket } from "../types";

interface ActiveCaseCardProps {
  ticket: SupportTicket;
}

export function ActiveCaseCard({ ticket }: ActiveCaseCardProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [showLogModal, setShowLogModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden rtl:text-right">
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

        {/* Case Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-base sm:text-lg font-bold text-[#123B5D]">
                {isUrdu ? `کیس #${ticket.caseNumber}` : `Case #${ticket.caseNumber}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                {isUrdu ? "آپریشنز جائزہ جاری" : ticket.statusLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isUrdu ? "جاب" : "Job"}{" "}
              <strong className="text-slate-800">{ticket.jobReference}</strong> •{" "}
              {ticket.serviceTitle} • {isUrdu ? "کاریگر:" : "Assigned:"}{" "}
              <strong className="text-slate-800 font-semibold">{ticket.workerName}</strong>
            </p>
          </div>

          <div className="flex items-baseline sm:flex-col sm:items-end gap-1.5 sm:gap-0 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              {isUrdu ? "حل کا متوقع وقت" : "Resolution ETA"}
            </span>
            <span className="text-xs sm:text-sm text-amber-700 font-extrabold">
              {isUrdu ? "20 منٹ کے اندر" : ticket.estimatedResolutionTime}
            </span>
          </div>
        </div>

        {/* Incident Summary Box */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
              <ShieldAlert className="size-4 text-amber-600 shrink-0" />
              <span>
                {isUrdu ? `رپورٹ کردہ مسئلہ: ${ticket.issueTitle}` : `Reported: ${ticket.issueTitle}`}
              </span>
            </span>
            <span className="text-[11px] font-semibold text-[#0F8B8D]">
              {isUrdu ? "کسٹمر پراپرٹی، پشاور" : ticket.location}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed italic">
            “{ticket.description}”
          </p>
        </div>

        {/* Investigation Progress Timeline */}
        <div className="pt-1">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-3">
            {isUrdu ? "تحقیقاتی پیش رفت اور اقدامات" : "Investigation Progress & Actions"}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {ticket.timeline.map((step, idx) => {
              const isDone = step.status === "completed";
              const isCurrent = step.status === "current";

              return (
                <div key={idx} className="flex sm:flex-col items-start gap-2.5">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-amber-100 text-amber-700 border-2 border-amber-500"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-4" />
                    ) : isCurrent ? (
                      <Clock className="size-4 animate-spin" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex flex-col rtl:text-right">
                    <span
                      className={`text-xs font-semibold ${
                        isDone || isCurrent ? "text-[#123B5D]" : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {step.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Guarantee & Case Log Modal Trigger */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <UserCheck className="size-4 text-[#0F8B8D] shrink-0" />
            <span>
              {isUrdu
                ? "WorkerFIX آپریشنز سپروائزر اس معاملے میں کاریگر کے ساتھ براہ راست رابطہ کر رہا ہے۔"
                : "WorkerFIX operations supervisor is mediating this case directly with the technician."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-[#123B5D] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <MessageSquare className="size-3.5 text-[#0F8B8D]" />
            <span>
              {isUrdu
                ? `سرگرمی لاگ (${ticket.notesCount || 3})`
                : `Case Activity Log (${ticket.notesCount || 3})`}
            </span>
          </button>
        </div>
      </div>

      {/* Case Activity Log Modal */}
      {showLogModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 rtl:text-right">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-[#0F8B8D]" />
                <h3 className="text-sm font-bold text-[#123B5D]">
                  {isUrdu
                    ? `کیس #${ticket.caseNumber} • سرگرمی لاگ`
                    : `Case #${ticket.caseNumber} • Activity Log`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                aria-label="Close"
                className="size-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-3 text-xs">
                {/* Note 1 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                    <span className="font-bold text-[#123B5D]">
                      {isUrdu ? "آپریشنز سپورٹ ڈیسک" : "Operations Support Desk"}
                    </span>
                    <span>{isUrdu ? "آج • 03:22 PM" : "Today • 03:22 PM"}</span>
                  </div>
                  <p className="text-slate-700">
                    {isUrdu
                      ? "“کیس کھول دیا گیا۔ کاریگر راشد علی سے رابطہ کیا گیا۔ کاریگر نے تصدیق کی کہ وہ بغیر کسی اضافی چارج کے آج شام 4:30 بجے دوبارہ کسٹمر کے گھر پہنچ کر لیکیج کا مکمل حل کرے گا۔”"
                      : "“Case opened. Contacted technician Rashid Ali. Technician confirmed availability to revisit the customer property today at 4:30 PM for seal resealing and fixture test at no extra charge.”"}
                  </p>
                </div>

                {/* Note 2 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                    <span className="font-bold text-[#123B5D]">
                      {isUrdu ? "سسٹم نوٹیفکیشن" : "System Notification"}
                    </span>
                    <span>{isUrdu ? "آج • 03:16 PM" : "Today • 03:16 PM"}</span>
                  </div>
                  <p className="text-slate-700">
                    {isUrdu
                      ? "“ڈسپیوٹ 5 روزہ کاریگری وارنٹی کے تحت رجسٹر کیا گیا۔ ترجیح ہائی پر سیٹ کی گئی۔”"
                      : "“Dispute registered under 5-Day Craftsmanship Warranty. Priority escalated to High.”"}
                  </p>
                </div>

                {/* Note 3 */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between text-emerald-800 text-[10px] mb-1">
                    <span className="font-bold">
                      {isUrdu ? "کسٹمر کلیم ریکارڈڈ" : "Customer Claim Recorded"}
                    </span>
                    <span>{isUrdu ? "آج • 03:15 PM" : "Today • 03:15 PM"}</span>
                  </div>
                  <p className="text-emerald-900">
                    {isUrdu
                      ? "“کسٹمر نے ماسٹر باتھ روم وینٹی فٹنگ میں لیکیج کی شکایت جمع کروائی۔ کاریگر سے دوبارہ کام کی درخواست کی گئی۔”"
                      : "“Customer submitted leak report with master bathroom vanity fixture. Requested rework by pro.”"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 bg-[#123B5D] text-white rounded-xl text-xs font-bold hover:bg-[#123B5D]/90 transition-colors cursor-pointer"
              >
                {isUrdu ? "لاگ بند کریں" : "Close Log"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

