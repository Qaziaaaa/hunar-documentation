import { Banknote, CheckCircle2, Coins, Hourglass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    completedJobs?: string;
  };
}) {
  const cards = [
    {
      label: labels.totalEarned,
      value: formatRs(summary.totalEarned),
      hint: labels.totalEarnedHint,
      icon: Banknote,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      label: labels.totalCommission,
      value: formatRs(summary.totalCommission),
      hint: labels.totalCommissionHint,
      icon: Coins,
      color: "text-teal bg-teal/10 border-teal/20",
    },
    {
      label: labels.pendingCommission,
      value: formatRs(summary.pendingCommission),
      hint: labels.pendingCommissionHint,
      icon: Hourglass,
      color: "text-orange bg-orange/10 border-orange/20",
    },
    {
      label: labels.completedJobs ?? "Completed Jobs",
      value: `${summary.completedJobs ?? 6} Jobs`,
      hint: "Doorstep visits delivered",
      icon: CheckCircle2,
      color: "text-navy bg-navy/5 border-navy/15",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className="border border-border/80 shadow-xs hover:shadow-md transition-shadow bg-card"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground truncate">
                  {card.label}
                </span>
                <span
                  className={`flex size-9 items-center justify-center rounded-lg border ${card.color}`}
                >
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold tracking-tight text-navy">
                  {card.value}
                </span>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {card.hint}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
