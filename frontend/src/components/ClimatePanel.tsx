"use client";

import { useEffect, useState } from "react";
import { elevationMismatch, fmtMeters } from "@/lib/climate";
import type { PowerClimatology } from "@/lib/nasa";
import type { TerSite } from "@/lib/types";

interface ApiResponse {
  data: PowerClimatology | null;
  error?: string;
}

/**
 * Live NASA POWER climatology for the site's representative coordinates.
 * Render with a `key={site.slug}` so state resets when the site changes.
 */
export default function ClimatePanel({ site, color = "#38bdf8" }: { site: TerSite; color?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "empty" | "error">("loading");
  const [data, setData] = useState<PowerClimatology | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/climate?site=${site.slug}`)
      .then((r) => (r.ok ? (r.json() as Promise<ApiResponse>) : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (cancelled) return;
        if (j.data) {
          setData(j.data);
          setState("ok");
        } else setState("empty");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [site.slug]);

  const mismatch = data ? elevationMismatch(site.id, data.cellElevationM) : null;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: `${color}33`, backgroundColor: `${color}0d` }}
    >
      <p
        className="flex items-center justify-between text-xs font-medium uppercase tracking-wider"
        style={{ color }}
      >
        NASA POWER · Live data
        <span className="font-mono text-[10px] normal-case text-white/60">
          {site.lat.toFixed(2)}°, {site.lng.toFixed(2)}°
        </span>
      </p>
      {state === "loading" && <p className="mt-3 text-sm text-white/60">Querying NASA POWER…</p>}
      {state === "empty" && (
        <p className="mt-3 text-sm text-white/60">NASA POWER returned no data for this point right now.</p>
      )}
      {state === "error" && (
        <p className="mt-3 text-sm text-white/60">NASA POWER query failed. The rest of the page still works.</p>
      )}
      {state === "ok" && data && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <Metric label="Air temp @2 m" value={`${data.t2m} °C`} />
            <Metric label="Wind @10 m" value={`${data.ws10m} m/s`} />
            <Metric label="UV index" value={String(data.uvIndex)} />
            <Metric label="Precipitation (reanalysis)" value={`${data.precipitationMm} mm/y`} />
          </div>
          {mismatch && (
            <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-200" role="note">
              <strong>Grid-cell mismatch:</strong> NASA POWER averages a ~50 km cell at{" "}
              {fmtMeters(mismatch.cellM)} elevation, while this site lies at{" "}
              {mismatch.siteRange.min === mismatch.siteRange.max
                ? fmtMeters(mismatch.siteRange.min)
                : `${fmtMeters(mismatch.siteRange.min)} to ${fmtMeters(mismatch.siteRange.max)}`}
              . Temperature and precipitation here are{" "}
              {mismatch.cellM < mismatch.siteRange.min ? "likely too warm" : "likely too cold"} and not
              representative of the site itself.
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-white/60">
            {data.period} annual means from a reanalysis grid cell around the point above — not a
            measurement of the site or the whole region. Precipitation from reanalysis is indicative
            only. Source: NASA POWER (power.larc.nasa.gov).
          </p>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/60">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
