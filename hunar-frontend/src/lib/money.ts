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

/**
 * Sanitizes numeric/price input values:
 * 1. Returns empty string "" when cleared.
 * 2. Strips redundant leading zeros (e.g. "0120" -> "120", "05" -> "5", "00" -> "0").
 * 3. Preserves valid single "0" and decimals like "0.5" or "12.50".
 */
export function sanitizePriceInput(rawValue: string | number | undefined | null): string {
  if (rawValue === "" || rawValue === undefined || rawValue === null) return "";
  const str = String(rawValue).trim();
  if (str === "") return "";
  // If multiple zeros like "00", reduce to single "0"
  if (/^0{2,}$/.test(str)) return "0";
  // If starts with "0" followed by a digit 0-9 (e.g. "0120", "05"), strip leading zeros
  if (/^0+[0-9]/.test(str) && !str.startsWith("0.")) {
    const stripped = str.replace(/^0+/, "");
    return stripped === "" ? "0" : stripped;
  }
  return str;
}

export function parsePriceOrZero(value: string | number | undefined | null): number {
  if (value === "" || value === undefined || value === null) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export function parsePriceOrUndefined(value: string | number | undefined | null): number | undefined {
  if (value === "" || value === undefined || value === null) return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}