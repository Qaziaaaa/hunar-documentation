"use client";

import { useState } from "react";
import {
  Radio,
  Power,
  Info,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";

import { useLocale } from "next-intl";

export function StatusBanner({
  isOnline,
  onToggleOnline,
  city = "Peshawar",
  serviceAreas = ["Hayatabad", "University Town", "Saddar"],
}: {
  isOnline: boolean;
  onToggleOnline: () => void;
  city?: string;
  serviceAreas?: string[];
}) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [showRuleInfo, setShowRuleInfo] = useState(false);

  return (
    <div className="hidden w-full md:block">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5",
          isOnline
            ? "border-teal/30 bg-gradient-to-r from-teal/10 via-white to-teal/5 shadow-xs"
            : "border-slate-200 bg-white shadow-xs"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Online Status Visual & Message */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={cn(
                "relative flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors shadow-xs",
                isOnline ? "bg-teal text-white" : "bg-slate-300 text-slate-600"
              )}
            >
              {isOnline ? (
                <Radio className="size-6 animate-pulse" />
              ) : (
                <Power className="size-5" />
              )}
              {isOnline && (
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                  <span className="relative inline-flex rounded-full size-3 bg-[#16A34A]" />
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold text-navy">
                  {isOnline
                    ? isUrdu
                      ? "اسٹیٹس: آن لائن اور جابز کے لیے تیار"
                      : "Status: Online & Ready for Jobs"
                    : isUrdu
                      ? "اسٹیٹس: اس وقت آف لائن"
                      : "Status: Currently Offline"}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold",
                    isOnline
                      ? "bg-teal/20 text-teal"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isOnline ? "bg-teal animate-pulse" : "bg-slate-500"
                    )}
                  />
                  {isOnline
                    ? isUrdu
                      ? "لائیو آن رڈار"
                      : "LIVE ON RADAR"
                    : isUrdu
                      ? "آف رڈار"
                      : "OFF RADAR"}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                {isOnline ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 text-teal shrink-0" />
                    {isUrdu
                      ? `${city} میں کسٹمر جاب کی درخواستیں موصول ہو رہی ہیں۔`
                      : `Receiving customer job requests across ${city} (${serviceAreas.slice(0, 3).join(", ")}).`}
                  </span>
                ) : isUrdu ? (
                  "آپ کسٹمر کی تلاش سے چھپے ہوئے ہیں۔ نئی جابز حاصل کرنے کے لیے آن لائن ہوں۔"
                ) : (
                  "You are hidden from customer searches. Switch Online to receive new jobs."
                )}
              </p>
            </div>
          </div>

          {/* Right: Interactive Switch Button + Policy Trigger */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowRuleInfo(!showRuleInfo)}
              className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
              title="View status rules"
            >
              <Info className="size-4" />
            </button>

            {/* Toggle Button */}
            <div
              onClick={onToggleOnline}
              className="relative inline-flex h-10 w-40 shrink-0 items-center rounded-full bg-slate-200/80 shadow-inner select-none cursor-pointer overflow-hidden"
              title={
                isUrdu
                  ? isOnline
                    ? "موجودہ اسٹیٹس: آن لائن"
                    : "موجودہ اسٹیٹس: آف لائن"
                  : isOnline
                  ? "Current Status: Online"
                  : "Current Status: Offline"
              }
            >
              <div className="z-10 flex h-full flex-1 items-center justify-center text-xs font-bold text-slate-500">
                {!isOnline ? null : isUrdu ? "آف لائن" : "Offline"}
              </div>
              <div className="z-10 flex h-full flex-1 items-center justify-center text-xs font-bold text-slate-500">
                {isOnline ? null : isUrdu ? "آن لائن" : "Online"}
              </div>
              <div
                className={cn(
                  "absolute top-0 bottom-0 start-0 z-20 w-1/2 rounded-full flex items-center justify-center text-xs font-extrabold text-white shadow-md transition-all duration-300 ease-in-out pointer-events-none",
                  isOnline
                    ? "translate-x-full rtl:-translate-x-full bg-[#16A34A]"
                    : "translate-x-0 bg-red-500"
                )}
              >
                {isOnline
                  ? isUrdu ? "آن لائن" : "Online"
                  : isUrdu ? "آف لائن" : "Offline"}
              </div>
            </div>
          </div>
        </div>

        {/* Rule Policy Collapsible Card */}
        {showRuleInfo && (
          <div className="mt-3.5 pt-3 border-t border-slate-200/80 text-xs space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 font-bold text-navy">
              <Sparkles className="size-3.5 text-teal" />
              <span>Status Rules &amp; Wallet Policy:</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              • In current mode, your Online/Offline status is controlled manually by this switch.
              <br />
              • Once the Wallet API is integrated, you remain <strong>Online</strong> as long as your wallet balance is ≥ −500 Rs.
              <br />
              • When Online, nearby customer requests in Peshawar match your skills in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
