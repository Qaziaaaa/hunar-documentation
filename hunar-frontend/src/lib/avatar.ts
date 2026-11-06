/**
 * Resolves a stored avatar URL or path to an accessible, absolute URL.
 * Handles absolute URLs (http, https, data, blob) and relative backend paths
 * (such as /uploads/profile-photos/... or profile-photos/...).
 */
export function resolveAvatarUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Already absolute or supported browser data/blob scheme
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Prepend backend origin for relative paths
  const backendOrigin =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api(\/v\d+)?\/?$/, "")
      : "") || "http://localhost:4000";

  let cleanPath = trimmed;
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }

  // If path is stored directly as /profile-photos/... instead of /uploads/profile-photos/...
  if (cleanPath.startsWith("/profile-photos/")) {
    cleanPath = `/uploads${cleanPath}`;
  }

  return `${backendOrigin}${cleanPath}`;
}
