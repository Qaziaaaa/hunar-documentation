export const REDIS_PROVIDER = 'REDIS_PROVIDER';
export const REFRESH_TOKEN_PREFIX = 'refresh:';
export const OTP_PREFIX = 'otp:';
export const OTP_ATTEMPTS_PREFIX = 'otp:attempts:';
export const OTP_COOLDOWN_PREFIX = 'otp:cooldown:';
export const OTP_VERIFY_PREFIX = 'otp:verify:';
export const OTP_RATE_PREFIX = 'rate:otp:';
export const OTP_VERIFY_RATE_PREFIX = 'rate:verify:';
export const LOGIN_RATE_PREFIX = 'rate:login:';

// Wallet-specific Redis constants
export const WALLET_OTP_PREFIX = 'wallet:otp:';
export const WALLET_OTP_ATTEMPTS_PREFIX = 'wallet:otp:attempts:';
export const WALLET_IDEM_COMMISSION_HOLD = 'wallet:idem:commission:hold:';
export const WALLET_IDEM_COMMISSION_DEDUCT = 'wallet:idem:commission:deduct:';
export const WALLET_IDEM_COMMISSION_REVERSE = 'wallet:idem:commission:reverse:';
export const WALLET_IDEM_EARNINGS_CREDIT = 'wallet:idem:earnings:credit:';
export const WALLET_IDEM_TOPUP_CREDIT = 'wallet:idem:topup:credit:';
export const WALLET_IDEM_WITHDRAWAL = 'wallet:idem:withdrawal:';
