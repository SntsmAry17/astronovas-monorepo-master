"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_ORDER, PLANETS, fmtScore, getAssessment, reportId } from "@/lib/sites";
import type { Category, CategoryId, Planet, TerSite } from "@/lib/types";
import ClimatePanel from "./ClimatePanel";
import { ClassificationBadge, PlanetToggle, ScoreBar } from "./ui";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-white/40">Loading globe…</div>,
});

interface Props {
  sites: TerSite[];
  initialSite?: string | null;
  initialPlanet?: Planet;
}

export default function ExploreApp({ sites, initialSite, initialPlanet = "moon" }: Props) {
  const [planet, setPlanet] = useState<Planet>(initialPlanet);
  const [activeId, setActiveId] = useState<string | null>(
    initialSite ? (sites.find((s) => s.slug === initialSite)?.id ?? null) : null,
  );
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [query, setQuery] = useState("");

  const site = sites.find((s) => s.id === activeId) ?? null;
  const assessment = site ? getAssessment(site, planet) : null;
  const planetColor = PLANETS.find((p) => p.id === planet)?.color ?? "#38bdf8";

  const activeCategory = CATEGORY_ORDER.find((c) => c.id === categoryId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q
      ? [...sites]
      : sites.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.country.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q),
        );
    // With a category filter active, rank sites by that category's score.
    if (categoryId) {
      base.sort((a, b) => {
        const sa = getAssessment(a, planet).categories.find((c) => c.id === categoryId)?.score;
        const sb = getAssessment(b, planet).categories.find((c) => c.id === categoryId)?.score;
        return (sb ?? -1) - (sa ?? -1);
      });
    }
    return base;
  }, [sites, query, categoryId, planet]);

  const selectSite = (id: string | null) => {
    setActiveId(id);
    setCategoryId(null);
  };

  return (
    <div className="flex flex-col md:h-screen md:flex-row">
      {/* Globe */}
      <div className="relative h-[46vh] shrink-0 md:h-auto md:flex-1">
        <Globe sites={sites} activeId={activeId} onSelect={selectSite} color={planetColor} />
        <div className="pointer-events-none absolute left-4 top-16 md:top-20">
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: planetColor }}>
            Explore Sites · {planet === "moon" ? "Moon" : "Mars"}
          </p>
          <p className="mt-1 max-w-56 text-xs text-white/50">
            Drag to rotate, scroll to zoom, click a marker to open its profile.
          </p>
        </div>
      </div>

      {/* Side panel */}
      <aside className="nice-scroll min-h-0 flex-1 overflow-y-auto border-t border-white/10 bg-black/35 backdrop-blur md:w-[46%] md:flex-none md:border-l md:border-t-0">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#050a14]/90 px-5 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-14 md:pt-12">
            <PlanetToggle planet={planet} onChange={setPlanet} />
            {site && (
              <button
                onClick={() => selectSite(null)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                ← All sites
              </button>
            )}
          </div>
          <div className={`mt-3 gap-2 ${site ? "block" : "grid sm:grid-cols-[1fr_1.35fr]"}`}>
            {!site && (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search location…"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/40"
              />
            )}
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId((e.target.value || null) as CategoryId | null)}
              aria-label="Filter by scientific category"
              className="w-full rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2 text-sm text-white outline-none focus:border-white/40"
            >
              <option value="">All categories — overall similarity</option>
              {CATEGORY_ORDER.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-5 py-5 pb-16">
          {!site && (
            <>
              <p className="text-sm text-white/60">
                Eight terrestrial analog regions. Select one on the globe or below — your planet
                selection decides which scientific assessment is shown.
              </p>
              {activeCategory && (
                <p className="mt-2 text-xs" style={{ color: planetColor }}>
                  Ranked by {activeCategory.name} score — strongest first.
                </p>
              )}
              <div className="mt-4 grid gap-2">
                {filtered.map((s) => {
                  const a = getAssessment(s, planet);
                  const cat = activeCategory
                    ? (a.categories.find((c) => c.id === activeCategory.id) ?? null)
                    : null;
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectSite(s.id)}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-colors hover:border-white/30 hover:bg-white/[0.07]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{s.name}</span>
                        <span className="block text-xs text-white/50">
                          {s.id} · {s.country}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono text-lg font-semibold" style={{ color: planetColor }}>
                          {fmtScore(activeCategory ? (cat?.score ?? null) : a.overallScore)}
                        </span>
                        <span
                          className="block max-w-36 truncate text-[10px] uppercase tracking-wider"
                          style={{ color: planetColor }}
                        >
                          {activeCategory ? activeCategory.name : `${planet} similarity`}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="py-6 text-center text-sm text-white/40">No location matches “{query}”.</p>
                )}
              </div>
            </>
          )}

          {site && assessment && (
            <div className="space-y-5">
              <GeographicCard site={site} color={planetColor} />
              <SimilarityCard site={site} planet={planet} />

              {categoryId && (
                <CategoryPanel
                  category={assessment.categories.find((c) => c.id === categoryId) ?? null}
                  site={site}
                  planet={planet}
                />
              )}

              <Link
                href={`/report/${reportId(assessment)}`}
                className="block rounded-xl border px-5 py-4 text-center font-medium transition-colors hover:bg-white/10"
                style={{ borderColor: planetColor, color: planetColor, background: `${planetColor}14` }}
              >
                Read Full Scientific Report →
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function GeographicCard({ site, color }: { site: TerSite; color: string }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
        {site.id} · Terrestrial site
      </p>
      <h2 className="mt-1 text-2xl font-bold">{site.name}</h2>
      <p className="mt-0.5 text-sm text-white/60">
        {site.country}
        {site.regions ? ` — ${site.regions}` : ""}
      </p>
      <dl className="mt-4 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
        <Field k="Environment">{site.environmentType}</Field>
        <Field k="Elevation">{site.elevation}</Field>
        <Field k="Coordinates">
          {Math.abs(site.lat).toFixed(4)}° {site.lat >= 0 ? "N" : "S"},{" "}
          {Math.abs(site.lng).toFixed(4)}° {site.lng >= 0 ? "E" : "W"}
        </Field>
        {site.extraMarkers && (
          <Field k="Reference points">
            {site.extraMarkers.map((m) => `${m.name} (${m.lat}°, ${m.lng}°)`).join(" · ")}
          </Field>
        )}
      </dl>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {site.features.map((f) => (
          <li key={f} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-white/80">{site.description}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{site.relevance}</p>
      <p className="mt-3 text-xs italic text-white/40">{site.geoNote}</p>
      <div className="mt-4">
        <ClimatePanel key={site.slug} site={site} color={color} />
      </div>
    </section>
  );
}

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-white/40">{k}</dt>
      <dd className="mt-0.5 text-white/85">{children}</dd>
    </div>
  );
}

function SimilarityCard({ site, planet }: { site: TerSite; planet: Planet }) {
  const a = getAssessment(site, planet);
  const color = PLANETS.find((p) => p.id === planet)?.color ?? "#38bdf8";
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
            {a.id} · {planet === "moon" ? "Lunar" : "Martian"} assessment
          </p>
          <h3 className="mt-1 text-lg font-bold">Planetary similarity</h3>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-bold" style={{ color }}>
            {fmtScore(a.overallScore)}
          </p>
          <ClassificationBadge score={a.overallScore} label={a.classification} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {a.categories.map((c) => (
          <div key={c.id} className="text-xs">
            <div className="mb-1 flex justify-between">
              <span className="truncate text-white/70">{c.name}</span>
              <span className="ml-2 text-white/50">{fmtScore(c.score)}</span>
            </div>
            <ScoreBar score={c.score} color={color} />
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-white/80">{a.summary}</p>

      <p className="mb-1.5 mt-4 text-[10px] uppercase tracking-wider text-white/40">
        Main scientific applications
      </p>
      <ul className="list-disc space-y-1 pl-5 text-[13px] text-white/70 marker:text-sky-400/60">
        {a.applications.map((app) => (
          <li key={app}>{app}</li>
        ))}
      </ul>

      <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-relaxed text-amber-200/70">
        Similarity percentages are preliminary AI-assisted assessments based on compiled scientific
        descriptions. They are not independently validated measurements or certified indicators of
        mission suitability.
      </p>
    </section>
  );
}

function CategoryPanel({
  category,
  site,
  planet,
}: {
  category: Category | null;
  site: TerSite;
  planet: Planet;
}) {
  const color = PLANETS.find((p) => p.id === planet)?.color ?? "#38bdf8";
  if (!category) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
        This category has no comparable variables for {site.name} on the {planet === "moon" ? "Moon" : "Mars"}.
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
            {site.id} · {planet === "moon" ? "Moon" : "Mars"}
          </p>
          <h3 className="mt-1 text-lg font-bold">{category.name}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-bold" style={{ color }}>
            {fmtScore(category.score)}
          </p>
          <ClassificationBadge score={category.score} label={category.classification} />
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-white/80">{category.description}</p>
      <p className="mt-2 text-sm text-white/55">
        <span className="font-medium text-white/70">Scientific utility: </span>
        {category.utility}
      </p>

      <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
        {category.variables.map((v) => (
          <div key={v.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-white/90">{v.name}</p>
              <p className="shrink-0 font-mono text-sm" style={{ color }}>
                {fmtScore(v.score)}
              </p>
            </div>
            <ScoreBar score={v.score} color={color} />
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{v.explanation}</p>
            <p className="mt-1 text-xs text-white/45">
              <span className="font-medium text-white/55">Utility: </span>
              {v.utility}
            </p>
          </div>
        ))}
      </div>
      <Link
        href={`/report/${reportId(getAssessment(site, planet))}`}
        className="mt-4 inline-block text-xs hover:underline"
        style={{ color }}
      >
        Read this assessment&apos;s full scientific report →
      </Link>
    </section>
  );
}
