export const URGENT_OFFER_TTL_SECONDS = 50;

export interface UrgentOfferTimerInfo {
  remainingMs: number;
  remainingSeconds: number;
  progress: number; // 0 to 1
  isExpired: boolean;
}

export interface UrgentOfferTimeSource {
  id?: string;
  createdAt?: string | number | Date | null;
  expiresAt?: string | number | Date | null;
  serverTime?: string | number | Date | null;
}

// In-memory cache to pin each offer's client-local expiration target timestamp.
// This guarantees smooth countdown across ticks and eliminates client-server clock drift.
const expiryCache = new Map<string, number>();
const weakExpiryCache = new WeakMap<object, number>();

export function clearOfferExpiryCache(keyOrId?: string): void {
  if (keyOrId) {
    expiryCache.delete(keyOrId);
    // Also remove any entries prefixed with keyOrId (e.g. `offerId_...`)
    for (const key of expiryCache.keys()) {
      if (key.startsWith(`${keyOrId}_`)) {
        expiryCache.delete(key);
      }
    }
  } else {
    expiryCache.clear();
  }
}

function pruneOldExpiryCacheEntries(): void {
  if (expiryCache.size > 200) {
    const now = Date.now();
    for (const [key, exp] of expiryCache.entries()) {
      if (exp < now - 60_000) {
        expiryCache.delete(key);
      }
    }
  }
}

function resolveCacheKey(offer: UrgentOfferTimeSource): string | null {
  if (offer.id) {
    const suffix = offer.expiresAt || offer.createdAt || "";
    return `${offer.id}_${suffix}`;
  }
  if (offer.expiresAt) {
    return `exp_${offer.expiresAt}`;
  }
  if (offer.createdAt) {
    return `cat_${offer.createdAt}`;
  }
  return null;
}

/**
 * Calculates a synchronized remaining time for an urgent offer taking into account:
 * 1. Server-provided `expiresAt` and `serverTime` (eliminating client-server clock skew).
 * 2. Caching client-side target expiry timestamp so `remainingMs` smoothly decreases on every tick.
 * 3. Graceful fallback when timestamps are absent.
 */
export function getUrgentOfferTimer(
  offer?: UrgentOfferTimeSource | null,
  ttlSeconds = URGENT_OFFER_TTL_SECONDS
): UrgentOfferTimerInfo {
  if (!offer || (!offer.createdAt && !offer.expiresAt)) {
    return { remainingMs: 0, remainingSeconds: 0, progress: 0, isExpired: true };
  }

  const cacheKey = resolveCacheKey(offer);
  let targetExpiryClientMs: number | undefined;

  // 1. Try WeakMap if offer is an object
  if (typeof offer === "object" && offer !== null) {
    targetExpiryClientMs = weakExpiryCache.get(offer);
  }

  // 2. Try string key map
  if (targetExpiryClientMs === undefined && cacheKey) {
    targetExpiryClientMs = expiryCache.get(cacheKey);
  }

  // 3. If not cached, compute clientTargetExpiryMs once
  if (targetExpiryClientMs === undefined) {
    const now = Date.now();
    const expiresAtMs = offer.expiresAt ? new Date(offer.expiresAt).getTime() : NaN;
    const serverTimeMs = offer.serverTime ? new Date(offer.serverTime).getTime() : NaN;
    const createdAtMs = offer.createdAt ? new Date(offer.createdAt).getTime() : NaN;
    const totalTtlMs = ttlSeconds * 1000;

    if (!isNaN(expiresAtMs) && !isNaN(serverTimeMs)) {
      // Both expiresAt and serverTime are provided by the backend:
      // The remaining server lifetime at the instant this payload was generated:
      const serverRemainingDurationMs = expiresAtMs - serverTimeMs;
      targetExpiryClientMs = now + Math.max(0, serverRemainingDurationMs);
    } else if (!isNaN(expiresAtMs)) {
      if (!isNaN(createdAtMs) && expiresAtMs > createdAtMs) {
        const duration = expiresAtMs - createdAtMs;
        const elapsedSinceCreated = Math.max(0, now - createdAtMs);
        const remaining = Math.max(0, duration - elapsedSinceCreated);
        targetExpiryClientMs = now + remaining;
      } else {
        targetExpiryClientMs = expiresAtMs;
      }
    } else if (!isNaN(createdAtMs)) {
      if (!isNaN(serverTimeMs)) {
        const serverExpiresAt = createdAtMs + totalTtlMs;
        const serverRemaining = serverExpiresAt - serverTimeMs;
        targetExpiryClientMs = now + Math.max(0, serverRemaining);
      } else {
        const elapsed = Math.max(0, now - createdAtMs);
        const remaining = Math.max(0, totalTtlMs - elapsed);
        targetExpiryClientMs = now + remaining;
      }
    } else {
      return { remainingMs: 0, remainingSeconds: 0, progress: 0, isExpired: true };
    }

    // Save in cache
    if (typeof offer === "object" && offer !== null) {
      weakExpiryCache.set(offer, targetExpiryClientMs);
    }
    if (cacheKey) {
      expiryCache.set(cacheKey, targetExpiryClientMs);
      pruneOldExpiryCacheEntries();
    }
  }

  const now = Date.now();
  const remainingMs = Math.max(0, targetExpiryClientMs - now);
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const totalDurationMs = ttlSeconds * 1000;
  const progress = Math.max(0, Math.min(1, remainingMs / totalDurationMs));

  return {
    remainingMs,
    remainingSeconds,
    progress,
    isExpired: remainingMs <= 0,
  };
}

export function getOfferRemainingSeconds(
  offer?: UrgentOfferTimeSource | null,
  ttlSeconds = URGENT_OFFER_TTL_SECONDS
): number {
  return getUrgentOfferTimer(offer, ttlSeconds).remainingSeconds;
}

export function isUrgentOfferActive(
  offer?: UrgentOfferTimeSource | null,
  ttlSeconds = URGENT_OFFER_TTL_SECONDS
): boolean {
  return !getUrgentOfferTimer(offer, ttlSeconds).isExpired;
}
