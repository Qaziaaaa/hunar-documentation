export const DESIGN_TOKENS = {
  colors: {
    navy: "#123B5D",
    teal: "#0F8B8D",
    orange: "#F59E0B",
    background: "#F8FAFC",
    card: "#FFFFFF",
    text: "#172033",
    textSecondary: "#64748B",
    success: "#16A34A",
    error: "#DC2626",
  },
  status: {
    pending: "#F59E0B",
    accepted: "#0F8B8D",
    active: "#0F8B8D",
    inProgress: "#123B5D",
    completed: "#16A34A",
    paid: "#16A34A",
    cancelled: "#DC2626",
    rejected: "#DC2626",
  },
} as const;

export type OrderworkerStatus =
  | "pending"
  | "accepted"
  | "active"
  | "inProgress"
  | "completed"
  | "paid"
  | "cancelled"
  | "rejected";

export type HunarStatus = OrderworkerStatus;

export function statusColor(status: OrderworkerStatus): string {
  return DESIGN_TOKENS.status[status] ?? DESIGN_TOKENS.status.pending;
}

const CURRENCY = "Rs.";

export function formatRs(amount: number): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${CURRENCY} ${formatted}`;
}