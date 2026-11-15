// Genera backend/supabase/seed.sql a partir de los JSON del prototipo y de NASA POWER (sin clave).
//
//   npm run db:seed                       (desde la raíz del repo)
//   node scripts/generate-seed.mjs [carpeta-con-analogs.json-y-sites.json]
//
// Por defecto lee frontend/src/data/. Si NASA POWER no responde, usa los valores del JSON y marca el dato como ilustrativo.
// La normalización 0-1 replica earthProfile() de frontend/src/lib/similarity.ts: si cambia allá, cambia aquí.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(backendDir, "..");
const dataDir = path.resolve(process.argv[2] ?? path.join(repoRoot, "frontend", "src", "data"));
const outFile = path.join(backendDir, "supabase", "seed.sql");

const analogs = JSON.parse(await readFile(path.join(dataDir, "analogs.json"), "utf8"));
const refSites = JSON.parse(await readFile(path.join(dataDir, "sites.json"), "utf8"));

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const q = (s) => (s == null ? "null" : `'${String(s).replaceAll("'", "''")}'`);
const num = (v) => (v == null ? "null" : String(v));

/** Climatología anual 2001-2025 de NASA POWER para un punto; null si falla. */
async function fetchPower(lat, lng) {
  const url = new URL("https://power.larc.nasa.gov/api/temporal/climatology/point");
  url.search = new URLSearchParams({
    parameters: "T2M,PRECTOTCORR,ALLSKY_SFC_UV_INDEX",
    community: "RE",
    latitude: String(lat),
    longitude: String(lng),
    format: "JSON",
  }).toString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const p = (await res.json()).properties.parameter;
    const ann = (k) => {
      const v = p[k]?.ANN;
      if (typeof v !== "number" || v === -999) throw new Error(`sin dato ${k}`);
      return v;
    };
    return { uv: ann("ALLSKY_SFC_UV_INDEX"), rainMm: ann("PRECTOTCORR") * 365, tempC: ann("T2M") };
  } catch (err) {
    console.warn(`  POWER falló para (${lat}, ${lng}): ${err.message}. Se usa el valor del JSON.`);
    return null;
  }
}

// ---------------------------------------------------------------- catálogos
const bodies = [
  ["earth", "Tierra", 6371, "Planeta de referencia: aquí viven los análogos.", "/textures/earth-blue-marble.jpg"],
  ["moon", "Luna", 1737.4, "Satélite natural de la Tierra.", "/textures/moon-lroc-2k.jpg"],
  ["mars", "Marte", 3389.5, "El planeta rojo.", "/textures/mars-viking-2k.jpg"],
];

const features = [
  ["aridity", "Aridez", "Qué tan seco es el lugar (1 = sin precipitación).", "mm/año", 1],
  ["cold", "Frío", "Temperatura media baja (1 = muy frío).", "°C", 2],
  ["radiation", "Radiación UV", "Exposición a radiación ultravioleta.", "índice UV medio", 3],
  ["roughness", "Rugosidad", "Irregularidad del terreno y pendientes.", null, 4],
  ["basalt", "Roca basáltica", "Presencia de basalto y terreno volcánico.", null, 5],
  ["ice", "Hielo / permafrost", "Hielo superficial o subterráneo.", null, 6],
];

const datasets = [
  {
    slug: "nasa-power",
    name: "NASA POWER · Climatología 2001–2025",
    provider: "NASA POWER",
    body: "earth",
    url: "https://power.larc.nasa.gov/docs/",
    license: "Datos abiertos de la NASA",
    resolution: "0.5° × 0.625°",
    coverage: "Enero 2001 – diciembre 2025",
    illustrative: false,
    retrieved: new Date().toISOString(),
  },
  {
    slug: "prototype-illustrative",
    name: "Valores ilustrativos del prototipo",
    provider: "Equipo AstroNovas",
    body: null,
    url: null,
    license: null,
    resolution: null,
    coverage: null,
    illustrative: true,
    retrieved: null,
    notes: "Estimaciones provisionales hasta integrar los datos reales (Luna, Marte y terreno terrestre).",
  },
];

// -------------------------------------------------------------------- sitios
const sites = [];
const siteFeatures = [];

for (const a of analogs) {
  console.log(`NASA POWER → ${a.name}`);
  const power = await fetchPower(a.lat, a.lng);
  const live = power ?? { uv: a.metrics.uvIndex, rainMm: a.metrics.annualRainfallMm, tempC: a.metrics.meanTempC };
  const ds = power ? "nasa-power" : "prototype-illustrative";

  sites.push({
    slug: a.id, body: "earth", analogOf: a.target === "Luna" ? "moon" : "mars", name: a.name, region: a.region,
    terrain: a.type, description: a.description, soil: a.metrics.soil, lat: a.lat, lng: a.lng, palette: a.palette,
  });
  const add = (key, value, raw, unit, dataset, illustrative) =>
    siteFeatures.push({ slug: a.id, key, value: round(clamp01(value), 3), raw, unit, dataset, illustrative });

  add("aridity", 1 - live.rainMm / 900, round(live.rainMm, 1), "mm/año", ds, !power);
  add("cold", (20 - live.tempC) / 45, round(live.tempC, 1), "°C", ds, !power);
  add("radiation", live.uv / 3, round(live.uv, 2), "índice UV medio", ds, !power);
  for (const k of ["roughness", "basalt", "ice"]) add(k, a.traits[k], null, null, "prototype-illustrative", true);
}

for (const s of refSites) {
  sites.push({
    slug: s.id, body: s.body, analogOf: null, name: s.name, region: null, terrain: null,
    description: s.blurb, soil: null, lat: s.lat, lng: s.lng, palette: null,
  });
  for (const [key, value] of Object.entries(s.profile)) {
    siteFeatures.push({ slug: s.id, key, value, raw: null, unit: null, dataset: "prototype-illustrative", illustrative: true });
  }
}

// ---------------------------------------------------------------------- SQL
const sql = [];
sql.push(`-- GENERADO por backend/scripts/generate-seed.mjs el ${new Date().toISOString()}. No editar a mano.`);
sql.push("-- Idempotente: se puede ejecutar varias veces.\n");

sql.push("insert into public.bodies (id, name, radius_km, description, texture_url) values");
sql.push(bodies.map((b) => `  (${q(b[0])}, ${q(b[1])}, ${b[2]}, ${q(b[3])}, ${q(b[4])})`).join(",\n"));
sql.push("on conflict (id) do update set name = excluded.name, radius_km = excluded.radius_km,\n  description = excluded.description, texture_url = excluded.texture_url;\n");

sql.push("insert into public.features (key, label, description, raw_unit, sort_order) values");
sql.push(features.map((f) => `  (${q(f[0])}, ${q(f[1])}, ${q(f[2])}, ${q(f[3])}, ${f[4]})`).join(",\n"));
sql.push("on conflict (key) do update set label = excluded.label, description = excluded.description,\n  raw_unit = excluded.raw_unit, sort_order = excluded.sort_order;\n");

sql.push("insert into public.datasets (slug, name, provider, body_id, url, license, resolution, temporal_coverage, is_illustrative, retrieved_at, notes) values");
sql.push(
  datasets
    .map((d) => `  (${q(d.slug)}, ${q(d.name)}, ${q(d.provider)}, ${q(d.body)}, ${q(d.url)}, ${q(d.license)}, ${q(d.resolution)}, ${q(d.coverage)}, ${d.illustrative}, ${d.retrieved ? q(d.retrieved) + "::timestamptz" : "null::timestamptz"}, ${q(d.notes ?? null)})`)
    .join(",\n"),
);
sql.push("on conflict (slug) do update set name = excluded.name, provider = excluded.provider, url = excluded.url,\n  license = excluded.license, resolution = excluded.resolution, temporal_coverage = excluded.temporal_coverage,\n  is_illustrative = excluded.is_illustrative, retrieved_at = excluded.retrieved_at, notes = excluded.notes;\n");

sql.push("insert into public.sites (slug, body_id, analog_of, name, region, terrain_type, description, soil, lat, lng, palette, status, source) values");
sql.push(
  sites
    .map((s) => {
      const palette = s.palette ? `array[${s.palette.map(q).join(", ")}]` : "null::text[]";
      return `  (${q(s.slug)}, ${q(s.body)}, ${q(s.analogOf)}, ${q(s.name)}, ${q(s.region)}, ${q(s.terrain)}, ${q(s.description)}, ${q(s.soil)}, ${s.lat}, ${s.lng}, ${palette}, 'published', 'curated')`;
    })
    .join(",\n"),
);
sql.push("on conflict (slug) do update set body_id = excluded.body_id, analog_of = excluded.analog_of, name = excluded.name,\n  region = excluded.region, terrain_type = excluded.terrain_type, description = excluded.description, soil = excluded.soil,\n  lat = excluded.lat, lng = excluded.lng, palette = excluded.palette, status = excluded.status, source = excluded.source;\n");

sql.push("insert into public.site_features (site_id, feature_key, value, raw_value, raw_unit, dataset_id, is_illustrative)");
sql.push("select s.id, v.feature_key, v.value, v.raw_value, v.raw_unit, d.id, v.is_illustrative");
sql.push("from (values");
sql.push(
  siteFeatures
    .map((f) => `  (${q(f.slug)}, ${q(f.key)}, ${f.value}::numeric, ${num(f.raw)}::numeric, ${q(f.unit)}::text, ${q(f.dataset)}, ${f.illustrative})`)
    .join(",\n"),
);
sql.push(") as v (slug, feature_key, value, raw_value, raw_unit, dataset_slug, is_illustrative)");
sql.push("join public.sites s on s.slug = v.slug");
sql.push("join public.datasets d on d.slug = v.dataset_slug");
sql.push("on conflict (site_id, feature_key) do update set value = excluded.value, raw_value = excluded.raw_value,\n  raw_unit = excluded.raw_unit, dataset_id = excluded.dataset_id, is_illustrative = excluded.is_illustrative;\n");

await writeFile(outFile, sql.join("\n") + "\n", "utf8");
console.log(`\nListo: ${path.relative(repoRoot, outFile)} (${sites.length} sitios, ${siteFeatures.length} valores de variables)`);
