import { cacheLife } from "next/cache";
import type { TerSite } from "./types";
import { SITES } from "./sites";

const POWER_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point";

export interface PowerClimatology {
  /** Air temperature at 2 m, annual mean (°C). */
  t2m: number;
  /** Wind speed at 10 m, annual mean (m/s). */
  ws10m: number;
  /** All-sky surface UV index, annual mean. */
  uvIndex: number;
  /** Corrected precipitation, annualized from mm/day (mm/year). */
  precipitationMm: number;
  /** Mean elevation of the NASA POWER grid cell (m), which can differ from the site's. */
  cellElevationM: number | null;
  period: string;
}

export interface SiteClimate {
  siteId: string;
  data: PowerClimatology | null;
}

/**
 * Annual climatology (NASA POWER, no API key) for the representative coordinates of one site.
 * Never throws inside `use cache`: a failure returns null and is retried in ~30 s; a success
 * is cached for a day. These are point climatologies — not measurements of a whole region.
 */
export async function fetchClimatology(lat: number, lng: number): Promise<PowerClimatology | null> {
  "use cache";

  try {
    const url = new URL(POWER_URL);
    url.search = new URLSearchParams({
      parameters: "T2M,PRECTOTCORR,WS10M,ALLSKY_SFC_UV_INDEX",
      community: "RE",
      latitude: String(lat),
      longitude: String(lng),
      format: "JSON",
    }).toString();

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`NASA POWER ${res.status}`);
    const json = await res.json();
    const { parameter } = json.properties;
    const cellElev = json.geometry?.coordinates?.[2];

    const ann = (key: string): number => {
      const v = parameter[key]?.ANN;
      if (typeof v !== "number" || v === -999) throw new Error(`NASA POWER missing ${key}`);
      return v;
    };

    const result: PowerClimatology = {
      t2m: Math.round(ann("T2M") * 10) / 10,
      ws10m: Math.round(ann("WS10M") * 10) / 10,
      uvIndex: ann("ALLSKY_SFC_UV_INDEX"),
      precipitationMm: Math.round(ann("PRECTOTCORR") * 365 * 10) / 10,
      cellElevationM: typeof cellElev === "number" ? Math.round(cellElev) : null,
      period: "2001–2025 climatology",
    };
    cacheLife("days");
    return result;
  } catch {
    cacheLife({ stale: 300, revalidate: 30, expire: 600 });
    return null;
  }
}

/** Loads climatologies for all eight sites (each cached independently). */
export async function getAllClimatologies(): Promise<Record<string, PowerClimatology | null>> {
  const entries = await Promise.all(
    SITES.map(async (s: TerSite) => [s.id, await fetchClimatology(s.lat, s.lng)] as const),
  );
  return Object.fromEntries(entries);
}
