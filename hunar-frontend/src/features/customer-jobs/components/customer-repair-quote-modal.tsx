"use client";

import { useEffect, useState } from "react";
import {
  Wrench,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Phone,
  Info,
} from "lucide-react";
import { formatRs } from "@/lib/design-tokens";
import {
  acceptRepairEstimate,
  rejectRepairEstimate,
} from "@/features/customer-jobs/api/customer-repair-api";
import {
  customerQuoteService,
  type PendingRepairQuote,
} from "../services/customer-quote-service";

interface CustomerRepairQuoteModalProps {
  isOpen: boolean;
  quote: PendingRepairQuote | null;
  onDecision: (decision: "ACCEPTED" | "REJECTED", message: string) => void;
  isUrdu?: boolean;
}

export function CustomerRepairQuoteModal({
  isOpen,
  quote,
  onDecision,
  isUrdu = false,
}: CustomerRepairQuoteModalProps) {
  const [isProcessing, setIsProcessing] = useState<"ACCEPT" | "REJECT" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mandatory modal: Prevent dismissal by ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  if (!isOpen || !quote) return null;

  const handleAccept = async () => {
    try {
      setIsProcessing("ACCEPT");
      setErrorMessage(null);
      await acceptRepairEstimate(quote.repairId || quote.jobId);
      customerQuoteService.clearQuoteSession();
      onDecision(
        "ACCEPTED",
        isUrdu
          ? "مرمت کا تخمینہ قبول کر لیا گیا۔ کاریگر کو کام شروع کرنے کا پیغام بھیج دیا گیا ہے۔"
          : "Repair quote accepted! The technician has been notified to proceed with the repair work."
      );
    } catch (err: any) {
      console.error("[CustomerRepairQuoteModal] accept error:", err);
      setErrorMessage(
        err?.message ||
          (isUrdu
            ? "منظور کرنے میں خرابی پیش آگئی۔ دوبارہ کوشش کریں۔"
            : "Failed to accept quote. Please try again.")
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing("REJECT");
      setErrorMessage(null);
      await rejectRepairEstimate(quote.repairId || quote.jobId);
      customerQuoteService.clearQuoteSession();
      onDecision(
        "REJECTED",
        isUrdu
          ? "مرمت کا تخمینہ مسترد کر دیا گیا۔ صرف طے شدہ تشخیصی وزٹ فیس لاگو ہو گی۔"
          : "Repair quote declined. Only the diagnostic visit fee will be applicable upon visit completion."
      );
    } catch (err: any) {
      console.error("[CustomerRepairQuoteModal] reject error:", err);
      setErrorMessage(
        err?.message ||
          (isUrdu
            ? "رد کرنے میں خرابی پیش آگئی۔ دوبارہ کوشش کریں۔"
            : "Failed to reject quote. Please try again.")
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const visitFee = quote.visitCharge || 0;
  const repairAmount = quote.amount || 0;
  const totalPayable = visitFee + repairAmount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="repair-quote-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in-50 duration-200 select-none"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      onClick={(e) => {
        // Mandatory behavior: prevent dismissal on backdrop click
        e.stopPropagation();
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-[#123B5D] animate-in zoom-in-95 duration-200 border border-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header — Clean white surface matching CustomerPortal modals */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0">
              <Wrench className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  id="repair-quote-modal-title"
                  className="font-extrabold text-base sm:text-lg text-[#123B5D]"
                >
                  {isUrdu ? "مرمت کا تخمینہ" : "Repair Quote"}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 uppercase tracking-wide">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{isUrdu ? "فیصلہ مطلوب ہے" : "Decision Required"}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isUrdu
                  ? "کاریگر کے پیش کردہ کام اور لاگت کا جائزہ لیں"
                  : "Review the technician's proposed repair and cost"}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content Body — Scrollbar hidden completely */}
        <div
          className="p-5 sm:p-6 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-3.5 max-h-[calc(90vh-140px)]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Job Reference Badge */}
          {quote.jobTitle && (
            <div className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="font-semibold text-slate-500 text-[11px]">
                {isUrdu ? "سروس کی درخواست:" : "Service Request:"}
              </span>
              <span className="font-bold text-[#123B5D] truncate max-w-[240px]">
                {quote.jobTitle}
              </span>
            </div>
          )}

          {/* Technician Field Profile Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-[#123B5D]/10 text-[#123B5D] font-bold text-sm flex items-center justify-center border border-slate-200 shrink-0">
                {quote.workerName ? quote.workerName.charAt(0).toUpperCase() : "W"}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-[#123B5D]">
                    {quote.workerName || (isUrdu ? "مقررہ کاریگر" : "Assigned Technician")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/80">
                    <ShieldCheck className="size-3 text-emerald-600" />
                    <span>{isUrdu ? "تصدیق شدہ" : "Verified Pro"}</span>
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {isUrdu ? "موقع پر موجود کاریگر" : "On-Site Diagnostic Specialist"}
                </span>
              </div>
            </div>

            {quote.workerPhone && (
              <a
                href={`tel:${quote.workerPhone}`}
                className="size-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[#0F8B8D] hover:bg-teal-50 transition-colors shadow-2xs"
                title={isUrdu ? "کال کریں" : "Call Worker"}
              >
                <Phone className="size-3.5" />
              </a>
            )}
          </div>

          {/* Repair Details & Description */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              {isUrdu ? "مطلوبہ مرمتی کام کی تفصیل:" : "Description of Proposed Repair:"}
            </span>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-medium">
              {quote.description ||
                (isUrdu
                  ? "معائنہ کے بعد درکار فنی مرمت کا کام۔"
                  : "Standard technical repair as verified during on-site inspection.")}
            </div>
          </div>

          {/* Itemized Cost Breakdown Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5">
            {/* Diagnostic Visit Fee */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                {isUrdu ? "طے شدہ تشخیصی وزٹ فیس" : "Diagnostic Visit Fee"}
              </span>
              <span className="font-bold text-slate-800 font-mono">{formatRs(visitFee)}</span>
            </div>

            {/* Proposed Repair Cost */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0F8B8D] flex items-center gap-1.5">
                <Wrench className="size-3.5" />
                <span>{isUrdu ? "مرمت لاگت (سامان و لیبر)" : "Proposed Repair Cost"}</span>
              </span>
              <span className="font-extrabold text-sm text-[#0F8B8D] font-mono">
                {formatRs(repairAmount)}
              </span>
            </div>

            {/* Total Payable if Approved */}
            <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#123B5D] block">
                  {isUrdu ? "منظوری کی صورت میں کل رقم:" : "Total Payable if Approved:"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isUrdu ? "وزٹ فیس + مرمت لاگت" : "Visit Fee + Repair Cost"}
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-[#123B5D] font-mono">
                {formatRs(totalPayable)}
              </span>
            </div>
          </div>

          {/* Conditional Notice Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
            <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {isUrdu
                ? "اگر آپ مرمت مسترد کرتے ہیں تو صرف تشخیصی وزٹ فیس ادا کرنی ہوگی۔ کوئی اضافی مرمت کا خرچ شامل نہیں ہوگا۔"
                : "If you decline, only the agreed diagnostic visit fee is due. No repair work or extra charges will be billed."}
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="px-5 sm:px-6 py-4 bg-white border-t border-slate-100 flex items-center gap-3">
          {/* Reject Button — Matches Destructive Action Pattern in Customer App */}
          <button
            type="button"
            disabled={isProcessing !== null}
            onClick={handleReject}
            className="flex-1 h-11 px-4 rounded-xl border border-red-200 bg-white hover:bg-red-50 active:bg-red-100 text-red-600 hover:text-red-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === "REJECT" ? (
              <span className="inline-flex items-center gap-1.5 animate-pulse text-xs">
                <span>{isUrdu ? "مسترد ہو رہا ہے..." : "Declining..."}</span>
              </span>
            ) : (
              <>
                <XCircle className="size-4 text-red-600" />
                <span>{isUrdu ? "مرمت مسترد کریں" : "Reject Repair"}</span>
              </>
            )}
          </button>

          {/* Accept Button — Matches Primary Brand Button (#0F8B8D) in Customer App */}
          <button
            type="button"
            disabled={isProcessing !== null}
            onClick={handleAccept}
            className="flex-1 h-11 px-5 rounded-xl bg-[#0F8B8D] hover:bg-[#0D7A7C] active:scale-98 text-white text-xs sm:text-sm font-bold shadow-sm shadow-[#0F8B8D]/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing === "ACCEPT" ? (
              <span className="inline-flex items-center gap-1.5 animate-pulse text-xs">
                <span>{isUrdu ? "منظور ہو رہا ہے..." : "Approving..."}</span>
              </span>
            ) : (
              <>
                <CheckCircle2 className="size-4 text-white" />
                <span>{isUrdu ? "مرمت منظور کریں" : "Accept Quote"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
