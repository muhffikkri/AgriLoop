import samplesJson from "@/data/demo/satellite-samples.json";
import { readStore } from "./db.ts";
import type { GridPatch, Samples } from "@/components/demo/SatelliteGridDemo.tsx";
import type { LonLat } from "@/lib/domain/grid-extent.ts";

/** Rectangular ring built from the stored bounds, so admin metadata edits reach the public demo. */
export function getDemoGrids(): GridPatch[] {
  return readStore()
    .grids.filter((grid) => grid.active)
    .map((grid) => ({
      id: grid.id,
      areaLabel: grid.areaLabel,
      district: grid.district,
      note: grid.note,
      ring: [
        [grid.bounds.west, grid.bounds.north],
        [grid.bounds.east, grid.bounds.north],
        [grid.bounds.east, grid.bounds.south],
        [grid.bounds.west, grid.bounds.south],
        [grid.bounds.west, grid.bounds.north],
      ] as LonLat[],
    }));
}

export function getSamples(): Samples {
  return samplesJson as Samples;
}
