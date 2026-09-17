import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import type { HunarStatus } from "@/lib/design-tokens";

const STATUS_CLASS: Record<HunarStatus, string> = {
  pending: "bg-status-pending/10 text-status-pending",
  accepted: "bg-status-active/10 text-status-active",
  active: "bg-status-active/10 text-status-active",
  inProgress: "bg-status-in-progress/10 text-status-in-progress",
  completed: "bg-status-completed/10 text-status-completed",
  paid: "bg-status-completed/10 text-status-completed",
  cancelled: "bg-status-cancelled/10 text-status-cancelled",
  rejected: "bg-status-cancelled/10 text-status-cancelled",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: HunarStatus;
  label: string;
  className?: string;
}) {
  return <Badge className={cn(STATUS_CLASS[status], className)}>{label}</Badge>;
}