"use client";

import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { useLocale } from "next-intl";

export function HunarBrandBanner() {
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#123B5D] via-[#172C42] to-[#1A1A2E] text-white p-3.5 sm:p-4 shadow-sm border border-slate-700/40">
      {/* Ambient background glow */}
      <div className="absolute -right-8 -bottom-8 size-32 rounded-full bg-[#0F8B8D]/20 blur-xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="size-9 sm:size-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white font-black text-sm border border-white/20 shrink-0 shadow-xs">
            <span>H</span>
            <span className="size-1.5 rounded-full bg-[#0F8B8D] ml-0.5"></span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                HUNAR
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0F8B8D] text-white uppercase tracking-wider">
                PK
              </span>
              <span className="text-[11px] text-slate-300 font-medium hidden xs:inline">
                • {locale === "ur" ? "سرٹیفائیڈ پرو مارکیٹ پلیس" : "Certified Pro Marketplace"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-1">
              {locale === "ur"
                ? "100% تصدیق شدہ ماہر کاریگر، ڈور سٹیپ سیکیورٹی پن اور تسلی بخش کام کی گارنٹی"
                : "Guaranteed tradesperson protection & locked-price assurance across all service areas"}
            </p>
          </div>
        </div>

        {/* 3 Compact Trust Pills */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 text-[10px] sm:text-[11px] font-semibold text-slate-200">
            <ShieldCheck className="size-3.5 text-[#0F8B8D] shrink-0" />
            <span>{locale === "ur" ? "نادرا تصدیق شدہ" : "NADRA Verified"}</span>
          </div>

          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 text-[10px] sm:text-[11px] font-semibold text-slate-200">
            <Lock className="size-3.5 text-[#F59E0B] shrink-0" />
            <span>{locale === "ur" ? "ڈور سٹیپ OTP پن" : "Doorstep OTP PIN"}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10 text-[10px] sm:text-[11px] font-semibold text-slate-200">
            <CheckCircle2 className="size-3.5 text-[#16A34A] shrink-0" />
            <span>{locale === "ur" ? "100% گارنٹی" : "100% Guaranteed"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
