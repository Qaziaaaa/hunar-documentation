"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Grid,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export interface ServiceItem {
  id: string;
  title: string;
  titleUr: string;
  image: string;
  subCategory?: string;
  href?: string;
}

export const ALL_SERVICES: ServiceItem[] = [
  // Line 1 (3 items)
  {
    id: "plumber",
    title: "Plumber",
    titleUr: "پلمبر",
    image: "/services/plumber.jpg",
  },
  {
    id: "electrician",
    title: "Electrician",
    titleUr: "الیکٹریشن",
    image: "/services/electrician.jpg",
  },
  {
    id: "ac-technician",
    title: "AC Technician",
    titleUr: "اے سی ٹیکنیشن",
    image: "/services/AC.jpg",
  },

  // Line 2 (3 items)
  {
    id: "carpenter",
    title: "Carpenter",
    titleUr: "کارپینٹر",
    image: "/services/carpenter.jpg",
  },
  {
    id: "painter",
    title: "Painter",
    titleUr: "پینٹر",
    image: "/services/painter.jpg",
  },
  {
    id: "mason-mistry",
    title: "Mason / Mistri",
    titleUr: "مستری",
    image: "/services/mason.jpg",
  },

  // Line 3 (3 items)
  {
    id: "solar-technician",
    title: "Solar Panel Setup",
    titleUr: "سولر پینل",
    image: "/services/solar setup.jpg",
  },
  {
    id: "gardener",
    title: "Gardener",
    titleUr: "مالی / باغبانی",
    image: "/services/gardner.jpg",
  },


  // Extra hidden rows (Expanded on "Show All")
  {
    id: "pest-control",
    title: "Pest Control",
    titleUr: "کیڑے مار اسپرے",
    image: "/services/pest.jpg",
  },
  {
    id: "cleaner",
    title: "Deep Cleaning",
    titleUr: "صفائی و کلیننگ",
    image: "/services/cleaning.jpg",
  },
  {
    id: "cctv-security",
    title: "CCTV & Security",
    titleUr: "سی سی ٹی وی",
    image: "/services/CCTV.jpg",
  },
  {
    id: "plumber",
    title: "Geyser & Heating",
    titleUr: "گیزر و ہیٹنگ",
    image: "/services/geyser.jpg",
    subCategory: "Geyser Installation (Gas/Electric)",
    href: "/customer/post-job?category=plumber&subCategory=Geyser+Installation+(Gas/Electric)",
  },
  {
    id: "cleaner",
    title: "Water Tank Clean",
    titleUr: "واٹر ٹینک صفائی",
    image: "/services/water tank.jpg",
    subCategory: "Water Tank Deep Cleaning",
    href: "/customer/post-job?category=cleaner&subCategory=Water+Tank+Deep+Cleaning",
  },

];

export function ServicesGrid() {
  const [showAll, setShowAll] = useState(false);
  const locale = useLocale();

  // Default sliced count: 12 items (3 rows of 4 on desktop, 4 rows of 3 on mobile)
  const displayedServices = showAll ? ALL_SERVICES : ALL_SERVICES.slice(0, 12);

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

      {/* 3 in 1 line on Mobile, 4 in 1 line on Desktop */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 w-full">
        {displayedServices.map((service, index) => {
          const displayTitle = locale === "ur" ? service.titleUr : service.title;
          const serviceHref =
            service.href || `/customer/post-job?category=${service.id}`;

          return (
            <Link
              key={`${service.id}-${service.title}`}
              href={serviceHref}
              className="group flex flex-col justify-between p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-slate-200 bg-[#F9FAFC] hover:border-[#0F8B8D] shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer active:scale-95 h-full"
            >
              {/* Inner Image Container - Fixed identical height & full width */}
              <div className="relative w-full h-24 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden bg-[#F9FAFC] shrink-0">
                <Image
                  src={service.image}
                  alt={displayTitle}
                  fill
                  priority={index < 4}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 33vw, 25vw"
                />
              </div>

              {/* Service Title & Arrow */}
              <div className="flex items-center justify-between px-1 pt-2 pb-0.5 gap-1.5 min-h-[38px] sm:min-h-[44px]">
                <span className="text-xs sm:text-sm font-bold text-[#123B5D] group-hover:text-[#0F8B8D] transition-colors leading-snug line-clamp-2 text-left rtl:text-right">
                  {displayTitle}
                </span>
                <ArrowRight className="size-3.5 sm:size-4 text-slate-400 group-hover:text-[#0F8B8D] group-hover:translate-x-0.5 transition-all shrink-0 rtl:rotate-180 mb-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
