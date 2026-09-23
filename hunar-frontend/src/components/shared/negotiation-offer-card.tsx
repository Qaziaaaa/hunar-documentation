import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRs } from "@/lib/money";
import { formatDateTime } from "@/lib/format";

export function NegotiationOfferCard({
  actorLabel,
  amount,
  note,
  timestamp,
  canAccept,
  canReject,
  canCounter,
  lockedLabel,
  acceptLabel,
  rejectLabel,
  counterLabel,
  onAccept,
  onReject,
  onCounter,
}: {
  actorLabel: string;
  amount: number;
  note?: string;
  timestamp: string;
  canAccept: boolean;
  canReject: boolean;
  canCounter: boolean;
  lockedLabel?: string;
  acceptLabel: string;
  rejectLabel: string;
  counterLabel: string;
  onAccept: () => void;
  onReject?: () => void;
  onCounter?: () => void;
}) {
  const anyAction = canAccept || canReject || canCounter;
  return (
    <Card className="border-orange/40 shadow-sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
            <Handshake aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy">{actorLabel}</p>
            <time className="text-xs text-muted-foreground">
              {formatDateTime(timestamp)}
            </time>
          </div>
        </div>
        <p className="text-2xl font-bold text-navy">{formatRs(amount)}</p>
        {note ? (
          <p className="text-sm text-muted-foreground">{note}</p>
        ) : null}
        {lockedLabel ? (
          <p className="text-sm font-medium text-teal">{lockedLabel}</p>
        ) : null}
        {anyAction ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {canAccept ? (
              <Button
                className="bg-teal hover:bg-teal/85"
                onClick={onAccept}
              >
                {acceptLabel}
              </Button>
            ) : null}
            {canCounter ? (
              <Button variant="outline" onClick={onCounter}>
                {counterLabel}
              </Button>
            ) : null}
            {canReject && onReject ? (
              <Button variant="ghost" onClick={onReject}>
                {rejectLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}