/**
 * Utility to extract and sanitize customer location into Area / Sector only.
 * Before a worker accepts a job, precise details (house numbers, street numbers,
 * apartment/unit numbers, landmarks, and full street addresses) MUST NOT be exposed.
 */

const HOUSE_UNIT_REGEX =
  /\b(house|h\s*#|hno|flat|apt|apartment|plot|plaza|building|floor|portion|room|villa|b\s*#)\b/i;

const UNIT_NUMBER_REGEX = /^#?\d+[-/\w]*$/i;

const STREET_REGEX = /\b(street|st\s*#|st\.|lane|gali|ave|avenue|blvd|boulevard)\b/i;

const LANDMARK_REGEX =
  /\b(near|opp|opposite|behind|beside|adjacent|close to|in front of|landmark)\b/i;

const COMMON_CITIES = ['peshawar', 'islamabad', 'rawalpindi', 'lahore', 'karachi', 'pakistan'];

const KNOWN_AREA_ROADS = [
  'warsak road',
  'ring road',
  'kohat road',
  'charsadda road',
  'bara road',
  'dalazak road',
  'university road',
  'mall road',
  'khyber road',
];

export function stripCitySuffix(text: string, city?: string | null): string {
  let cleaned = text.trim();
  if (city && city.trim()) {
    const cityEscaped = city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`[,\\s-]+${cityEscaped}\\s*$`, 'i'), '').trim();
  }
  for (const c of COMMON_CITIES) {
    cleaned = cleaned.replace(new RegExp(`[,\\s-]+${c}\\s*$`, 'i'), '').trim();
  }
  return cleaned || text.trim();
}

export function containsPreciseDetails(text: string): boolean {
  if (HOUSE_UNIT_REGEX.test(text) || STREET_REGEX.test(text) || LANDMARK_REGEX.test(text)) {
    return true;
  }
  return false;
}

export function extractAreaFromAddress(address: string, city?: string | null): string {
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const cityLower = city ? city.trim().toLowerCase() : '';

  const candidates: string[] = [];

  for (const part of parts) {
    const partLower = part.toLowerCase();

    // Skip house / unit / flat descriptions
    if (HOUSE_UNIT_REGEX.test(part) || UNIT_NUMBER_REGEX.test(part)) {
      continue;
    }

    // Skip street / lane / gali descriptions
    if (STREET_REGEX.test(part)) {
      continue;
    }

    // Skip landmarks ("Near...", "Opp...", etc.)
    if (LANDMARK_REGEX.test(part)) {
      continue;
    }

    // Check if it's just the city name
    if (
      (cityLower && partLower === cityLower) ||
      COMMON_CITIES.includes(partLower)
    ) {
      continue;
    }

    // If it mentions a "road" that is NOT a known area corridor (e.g. "Circular Road"),
    // but we might have other more specific parts, check:
    if (/\broad\b/i.test(part) && !KNOWN_AREA_ROADS.some((r) => partLower.includes(r))) {
      // It's a street name like "Circular Road" or "School Road"
      continue;
    }

    candidates.push(part);
  }

  if (candidates.length > 0) {
    // If parts contain specific Area / Sector / Phase keywords, format cleanly
    return candidates.join(', ');
  }

  // Fallback to city or neutral placeholder (never house / street info)
  return city?.trim() || 'Location pending';
}

export function sanitizeToAreaOrSector(params: {
  area?: string | null;
  address?: string | null;
  city?: string | null;
}): string {
  const rawArea = (params.area || '').trim();
  const rawAddress = (params.address || '').trim();
  const rawCity = (params.city || '').trim();

  if (rawArea) {
    const cleanedArea = stripCitySuffix(rawArea, rawCity);
    if (!containsPreciseDetails(cleanedArea)) {
      return cleanedArea;
    }
  }

  // If area is missing, empty, or contained precise street/house info
  const source = rawAddress || rawArea;
  if (!source) {
    return rawCity || 'Location pending';
  }

  const extracted = extractAreaFromAddress(source, rawCity);
  return extracted;
}
