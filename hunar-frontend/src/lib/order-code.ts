/** Exact format: LLD-DDL (e.g. AW3-90W) */
export const ORDER_CODE_REGEX = /^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

export function isOrderCode(value: unknown): value is string {
  return typeof value === 'string' && ORDER_CODE_REGEX.test(value.trim());
}

export function formatOrderCode(code: string, prefixHash = false): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  return prefixHash ? `#${clean}` : clean;
}

export function generateMockOrderCode(): string {
  const randChar = (charset: string) => charset[Math.floor(Math.random() * charset.length)];
  return `${randChar(LETTERS)}${randChar(LETTERS)}${randChar(DIGITS)}-${randChar(DIGITS)}${randChar(DIGITS)}${randChar(LETTERS)}`;
}
