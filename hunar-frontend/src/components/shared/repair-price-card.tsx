import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatRs } from "@/lib/money";
import { cn } from "@/lib/utils";

export function RepairPriceCard({
  label,
  amount,
  hint,
  amountLabel,
  className,
}: {
  label: string;
  amount: number;
  hint?: React.ReactNode;
  amountLabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
            <Wrench aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-navy">
              {formatRs(amount)}
            </p>
            {amountLabel ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {amountLabel}
              </p>
            ) : null}
          </div>
        </div>
        {hint ? (
          <div className="shrink-0 text-right text-xs text-muted-foreground">
            {hint}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}