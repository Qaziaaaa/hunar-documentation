"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  HelpCircle,
  KeyRound,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { arrivalService } from "../services/arrival-verification-service";

interface WorkerArrivalOtpModalProps {
  isOpen: boolean;
  otp: string;
  arrivedAt: number;
  customerName?: string;
  onClose: () => void;
  isUrdu?: boolean;
}

export function WorkerArrivalOtpModal({
  isOpen,
  otp,
  arrivedAt,
  customerName = "Customer",
  onClose,
  isUrdu = false,
}: WorkerArrivalOtpModalProps) {
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - (arrivedAt || Date.now())) / 1000);
    return Math.max(0, 300 - elapsed); // 5 minutes = 300 seconds
  });
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);

  // 5-minute countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (arrivedAt || Date.now())) / 1000);
      const remaining = Math.max(0, 300 - elapsed);
      setSecondsRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, arrivedAt]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isFiveMinutesPassed = secondsRemaining === 0;

  const handleCustomerNotEntering = () => {
    if (!isFiveMinutesPassed) return;
    arrivalService.reportCustomerNotEntering();
    setShowSupportPrompt(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#123B5D]">
                {isUrdu ? "دہلیز کی سیکیورٹی تصدیق" : "Doorstep OTP Verification"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isUrdu
                  ? `${customerName} کی دہلیز پر آمد ریکارڈ ہو گئی`
                  : `Arrived at ${customerName}'s doorstep`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Clear Instructions */}
        <div className="text-center space-y-1.5 pt-1">
          <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
            {isUrdu
              ? "کسٹمر کو یہ 4 ہندسوں کا OTP بتائیں تاکہ وہ اپنی اسکرین پر درج کر سکیں:"
              : "Share this 4-digit OTP with the customer to enter on their screen:"}
          </p>
        </div>

        {/* Big Bold OTP Display Box */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 border-2 border-[#0F8B8D] text-center space-y-2 shadow-inner">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0F8B8D]">
            {isUrdu ? "دہلیز داخلہ PIN" : "Doorstep Entry OTP"}
          </div>

          <div className="flex items-center justify-center gap-3">
            {otp.split("").map((digit, idx) => (
              <span
                key={idx}
                className="size-12 sm:size-14 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center font-mono font-black text-2xl sm:text-3xl text-[#123B5D]"
              >
                {digit}
              </span>
            ))}
          </div>

          <div className="pt-1 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#0F8B8D] hover:border-[#0F8B8D]/40 transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{isUrdu ? "کاپی ہو گیا" : "Copied"}</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-slate-400" />
                  <span>{isUrdu ? "OTP کاپی کریں" : "Copy OTP"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Status Notice */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11.5px] font-semibold text-amber-900">
          <span className="size-2 rounded-full bg-amber-500 animate-ping shrink-0" />
          <span>
            {isUrdu
              ? "کسٹمر کی تصدیق کا انتظار ہے... تصدیق سے پہلے احاطے میں داخل نہ ہوں۔"
              : "Waiting for customer to verify... Do not enter premises until verified."}
          </span>
        </div>

        {/* Support Alert Prompt if 5 minutes passed */}
        {showSupportPrompt && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs animate-in fade-in">
            <div className="flex items-start gap-2 text-slate-700">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {isUrdu
                  ? "5 منٹ گزر چکے ہیں۔ اگر کسٹمر جواب نہیں دے رہا تو آپ ہیلپ لائن سے رابطہ کر سکتے ہیں یا کسٹمر کو براہ راست کال کر سکتے ہیں۔"
                  : "5 minutes elapsed. If the customer isn't responding, you may contact support or call the customer directly."}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="tel:0911234567"
                className="flex-1 py-1.5 rounded-lg bg-[#123B5D] text-white text-center font-bold text-[11px] flex items-center justify-center gap-1.5"
              >
                <Phone className="size-3" />
                <span>{isUrdu ? "سپورٹ ہیلپ لائن" : "Call Support"}</span>
              </a>
            </div>
          </div>
        )}

        {/* Action Button: Customer is not entering the OTP */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleCustomerNotEntering}
            disabled={!isFiveMinutesPassed}
            className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2 ${
              isFiveMinutesPassed
                ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs cursor-pointer active:scale-98"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            }`}
          >
            <Clock className="size-4" />
            <span>
              {isUrdu ? "کسٹمر OTP درج نہیں کر رہا" : "Customer is not entering the OTP"}
            </span>
            {!isFiveMinutesPassed && (
              <span className="font-mono text-xs text-slate-500 bg-white/70 px-1.5 py-0.5 rounded border border-slate-200">
                ({formatCountdown(secondsRemaining)})
              </span>
            )}
          </button>

          {!isFiveMinutesPassed && (
            <p className="text-[10px] text-center text-slate-500 font-medium mt-1.5">
              {isUrdu
                ? `پہنچنے کے 5 منٹ بعد فعال ہوگا (باقی: ${formatCountdown(secondsRemaining)})`
                : `Enables 5 minutes after arrival (${formatCountdown(secondsRemaining)} remaining)`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
