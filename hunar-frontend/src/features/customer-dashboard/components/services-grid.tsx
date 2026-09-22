"use client";

import { useState } from "react";
import {
  AirVent,
  BrickWall,
  Bug,
  Cctv,
  ChevronDown,
  ChevronUp,
  Droplets,
  Flame,
  Grid,
  Hammer,
  PaintRoller,
  PlugZap,
  Snowflake,
  Sparkles,
  Sprout,
  Sun,
  Truck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export interface ServiceItem {
  id: string;
  title: string;
  titleUr: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

export const ALL_SERVICES: ServiceItem[] = [
  // Line 1 (3 items)
  {
    id: "plumber",
    title: "Plumber",
    titleUr: "پلمبر",
    icon: Droplets,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-200/60",
  },
  {
    id: "electrician",
    title: "Electrician",
    titleUr: "الیکٹریشن",
    icon: PlugZap,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-200/60",
  },
  {
    id: "ac-technician",
    title: "AC Technician",
    titleUr: "اے سی ٹیکنیشن",
    icon: Snowflake,
    iconColor: "text-[#0F8B8D]",
    iconBg: "bg-teal-50 border-teal-200/60",
  },

  // Line 2 (3 items)
  {
    id: "carpenter",
    title: "Carpenter",
    titleUr: "کارپینٹر",
    icon: Hammer,
    iconColor: "text-amber-800",
    iconBg: "bg-amber-50/80 border-amber-300/60",
  },
  {
    id: "painter",
    title: "Painter",
    titleUr: "پینٹر",
    icon: PaintRoller,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50 border-violet-200/60",
  },
  {
    id: "mason",
    title: "Mason / Mistri",
    titleUr: "مستری",
    icon: BrickWall,
    iconColor: "text-stone-700",
    iconBg: "bg-stone-100 border-stone-300/60",
  },

  // Line 3 (3 items)
  {
    id: "cleaning",
    title: "Deep Cleaning",
    titleUr: "صفائی و کلیننگ",
    icon: Sparkles,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-200/60",
  },
  {
    id: "pest-control",
    title: "Pest Control",
    titleUr: "کیڑے مار اسپرے",
    icon: Bug,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50 border-rose-200/60",
  },
  {
    id: "cctv",
    title: "CCTV & Security",
    titleUr: "سی سی ٹی وی",
    icon: Cctv,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 border-indigo-200/60",
  },

  // Extra hidden rows (Expanded on "Show All")
  {
    id: "solar",
    title: "Solar Panel Setup",
    titleUr: "سولر پینل",
    icon: Sun,
    iconColor: "text-yellow-600",
    iconBg: "bg-yellow-50 border-yellow-200/60",
  },
  {
    id: "geyser",
    title: "Geyser & Heating",
    titleUr: "گیزر و ہیٹنگ",
    icon: Flame,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50 border-orange-200/60",
  },
  {
    id: "water-tank",
    title: "Water Tank Clean",
    titleUr: "واٹر ٹینک صفائی",
    icon: Droplets,
    iconColor: "text-cyan-600",
    iconBg: "bg-cyan-50 border-cyan-200/60",
  },
  {
    id: "movers",
    title: "Home Mover",
    titleUr: "سامان شفٹنگ",
    icon: Truck,
    iconColor: "text-slate-700",
    iconBg: "bg-slate-100 border-slate-300/60",
  },
  {
    id: "gardener",
    title: "Gardener",
    titleUr: "مالی / باغبانی",
    icon: Sprout,
    iconColor: "text-lime-700",
    iconBg: "bg-lime-50 border-lime-200/60",
  },
  {
    id: "welder",
    title: "Welding & Steel",
    titleUr: "ویلڈنگ و لوہا",
    icon: AirVent,
    iconColor: "text-sky-700",
    iconBg: "bg-sky-50 border-sky-200/60",
  },
];

export function ServicesGrid() {
  const [showAll, setShowAll] = useState(false);
  const locale = useLocale();

  // 3 items per line × 3 lines = 9 items
  const displayedServices = showAll ? ALL_SERVICES : ALL_SERVICES.slice(0, 9);

  return (
    <section className="flex flex-col gap-3 w-full">
      {/* Top Header with "Show All Services" Button on the Right */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-bold text-[#123B5D]">
          {locale === "ur" ? "مقبول سروسز کیٹیگریز" : "Popular Services"}
        </span>
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[#0F8B8D] hover:bg-[#0F8B8D]/10 hover:border-[#0F8B8D]/30 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Grid className="size-3" />
          <span>
            {showAll
              ? locale === "ur"
                ? "کم دکھائیں"
                : "Show Less"
              : locale === "ur"
              ? "تمام سروسز دیکھیں"
              : "Show All Services"}
          </span>
          {showAll ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      </div>

      {/* 3 in 1 line Grid (left to right) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
        {displayedServices.map((service) => {
          const Icon = service.icon;
          const displayTitle = locale === "ur" ? service.titleUr : service.title;
          return (
            <Link
              key={service.id}
              href={`/customer/post-job?category=${service.id}`}
              className="group flex flex-col items-center justify-center p-3.5 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#0F8B8D] shadow-2xs hover:shadow-xs transition-all text-center gap-2 cursor-pointer active:scale-95"
            >
              {/* Icon */}
              <div
                className={`size-12 sm:size-14 rounded-2xl border flex items-center justify-center ${service.iconBg} ${service.iconColor} group-hover:scale-105 transition-transform shadow-2xs`}
              >
                <Icon className="size-6 sm:size-7 stroke-[2.2]" />
              </div>

              {/* Service Name below Icon */}
              <span className="text-xs sm:text-sm font-bold text-[#123B5D] group-hover:text-[#0F8B8D] transition-colors line-clamp-1">
                {displayTitle}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
