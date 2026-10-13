/** Exact format: LLD-DDL (e.g. AW3-90W) */
export const ORDER_CODE_REGEX = /^[A-Z]{2}[0-9]-[0-9]{2}[A-Z]$/;

export function isOrderCode(value: unknown): value is string {
  return typeof value === 'string' && ORDER_CODE_REGEX.test(value.trim());
}

export function formatOrderCode(code: string, prefixHash = false): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  return prefixHash ? `#${clean}` : clean;
}
