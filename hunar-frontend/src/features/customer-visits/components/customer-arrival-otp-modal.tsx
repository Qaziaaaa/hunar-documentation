"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  arrivalService,
  SUCCESS_VERIFICATION_MESSAGE,
  SUCCESS_VERIFICATION_MESSAGE_UR,
  type ArrivalSession,
} from "@/features/jobs/services/arrival-verification-service";

interface CustomerArrivalOtpModalProps {
  isOpen: boolean;
  session: ArrivalSession | null;
  onSuccess: (message: string) => void;
  onClose: () => void;
  isUrdu?: boolean;
}

export function CustomerArrivalOtpModal({
  isOpen,
  session,
  onSuccess,
  onClose,
  isUrdu = false,
}: CustomerArrivalOtpModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", ""]);
      setError(null);
      // Auto focus first input
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeSession: Partial<ArrivalSession> = session || {
    jobId: "job-1",
    otp: "4821",
    workerName: isUrdu ? "طارق شاہ" : "Tariq Shah",
    status: "pending_otp",
  };

  const workerName = activeSession.workerName || (isUrdu ? "کاریگر" : "Worker");

  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const char = cleaned.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    // Auto move to next input or auto-verify on last digit
    if (index < 3 && char) {
      inputRefs.current[index + 1]?.focus();
    } else if (index === 3 && char) {
      const full = next.join("");
      if (full.length === 4) {
        setTimeout(() => {
          verifyFullOtp(full);
        }, 150);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (e.key === "Enter") {
      verifyFullOtp(digits.join(""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const next = ["", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const targetIdx = Math.min(pasted.length, 3);
    inputRefs.current[targetIdx]?.focus();

    if (pasted.length === 4) {
      setTimeout(() => {
        verifyFullOtp(pasted);
      }, 150);
    }
  };

  const verifyFullOtp = (fullOtp: string) => {
    if (fullOtp.length < 4) {
      setError(
        isUrdu
          ? "براہ کرم کاریگر کی طرف سے دیا گیا پورا 4 ہندسوں کا OTP درج کریں۔"
          : "Please enter the full 4-digit OTP provided by the worker."
      );
      return;
    }

    setIsVerifying(true);
    setError(null);

    const result = arrivalService.verifyOtp(fullOtp, activeSession);

    if (!result.success) {
      setIsVerifying(false);
      setError(
        result.error ||
          (isUrdu
            ? "درج کردہ OTP غلط ہے۔ براہ کرم کاریگر سے تصدیق کر کے دوبارہ کوشش کریں۔"
            : "Incorrect OTP. Please check the code provided by the worker and try again.")
      );
      return;
    }

    setIsVerifying(false);
    const successMsg = isUrdu ? SUCCESS_VERIFICATION_MESSAGE_UR : SUCCESS_VERIFICATION_MESSAGE;
    onSuccess(successMsg);
  };

  const handleConfirm = () => {
    verifyFullOtp(digits.join(""));
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
                  ? `${workerName} آپ کی دہلیز پر پہنچ گئے ہیں`
                  : `${workerName} has arrived at your doorstep`}
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
              ? "کاریگر کا دیا گیا 4 ہندسوں کا OTP درج کریں تاکہ احاطے میں داخلے کی اجازت ہو:"
              : "Enter the 4-digit OTP provided by the worker to allow entry inside:"}
          </p>
        </div>

        {/* Big Bold OTP Box matching Worker OTP Card */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/80 border-2 border-[#0F8B8D] text-center space-y-2 shadow-inner">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#0F8B8D]">
            {isUrdu ? "دہلیز داخلہ PIN" : "Doorstep Entry OTP"}
          </div>

          <div
            className="flex items-center justify-center gap-3"
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`size-12 sm:size-14 rounded-xl bg-white border shadow-sm flex items-center justify-center font-mono font-black text-2xl sm:text-3xl text-[#123B5D] text-center transition-all focus:outline-none ${
                  error
                    ? "border-red-400 ring-2 ring-red-400/20"
                    : digit
                    ? "border-[#0F8B8D] ring-2 ring-[#0F8B8D]/20"
                    : "border-slate-200/90 focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20"
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center gap-1.5 pt-1 text-red-600 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Real-time Status Notice */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11.5px] font-semibold text-amber-900">
          <span className="size-2 rounded-full bg-amber-500 animate-ping shrink-0" />
          <span>
            {isUrdu
              ? "تصدیق کے بعد ہی کاریگر کو احاطے میں داخل ہونے کی اجازت ہوگی۔"
              : "The worker will only be allowed inside after successful OTP verification."}
          </span>
        </div>

        {/* Action Button: Confirm OTP */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isVerifying || digits.join("").length < 4}
            className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
              digits.join("").length === 4
                ? "bg-[#0F8B8D] hover:bg-[#0D7A7C] text-white border-[#0F8B8D] shadow-sm shadow-[#0F8B8D]/25"
                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 className="size-4" />
            <span>{isUrdu ? "OTP کی تصدیق کریں" : "Confirm OTP"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
