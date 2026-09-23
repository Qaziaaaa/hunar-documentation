import { LockKeyhole } from "lucide-react";
import { formatRs } from "@/lib/money";
import { formatDateTime } from "@/lib/format";

export function LockedPriceBadge({
  amount,
  lockedAt,
}: {
  amount: number;
  lockedAt?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-teal/30 bg-teal/5 p-4">
      <div className="flex items-center gap-2">
        <LockKeyhole aria-hidden="true" className="size-5 text-teal" />
        <div>
          <p className="text-sm font-semibold text-navy">
            Repair price locked
          </p>
          <p className="text-xs text-muted-foreground">
            The agreed price cannot be changed without customer approval.
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold text-navy">
          {formatRs(amount)}
        </span>
        {lockedAt ? (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(lockedAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}