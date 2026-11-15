"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_ORDER, fmtScore, getAssessment, planetColor as colorFor, reportId } from "@/lib/format";
import type { Category, CategoryId, Planet, SiteSummary, TerSite } from "@/lib/types";
import ClimatePanel from "./ClimatePanel";
import {
  CategoryJudgmentNote,
  ClassificationBadge,
  GlobeSkeleton,
  PlanetToggle,
  ScoreBar,
  ScoreDisclaimer,
  ScoreRing,
  SiteDetailSkeleton,
  SkeletonRegion,
  Tabs,
} from "./ui";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <GlobeSkeleton />,
});

interface Props {
  sites: SiteSummary[];
  initialSite?: string | null;
  initialPlanet?: Planet;
  /** Full detail of the initially selected site, resolved on the server. */
  initialDetail?: TerSite | null;
}

type Detail = { status: "loading" } | { status: "error" } | { status: "ok"; site: TerSite };

/** Keeps the address bar in sync (shareable links) without a navigation or remount. */
function syncUrl(slug: string | null, planet: Planet) {
  const qs = new URLSearchParams();
  if (slug) qs.set("site", slug);
  if (planet !== "moon") qs.set("planet", planet);
  const q = qs.toString();
  window.history.replaceState(null, "", q ? `/explore?${q}` : "/explore");
}

export default function ExploreApp({ sites, initialSite, initialPlanet = "moon", initialDetail = null }: Props) {
  const [planet, setPlanet] = useState<Planet>(initialPlanet);
  const [activeId, setActiveId] = useState<string | null>(
    initialSite ? (sites.find((s) => s.slug === initialSite)?.id ?? null) : null,
  );
  const [details, setDetails] = useState<Record<string, Detail>>(
    initialDetail ? { [initialDetail.slug]: { status: "ok", site: initialDetail } } : {},
  );
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("overview");

  const summary = sites.find((s) => s.id === activeId) ?? null;
  const detail = summary ? details[summary.slug] : undefined;
  const planetColor = colorFor(planet);
  const activeCategory = CATEGORY_ORDER.find((c) => c.id === categoryId) ?? null;

  useEffect(() => {
    syncUrl(summary?.slug ?? null, planet);
  }, [summary, planet]);

  const loadDetail = (slug: string) => {
    setDetails((d) => ({ ...d, [slug]: { status: "loading" } }));
    fetch(`/api/sites/${slug}`)
      .then((r) => (r.ok ? (r.json() as Promise<TerSite>) : Promise.reject(new Error(String(r.status)))))
      .then((site) => setDetails((d) => ({ ...d, [slug]: { status: "ok", site } })))
      .catch(() => setDetails((d) => ({ ...d, [slug]: { status: "error" } })));
  };

  const selectSite = (id: string | null) => {
    setActiveId(id);
    setCategoryId(null);
    setTab("overview");
    const slug = sites.find((s) => s.id === id)?.slug;
    if (slug && !details[slug]) loadDetail(slug);
  };

  // Picking a category (list filter or breakdown bar) jumps to where it is shown.
  const pickCategory = (id: CategoryId | null) => {
    setCategoryId(id);
    if (id && activeId) setTab("similarity");
  };

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
        const sa = getAssessment(a, planet).categoryScores[categoryId];
        const sb = getAssessment(b, planet).categoryScores[categoryId];
        return (sb ?? -1) - (sa ?? -1);
      });
    }
    return base;
  }, [sites, query, categoryId, planet]);

  return (
    <div className="flex flex-col md:h-screen md:flex-row">
      {/* Globe */}
      <div className="relative h-[46vh] shrink-0 md:h-auto md:flex-1">
        <Globe sites={sites} activeId={activeId} onSelect={selectSite} color={planetColor} />
        <div className="pointer-events-none absolute left-4 top-16 md:top-20">
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: planetColor }}>
            Explore Sites · {planet === "moon" ? "Moon" : "Mars"}
          </p>
          <p className="mt-1 max-w-56 text-xs text-white/60">
            Drag to rotate, scroll to zoom, click a marker to open its profile.
          </p>
        </div>
      </div>

      {/* Side panel */}
      <aside className="nice-scroll min-h-0 flex-1 overflow-y-auto border-t border-white/10 bg-black/35 backdrop-blur md:w-[46%] md:flex-none md:border-l md:border-t-0">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#050a14]/90 px-5 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-14 md:pt-12">
            <PlanetToggle planet={planet} onChange={setPlanet} />
            {summary && (
              <button
                onClick={() => selectSite(null)}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                ← All sites
              </button>
            )}
          </div>
          <div className={`mt-3 gap-2 ${summary ? "block" : "grid sm:grid-cols-[1fr_1.35fr]"}`}>
            {!summary && (
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search location…"
                aria-label="Search location"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/60 focus:border-white/40"
              />
            )}
            <select
              value={categoryId ?? ""}
              onChange={(e) => pickCategory((e.target.value || null) as CategoryId | null)}
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
          {!summary && (
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
                {filtered.map((s, i) => {
                  const a = getAssessment(s, planet);
                  const catScore = activeCategory ? (a.categoryScores[activeCategory.id] ?? null) : null;
                  const shown = activeCategory ? catScore : a.overallScore;
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectSite(s.id)}
                      className="card card-interactive group block w-full px-4 py-3 text-left"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-3">
                          {activeCategory && (
                            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-[11px] text-white/70">
                              {i + 1}
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{s.name}</span>
                            <span className="block text-xs text-white/60">
                              {s.id} · {s.country}
                            </span>
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-mono text-lg font-semibold" style={{ color: planetColor }}>
                            {fmtScore(shown)}
                          </span>
                          <span className="block max-w-36 truncate text-[10px] uppercase tracking-wider text-white/60">
                            {activeCategory ? activeCategory.name : `${planet} similarity`}
                          </span>
                        </span>
                      </span>
                      <span className="mt-2.5 block">
                        <ScoreBar score={shown} color={planetColor} height={4} />
                      </span>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="py-6 text-center text-sm text-white/60">No location matches “{query}”.</p>
                )}
              </div>
            </>
          )}

          {summary && detail?.status === "error" && (
            <p className="text-sm text-white/60" role="alert">
              Could not load {summary.name}.{" "}
              <button className="underline" onClick={() => loadDetail(summary.slug)}>
                Retry
              </button>
            </p>
          )}

          {summary && detail?.status !== "ok" && detail?.status !== "error" && (
            <SkeletonRegion label={`Loading ${summary.name}…`}>
              <SiteDetailSkeleton />
            </SkeletonRegion>
          )}

          {detail?.status === "ok" && (
            <SiteDetail
              site={detail.site}
              planet={planet}
              categoryId={categoryId}
              color={planetColor}
              tab={tab}
              onTab={setTab}
              onPickCategory={pickCategory}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

type TabId = "overview" | "similarity" | "climate";
const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "similarity", label: "Similarity" },
  { id: "climate", label: "Climate" },
];

function SiteDetail({
  site,
  planet,
  categoryId,
  color,
  tab,
  onTab,
  onPickCategory,
}: {
  site: TerSite;
  planet: Planet;
  categoryId: CategoryId | null;
  color: string;
  tab: TabId;
  onTab: (t: TabId) => void;
  onPickCategory: (id: CategoryId | null) => void;
}) {
  const assessment = getAssessment(site, planet);
  const body = planet === "moon" ? "Lunar" : "Martian";
  return (
    <div className="rise-in space-y-4">
      {/* Header: identity + headline score */}
      <header className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
              {site.id} · {body} analog
            </p>
            <h2 className="mt-1 text-2xl font-bold leading-tight">{site.name}</h2>
            <p className="mt-0.5 text-sm text-white/65">
              {site.country}
              {site.regions ? ` — ${site.regions}` : ""}
            </p>
            <div className="mt-3">
              <ClassificationBadge score={assessment.overallScore} label={assessment.classification} />
            </div>
          </div>
          <ScoreRing score={assessment.overallScore} color={color} label="similarity" />
        </div>
        <Link
          href={`/report/${reportId(assessment)}`}
          className="mt-4 flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
          style={{ borderColor: `${color}66`, color, background: `${color}12` }}
        >
          Read full scientific report <span aria-hidden>→</span>
        </Link>
      </header>

      <Tabs tabs={TABS} value={tab} onChange={onTab} color={color} idPrefix="site" />

      <div id="site-panel" role="tabpanel" aria-labelledby={`site-tab-${tab}`} className="rise-in space-y-4" key={tab}>
        {tab === "overview" && <OverviewCard site={site} />}
        {tab === "similarity" && (
          <>
            <SimilarityCard site={site} planet={planet} categoryId={categoryId} onPickCategory={onPickCategory} />
            {categoryId && (
              <CategoryPanel
                category={assessment.categories.find((c) => c.id === categoryId) ?? null}
                site={site}
                planet={planet}
              />
            )}
          </>
        )}
        {tab === "climate" && <ClimatePanel key={site.slug} site={site} color={color} />}
      </div>
    </div>
  );
}

function OverviewCard({ site }: { site: TerSite }) {
  return (
    <section className="card p-5">
      <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
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
          <li key={f} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75">
            {f}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-white/85">{site.description}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{site.relevance}</p>
      <p className="mt-3 text-xs italic text-white/60">{site.geoNote}</p>
    </section>
  );
}

function Field({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-white/60">{k}</dt>
      <dd className="mt-0.5 text-white/85">{children}</dd>
    </div>
  );
}

function SimilarityCard({
  site,
  planet,
  categoryId,
  onPickCategory,
}: {
  site: TerSite;
  planet: Planet;
  categoryId: CategoryId | null;
  onPickCategory: (id: CategoryId | null) => void;
}) {
  const a = getAssessment(site, planet);
  const color = colorFor(planet);
  return (
    <section className="card p-5">
      <h3 className="text-base font-bold">Category breakdown</h3>
      <p className="mt-0.5 text-xs text-white/60">Select a category to see its variables.</p>

      <ul className="mt-3 space-y-1">
        {a.categories.map((c) => {
          const active = categoryId === c.id;
          return (
            <li key={c.id}>
              <button
                onClick={() => onPickCategory(active ? null : c.id)}
                aria-pressed={active}
                className={`group w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  active ? "bg-white/[0.07]" : "border-transparent hover:bg-white/[0.05]"
                }`}
                style={active ? { borderColor: `${color}77` } : undefined}
              >
                <span className="mb-1.5 flex justify-between gap-2">
                  <span className="truncate text-white/80 group-hover:text-white">{c.name}</span>
                  <span className="shrink-0 font-mono text-white/70">{fmtScore(c.score)}</span>
                </span>
                <ScoreBar score={c.score} color={color} />
              </button>
            </li>
          );
        })}
      </ul>
      <CategoryJudgmentNote />

      <p className="mt-5 text-sm leading-relaxed text-white/85">{a.summary}</p>

      <p className="mb-1.5 mt-4 text-[10px] uppercase tracking-wider text-white/60">
        Main scientific applications
      </p>
      <ul className="list-disc space-y-1 pl-5 text-[13px] text-white/75 marker:text-sky-400/60">
        {a.applications.map((app) => (
          <li key={app}>{app}</li>
        ))}
      </ul>

      <ScoreDisclaimer className="mt-4 p-3 text-[11px]" />
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
  const color = colorFor(planet);
  if (!category) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/60">
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
      <p className="mt-2 text-sm text-white/60">
        <span className="font-medium text-white/70">Scientific utility: </span>
        {category.utility}
      </p>

      <div className="mt-5 border-t border-white/10 pt-4">
        <CategoryJudgmentNote className="mb-4 text-[11px]" />
      </div>
      <div className="space-y-4">
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
            <p className="mt-1 text-xs text-white/60">
              <span className="font-medium text-white/60">Utility: </span>
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
