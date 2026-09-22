"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Search, Sparkles } from "lucide-react";
import { useLocale } from "next-intl";
import {
  CATEGORY_OPTIONS,
  CategoryOption,
  POPULAR_SEARCH_TAGS,
} from "../data/categories";
import type { PostJobData, ServiceCategory } from "../types";

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

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORY_OPTIONS;
    const q = searchQuery.toLowerCase();
    return CATEGORY_OPTIONS.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        (isUrdu && cat.urduName.includes(q)) ||
        cat.subtitle.toLowerCase().includes(q) ||
        cat.subCategories.some((sub) => sub.toLowerCase().includes(q))
    );
  }, [searchQuery, isUrdu]);

  const selectedCategory = CATEGORY_OPTIONS.find(
    (c) => c.id === data.category
  );

  const handleSelectCategory = (cat: CategoryOption) => {
    const isNew = data.category !== cat.id;
    onChange({
      category: cat.id,
      subCategory: isNew
        ? cat.subCategories[0] || ""
        : data.subCategory || cat.subCategories[0] || "",
      title: isNew && !data.title ? cat.defaultTitle || "" : data.title,
      description:
        isNew && !data.description ? cat.defaultDescription || "" : data.description,
      suggestedVisitFee:
        isNew || !data.suggestedVisitFee
          ? cat.suggestedFee
          : data.suggestedVisitFee,
    });
  };

  const handleQuickTagClick = (tag: typeof POPULAR_SEARCH_TAGS[0]) => {
    const targetCategory = CATEGORY_OPTIONS.find(
      (c) => c.id === tag.category
    );
    if (targetCategory) {
      onChange({
        category: tag.category as ServiceCategory,
        subCategory: tag.subCategory,
        title: targetCategory.defaultTitle || tag.subCategory,
        description: targetCategory.defaultDescription || "",
        suggestedVisitFee: targetCategory.suggestedFee,
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      {/* Header Section */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#123B5D]">
          {isUrdu ? "آج آپ کو کس سروس کی ضرورت ہے؟" : "What service do you need today?"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
          {isUrdu
            ? "تصدیق شدہ مقامی کاریگروں سے فوری معائنہ اور شفاف فکسڈ فیس حاصل کریں۔"
            : "Choose from our verified local technicians with guaranteed on-time arrival and transparent pricing."}
        </p>
      </div>

      {/* Search & Popular Searches */}
      <div className="w-full max-w-3xl mx-auto space-y-2.5">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 rtl:left-auto rtl:right-3.5 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isUrdu
                ? "اے سی سروس، پائپ لیک، الیکٹریکل وائرنگ، کارپینٹر تلاش کریں..."
                : "Search for AC repair, leaking pipe, electrical wiring, carpenter..."
            }
            className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-[#1A1A2E] placeholder-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] shadow-2xs transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 rtl:right-auto rtl:left-3 text-xs text-slate-400 hover:text-slate-600"
            >
              {isUrdu ? "صاف کریں" : "Clear"}
            </button>
          ) : null}
        </div>

        {/* Popular Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 scrollbar-none">
          <span className="text-slate-400 font-medium whitespace-nowrap shrink-0 flex items-center gap-1">
            <Sparkles className="size-3 text-amber-500" />
            {isUrdu ? "مقبول:" : "Popular:"}
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              onClick={() => handleQuickTagClick(tag)}
              className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-[#0F766E] hover:text-[#0F766E] transition-colors whitespace-nowrap font-medium shadow-2xs cursor-pointer active:scale-95"
            >
              {isUrdu && tag.urduLabel ? tag.urduLabel : tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Responsive Category Grid */}
      <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredCategories.map((category) => {
          const isSelected = data.category === category.id;
          const Icon = category.icon;

          return (
            <div
              key={category.id}
              onClick={() => handleSelectCategory(category)}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? "bg-[#0F766E]/5 border-[#0F766E] shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-[#0F766E] text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#123B5D]">
                    {isUrdu ? category.urduName : category.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    {category.subtitle}
                  </p>
                </div>
              </div>

              <div
                className={`size-5 rounded-full flex items-center justify-center shrink-0 border ${
                  isSelected
                    ? "bg-[#0F766E] border-[#0F766E] text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {isSelected ? <Check className="size-3 stroke-[3]" /> : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subcategory Selector when Category is Selected */}
      {selectedCategory && (
        <div className="w-full max-w-3xl mx-auto p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#123B5D]">
              Specific task in {selectedCategory.name}:
            </span>
            <span className="text-[11px] text-slate-500">
              Select one or type custom in next step
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategory.subCategories.map((sub) => {
              const isSubSelected = data.subCategory === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => onChange({ subCategory: sub, title: sub })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isSubSelected
                      ? "bg-[#0F766E] text-white border-[#0F766E] shadow-2xs font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]/50 hover:bg-slate-50"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Action */}
      <div className="w-full max-w-3xl mx-auto pt-3 border-t border-slate-200 flex justify-end">
        <button
          type="button"
          disabled={!data.category}
          onClick={onNext}
          className={`px-6 py-2.5 rounded-full flex items-center gap-2 text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-[0.99] ${
            data.category
              ? "bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <span>Continue to Details</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
