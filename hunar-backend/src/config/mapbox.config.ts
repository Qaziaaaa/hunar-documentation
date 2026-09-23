export interface MapboxConfig {
  accessToken: string;
}

export default () => {
  const mapboxConfig: MapboxConfig = {
    // Mapbox geocoding token (https://account.mapbox.com). Empty = geocoding disabled.
    accessToken: process.env.MAPBOX_TOKEN ?? '',
  };
  return { mapbox: mapboxConfig };
};
