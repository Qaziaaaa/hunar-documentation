import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  className,
  showValue = false,
  size = "size-3.5",
  label,
}: {
  rating: number;
  className?: string;
  showValue?: boolean;
  size?: string;
  label?: string;
}) {
  const fullStars = Math.floor(rating);
  const remainder = rating - fullStars;
  const hasHalfStar = remainder >= 0.25 && remainder < 0.75;
  const roundedFullStars = remainder >= 0.75 ? fullStars + 1 : fullStars;

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={label ?? `Rated ${rating} out of 5`}
    >
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          if (starIndex <= roundedFullStars) {
            return (
              <Star
                key={starIndex}
                aria-hidden="true"
                className={cn(size, "fill-amber-400 text-amber-400")}
              />
            );
          }
          if (starIndex === roundedFullStars + 1 && hasHalfStar) {
            return (
              <StarHalf
                key={starIndex}
                aria-hidden="true"
                className={cn(size, "fill-amber-400 text-amber-400")}
              />
            );
          }
          return (
            <Star
              key={starIndex}
              aria-hidden="true"
              className={cn(size, "fill-slate-200 text-slate-300")}
            />
          );
        })}
      </span>
      {showValue ? (
        <span className="text-xs font-bold text-navy">
          {rating.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}