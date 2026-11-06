export interface PeshawarHotspot {
  id: string;
  name: string;
  areaKey: string;
  landmark: string;
  addressPrefix: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const PESHAWAR_HOTSPOTS: PeshawarHotspot[] = [
  {
    id: "univ-town",
    name: "University Town",
    areaKey: "University Town, Peshawar",
    landmark: "Near Islamia College Gate",
    addressPrefix: "House 45, Street 12, Block C, University Town",
    lat: 34.0043,
    lng: 71.5034,
    zoom: 15,
  },
  {
    id: "hayatabad-phase1",
    name: "Hayatabad Phase 1",
    areaKey: "Hayatabad Phase 1, Peshawar",
    landmark: "Near Phase 1 Commercial Market",
    addressPrefix: "House 12, Sector A-1, Phase 1, Hayatabad",
    lat: 33.996,
    lng: 71.448,
    zoom: 15,
  },
  {
    id: "hayatabad-phase2",
    name: "Hayatabad Phase 2",
    areaKey: "Hayatabad Phase 2, Peshawar",
    landmark: "Near Zarghoni Mosque",
    addressPrefix: "House 55, Sector B-2, Phase 2, Hayatabad",
    lat: 33.991,
    lng: 71.443,
    zoom: 15,
  },
  {
    id: "hayatabad-phase3",
    name: "Hayatabad Phase 3",
    areaKey: "Hayatabad Phase 3, Peshawar",
    landmark: "Near Tatara Park, Sector E-2",
    addressPrefix: "Street 4, Sector E-2, Phase 3, Hayatabad",
    lat: 33.9856,
    lng: 71.4398,
    zoom: 15,
  },
  {
    id: "hayatabad-phase4",
    name: "Hayatabad Phase 4",
    areaKey: "Hayatabad Phase 4, Peshawar",
    landmark: "Near Shaukat Khanum Hospital",
    addressPrefix: "House 34, Sector G-3, Phase 4, Hayatabad",
    lat: 33.98,
    lng: 71.435,
    zoom: 15,
  },
  {
    id: "hayatabad-phase5",
    name: "Hayatabad Phase 5",
    areaKey: "Hayatabad Phase 5, Peshawar",
    landmark: "Near Hayatabad Food Street",
    addressPrefix: "House 89, Sector D-1, Phase 5, Hayatabad",
    lat: 33.978,
    lng: 71.429,
    zoom: 15,
  },
  {
    id: "hayatabad-phase6",
    name: "Hayatabad Phase 6",
    areaKey: "Hayatabad Phase 6, Peshawar",
    landmark: "Near Hayatabad Medical Complex (HMC)",
    addressPrefix: "House 28, Sector F-4, Phase 6, Hayatabad",
    lat: 33.9745,
    lng: 71.4256,
    zoom: 15,
  },
  {
    id: "hayatabad-phase7",
    name: "Hayatabad Phase 7",
    areaKey: "Hayatabad Phase 7, Peshawar",
    landmark: "Near Phase 7 Green Belt",
    addressPrefix: "House 10, Sector H-2, Phase 7, Hayatabad",
    lat: 33.969,
    lng: 71.419,
    zoom: 15,
  },
  {
    id: "saddar-cantt",
    name: "Saddar & Cantt",
    areaKey: "Saddar & Peshawar Cantt",
    landmark: "Near Mall Road & Deans Trade Center",
    addressPrefix: "Flat 12, Saddar Road, Cantt",
    lat: 34.0084,
    lng: 71.5458,
    zoom: 15,
  },
  {
    id: "gulbahar-gt-road",
    name: "Gulbahar & City",
    areaKey: "Gulbahar & City Area, Peshawar",
    landmark: "Near Hashtnagri Flyover",
    addressPrefix: "House 18, Street 3, Gulbahar No. 2",
    lat: 34.015,
    lng: 71.585,
    zoom: 14.5,
  },
  {
    id: "warsak-road",
    name: "Warsak Road",
    areaKey: "Warsak Road, Peshawar",
    landmark: "Near Peshawar Public School",
    addressPrefix: "Street 9, Officers Colony, Warsak Road",
    lat: 34.041,
    lng: 71.518,
    zoom: 14.5,
  },
  {
    id: "ring-road-pishtakhara",
    name: "Ring Road",
    areaKey: "Ring Road & Pishtakhara, Peshawar",
    landmark: "Near Pishtakhara Chowk",
    addressPrefix: "Main Ring Road near Canal Bridge",
    lat: 33.968,
    lng: 71.512,
    zoom: 14.5,
  },
  {
    id: "dha-peshawar",
    name: "DHA Peshawar",
    areaKey: "DHA Peshawar",
    landmark: "Near Sector A Main Boulevard",
    addressPrefix: "Villa 104, Sector B, DHA Peshawar",
    lat: 34.025,
    lng: 71.41,
    zoom: 14.5,
  },
  {
    id: "regi-model-town",
    name: "Regi Model Town",
    areaKey: "Regi Model Town (RMT), Peshawar",
    landmark: "Near Zone 3 Commercial Center",
    addressPrefix: "Plot 88, Sector C, Zone 3, RMT",
    lat: 34.048,
    lng: 71.455,
    zoom: 14.5,
  },
  {
    id: "dalazak-road",
    name: "Dalazak Road",
    areaKey: "Dalazak Road, Peshawar",
    landmark: "Near Dalazak Chowk & Ring Road",
    addressPrefix: "House 22, Street 4, Dalazak Road",
    lat: 34.032,
    lng: 71.601,
    zoom: 14.5,
  },
  {
    id: "kohat-road",
    name: "Kohat Road",
    areaKey: "Kohat Road & Scheme Chowk, Peshawar",
    landmark: "Near Kohat Road Bus Terminal",
    addressPrefix: "Shop 14, Main Kohat Road",
    lat: 33.952,
    lng: 71.538,
    zoom: 14.5,
  },
  {
    id: "charsadda-road",
    name: "Charsadda Road",
    areaKey: "Charsadda Road, Peshawar",
    landmark: "Near Eidgah & Interchange",
    addressPrefix: "House 7, Street 1, Charsadda Road",
    lat: 34.053,
    lng: 71.572,
    zoom: 14.5,
  },
];

// Helper to find closest named neighborhood in Peshawar
export function findClosestHotspot(lat: number, lng: number): PeshawarHotspot {
  let closest = PESHAWAR_HOTSPOTS[0];
  let minDistance = Number.MAX_VALUE;

  PESHAWAR_HOTSPOTS.forEach((h) => {
    const dist = Math.hypot(h.lat - lat, h.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = h;
    }
  });
  return closest;
}

// Helper to get matching area for a hotspot
export function getHotspotArea(hotspot: PeshawarHotspot): string {
  const id = hotspot.id.toLowerCase();
  if (id.includes("univ-town")) return "University Town";
  if (
    id.includes("hayatabad-phase1") ||
    id.includes("hayatabad-phase2") ||
    id.includes("hayatabad-phase3")
  ) {
    return "Hayatabad Phase 1-3";
  }
  if (
    id.includes("hayatabad-phase4") ||
    id.includes("hayatabad-phase5") ||
    id.includes("hayatabad-phase6") ||
    id.includes("hayatabad-phase7")
  ) {
    return "Hayatabad Phase 4-7";
  }
  if (id.includes("saddar") || id.includes("cantt")) return "Saddar & Cantt";
  if (id.includes("gulbahar") || id.includes("city")) return "Gulbahar & City Area";
  if (id.includes("warsak")) return "Warsak Road Sector";
  if (id.includes("ring-road") || id.includes("pishtakhara")) return "Ring Road Belt";
  if (id.includes("dha")) return "DHA Phase 1";
  if (id.includes("model-town") || id.includes("regi")) return "Model Town";

  return hotspot.name || hotspot.areaKey.replace(/,\s*Peshawar/gi, "").trim();
}

// Reverse Geocode helper to fill ONLY the area based on coordinates
export async function reverseGeocodePeshawar(lat: number, lng: number): Promise<{
  area: string;
  address: string;
  landmark: string;
}> {
  const closest = findClosestHotspot(lat, lng);
  const matchedArea = getHotspotArea(closest);

  return {
    area: matchedArea,
    address: "",
    landmark: "",
  };
}
