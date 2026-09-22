import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  className,
  showValue = false,
  label,
}: {
  rating: number;
  className?: string;
  showValue?: boolean;
  label?: string;
}) {
  const filled = Math.round(rating);
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={label ?? `Rated ${rating} out of 5`}
    >
      <span className="inline-flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            aria-hidden="true"
            className={cn(
              "size-4",
              star <= filled
                ? "fill-orange text-orange"
                : "fill-muted text-muted"
            )}
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-sm font-medium text-navy">
          {rating}
          <span className="text-muted-foreground">/5</span>
        </span>
      ) : null}
    </span>
  );
}