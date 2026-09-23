import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-error/20 bg-error/5 px-6 py-14 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-error/10 text-error">
        <TriangleAlert aria-hidden="true" className="size-6" />
      </span>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-navy">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      ) : null}
    </div>
  );
}