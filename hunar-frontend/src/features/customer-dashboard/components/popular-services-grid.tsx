"use client";

import {
  ArrowRight,
  Droplets,
  Flame,
  Hammer,
  Paintbrush,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const POPULAR_SERVICES = [
  {
    id: "plumber",
    title: "Plumber",
    urduTitle: "پلمبر",
    subtitle: "Pipes, Sanitary & Leaks",
    urduSubtitle: "پائپ، سینیٹری و لیکج",
    icon: Wrench,
    badge: "Popular",
    urduBadge: "مقبول",
    colorBg: "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400",
    iconBg: "bg-blue-600 text-white",
    basePrice: "From Rs. 800",
    basePriceUr: "800 روپے سے",
  },
  {
    id: "electrician",
    title: "Electrician",
    urduTitle: "الیکٹریشن",
    subtitle: "Wiring, DB & Short Circuits",
    urduSubtitle: "وائرنگ، شارٹ سرکٹ و فٹنگ",
    icon: Zap,
    badge: "High Demand",
    urduBadge: "زیادہ طلب",
    colorBg: "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400",
    iconBg: "bg-amber-600 text-white",
    basePrice: "From Rs. 1,000",
    basePriceUr: "1,000 روپے سے",
  },
  {
    id: "ac-technician",
    title: "AC Technician",
    urduTitle: "اے سی ٹیکنیشن",
    subtitle: "Inverter Gas & Servicing",
    urduSubtitle: "گیس چارجنگ و سروسنگ",
    icon: Flame,
    badge: "Seasonal Pro",
    urduBadge: "سیزنل سپیشلسٹ",
    colorBg: "bg-teal-50 text-teal-800 border-teal-200 hover:border-teal-400",
    iconBg: "bg-[#0F8B8D] text-white",
    basePrice: "From Rs. 1,500",
    basePriceUr: "1,500 روپے سے",
  },
  {
    id: "carpenter",
    title: "Carpenter",
    urduTitle: "بڑھئی / کارپینٹر",
    subtitle: "Doors, Furniture & Locks",
    urduSubtitle: "دروازے، تالے و فرنیچر",
    icon: Hammer,
    badge: null,
    urduBadge: null,
    colorBg: "bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-400",
    iconBg: "bg-orange-600 text-white",
    basePrice: "From Rs. 1,200",
    basePriceUr: "1,200 روپے سے",
  },
  {
    id: "painter",
    title: "Painter",
    urduTitle: "پینٹر",
    subtitle: "Interior, Exterior & Putty",
    urduSubtitle: "رنگ و روغن و پٹین",
    icon: Paintbrush,
    badge: null,
    urduBadge: null,
    colorBg: "bg-purple-50 text-purple-800 border-purple-200 hover:border-purple-400",
    iconBg: "bg-purple-600 text-white",
    basePrice: "From Rs. 1,500",
    basePriceUr: "1,500 روپے سے",
  },
  {
    id: "cleaner",
    title: "Home Cleaner",
    urduTitle: "گھر کی صفائی",
    subtitle: "Deep Cleaning & Dusting",
    urduSubtitle: "مکمل صفائی و واشنگ",
    icon: Sparkles,
    badge: "Top Rated",
    urduBadge: "ٹاپ ریٹیڈ",
    colorBg: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400",
    iconBg: "bg-emerald-600 text-white",
    basePrice: "From Rs. 1,500",
    basePriceUr: "1,500 روپے سے",
  },
];

export function PopularServicesGrid() {
  const t = useTranslations("CustomerPortal.Dashboard");
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
            {t("popularTitle")}
          </h2>
          <p className="text-xs text-slate-500">
            {t("popularSubtitle")}
          </p>
        </div>
        <Link
          href="/customer/post-job"
          className="text-[#0F8B8D] hover:text-[#0F8B8D]/80 text-xs font-semibold inline-flex items-center gap-1 shrink-0"
        >
          <span>{t("viewAll")}</span>
          <ArrowRight className="size-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {POPULAR_SERVICES.map((srv) => {
          const Icon = srv.icon;
          const title = locale === "ur" ? srv.urduTitle : srv.title;
          const subtitle = locale === "ur" ? srv.urduSubtitle : srv.subtitle;
          const badge = locale === "ur" ? srv.urduBadge : srv.badge;
          const price = locale === "ur" ? srv.basePriceUr : srv.basePrice;

          return (
            <Link
              key={srv.id}
              href={`/customer/post-job?category=${srv.id}`}
              className="group bg-white border border-slate-200 hover:border-[#0F8B8D] rounded-2xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 text-left rtl:text-right relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center ${srv.iconBg} shadow-2xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="size-5" />
                </div>
                {badge ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    {badge}
                  </span>
                ) : null}
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0F8B8D] transition-colors">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {subtitle}
                </p>
                <span className="text-[10px] font-semibold text-[#0F8B8D] mt-2 block">
                  {price}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
