const DEFAULT_REDIRECT = "/customer/dashboard";

/**
 * Returns the given redirect target only when it is a safe internal path,
 * otherwise falls back to the customer dashboard. Guards against open
 * redirects (absolute URLs, protocol-relative `//host`, etc.).
 */
export function getSafeRedirect(
  redirect: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (!redirect) return fallback;
  if (!redirect.startsWith("/")) return fallback;
  if (redirect.startsWith("//") || redirect.startsWith("/\\")) return fallback;
  return redirect;
}
