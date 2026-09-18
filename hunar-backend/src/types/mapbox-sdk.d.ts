// Minimal type declarations for the untyped @mapbox/mapbox-sdk geocoding service.
// Covers only the surface used by MapboxService (forward geocoding).

declare module '@mapbox/mapbox-sdk/services/geocoding' {
  export interface GeocodeFeature {
    id: string;
    type: 'Feature';
    place_type: string[];
    center: [number, number];
    place_name: string;
    text: string;
    relevance: number;
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties?: Record<string, unknown>;
  }

  export interface GeocodeResponseBody {
    type: 'FeatureCollection';
    query: string[];
    features: GeocodeFeature[];
  }

  export interface GeocodingService {
    forwardGeocode(options: { query: string | string[]; limit?: number; countries?: string[] }): {
      send(): Promise<{ body: GeocodeResponseBody }>;
    };
  }

  export interface GeocodingServiceOptions {
    accessToken: string;
    origin?: string;
  }

  export function GeocodingService(options: GeocodingServiceOptions): GeocodingService;

  export default GeocodingService;
}
