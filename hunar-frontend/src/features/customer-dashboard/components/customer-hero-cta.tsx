"use client";

import { MapPin, Plus, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MOCK_CUSTOMER_USER } from "../mock/customer-mock-data";

export function CustomerHeroCta() {
  const t = useTranslations("CustomerPortal.Dashboard");
  const locale = useLocale();

  return (
    <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#123B5D]">
            {t("greeting")}
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B8D]"></span>
            {locale === "ur" ? "لائیو ویریفائیڈ سروس" : "Live Verified Hub"}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
          <MapPin className="size-4 text-slate-400 shrink-0" />
          {locale === "ur"
            ? `آپ کے علاقے (${MOCK_CUSTOMER_USER.area}) میں لائیو سروسز اور بکنگز کی تفصیلات:`
            : `Here's what's happening with your services today in ${MOCK_CUSTOMER_USER.area}.`}
        </p>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <Link
          href="/customer/visits"
          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ShieldCheck className="size-4 text-[#0F8B8D]" />
          <span>{t("trackVisitBtn")}</span>
        </Link>
        <Link
          href="/customer/post-job"
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#0F8B8D] text-white text-xs sm:text-sm font-semibold shadow-xs hover:bg-[#0F8B8D]/90 transition-all active:scale-[0.99]"
        >
          <Plus className="size-4.5" />
          <span>{t("postJobBtn")}</span>
        </Link>
      </div>
    </section>
  );
}
