"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import type { PaymentTransaction } from "@/types/admin";
import { AreaChart } from "./area-chart";
import { SegControl } from "./seg-control";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const RANGE_OPTIONS = RANGES.map((r) => ({ value: r, label: `${r} days` })) as readonly {
  value: Range;
  label: string;
}[];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Daily commission per day for the last `range` days (current window). */
function buildDailySeries(transactions: PaymentTransaction[], range: Range): number[] {
  const todayStart = startOfDay(new Date());
  const totals = new Array<number>(range).fill(0);
  for (const tx of transactions) {
    if (tx.status === "REFUNDED") continue;
    const dayIndex = Math.floor((todayStart - startOfDay(new Date(tx.timestamp))) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < range) totals[range - 1 - dayIndex] += tx.commission;
  }
  return totals;
}

/** Previous equal-length window sum (sample's "vs the N days before"). */
function previousWindowSum(transactions: PaymentTransaction[], range: Range): number {
  const todayStart = startOfDay(new Date());
  let sum = 0;
  for (const tx of transactions) {
    if (tx.status === "REFUNDED") continue;
    const t = startOfDay(new Date(tx.timestamp));
    const dayIndex = Math.floor((todayStart - t) / 86_400_000);
    if (dayIndex >= range && dayIndex < range * 2) sum += tx.commission;
  }
  return sum;
}

const DAY_FMT = new Intl.DateTimeFormat("en-PK", { month: "short", day: "numeric" });

export function DashboardHeroCard({
  totalRevenue,
  transactions,
  commissionRate,
}: {
  totalRevenue: number;
  transactions: PaymentTransaction[];
  commissionRate?: number | null;
}) {
  const [range, setRange] = useState<Range>(30);
  // Sample hero count-up runs ~1.4s power3.out.
  const revenue = useCountUp(totalRevenue, 1400);
  const series = useMemo(() => buildDailySeries(transactions, range), [transactions, range]);
  const prevSum = useMemo(() => previousWindowSum(transactions, range), [transactions, range]);
  const labels = useMemo(() => {
    const today = startOfDay(new Date());
    return series.map((_, i) => {
      const daysAgo = series.length - 1 - i;
      return DAY_FMT.format(new Date(today - daysAgo * 86_400_000));
    });
  }, [series]);

  const seriesSum = series.reduce((a, b) => a + b, 0);
  const deltaPct = prevSum > 0 ? ((seriesSum - prevSum) / prevSum) * 100 : null;
  const up = (deltaPct ?? 0) >= 0;

  return (
    <article className="wf-card wf-hero" data-card>
      <header className="wf-card__head">
        <div>
          <h3 className="wf-card__title">Platform Revenue</h3>
          <p className="wf-card__sub">Escrow payouts, all channels</p>
        </div>
        <SegControl
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
          label="Revenue range"
        />
      </header>

      <div className="wf-hero__figure">
        <p className="wf-hero__num">Rs. {revenue.toLocaleString()}</p>
        <p className="wf-hero__delta">
          {deltaPct !== null ? (
            <>
              <span className={`wf-delta ${up ? "" : "wf-delta--down"}`}>
                {up ? <ArrowUpRight aria-hidden /> : <ArrowDownRight aria-hidden />}
                {up ? "+" : ""}
                {deltaPct.toFixed(1)}%
              </span>
              <span className="muted">vs the {range} days before</span>
            </>
          ) : (
            <span className="wf-delta wf-delta--flat">
              {commissionRate != null
                ? `${Math.round(commissionRate * 100)}% commission fee`
                : "Commission fee applied"}
            </span>
          )}
        </p>
      </div>

      <div className="wf-hero__chart">
        <AreaChart points={series} labels={labels} detailed />
      </div>
    </article>
  );
}
