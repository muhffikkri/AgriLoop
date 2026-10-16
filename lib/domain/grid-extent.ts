export type Bounds = { west: number; east: number; south: number; north: number };
export type LonLat = [number, number];
export type Point = { x: number; y: number };

export function ringToBounds(ring: LonLat[]): Bounds {
  const lons = ring.map(([lon]) => lon);
  const lats = ring.map(([, lat]) => lat);
  return {
    west: Math.min(...lons),
    east: Math.max(...lons),
    south: Math.min(...lats),
    north: Math.max(...lats),
  };
}

export function aoiBounds(rings: LonLat[][]): Bounds {
  return rings.reduce<Bounds>(
    (acc, ring) => {
      const next = ringToBounds(ring);
      return {
        west: Math.min(acc.west, next.west),
        east: Math.max(acc.east, next.east),
        south: Math.min(acc.south, next.south),
        north: Math.max(acc.north, next.north),
      };
    },
    { west: Infinity, east: -Infinity, south: Infinity, north: -Infinity },
  );
}

/**
 * Equirectangular projection is plenty for a single demo extent a few kilometres wide:
 * the overlay sits on top of a synthetic raster, not on a survey map.
 */
export function projectPoint([lon, lat]: LonLat, bounds: Bounds, width: number, height: number): Point {
  const spanX = bounds.east - bounds.west;
  const spanY = bounds.north - bounds.south;
  if (spanX <= 0 || spanY <= 0) return { x: 0, y: 0 };
  return {
    x: Math.round(((lon - bounds.west) / spanX) * width * 1000) / 1000,
    y: Math.round(((bounds.north - lat) / spanY) * height * 1000) / 1000,
  };
}
