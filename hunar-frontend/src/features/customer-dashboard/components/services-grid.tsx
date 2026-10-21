"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  Car,
  ChevronDown,
  ChevronUp,
  Cpu,
  Grid,
  SearchX,
  Truck,
  Tv,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useCustomerSearch } from "./customer-search-context";
import {
  fetchServiceCategories,
  BackendCategory,
  CATEGORY_ID_MAP,
} from "@/features/post-job/api/post-job-api";

export interface ServiceItem {
  id: string;
  title: string;
  titleUr: string;
  image?: string | null;
  icon?: LucideIcon;
  gradient?: string;
  subCategory?: string;
  href?: string;
}

export interface CategoryAsset {
  image?: string;
  icon?: LucideIcon;
  gradient?: string;
}

/**
 * Intelligent asset & icon picker for admin-created or custom categories.
 * Maps known trade keywords to existing high-res 3D photographic assets or trade icons,
 * and falls back to a clean, branded neutral placeholder instead of hardcoded mason.jpg.
 */
export function pickCategoryAsset(categoryName: string): CategoryAsset {
  const norm = categoryName.toLowerCase().trim();

  // 1. Photographic Image Picker (matches name to known high-res 3D photographic assets)
  if (
    norm.includes("plumb") ||
    norm.includes("tap") ||
    norm.includes("leak") ||
    norm.includes("pipe") ||
    norm.includes("sanitary") ||
    norm.includes("پلمبر")
  ) {
    return { image: "/services/plumber.jpg" };
  }
  if (
    norm.includes("electr") ||
    norm.includes("wire") ||
    norm.includes("light") ||
    norm.includes("ups") ||
    norm.includes("switch") ||
    norm.includes("الیکٹریشن")
  ) {
    return { image: "/services/electrician.jpg" };
  }
  if (
    norm.includes("ac") ||
    norm.includes("air") ||
    norm.includes("cool") ||
    norm.includes("hvac") ||
    norm.includes("refriger") ||
    norm.includes("اے سی")
  ) {
    return { image: "/services/AC.jpg" };
  }
  if (
    norm.includes("carpent") ||
    norm.includes("wood") ||
    norm.includes("furniture") ||
    norm.includes("door") ||
    norm.includes("کارپینٹر")
  ) {
    return { image: "/services/carpenter.jpg" };
  }
  if (
    norm.includes("paint") ||
    norm.includes("polish") ||
    norm.includes("whitewash") ||
    norm.includes("پینٹر")
  ) {
    return { image: "/services/painter.jpg" };
  }
  if (
    norm.includes("mason") ||
    norm.includes("mistri") ||
    norm.includes("mistry") ||
    norm.includes("brick") ||
    norm.includes("cement") ||
    norm.includes("مستری")
  ) {
    return { image: "/services/mason.jpg" };
  }
  if (
    norm.includes("solar") ||
    norm.includes("inverter") ||
    norm.includes("panel") ||
    norm.includes("سولر")
  ) {
    return { image: "/services/solar setup.jpg" };
  }
  if (
    norm.includes("garden") ||
    norm.includes("lawn") ||
    norm.includes("plant") ||
    norm.includes("مالی")
  ) {
    return { image: "/services/gardner.jpg" };
  }
  if (
    norm.includes("pest") ||
    norm.includes("termite") ||
    norm.includes("fumigat") ||
    norm.includes("spray") ||
    norm.includes("کیڑے")
  ) {
    return { image: "/services/pest.jpg" };
  }
  if (
    norm.includes("clean") ||
    norm.includes("wash") ||
    norm.includes("maid") ||
    norm.includes("janitor") ||
    norm.includes("صفائی")
  ) {
    return { image: "/services/cleaning.jpg" };
  }
  if (
    norm.includes("cctv") ||
    norm.includes("camera") ||
    norm.includes("secur") ||
    norm.includes("surveillance") ||
    norm.includes("سیکیورٹی")
  ) {
    return { image: "/services/CCTV.jpg" };
  }
  if (
    norm.includes("geyser") ||
    norm.includes("heater") ||
    norm.includes("boiler") ||
    norm.includes("گیزر")
  ) {
    return { image: "/services/geyser.jpg" };
  }
  if (
    norm.includes("tank") ||
    norm.includes("reservoir") ||
    norm.includes("ٹینک")
  ) {
    return { image: "/services/water tank.jpg" };
  }

  // 2. Icon Picker for other known trade categories
  if (
    norm.includes("mover") ||
    norm.includes("shift") ||
    norm.includes("transport") ||
    norm.includes("pack") ||
    norm.includes("truck") ||
    norm.includes("گاڑی")
  ) {
    return {
      icon: Truck,
      gradient: "from-amber-500/15 via-orange-500/5 to-slate-50",
    };
  }
  if (
    norm.includes("tech") ||
    norm.includes("it") ||
    norm.includes("computer") ||
    norm.includes("network") ||
    norm.includes("software")
  ) {
    return {
      icon: Cpu,
      gradient: "from-blue-500/15 via-indigo-500/5 to-slate-50",
    };
  }
  if (
    norm.includes("car") ||
    norm.includes("auto") ||
    norm.includes("bike") ||
    norm.includes("motor") ||
    norm.includes("mechanic")
  ) {
    return {
      icon: Car,
      gradient: "from-rose-500/15 via-red-500/5 to-slate-50",
    };
  }
  if (
    norm.includes("appliance") ||
    norm.includes("tv") ||
    norm.includes("oven") ||
    norm.includes("microwave")
  ) {
    return {
      icon: Tv,
      gradient: "from-purple-500/15 via-violet-500/5 to-slate-50",
    };
  }

  // 3. Neutral Branded Placeholder for unclassified / admin custom services
  return {
    icon: Briefcase,
    gradient: "from-[#0F8B8D]/15 via-slate-100 to-[#123B5D]/5",
  };
}

function ServiceCardMedia({
  service,
  displayTitle,
  priority,
}: {
  service: ServiceItem;
  displayTitle: string;
  priority: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  if (service.image && !hasError) {
    return (
      <div className="relative w-full h-28 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden bg-[#F9FAFC] shrink-0">
        <Image
          src={service.image}
          alt={displayTitle}
          fill
          priority={priority}
          onError={() => setHasError(true)}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
    );
  }

  const IconComponent = service.icon || Briefcase;

  return (
    <div
      className={`relative w-full h-28 sm:h-36 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 flex items-center justify-center p-3 select-none bg-gradient-to-br ${
        service.gradient || "from-[#0F8B8D]/15 via-slate-100 to-[#123B5D]/5"
      } border border-slate-200/70 transition-all duration-300 group-hover:border-[#0F8B8D]/40 group-hover:shadow-inner`}
    >
      {/* Decorative ambient glows */}
      <div className="absolute -top-6 -right-6 size-20 rounded-full bg-[#0F8B8D]/10 blur-xl pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 size-20 rounded-full bg-[#123B5D]/10 blur-xl pointer-events-none" />

      {/* Centered Floating Icon Badge */}
      <div className="relative z-10 size-12 sm:size-14 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center text-[#0F8B8D] group-hover:text-[#123B5D] group-hover:scale-110 group-hover:shadow-sm transition-all duration-300">
        <IconComponent className="size-6 sm:size-7 stroke-[1.75]" />
      </div>
    </div>
  );
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

function isServiceActive(service: ServiceItem, activeCategories: BackendCategory[]): boolean {
  const targetSeedId = CATEGORY_ID_MAP[service.id.toLowerCase()];

  return activeCategories.some((cat) => {
    if (targetSeedId && cat.id.toLowerCase() === targetSeedId.toLowerCase()) {
      return true;
    }
    if (cat.id.toLowerCase() === service.id.toLowerCase()) {
      return true;
    }
    const catName = cat.name.toLowerCase();
    const serviceTitle = service.title.toLowerCase();
    const serviceId = service.id.toLowerCase();

    if (catName === serviceTitle || catName === serviceId) {
      return true;
    }
    if (serviceTitle.includes(catName) || catName.includes(serviceTitle)) {
      return true;
    }
    if (
      (catName.includes("plumb") && serviceId === "plumber") ||
      (catName.includes("electr") && serviceId === "electrician") ||
      ((catName.includes("ac") || catName.includes("refriger")) && serviceId === "ac-technician") ||
      (catName.includes("carpent") && serviceId === "carpenter") ||
      (catName.includes("paint") && serviceId === "painter") ||
      (catName.includes("clean") && serviceId === "cleaner") ||
      (catName.includes("mason") && serviceId === "mason-mistry") ||
      (catName.includes("pest") && serviceId === "pest-control") ||
      (catName.includes("handyman") &&
        (serviceId === "solar-technician" || serviceId === "gardener" || serviceId === "cctv-security"))
    ) {
      return true;
    }
    return false;
  });
}

export function ServicesGrid() {
  const [showAll, setShowAll] = useState(false);
  const locale = useLocale();
  const { searchQuery } = useCustomerSearch();
  const [activeCategories, setActiveCategories] = useState<BackendCategory[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadCategories = () => {
      fetchServiceCategories().then((cats) => {
        if (mounted && Array.isArray(cats)) {
          setActiveCategories(cats);
        }
      });
    };

    loadCategories();

    // Re-fetch on tab focus and periodically so changes in Admin reflect dynamically
    window.addEventListener("focus", loadCategories);
    const interval = setInterval(loadCategories, 5000);
    return () => {
      mounted = false;
      window.removeEventListener("focus", loadCategories);
      clearInterval(interval);
    };
  }, []);

  const activeServices = useMemo(() => {
    if (!activeCategories) return ALL_SERVICES;

    const filtered = ALL_SERVICES.filter((service) =>
      isServiceActive(service, activeCategories)
    );

    const seenTitles = new Set(filtered.map((s) => s.title.toLowerCase()));

    // Also include custom active categories created by Admin that aren't in seeded list
    const customServices: ServiceItem[] = activeCategories
      .filter(
        (b) =>
          !b.id.startsWith("seed-category-") &&
          !seenTitles.has(b.name.toLowerCase())
      )
      .map((b) => {
        const asset = pickCategoryAsset(b.name);
        return {
          id: b.id,
          title: b.name,
          titleUr: b.nameUrdu || b.name,
          image: asset.image,
          icon: asset.icon,
          gradient: asset.gradient,
          href: `/customer/post-job?category=${encodeURIComponent(b.id)}`,
        };
      });

    return [...filtered, ...customServices];
  }, [activeCategories]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Live-filter services: case-insensitive, partial match on title (EN/UR), subCategory, and id
  const displayedServices = useMemo(() => {
    if (!normalizedQuery) {
      return showAll ? activeServices : activeServices.slice(0, 12);
    }
    return activeServices.filter((service) => {
      const matchesTitle = service.title.toLowerCase().includes(normalizedQuery);
      const matchesTitleUr = service.titleUr.includes(searchQuery.trim());
      const matchesSubCategory = service.subCategory
        ?.toLowerCase()
        .includes(normalizedQuery);
      const matchesId = service.id.toLowerCase().includes(normalizedQuery);
      return matchesTitle || matchesTitleUr || matchesSubCategory || matchesId;
    });
  }, [normalizedQuery, searchQuery, showAll, activeServices]);

  const isSearching = normalizedQuery.length > 0;

  return (
    <section className="flex flex-col gap-3 w-full flex-1 min-h-[320px] sm:min-h-[440px]">
      {/* Top Header with "Show All Services" Button on the Right */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-bold text-[#123B5D]">
          {locale === "ur" ? "سروس منتخب کریں" : "Select Service"}
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

      {/* 2 in 1 line on Mobile, 4 in 1 line on Desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 w-full content-start">
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
              {/* Inner Media Container - Image or Dynamic Neutral Placeholder */}
              <ServiceCardMedia
                service={service}
                displayTitle={displayTitle}
                priority={index < 4}
              />

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

      {/* Empty search results state */}
      {isSearching && displayedServices.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 py-16 gap-2 text-center animate-in fade-in duration-200">
          <SearchX className="size-8 text-slate-300" />
          <p className="text-sm font-bold text-slate-500">
            {locale === "ur" ? "کوئی نتیجہ نہیں ملا" : "No results found"}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {locale === "ur"
              ? "کوئی اور لفظ آزمائیں"
              : "Try a different search term"}
          </p>
        </div>
      )}
    </section>
  );
}
