"use client";

import { useEffect, useState } from "react";
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
      .then((r) => r.json())
      .then((j: ApiResponse) => {
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
        <span className="font-mono text-[10px] normal-case text-white/40">
          {site.lat.toFixed(2)}°, {site.lng.toFixed(2)}°
        </span>
      </p>
      {state === "loading" && <p className="mt-3 text-sm text-white/50">Querying NASA POWER…</p>}
      {state === "empty" && (
        <p className="mt-3 text-sm text-white/50">NASA POWER returned no data for this point right now.</p>
      )}
      {state === "error" && (
        <p className="mt-3 text-sm text-white/50">NASA POWER query failed. The rest of the page still works.</p>
      )}
      {state === "ok" && data && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <Metric label="Air temp @2 m" value={`${data.t2m} °C`} />
            <Metric label="Wind @10 m" value={`${data.ws10m} m/s`} />
            <Metric label="UV index" value={String(data.uvIndex)} />
            <Metric label="Precipitation" value={`${data.precipitationMm} mm/y`} />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/45">
            {data.period} annual means for the representative point above — a single location, not a
            measurement of the whole region. Source: NASA POWER (power.larc.nasa.gov).
          </p>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
