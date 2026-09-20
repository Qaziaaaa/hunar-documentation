"use client";

import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Search,
  Shield,
  Sparkles,
  ThumbsUp,
  X,
} from "lucide-react";
import { FaqCategory, FaqItem } from "../types";

interface FaqAccordionProps {
  faqs: FaqItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function FaqAccordion({
  faqs,
  searchQuery,
  onSearchChange,
}: FaqAccordionProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [activeCategory, setActiveCategory] = useState<FaqCategory>("all");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    "faq-price-1": true,
    "faq-safety-1": true,
  });
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, boolean>>({});

  const categories: {
    id: FaqCategory;
    label: string;
    icon: typeof HelpCircle;
    count: number;
  }[] = [
    {
      id: "all",
      label: isUrdu ? "تمام سوالات" : "All Questions",
      icon: HelpCircle,
      count: faqs.length,
    },
    {
      id: "pricing",
      label: isUrdu ? "فیس اور ادائیگیاں" : "Pricing & Direct Payments",
      icon: CreditCard,
      count: faqs.filter((f) => f.category === "pricing").length,
    },
    {
      id: "safety",
      label: isUrdu ? "حفاظتی PIN اور آمد" : "Safety PIN & Doorstep",
      icon: Shield,
      count: faqs.filter((f) => f.category === "safety").length,
    },
    {
      id: "booking",
      label: isUrdu ? "بکنگ میں تبدیلی اور شیڈول" : "Booking Changes & Schedule",
      icon: Calendar,
      count: faqs.filter((f) => f.category === "booking").length,
    },
    {
      id: "guarantee",
      label: isUrdu ? "معیار اور 5 روزہ وارنٹی" : "Quality & 5-Day Warranty",
      icon: Sparkles,
      count: faqs.filter((f) => f.category === "guarantee").length,
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesQuery =
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        (faq.badge && faq.badge.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [faqs, activeCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleHelpful = (id: string) => {
    setHelpfulFeedback((prev) => ({
      ...prev,
      [id]: true,
    }));
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-6">
      {/* FAQ Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 rtl:text-right">
          <div className="w-1.5 h-6 bg-[#0F8B8D] rounded-full" />
          <div>
            <h2 className="text-lg font-bold text-[#123B5D]">
              {isUrdu ? "اکثر پوچھے گئے سوالات" : "Frequently Asked Questions"}
            </h2>
            <p className="text-xs text-slate-500">
              {isUrdu
                ? "فیس، سیکیورٹی اور بکنگ سے متعلق عام سوالات کے جوابات"
                : "Instant answers to common queries about pricing, safety, and bookings"}
            </p>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="size-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isUrdu
                ? "سوالات تلاش کریں (مثلاً پن، 300 روپے، منسوخی)..."
                : "Search questions (e.g. PIN, Rs. 300, cancel)..."
            }
            className="w-full h-10 pl-9 pr-8 rtl:pr-9 rtl:pl-8 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none transition-all placeholder:text-slate-400 rtl:text-right"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="size-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 absolute right-2.5 rtl:right-auto rtl:left-2.5 top-2.5 flex items-center justify-center transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0F8B8D] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Accordion List */}
      <div className="flex flex-col gap-3">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
            <HelpCircle className="size-8 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">
              {isUrdu ? "کوئی مماثل سوال نہیں ملا" : "No matching questions found"}
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm">
              {isUrdu
                ? "مختلف الفاظ سے تلاش کریں یا براہ راست ہماری 24/7 ہیلپ لائن سے رابطہ کریں۔"
                : "Try searching with different keywords or contact our 24/7 customer helpline directly."}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("all");
                onSearchChange("");
              }}
              className="mt-2 text-xs font-bold text-[#0F8B8D] hover:underline cursor-pointer"
            >
              {isUrdu ? "تلاش اور فلٹرز دوبارہ ترتیب دیں" : "Reset Search & Filters"}
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = !!openIds[faq.id];
            const isHelpfulMarked = !!helpfulFeedback[faq.id];

            return (
              <div
                key={faq.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-[#0F8B8D]/40 bg-slate-50/50 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Accordion Summary / Header */}
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between p-4 text-left rtl:text-right transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 pr-2 rtl:pr-0 rtl:pl-2 min-w-0">
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        isOpen ? "bg-[#0F8B8D]" : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-bold text-[#123B5D]">
                      {faq.question}
                    </span>
                    {faq.badge && (
                      <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F8B8D]/10 text-[#0F8B8D] border border-[#0F8B8D]/20 shrink-0">
                        {faq.badge}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#0F8B8D]" : ""
                    }`}
                  />
                </button>

                {/* Accordion Detail / Answer */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 flex flex-col gap-3 animate-in fade-in-50 duration-150 rtl:text-right">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>

                    {/* Feedback Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                      <span className="italic">
                        {isUrdu ? "ہنر تصدیق شدہ پالیسی" : "HUNAR Verified Policy"}
                      </span>
                      <div className="flex items-center gap-2">
                        {isHelpfulMarked ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Check className="size-3" />
                            {isUrdu ? "آپ کی رائے کا شکریہ!" : "Thank you for your feedback!"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleHelpful(faq.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-[#0F8B8D] text-slate-600 hover:text-[#0F8B8D] transition-colors cursor-pointer"
                          >
                            <ThumbsUp className="size-3" />
                            <span>{isUrdu ? "مفید رہا" : "Helpful"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

