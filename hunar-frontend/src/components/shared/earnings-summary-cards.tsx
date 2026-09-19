import { Banknote, Coins, Hourglass } from "lucide-react";
import { StatCard } from "./stat-card";
import { formatRs } from "@/lib/money";
import type { EarningsSummary } from "@/types/finance";

export function EarningsSummaryCards({
  summary,
  labels,
}: {
  summary: EarningsSummary;
  labels: {
    totalEarned: string;
    totalEarnedHint: string;
    totalCommission: string;
    totalCommissionHint: string;
    pendingCommission: string;
    pendingCommissionHint: string;
  };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label={labels.totalEarned}
        value={formatRs(summary.totalEarned)}
        hint={labels.totalEarnedHint}
        icon={Banknote}
      />
      <StatCard
        label={labels.totalCommission}
        value={formatRs(summary.totalCommission)}
        hint={labels.totalCommissionHint}
        icon={Coins}
      />
      <StatCard
        label={labels.pendingCommission}
        value={formatRs(summary.pendingCommission)}
        hint={labels.pendingCommissionHint}
        icon={Hourglass}
      />
    </div>
  );
}
