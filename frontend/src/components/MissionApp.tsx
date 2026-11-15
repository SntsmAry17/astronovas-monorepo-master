"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MISSIONS, rankForMission, type Mission, type MissionResult } from "@/lib/missions";
import { PLANETS, classifyScore, fmtScore, reportId } from "@/lib/sites";
import type { Planet, TerSite } from "@/lib/types";
import { ClassificationBadge, PlanetToggle, ScoreBar } from "./ui";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-white/40">Loading globe…</div>,
});

export default function MissionApp({ sites }: { sites: TerSite[] }) {
  const [planet, setPlanet] = useState<Planet>("mars");
  const [missionId, setMissionId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const mission = MISSIONS.find((m) => m.id === missionId) ?? null;
  const results = useMemo(
    () => (mission ? rankForMission(sites, planet, mission) : []),
    [sites, planet, mission],
  );
  const scored = results.filter((r) => r.score !== null);
  const insufficient = results.filter((r) => r.score === null);
  const planetColor = PLANETS.find((p) => p.id === planet)?.color ?? "#38bdf8";

  return (
    <div className="flex flex-col md:h-screen md:flex-row">
      {/* Globe */}
      <div className="relative h-[40vh] shrink-0 md:h-auto md:flex-1">
        <Globe sites={sites} activeId={focusId} onSelect={setFocusId} color={planetColor} />
        <div className="pointer-events-none absolute left-4 top-16 md:top-20">
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: planetColor }}>
            Find by Mission
          </p>
          <p className="mt-1 max-w-56 text-xs text-white/50">
            Pick a research objective; results focus the globe on each analog site.
          </p>
        </div>
      </div>

      {/* Side panel */}
      <aside className="nice-scroll min-h-0 flex-1 overflow-y-auto border-t border-white/10 bg-black/35 backdrop-blur md:w-[46%] md:flex-none md:border-l md:border-t-0">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#050a14]/90 px-5 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 pt-14 md:pt-12">
            <PlanetToggle
              planet={planet}
              onChange={(p) => {
                setPlanet(p);
                if (mission && !mission.planets.includes(p)) setMissionId(null);
              }}
            />
          </div>
          <div className="mt-3 pb-1">
            <label
              htmlFor="mission-select"
              className="font-mono text-[11px] uppercase tracking-widest"
              style={{ color: planetColor }}
            >
              Research objective
            </label>
            <select
              id="mission-select"
              value={missionId ?? ""}
              onChange={(e) => {
                setMissionId(e.target.value || null);
                setFocusId(null);
              }}
              className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#050a14] px-3 py-2.5 text-sm text-white outline-none focus:border-white/40"
            >
              <option value="">Choose a research objective…</option>
              {MISSIONS.filter((m) => m.planets.includes(planet)).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            {planet === "moon" && (
              <p className="mt-1.5 text-[11px] text-amber-300/70">
                Astrobiology is Mars-only — no direct biological comparison applies to the Moon.
              </p>
            )}
          </div>
        </div>

        <div className="px-5 py-5 pb-16">
          {!mission && (
            <p className="text-sm text-white/60">
              First choose the Moon or Mars above, then pick a research objective from the
              drop-down list. The platform will rank the eight analog locations using the
              variables that matter for that objective — not the general similarity score.
            </p>
          )}

          {mission && (
            <MissionResults
              mission={mission}
              planet={planet}
              scored={scored}
              insufficient={insufficient}
              focusId={focusId}
              onFocus={setFocusId}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

function MissionResults({
  mission,
  planet,
  scored,
  insufficient,
  focusId,
  onFocus,
}: {
  mission: Mission;
  planet: Planet;
  scored: MissionResult[];
  insufficient: MissionResult[];
  focusId: string | null;
  onFocus: (id: string | null) => void;
}) {
  const color = PLANETS.find((p) => p.id === planet)?.color ?? "#38bdf8";
  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
          Mission · {planet === "moon" ? "Moon" : "Mars"}
        </p>
        <h2 className="mt-1 text-xl font-bold">{mission.name}</h2>
        <p className="mt-1 text-sm text-white/55">{mission.description}</p>
        <p className="mt-2 text-xs text-white/40">
          Variables used: {mission.variables.map((v) => v.label).join(", ")}
        </p>
      </div>

      <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-relaxed text-amber-200/70">
        Mission-fit scores are exploratory rankings calculated from preliminary variable
        assessments. They support research prioritization and do not certify operational
        suitability.
      </p>

      <div className="space-y-3">
        {scored.map((r, i) => (
          <ResultCard
            key={r.site.id}
            rank={i + 1}
            result={r}
            planet={planet}
            color={color}
            focused={focusId === r.site.id}
            onFocus={onFocus}
          />
        ))}
      </div>

      {insufficient.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-white/45">
            Insufficient Data
          </p>
          <p className="mt-1 text-[11px] text-white/40">
            Fewer than two scored mission variables or under 50% variable coverage. Missing data
            does not mean low compatibility.
          </p>
          <ul className="mt-2 space-y-1">
            {insufficient.map((r) => (
              <li key={r.site.id}>
                <button
                  onClick={() => onFocus(r.site.id)}
                  className="text-sm text-white/65 underline-offset-2 hover:text-white hover:underline"
                >
                  {r.site.name}
                </button>
                <span className="ml-2 text-[11px] text-white/35">
                  scored {r.scoredCount}/{mission.variables.length} vars · {Math.round(r.coverage * 100)}% coverage
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ResultCard({
  rank,
  result,
  planet,
  color,
  focused,
  onFocus,
}: {
  rank: number;
  result: MissionResult;
  planet: Planet;
  color: string;
  focused: boolean;
  onFocus: (id: string | null) => void;
}) {
  const { site } = result;
  const assessment = planet === "moon" ? site.moon : site.mars;
  const top = [...result.contributions]
    .filter((c) => c.effectiveScore !== null)
    .sort((a, b) => (b.effectiveScore ?? 0) - (a.effectiveScore ?? 0))
    .slice(0, 3);
  const cls = classifyScore(result.score);

  return (
    <article
      className={`rounded-2xl border p-4 transition-colors ${
        focused ? "border-sky-400/50 bg-sky-400/[0.07]" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
            #{rank} recommended analog
          </p>
          <h3 className="mt-0.5 truncate text-lg font-bold">{site.name}</h3>
          <p className="text-xs text-white/50">{site.country}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-bold" style={{ color }}>
            {fmtScore(result.score)}
          </p>
          <ClassificationBadge score={result.score} label={cls} />
        </div>
      </div>

      <div className="mt-3">
        <ScoreBar score={result.score} color={color} />
        <p className="mt-1.5 text-[11px] text-white/45">
          Data coverage: {Math.round(result.coverage * 100)}% · {result.scoredCount} of{" "}
          {result.contributions.length} mission variables scored
        </p>
      </div>

      {top.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Main contributions</p>
          <ul className="mt-1 space-y-1">
            {top.map((c) => (
              <li key={c.missionVar.id} className="flex justify-between gap-2 text-xs text-white/70">
                <span className="truncate">{c.missionVar.label}</span>
                <span className="shrink-0 font-mono" style={{ color }}>
                  {c.effectiveScore?.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.missingVars.length > 0 && (
        <p className="mt-2 text-[11px] text-white/40">
          Not documented for this site: {result.missingVars.join(", ")}.
        </p>
      )}
      {result.naVars.length > 0 && (
        <p className="mt-1 text-[11px] text-white/40">
          Marked N/A (excluded): {result.naVars.join(", ")}.
        </p>
      )}

      {assessment.limitations[0] && (
        <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-white/45">
          <span className="font-medium text-white/55">Limitation: </span>
          {assessment.limitations[0]}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onFocus(focused ? null : site.id)}
          className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:bg-white/10"
        >
          {focused ? "Unfocus globe" : "Focus on globe"}
        </button>
        <Link
          href={`/explore?site=${site.slug}&planet=${planet}`}
          className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs text-sky-200 hover:bg-sky-400/20"
        >
          Open site profile
        </Link>
        <Link
          href={`/report/${reportId(assessment)}`}
          className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:bg-white/10"
        >
          Scientific report
        </Link>
      </div>
    </article>
  );
}
