"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkerDashboardShell } from "@/features/worker-dashboard";
import { formatRsExact } from "@/lib/money";

export type PeriodType = "day" | "week" | "month";

export interface JobEarningRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  category: string;
  amount: number;
  date: Date; // JavaScript Date object
}

// Realistic mock job earnings data
const MOCK_EARNINGS_RECORDS: JobEarningRecord[] = [
  {
    id: "earn-101",
    jobId: "JOB-1024",
    jobTitle: "Kitchen Sink & Pipe Leak Repair",
    category: "Plumbing Repair",
    amount: 1200,
    date: new Date(2026, 8, 23, 14, 30), // 23 Sep 2026
  },
  {
    id: "earn-102",
    jobId: "JOB-1025",
    jobTitle: "AC Master Service & Gas Refill",
    category: "AC Servicing",
    amount: 850,
    date: new Date(2026, 8, 23, 16, 45), // 23 Sep 2026
  },
  {
    id: "earn-103",
    jobId: "JOB-1019",
    jobTitle: "Overhead Water Tank Repair",
    category: "Water Tank Repair",
    amount: 800,
    date: new Date(2026, 8, 22, 11, 15), // 22 Sep 2026
  },
  {
    id: "earn-104",
    jobId: "JOB-1020",
    jobTitle: "Main Switchboard Rewiring",
    category: "Electrician",
    amount: 650,
    date: new Date(2026, 8, 22, 15, 0), // 22 Sep 2026
  },
  {
    id: "earn-105",
    jobId: "JOB-1015",
    jobTitle: "Ceiling Fan Installation & Balance",
    category: "Electrician",
    amount: 1100,
    date: new Date(2026, 8, 20, 10, 20), // 20 Sep 2026
  },
  {
    id: "earn-106",
    jobId: "JOB-1012",
    jobTitle: "Bathroom Faucet & Shower Mixer Fix",
    category: "Plumbing",
    amount: 950,
    date: new Date(2026, 8, 18, 13, 10), // 18 Sep 2026
  },
  {
    id: "earn-107",
    jobId: "JOB-1008",
    jobTitle: "Wooden Door Lock Replacement",
    category: "Carpentry",
    amount: 1400,
    date: new Date(2026, 8, 15, 17, 30), // 15 Sep 2026
  },
  {
    id: "earn-108",
    jobId: "JOB-0995",
    jobTitle: "UPS Battery & Inverter Repair",
    category: "Electrician",
    amount: 1750,
    date: new Date(2026, 8, 10, 12, 0), // 10 Sep 2026
  },
  {
    id: "earn-109",
    jobId: "JOB-0988",
    jobTitle: "Main Line Circuit Breaker Fix",
    category: "Electrician",
    amount: 1500,
    date: new Date(2026, 7, 28, 11, 0), // 28 Aug 2026
  },
  {
    id: "earn-110",
    jobId: "JOB-0975",
    jobTitle: "Water Pump Servicing & Bearing",
    category: "Mechanic",
    amount: 2100,
    date: new Date(2026, 7, 15, 14, 20), // 15 Aug 2026
  },
];

// Helper to format date label & filter range
function getPeriodDetails(period: PeriodType, offset: number) {
  const baseDate = new Date(2026, 8, 23); // Reference date: 23 Sep 2026

  if (period === "day") {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + offset);

    const isToday = offset === 0;
    const dateStr = targetDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const label = isToday ? `${dateStr} (Today)` : dateStr;

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    return { label, start, end };
  }

  if (period === "week") {
    const endDate = new Date(baseDate);
    endDate.setDate(baseDate.getDate() + offset * 7);

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);

    const startStr = startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    const endStr = endDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const label = `${startStr} – ${endStr}`;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return { label, start, end };
  }

  // Month
  const targetDate = new Date(baseDate);
  targetDate.setMonth(baseDate.getMonth() + offset);

  const label = targetDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return { label, start, end };
}

import { useLocale } from "next-intl";

export function WorkerEarningsContent() {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [period, setPeriod] = useState<PeriodType>("day");
  const [offset, setOffset] = useState<number>(0);

  // Compute period range & filter jobs
  const { label: periodLabel, start, end } = useMemo(() => {
    return getPeriodDetails(period, offset);
  }, [period, offset]);

  // Active date formatted as YYYY-MM-DD for date input
  const activeDateIso = useMemo(() => {
    const baseDate = new Date(2026, 8, 23);
    const targetDate = new Date(baseDate);
    if (period === "day") {
      targetDate.setDate(baseDate.getDate() + offset);
    } else if (period === "week") {
      targetDate.setDate(baseDate.getDate() + offset * 7);
    } else {
      targetDate.setMonth(baseDate.getMonth() + offset);
    }
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [period, offset]);

  // Date picker selection handler
  const handleDateChange = (isoDateStr: string) => {
    if (!isoDateStr) return;
    const parts = isoDateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const chosenDate = new Date(year, month, day);
      const baseDate = new Date(2026, 8, 23);

      const diffTime = chosenDate.getTime() - baseDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      setPeriod("day");
      setOffset(diffDays);
    }
  };

  // Filter records in selected period
  const filteredRecords = useMemo(() => {
    return MOCK_EARNINGS_RECORDS.filter((rec) => {
      const time = rec.date.getTime();
      return time >= start.getTime() && time <= end.getTime();
    });
  }, [start, end]);

  // Calculate total income for period
  const totalIncome = useMemo(() => {
    return filteredRecords.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredRecords]);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    setOffset(0); // Reset offset on mode change
  };

  const handlePrev = () => {
    setOffset((prev) => prev - 1);
  };

  const handleNext = () => {
    if (offset < 0) {
      setOffset((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (Updated visual gradient matching desktop)                  */}
      {/* ========================================================================= */}
      <div className="max-w-2xl mx-auto space-y-6 md:hidden">
        {/* TOP SECTION — Total Income Banner */}
        <Card className="border-teal/20 bg-gradient-to-r from-[#123B5D] via-[#0F8B8D]/90 to-[#0F8B8D] text-white shadow-md overflow-hidden relative">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
          <CardContent className="p-5 sm:p-6 text-center space-y-5 relative z-10">
            {/* Period Selector Chips + Calendar Icon Button */}
            <div className="flex items-center justify-center gap-2">
              <div className="inline-flex rounded-xl bg-white/15 backdrop-blur-md p-1 text-xs font-semibold text-white border border-white/20">
                {(["day", "week", "month"] as PeriodType[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePeriodChange(p)}
                    className={`px-3.5 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                      period === p
                        ? "bg-white text-[#123B5D] shadow-xs font-bold"
                        : "hover:bg-white/20 text-white"
                    }`}
                  >
                    {isUrdu
                      ? p === "day"
                        ? "روزانہ"
                        : p === "week"
                        ? "ہفتہ وار"
                        : "ماہانہ"
                      : p}
                  </button>
                ))}
              </div>

              {/* Clean Calendar Icon Button (Right side, next to period selector, no label) */}
              <div className="relative shrink-0">
                <input
                  type="date"
                  value={activeDateIso}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Select date"
                />
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md text-white hover:bg-white/25 transition-colors cursor-pointer border border-white/20">
                  <Calendar className="size-4 text-white" />
                </div>
              </div>
            </div>

            {/* Navigation Arrows & Selected Period Header */}
            <div className="flex items-center justify-between gap-2 max-w-sm mx-auto bg-white/15 backdrop-blur-md p-2 rounded-xl border border-white/20">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="size-9 rounded-lg hover:bg-white/20 text-white cursor-pointer"
                title={isUrdu ? "گزشتہ دورانیے کا دیکھیں" : "Previous period"}
              >
                <ChevronLeft className="size-5" />
              </Button>

              <span className="text-xs sm:text-sm font-bold text-white truncate px-2">
                {periodLabel}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleNext}
                disabled={offset >= 0}
                className="size-9 rounded-lg hover:bg-white/20 text-white disabled:opacity-30 cursor-pointer"
                title={isUrdu ? "اگلے دورانیے کا دیکھیں" : "Next period"}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>

            {/* Total Income Display */}
            <div className="pt-1">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-200">
                {isUrdu ? "کل آمدنی" : "Total Income"}
              </p>
              <div className="mt-1 flex items-baseline justify-center gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                  {formatRsExact(totalIncome)}
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {isUrdu ? "روپے" : "PKR"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM SECTION — Earnings by Job */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-teal/10 text-teal font-bold">
                <TrendingUp className="size-4" />
              </span>
              <h3 className="text-sm font-bold text-navy">
                {isUrdu ? "جاب کے لحاظ سے آمدنی" : "Earnings by Job"}
              </h3>
            </div>
            <Badge variant="outline" className="text-xs border-slate-200 text-slate-600 bg-white">
              {filteredRecords.length} {isUrdu ? "کام" : filteredRecords.length === 1 ? "Job" : "Jobs"}
            </Badge>
          </div>

          {filteredRecords.length === 0 ? (
            <Card className="border-border bg-card p-8 text-center">
              <Briefcase className="mx-auto size-10 text-slate-300 mb-2" />
              <h4 className="text-sm font-semibold text-navy">
                {isUrdu ? "اس دورانیے میں کوئی آمدنی نہیں ہے" : "No Earnings for this Period"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                {isUrdu
                  ? "دیگر تاریخوں کی آمدنی دیکھنے کے لیے اوپر دیے گئے تیروں کو استعمال کریں۔"
                  : "Use the arrows above to view earnings for other dates."}
              </p>
            </Card>
          ) : (
            <ul className="space-y-2.5">
              {filteredRecords.map((item) => (
                <li key={item.id}>
                  <Card className="border-border/80 bg-card p-4 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left Info: Job ID & Title */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-navy text-white text-[11px] font-mono px-2 py-0.5">
                            {item.jobId}
                          </Badge>
                          <span className="text-xs font-medium text-slate-500">
                            {item.category}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-navy truncate">
                          {item.jobTitle}
                        </h4>

                        <p className="text-[11px] text-slate-400">
                          {item.date.toLocaleDateString(isUrdu ? "ur-PK" : "en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Right Info: Amount Earned */}
                      <div className="shrink-0 text-right">
                        <span className="text-base sm:text-lg font-extrabold text-emerald-600 block">
                          + {formatRsExact(amountForWorker(item.amount))}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {isUrdu ? "خالص آمدنی" : "Net Income"}
                        </span>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (Redesigned & Optimized for Larger Screens — md: and up)   */}
      {/* ========================================================================= */}
      <div className="hidden md:block max-w-6xl mx-auto space-y-6">
        {/* DESKTOP HEADER BANNER & STAT CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card 1: Total Earnings Banner */}
          <Card className="lg:col-span-2 border-teal/20 bg-gradient-to-r from-[#123B5D] via-[#0F8B8D]/90 to-[#0F8B8D] text-white shadow-md overflow-hidden relative">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
            <CardContent className="p-6 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-200">
                      {isUrdu ? "آمدنی کا خلاصہ" : "Earnings Overview"}
                    </p>
                    <h2 className="text-lg font-bold text-white">
                      {periodLabel}
                    </h2>
                  </div>
                </div>

                <Badge className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-none px-3 py-1 text-xs font-semibold">
                  {filteredRecords.length} {isUrdu ? "مکمل شدہ کام" : filteredRecords.length === 1 ? "Completed Job" : "Completed Jobs"}
                </Badge>
              </div>

              <div className="pt-2 flex items-baseline gap-3">
                <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                  {formatRsExact(totalIncome)}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {isUrdu ? "روپے (کل آمدنی)" : "PKR (Total Income)"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Controls & Period Navigator */}
          <Card className="border-slate-200 bg-white shadow-xs flex flex-col justify-between">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">
                  {isUrdu ? "دورانیہ منتخب کریں" : "Select Period"}
                </p>
                {/* Day / Week / Month Switcher + Calendar Button */}
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600 flex-1">
                    {(["day", "week", "month"] as PeriodType[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePeriodChange(p)}
                        className={`py-2 rounded-lg capitalize transition-all cursor-pointer text-center ${
                          period === p
                            ? "bg-[#0F8B8D] text-white shadow-xs font-bold"
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isUrdu
                          ? p === "day"
                            ? "روزانہ"
                            : p === "week"
                            ? "ہفتہ وار"
                            : "ماہانہ"
                          : p}
                      </button>
                    ))}
                  </div>

                  {/* Clean Calendar Icon Button (Right side, next to period selector, no label) */}
                  <div className="relative shrink-0">
                    <input
                      type="date"
                      value={activeDateIso}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      aria-label="Select date"
                    />
                    <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200/80">
                      <Calendar className="size-4 text-[#0F8B8D]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Navigation Buttons */}
              <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  className="size-9 rounded-lg hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title={isUrdu ? "گزشتہ دورانیے کا دیکھیں" : "Previous period"}
                >
                  <ChevronLeft className="size-5" />
                </Button>

                <span className="text-xs font-bold text-[#123B5D] truncate px-2 text-center">
                  {periodLabel}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={offset >= 0}
                  className="size-9 rounded-lg hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                  title={isUrdu ? "اگلے دورانیے کا دیکھیں" : "Next period"}
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DESKTOP TRANSACTIONS TABLE */}
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Table Top Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] font-bold">
                <TrendingUp className="size-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[#123B5D]">
                  {isUrdu ? "جاب کے لحاظ سے آمدنی" : "Earnings Transactions"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isUrdu
                    ? "منتخب کردہ دورانیے میں مکمل ہونے والے تمام کاموں کی تفصیلی فہرست"
                    : "Detailed statement of all completed jobs for the selected timeframe"}
                </p>
              </div>
            </div>

            <Badge variant="outline" className="text-xs border-slate-300 text-slate-700 bg-white px-3 py-1 font-semibold">
              {filteredRecords.length} {isUrdu ? "جاب ریکارڈز" : filteredRecords.length === 1 ? "Transaction" : "Transactions"}
            </Badge>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="mx-auto size-12 text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-[#123B5D]">
                {isUrdu ? "اس دورانیے میں کوئی آمدنی نہیں ہے" : "No Earnings for this Period"}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {isUrdu
                  ? "دیگر تاریخوں کی آمدنی دیکھنے کے لیے اوپر دیے گئے نیویگیشن بٹنوں کو استعمال کریں۔"
                  : "Use the period controls above to navigate to other days, weeks, or months."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11.5px] uppercase tracking-wider text-slate-600 font-extrabold">
                    <th className="py-3.5 px-6">{isUrdu ? "جاب آئی ڈی" : "Job ID"}</th>
                    <th className="py-3.5 px-6">{isUrdu ? "تاریخ اور وقت" : "Date & Time"}</th>
                    <th className="py-3.5 px-6">{isUrdu ? "کام / سروس" : "Job / Service"}</th>
                    <th className="py-3.5 px-6">{isUrdu ? "کیٹیگری" : "Category"}</th>
                    <th className="py-3.5 px-6 text-right">{isUrdu ? "آمدنی (PKR)" : "Amount Earned"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRecords.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Job ID */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center font-mono font-bold text-xs bg-[#123B5D] text-white px-2.5 py-1 rounded-md shadow-2xs">
                          {item.jobId}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-6 text-slate-600 text-xs font-semibold whitespace-nowrap">
                        {item.date.toLocaleDateString(isUrdu ? "ur-PK" : "en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        <span className="text-slate-400 ml-1">
                          {item.date.toLocaleTimeString(isUrdu ? "ur-PK" : "en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Job / Service Title */}
                      <td className="py-4 px-6 font-bold text-[#123B5D]">
                        <span className="group-hover:text-[#0F8B8D] transition-colors">
                          {item.jobTitle}
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                      </td>

                      {/* Amount Earned */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex flex-col items-end">
                          <span className="text-base font-extrabold text-emerald-600">
                            + {formatRsExact(amountForWorker(item.amount))}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            {isUrdu ? "خالص درآمد" : "Net Payout"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function amountForWorker(val: number): number {
  return val;
}

export default function WorkerEarningsPage() {
  return (
    <WorkerDashboardShell initialTab="earnings">
      <WorkerEarningsContent />
    </WorkerDashboardShell>
  );
}