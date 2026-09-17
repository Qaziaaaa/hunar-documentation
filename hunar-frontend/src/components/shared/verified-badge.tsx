import { Check } from "lucide-react";
import { cn } from "cn";

export function VerifiedBadge({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title ?? "Verified"}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-teal text-white",
        className,
      )}
    >
      <Check aria-hidden="true" className="size-3" />
    </span>
  );
}