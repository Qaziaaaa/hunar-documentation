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
  const initials = review.reviewerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-teal/10 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy">
                {review.reviewerName}
              </p>
              <p className="text-xs text-muted-foreground">
                {review.job?.title
                  ? `${jobLabel}: ${review.job.title}`
                  : formatDate(review.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RatingStars rating={review.rating} />
            <time className="text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </time>
          </div>
        </div>
        {review.comment ? (
          <p className="text-sm leading-relaxed text-foreground">
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