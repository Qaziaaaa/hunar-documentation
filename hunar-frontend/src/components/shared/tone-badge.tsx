import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  BADGE_TONE_CLASS,
  DOT_TONE_CLASS,
  type Tone,
} from "@/lib/status-meta";

export function ToneBadge({
  tone,
  label,
  withDot = false,
  className,
}: {
  tone: Tone;
  label: React.ReactNode;
  withDot?: boolean;
  className?: string;
}) {
  return (
    <Badge
      className={cn(BADGE_TONE_CLASS[tone], className)}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full",
            DOT_TONE_CLASS[tone]
          )}
        />
      ) : null}
      <span>{label}</span>
    </Badge>
  );
}