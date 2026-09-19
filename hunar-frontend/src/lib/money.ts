import { HUNAR_CONFIG } from "./config";

export function formatRs(amount: number): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `Rs. ${formatted}`;
}

export function formatRsExact(amount: number): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return `Rs. ${formatted}`;
}

export function calculateCommission(
  visitCharge: number,
  rate: number = HUNAR_CONFIG.commissionRate,
): number {
  if (visitCharge < 0 || rate < 0) {
    throw new Error("COMMISSION_INVALID: charge and rate must be non-negative");
  }
  return Math.round(visitCharge * rate * 100) / 100;
}

export function calculateTotalEarned(
  visitCharge: number,
  repairCharge: number,
): number {
  return visitCharge + repairCharge;
}