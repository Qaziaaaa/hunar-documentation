"use client";

import { CheckCircle2, MapPin, Radio, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import type { PostJobData } from "../types";

interface JobPostedSuccessModalProps {
  data: PostJobData;
  jobId: string;
  onClose: () => void;
}

export function JobPostedSuccessModal({
  data,
  jobId,
}: JobPostedSuccessModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        {/* Radar Pulsing Visual */}
        <div className="relative size-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0F766E]/15 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-[#0F766E]/20 animate-pulse" />
          <div className="relative size-14 rounded-full bg-[#0F766E] text-white flex items-center justify-center shadow-lg">
            <Radio className="size-7" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
            <CheckCircle2 className="size-3.5" />
            <span>{isUrdu ? "جاب کامیابی سے پوسٹ ہو گئی!" : "Job Posted Successfully!"}</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#123B5D]">
            {isUrdu ? "قریبی تصدیق شدہ ماہرین تلاش کیے جا رہے ہیں" : "Searching for Nearby Pros"}
          </h2>
          <p className="text-xs text-slate-500">
            {isUrdu ? (
              <>
                ہم{" "}
                <span className="font-semibold text-slate-700">
                  {data.area || "پشاور"}
                </span>{" "}
                کے تصدیق شدہ کاریگروں کو الرٹ بھیج رہے ہیں۔ جلد ہی آپ کو آفرز موصول ہونا شروع ہو جائیں گی۔
              </>
            ) : (
              <>
                We are alerting verified technicians in{" "}
                <span className="font-semibold text-slate-700">
                  {data.area || "Peshawar"}
                </span>
                . You will start receiving offers shortly.
              </>
            )}
          </p>
        </div>

        {/* Job Details Pill Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left rtl:text-right space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span>{isUrdu ? "جاب ریفرنس نمبر:" : "Job Reference ID:"}</span>
            <span className="font-mono font-bold text-[#123B5D]">{jobId}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>{isUrdu ? "کیٹیگری:" : "Category:"}</span>
            <span className="font-bold text-[#123B5D] capitalize">
              {data.category.replace("-", " ")}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>{isUrdu ? "مقام:" : "Location:"}</span>
            <span className="font-medium text-[#123B5D] truncate max-w-[200px] flex items-center gap-1">
              <MapPin className="size-3 text-[#0F766E] shrink-0" />
              {data.area || (isUrdu ? "یونیورسٹی ٹاؤن، پشاور" : "University Town, Peshawar")}
            </span>
          </div>
        </div>

        {/* Safety Guarantee Note */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="size-4 text-green-600" />
          <span>
            {isUrdu
              ? "آپ کے تحفظ کے لیے تمام کاریگر نادرا سی این آئی سی سے تصدیق شدہ ہیں"
              : "All technicians are NADRA CNIC verified for your safety"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/customer/jobs"
            className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] text-center"
          >
            {isUrdu ? "میری جابز اور موصولہ آفرز دیکھیں" : "View in My Jobs & Live Bids"}
          </Link>
          <Link
            href="/customer/dashboard"
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors text-center"
          >
            {isUrdu ? "کسٹمر ڈیش بورڈ پر جائیں" : "Return to Customer Dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}

