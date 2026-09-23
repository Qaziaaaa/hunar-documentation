export const PLATFORM_WALLET_ID = 'platform';
export const WALLET_INITIAL_BALANCE = 0;
export const WALLET_MAX_NEGATIVE_BALANCE = -500;
export const WALLET_MIN_WITHDRAWAL = 100;
export const WALLET_TOPUP_PAYMENT_NUMBER = '+92 314 0837519';
export const INSUFFICIENT_BALANCE_MESSAGE =
  'Insufficient wallet balance. Please top up before arriving.';
export const WALLET_IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;
export const WALLET_COMPLETION_OTP_TTL_SECONDS = 5 * 60;
export const WALLET_COMPLETION_OTP_MAX_ATTEMPTS = 3;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
