/**
 * NASA POWER is a ~50 km reanalysis grid: it describes the average terrain of the grid cell,
 * not the exact point. When the cell's elevation differs a lot from the site's (a volcano summit,
 * a depression below sea level) the temperature/precipitation shown can be misleading.
 * Reference elevations (m) come from each site's documented elevation range.
 */
export const REFERENCE_ELEVATION_M: Record<string, { min: number; max: number }> = {
  "TER-01": { min: 2000, max: 4500 },
  "TER-02": { min: 4207, max: 4207 }, // Mauna Kea summit
  "TER-03": { min: 0, max: 2110 },
  "TER-04": { min: 0, max: 2000 },
  "TER-05": { min: 200, max: 400 },
  "TER-06": { min: 2600, max: 3200 },
  "TER-07": { min: -120, max: 0 }, // Dallol / Danakil Depression
  "TER-08": { min: 1500, max: 3000 },
};

/** Tolerance (m) between the grid-cell elevation and the documented range before warning. */
export const ELEVATION_TOLERANCE_M = 300;

export interface ElevationCheck {
  siteRange: { min: number; max: number };
  cellM: number;
}

/** Returns details when the POWER cell elevation is far from the site's documented range. */
export function elevationMismatch(siteId: string, cellM: number | null | undefined): ElevationCheck | null {
  const range = REFERENCE_ELEVATION_M[siteId];
  if (!range || typeof cellM !== "number") return null;
  const off = cellM < range.min ? range.min - cellM : cellM > range.max ? cellM - range.max : 0;
  return off > ELEVATION_TOLERANCE_M ? { siteRange: range, cellM } : null;
}

export const fmtMeters = (m: number) => `${Math.round(m).toLocaleString("en-US")} m`;
