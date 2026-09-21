"use client";

import { useLocale } from "next-intl";
import {
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { HelplineDeskInfo } from "../types";

interface HelplineCardProps {
  info: HelplineDeskInfo;
  onOpenTicketModal: () => void;
}

export function HelplineCard({ info, onOpenTicketModal }: HelplineCardProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-5 rtl:text-right">
      {/* Header with Online Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-[#0F8B8D]/10 flex items-center justify-center text-[#0F8B8D] shrink-0">
            <Headphones className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#123B5D]">
              {isUrdu ? "24/7 کسٹمر ہیلپ لائن" : "24/7 Customer Helpline"}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isUrdu ? "خصوصی آپریشنز اور سپورٹ ڈیسک" : "Dedicated Operations & Support Desk"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            {isUrdu ? "لائیو" : "Live"}
          </span>
        </div>
      </div>

      {/* Main Contact Action Buttons */}
      <div className="flex flex-col gap-2.5">
        {/* Direct Phone Call */}
        <a
          href={`tel:${info.hotlineNumber}`}
          className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0F8B8D] hover:bg-[#0F8B8D]/5 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-[#123B5D] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Phone className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#123B5D] truncate">
                {info.hotlineDisplay}
              </span>
              <span className="text-[11px] text-slate-500">
                {isUrdu ? "براہِ راست ہاٹ لائن • مفت ہیلپ لائن" : "Direct Hotline • Toll-free Helpline"}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#0F8B8D] group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
            {isUrdu ? "ابھی کال کریں" : "Call Now"}
          </span>
        </a>

        {/* WhatsApp Channel */}
        <a
          href={`https://wa.me/${info.whatsappNumber}?text=Assalam-o-Alaikum%20HUNAR%20Help%20Desk%2C%20I%20need%20assistance%20with%20my%20service.`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <MessageSquare className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-emerald-950 truncate">
                {isUrdu ? "واٹس ایپ ترجیحی ڈیسک" : "WhatsApp Priority Desk"}
              </span>
              <span className="text-[11px] text-emerald-700">
                {isUrdu ? "تصاویر اور وائس نوٹس بھیجیں (24/7)" : "Send photos & voice notes (24/7)"}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
            {isUrdu ? "چیٹ کریں" : "Chat"}
          </span>
        </a>

        {/* Email Support */}
        <a
          href={`mailto:${info.supportEmail}`}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all text-slate-700 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Mail className="size-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#123B5D]">
                {info.supportEmail}
              </span>
              <span className="text-[10px] text-slate-500">
                {isUrdu ? "دفتری استفسارات" : "Official inquiries"}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-slate-500">
            {isUrdu ? "ای میل" : "Email"}
          </span>
        </a>
      </div>

      {/* Stats Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
        <div className="size-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
          <Zap className="size-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-[#123B5D]">
            {isUrdu ? `${info.avgResolutionTime} اوسط حل کا وقت` : `${info.avgResolutionTime} Average Resolution`}
          </span>
          <span className="text-[11px] text-slate-500 leading-tight">
            {isUrdu ? "99.2% مطمئن کسٹمر کیسز" : info.resolutionRateText}
          </span>
        </div>
      </div>

      {/* Desk Location & Warranty Note */}
      <div className="pt-1 flex flex-col gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 text-[#0F8B8D] shrink-0" />
          <span className="truncate">
            {isUrdu ? "یونیورسٹی روڈ، پشاور کینٹ" : info.deskLocation}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
          <span>
            {isUrdu
              ? "5 روزہ کاریگری وارنٹی کے تحت مکمل تحفظ"
              : "Backed by 5-Day Craftsmanship Warranty"}
          </span>
        </div>
      </div>

      {/* Direct Ticket CTA Button */}
      <button
        type="button"
        onClick={onOpenTicketModal}
        className="w-full py-2.5 px-4 rounded-xl bg-[#123B5D] hover:bg-[#123B5D]/90 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
      >
        <span>{isUrdu ? "براہ راست سپورٹ ٹکٹ درج کریں" : "Open Direct Support Ticket"}</span>
      </button>
    </div>
  );
}

