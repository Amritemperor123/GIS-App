import dataLayer from '../assets/layers/data.geojson';

export interface SectorInfo {
  sector: string;
  provider: string;
}

// Point-in-polygon algorithm
function isPointInPolygon(point: { latitude: number; longitude: number }, polygon: number[][][]): boolean {
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = polygon[0].length - 1; i < polygon[0].length; j = i++) {
    const xi = polygon[0][i][0];
    const yi = polygon[0][i][1];
    const xj = polygon[0][j][0];
    const yj = polygon[0][j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

export function getSectorForLocation(location: { latitude: number; longitude: number }): SectorInfo | null {
  const features = (dataLayer as any).features ?? [];
  
  for (const feature of features) {
    const geometry = feature.geometry;
    if (geometry && geometry.type === 'MultiPolygon') {
      // Check each polygon in the MultiPolygon
      for (const polygon of geometry.coordinates) {
        if (isPointInPolygon(location, polygon)) {
          return {
            sector: feature.properties.Sector,
            provider: feature.properties.Provider
          };
        }
      }
    }
  }
  
  return null;
}

export function getAllSectors(): SectorInfo[] {
  const features = (dataLayer as any).features ?? [];
  return features.map((feature: any) => ({
    sector: feature.properties.Sector,
    provider: feature.properties.Provider
  }));
}
