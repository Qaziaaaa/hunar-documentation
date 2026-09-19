import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "./rating-stars";
import type { WorkerRatingSummary } from "@/types/review";

export function RatingSummary({
  summary,
  title,
  reviewLabel,
  starLabel,
}: {
  summary: WorkerRatingSummary;
  title: string;
  reviewLabel: string;
  starLabel: string;
}) {
  const { average, totalReviews, breakdown } = summary;
  const maxCount = Math.max(1, ...Object.values(breakdown));

  return (
    <Card className="shadow-sm">
      <CardContent className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-5xl font-bold text-navy">{average}</p>
          <RatingStars rating={average} />
          <p className="text-sm text-muted-foreground">
            {totalReviews} {reviewLabel}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-2">
          <p className="text-sm font-medium text-navy">{title}</p>
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = breakdown[star] ?? 0;
            return (
              <div
                key={star}
                className="flex items-center gap-2"
                aria-label={`${star} ${starLabel}: ${count}`}
              >
                <span className="w-8 shrink-0 text-right text-xs font-medium text-muted-foreground">
                  {star}
                </span>
                <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    aria-hidden="true"
                    className="h-full rounded-full bg-orange"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-xs text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}