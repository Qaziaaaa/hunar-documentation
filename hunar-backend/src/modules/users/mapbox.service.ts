import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import geocodingFactory, { GeocodingService } from '@mapbox/mapbox-sdk/services/geocoding';

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  placeName: string;
}

@Injectable()
export class MapboxService {
  private readonly client: GeocodingService | null;

  constructor(config: ConfigService) {
    const accessToken = config.get<string>('mapbox.accessToken', '');
    this.client = accessToken ? geocodingFactory({ accessToken }) : null;
  }

  /**
   * Forward-geocodes a readable address into coordinates using the Mapbox Geocoding API.
   * Restricted to Pakistan so "Hayatabad" resolves to Peshawar rather than a namesake elsewhere.
   */
  async geocodeAddress(address: string): Promise<GeocodedAddress | null> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'MAPBOX_NOT_CONFIGURED: set MAPBOX_TOKEN to enable address geocoding',
      );
    }
    const response = await this.client
      .forwardGeocode({ query: address, limit: 1, countries: ['pk'] })
      .send();
    const feature = response.body.features[0];
    if (!feature) {
      return null;
    }
    const [longitude, latitude] = feature.center;
    return { latitude, longitude, placeName: feature.place_name };
  }
}
