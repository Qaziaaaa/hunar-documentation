"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  FileText,
  Mail,
  MessageCircle,
  MessageSquare,
  Navigation,
  Sparkles,
} from "lucide-react";
import type { NotificationPreferences } from "../types";

interface NotificationsTabProps {
  preferences: NotificationPreferences;
  onUpdatePreferences: (updated: NotificationPreferences) => void;
  onSaveFeedback: (msg: string) => void;
}

export function NotificationsTab({
  preferences,
  onUpdatePreferences,
  onSaveFeedback,
}: NotificationsTabProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [prefs, setPrefs] = useState<NotificationPreferences>(preferences);

  const handleToggle = (key: keyof NotificationPreferences) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    onUpdatePreferences(next);
    onSaveFeedback(
      isUrdu
        ? "اطلاعات کی ترتیبات محفوظ ہو گئیں۔"
        : "Notification preferences saved."
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7">
        {/* Header */}
        <div className="pb-6 border-b border-slate-100 rtl:text-right">
          <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
            {isUrdu ? "اطلاعات اور الرٹس کی ترتیبات" : "Notification & Alert Preferences"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isUrdu
              ? "پشاور میں کاریگر کی روانگی، آمد اور رسیدوں کے خودکار الرٹس کنفیگر کریں۔"
              : "Configure multi-channel alerts for technician dispatch, arrival updates, and invoices in Peshawar."}
          </p>
        </div>

        {/* Preferences List */}
        <div className="divide-y divide-slate-100">
          {/* 1. Quotes & Proposals */}
          <div className="py-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 sm:gap-4 rtl:text-right">
              <div className="size-10 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="size-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-[#123B5D]">
                    {isUrdu ? "فوری کاریگر آفرز اور پروپوزلز" : "Instant Pro Quotes & Proposals"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#0F766E]/10 text-[#0F766E]">
                    {isUrdu ? "تجویز کردہ" : "Recommended"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isUrdu
                    ? "جب بھی کوئی تصدیق شدہ کاریگر آپ کی پوسٹ کردہ جاب کے لیے آفر بھیجے تو فوری ایس ایم ایس اور واٹس ایپ الرٹ حاصل کریں۔"
                    : "Receive immediate SMS & WhatsApp alerts whenever a verified technician submits a quote for your posted tasks."}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold">
                    <Check className="size-3 text-[#0F766E]" /> {isUrdu ? "ایس ایم ایس فعال" : "SMS Enabled"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <MessageCircle className="size-3 text-emerald-600" /> {isUrdu ? "واٹس ایپ اپ ڈیٹس" : "WhatsApp Updates"}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={prefs.instantQuotesWhatsapp}
                onChange={() => handleToggle("instantQuotesWhatsapp")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
            </label>
          </div>

          {/* 2. Live ETA & Arrival Alerts */}
          <div className="py-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 sm:gap-4 rtl:text-right">
              <div className="size-10 rounded-2xl bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="size-5 stroke-[2.2] rtl:rotate-180" />
              </div>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-[#123B5D] block">
                  {isUrdu
                    ? "لائیو کاریگر آمد اور ڈور سٹیپ الرٹس"
                    : "Live Technician ETA & Doorstep Arrival Alerts"}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isUrdu
                    ? "کاریگر کے روانہ ہوتے ہی لائیو نوٹیفکیشن اور دہلیز سے 5 منٹ کے فاصلے پر فوری الرٹ۔"
                    : "Instant ping when your technician starts riding, plus a proximity notification when they are within 5 minutes of your doorstep."}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold">
                    <Check className="size-3 text-[#0F766E]" /> {isUrdu ? "موبائل پش الرٹس" : "Mobile Push Alerts"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Check className="size-3 text-[#0F766E]" /> {isUrdu ? "ایپ کے اندر لائیو میپ" : "In-App Live Map"}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={prefs.technicianArrivalPush}
                onChange={() => handleToggle("technicianArrivalPush")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
            </label>
          </div>

          {/* 3. Direct Payments & Invoices */}
          <div className="py-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 sm:gap-4 rtl:text-right">
              <div className="size-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="size-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-[#123B5D] block">
                  {isUrdu
                    ? "ادائیگی کی رسیدیں اور وارنٹی سرٹیفکیٹس"
                    : "Direct Payment Receipts & Warranty Certificates"}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isUrdu
                    ? "کام کی تکمیل پر آپ کی ای میل پر خودکار پی ڈی ایف رسید اور 5 روزہ ڈیجیٹل وارنٹی کا سرٹیفکیٹ۔"
                    : "Automatic PDF receipts sent to your registered email upon job completion and digital warranty activation."}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold">
                    <Mail className="size-3 text-amber-600" /> {isUrdu ? "ای میل پی ڈی ایف رسید" : "Email PDF Invoices"}
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Check className="size-3 text-[#0F766E]" /> {isUrdu ? "ایس ایم ایس ٹرانزیکشن الرٹ" : "SMS Transaction Alerts"}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={prefs.directPaymentReceiptsEmail}
                onChange={() => handleToggle("directPaymentReceiptsEmail")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
            </label>
          </div>

          {/* 4. Tips & Maintenance */}
          <div className="py-5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 sm:gap-4 rtl:text-right">
              <div className="size-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="size-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-[#123B5D] block">
                  {isUrdu
                    ? "موسمی دیکھ بھال کے مشورے اور پشاور سروس آفرز"
                    : "Seasonal Maintenance Tips & Peshawar Service Offers"}
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isUrdu
                    ? "برسات میں ڈرینج معائنہ، گرمیوں سے قبل اے سی سروسنگ اور خصوصی مقامی رعایتوں کے بروقت الرٹس۔"
                    : "Timely reminders for monsoon drainage inspection, pre-summer AC servicing, and exclusive local promo discounts."}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={prefs.marketingAndTips}
                onChange={() => handleToggle("marketingAndTips")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

