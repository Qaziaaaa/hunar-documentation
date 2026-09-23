import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
    >
      <Loader2 aria-hidden="true" className="size-8 animate-spin text-teal" />
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : null}
      <span className="sr-only">Loading</span>
    </div>
  );
}