"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
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

function WorkerEarningsContent() {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [offset, setOffset] = useState<number>(0);

  // Compute period range & filter jobs
  const { label: periodLabel, start, end } = useMemo(() => {
    return getPeriodDetails(period, offset);
  }, [period, offset]);

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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 1. TOP SECTION — Total Income (~30% of screen) */}
      <Card className="border-teal/20 bg-gradient-to-b from-teal/5 via-navy/5 to-white shadow-xs overflow-hidden">
        <CardContent className="p-5 sm:p-6 text-center space-y-5">
          {/* Period Selector Chips (Day / Week / Month) */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            {(["day", "week", "month"] as PeriodType[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  period === p
                    ? "bg-teal text-white shadow-xs font-bold"
                    : "hover:bg-slate-200 text-slate-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Navigation Arrows & Selected Period Header */}
          <div className="flex items-center justify-between gap-2 max-w-sm mx-auto bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-slate-200/80">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              className="size-9 rounded-lg hover:bg-slate-100 text-slate-700"
              title="Previous period"
            >
              <ChevronLeft className="size-5" />
            </Button>

            <span className="text-xs sm:text-sm font-bold text-navy truncate px-2">
              {periodLabel}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={offset >= 0}
              className="size-9 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-30"
              title="Next period"
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          {/* Total Income Display */}
          <div className="pt-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Total Income
            </p>
            <div className="mt-1 flex items-baseline justify-center gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-navy">
                {formatRsExact(totalIncome)}
              </span>
              <span className="text-xs font-semibold text-slate-500">PKR</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. BOTTOM SECTION — Earnings by Job (~70% of screen) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal/10 text-teal font-bold">
              <TrendingUp className="size-4" />
            </span>
            <h3 className="text-sm font-bold text-navy">Earnings by Job</h3>
          </div>
          <Badge variant="outline" className="text-xs border-slate-200 text-slate-600 bg-white">
            {filteredRecords.length} {filteredRecords.length === 1 ? "Job" : "Jobs"}
          </Badge>
        </div>

        {filteredRecords.length === 0 ? (
          <Card className="border-border bg-card p-8 text-center">
            <Briefcase className="mx-auto size-10 text-slate-300 mb-2" />
            <h4 className="text-sm font-semibold text-navy">No Earnings for this Period</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Use the arrows above to view earnings for other dates.
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
                        {item.date.toLocaleDateString("en-GB", {
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
                        Net Income
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