import type { NegotiationEntry } from "@/types/repair";
import { formatRs } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NegotiationTimeline({
  entries,
  workerLabel,
  customerLabel,
  roundLabel,
}: {
  entries: NegotiationEntry[];
  workerLabel: string;
  customerLabel: string;
  roundLabel: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {roundLabel}
      </p>
    );
  }
  return (
    <ol className="relative space-y-4 border-s border-border ps-5 ms-2">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1;
        const isWorker = entry.by === "worker";
        return (
          <li key={`${entry.timestamp}-${index}`} className="relative">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -start-[26px] top-1 size-3 rounded-full ring-4 ring-background",
                isLast ? "bg-orange" : "bg-teal/60"
              )}
            />
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy">
                  {isWorker ? workerLabel : customerLabel}
                </p>
                <time className="text-xs text-muted-foreground">
                  {formatDateTime(entry.timestamp)}
                </time>
              </div>
              <p className="text-lg font-bold text-navy">
                {formatRs(entry.amount)}
              </p>
              {entry.note ? (
                <p className="text-sm text-muted-foreground">{entry.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}