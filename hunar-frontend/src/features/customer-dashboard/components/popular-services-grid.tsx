"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Droplets,
  Flame,
  Hammer,
  Paintbrush,
  Sparkles,
  Sprout,
  Wrench,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fetchServiceCategories } from "@/features/post-job/api/post-job-api";

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
  },
  {
    id: "gardener",
    title: "Gardener",
    urduTitle: "مالی / باغبانی",
    subtitle: "Lawn & Plant Care",
    urduSubtitle: "لان و پودوں کی دیکھ بھال",
    icon: Sprout,
    badge: "Popular",
    urduBadge: "مقبول",
    colorBg: "bg-green-50 text-green-800 border-green-200 hover:border-green-400",
    iconBg: "bg-green-600 text-white",
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
  },
];

export function PopularServicesGrid() {
  const t = useTranslations("CustomerPortal.Dashboard");
  const locale = useLocale();
  const [liveFees, setLiveFees] = useState<Record<string, number>>({});
  const [isLoadingFees, setIsLoadingFees] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchServiceCategories()
      .then((cats) => {
        if (!mounted || !cats.length) return;
        const feeMap: Record<string, number> = {};
        cats.forEach((c) => {
          if (c.defaultVisitCharge != null && c.defaultVisitCharge > 0) {
            feeMap[c.id.toLowerCase()] = c.defaultVisitCharge;
            feeMap[c.name.toLowerCase()] = c.defaultVisitCharge;
          }
        });
        setLiveFees(feeMap);
      })
      .catch(() => {
        // Fee fetch failed — do not invent a price; hide the price line.
      })
      .finally(() => {
        if (mounted) setIsLoadingFees(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
          const dynFee =
            liveFees[srv.id.toLowerCase()] ||
            liveFees[srv.title.toLowerCase()] ||
            (srv.id === "plumber" ? liveFees["plumbing"] : undefined);
          const price = dynFee
            ? locale === "ur"
              ? `وزٹ فیس ${dynFee} روپے سے`
              : `Visit fee from Rs. ${dynFee}`
            : null;

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
                {isLoadingFees ? (
                  <span
                    className="mt-2 block h-3 w-20 rounded bg-slate-100 animate-pulse"
                    aria-hidden="true"
                  />
                ) : price ? (
                  <span className="text-[10px] font-semibold text-[#0F8B8D] mt-2 block">
                    {price}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
