"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Check, RefreshCw, Search, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import {
  CATEGORY_OPTIONS,
  CategoryOption,
  POPULAR_SEARCH_TAGS,
  createCustomCategoryOption,
} from "../data/categories";
import type { PostJobData, ServiceCategory } from "../types";
import { fetchServiceCategories, BackendCategory } from "../api/post-job-api";

interface Step1ServiceSelectProps {
  data: PostJobData;
  onChange: (updates: Partial<PostJobData>) => void;
  onNext: () => void;
  initialSearch?: string;
}

export function Step1ServiceSelect({
  data,
  onChange,
  onNext,
  initialSearch = "",
}: Step1ServiceSelectProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [backendCategories, setBackendCategories] = useState<BackendCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCategories = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const cats = await fetchServiceCategories();
      if (cats && cats.length > 0) {
        setBackendCategories(cats);
      } else {
        setLoadError(
          isUrdu
            ? "سرور سے سروس کیٹیگریز دستیاب نہیں ہو سکیں۔ براہ کرم بعد میں کوشش کریں۔"
            : "No service categories available from server. Please try again later."
        );
      }
    } catch {
      setLoadError(
        isUrdu
          ? "سرور سے رابطہ قائم نہیں ہو سکا۔ براہ کرم انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔"
          : "Unable to connect to server. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Map backend database categories into UI CategoryOptions. Every item retains its authentic database UUID/id.
  const resolvedCategoryOptions = useMemo<CategoryOption[]>(() => {
    if (!backendCategories.length) return [];

    return backendCategories.map((b) => {
      const bClean = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const preset = CATEGORY_OPTIONS.find(
        (p) =>
          p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === bClean ||
          p.id.toLowerCase().replace(/[^a-z0-9]/g, "") === bClean ||
          b.name.toLowerCase().includes(p.id.toLowerCase())
      );

      if (preset) {
        return {
          ...preset,
          id: b.id as ServiceCategory, // Authentic backend database ID
          name: b.name,
          urduName: b.nameUrdu || preset.urduName,
          suggestedFee:
            b.defaultVisitCharge != null && b.defaultVisitCharge > 0
              ? b.defaultVisitCharge
              : preset.suggestedFee || 500,
          commonIssues: Array.isArray(b.commonIssues) ? b.commonIssues : preset.commonIssues || [],
        };
      }

      return createCustomCategoryOption(
        b.id,
        b.name,
        b.nameUrdu || undefined,
        b.defaultVisitCharge || 500,
        Array.isArray(b.commonIssues) ? b.commonIssues : []
      );
    });
  }, [backendCategories]);

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return resolvedCategoryOptions;
    const q = searchQuery.toLowerCase();
    return resolvedCategoryOptions.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (isUrdu && cat.urduName.includes(q)) ||
        cat.subtitle.toLowerCase().includes(q)
    );
  }, [searchQuery, isUrdu, resolvedCategoryOptions]);

  const handleSelectCategory = (cat: CategoryOption) => {
    const isNew = data.category !== cat.id;
    onChange({
      category: cat.id,
      subCategory: "",
      title: data.title || "",
      description: data.description || "",
      suggestedVisitFee:
        isNew || !data.suggestedVisitFee
          ? cat.suggestedFee
          : data.suggestedVisitFee,
    });
  };

  const handleQuickTagClick = (tag: typeof POPULAR_SEARCH_TAGS[0]) => {
    const targetCategory = resolvedCategoryOptions.find(
      (c) =>
        c.id === tag.category ||
        c.name.toLowerCase().includes(tag.category.toLowerCase()) ||
        tag.category.toLowerCase().includes(c.name.toLowerCase())
    );
    if (targetCategory) {
      onChange({
        category: targetCategory.id,
        subCategory: "",
        title: isUrdu && tag.urduLabel ? tag.urduLabel : tag.label,
        description: data.description || "",
        suggestedVisitFee: targetCategory.suggestedFee,
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300 pb-24">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#123B5D]">
          {isUrdu ? "آج آپ کو کس سروس کی ضرورت ہے؟" : "What service do you need today?"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto mt-1">
          {isUrdu
            ? "تصدیق شدہ مقامی کاریگروں سے فوری معائنہ اور شفاف فکسڈ فیس حاصل کریں۔"
            : "Choose from our verified local technicians with guaranteed on-time arrival and transparent pricing."}
        </p>
      </div>

      {/* Search & Popular Searches */}
      <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-2.5">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 rtl:left-auto rtl:right-3.5 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isUrdu
                ? "سروس یا کاریگر تلاش کریں..."
                : "Search service, e.g. AC repair, plumber..."
            }
            className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-[#123B5D] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D] shadow-2xs transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 rtl:right-auto rtl:left-3 text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
            >
              {isUrdu ? "صاف کریں" : "Clear"}
            </button>
          ) : null}
        </div>

        {/* Popular Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 scrollbar-none">
          <span className="text-slate-600 font-bold whitespace-nowrap shrink-0 flex items-center gap-1">
            <Sparkles className="size-3 text-amber-500" />
            {isUrdu ? "مقبول:" : "Popular:"}
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => handleQuickTagClick(tag)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#0F8B8D] hover:text-[#0F8B8D] transition-colors whitespace-nowrap font-bold shadow-2xs cursor-pointer active:scale-95"
            >
              {isUrdu && tag.urduLabel ? tag.urduLabel : tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-slate-200 rounded" />
                  <div className="h-2.5 w-32 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="size-5 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        /* Error State with Retry Button */
        <div className="w-full max-w-xl mx-auto p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
          <AlertCircle className="size-8 text-amber-600 mx-auto" />
          <p className="text-sm font-semibold text-amber-900">{loadError}</p>
          <button
            type="button"
            onClick={loadCategories}
            className="px-4 py-2 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold hover:bg-[#0F8B8D]/90 flex items-center gap-1.5 mx-auto transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>{isUrdu ? "دوبارہ کوشش کریں" : "Retry"}</span>
          </button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="w-full max-w-md mx-auto p-8 text-center text-slate-500 text-sm">
          {isUrdu ? "کوئی سروس نہیں ملی" : "No matching service categories found."}
        </div>
      ) : (
        /* 2-Column Responsive Category Grid */
        <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-3">
          {filteredCategories.map((category) => {
            const isSelected = data.category === category.id;
            const Icon = category.icon;

            return (
              <div
                key={category.id}
                onClick={() => handleSelectCategory(category)}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? "bg-[#0F8B8D]/10 border-[#0F8B8D] shadow-xs"
                    : "bg-white border-slate-200 hover:border-[#0F8B8D]/40 shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-[#0F8B8D] text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="text-left rtl:text-right">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#123B5D]">
                      {isUrdu ? category.urduName : category.name}
                    </h3>
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-1">
                      {category.subtitle}
                    </p>
                  </div>
                </div>

                <div
                  className={`size-5 rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? "bg-[#0F8B8D] border-[#0F8B8D] text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected ? <Check className="size-3 stroke-[3]" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 sm:py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            {data.category ? (
              <span className="text-[#0F8B8D] font-bold">
                ✓ {isUrdu ? "سروس منتخب ہو گئی" : "Service selected"}
              </span>
            ) : (
              <span>{isUrdu ? "جاری رکھنے کے لیے ایک سروس منتخب کریں" : "Select a service to continue"}</span>
            )}
          </div>
          <button
            type="button"
            disabled={!data.category}
            onClick={onNext}
            className={`ms-auto px-6 py-2.5 rounded-full flex items-center gap-2 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 ${
              data.category
                ? "bg-[#0F8B8D] text-white hover:bg-[#0F8B8D]/90 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>{isUrdu ? "تفصیلات کی طرف بڑھیں" : "Continue to Details"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
