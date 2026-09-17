// HUNAR commission calculation (10% of the locked visit charge; wallet disabled).
// Kept as a pure helper so the 10%-rule can be unit-tested without a database.
export function calculateCommission(visitCharge: number, commissionRate = 0.1): number {
  if (visitCharge < 0 || commissionRate < 0) {
    throw new Error('COMMISSION_INVALID: charge and rate must be non-negative');
  }
  return Math.round(visitCharge * commissionRate * 100) / 100;
}
