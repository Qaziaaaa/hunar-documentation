import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "./rating-stars";
import type { Review } from "@/types/review";
import { formatDate } from "@/lib/format";

export function ReviewCard({
  review,
  jobLabel,
  noCommentLabel,
}: {
  review: Review;
  jobLabel: string;
  noCommentLabel: string;
}) {
  const displayName = review.reviewerName || (review as any)?.reviewer?.name || "Customer";
  // Strip '(Customer)', '(Worker)', and parenthesized suffixes, then extract initials
  const cleanDisplayName = displayName.replace(/\s*\([^)]*\)/g, "").trim() || displayName;
  const initials =
    cleanDisplayName
      .split(/\s+/)
      .filter(Boolean)
      .map((part: string) => part.replace(/[^a-zA-Z0-9]/g, "")[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "C";

  return (
    <Card className="shadow-sm overflow-hidden w-full">
      <CardContent className="flex flex-col gap-3 min-w-0 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className="bg-teal/10 text-xs font-semibold text-teal">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {review.job?.title
                  ? `${jobLabel}: ${review.job.title}`
                  : formatDate(review.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <RatingStars rating={review.rating} />
            <time className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </time>
          </div>
        </div>
        {review.comment ? (
          <p className="text-sm leading-relaxed text-foreground break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap">
            {review.comment}
          </p>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            {noCommentLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}