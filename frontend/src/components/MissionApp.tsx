"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MISSIONS, rankForMission, type Mission, type MissionResult } from "@/lib/missions";
import { classifyScore, fmtScore, getAssessment, planetColor as colorFor, reportId } from "@/lib/format";
import type { MissionSite, Planet } from "@/lib/types";
import { ClassificationBadge, PlanetToggle, ScoreBar, ScoreDisclaimer } from "./ui";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-white/60">Loading globe…</div>,
});

const MISSION_ICONS: Record<string, string> = {
  "rover-mobility": "🚙",
  "geology-mineralogy": "🪨",
  "water-ice-resources": "🧊",
  "thermal-testing": "🌡️",
  "dust-wind": "🌪️",
  "subsurface-caves": "🕳️",
  astrobiology: "🧬",
};

export default function MissionApp({ sites }: { sites: MissionSite[] }) {
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
  const planetColor = colorFor(planet);

  // A marker click on the globe focuses a site: bring its result card into view.
  useEffect(() => {
    if (focusId) document.getElementById(`result-${focusId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusId]);

  return (
    <div className="flex flex-col md:h-screen md:flex-row">
      {/* Globe */}
      <div className="relative h-[40vh] shrink-0 md:h-auto md:flex-1">
        <Globe sites={sites} activeId={focusId} onSelect={setFocusId} color={planetColor} />
        <div className="pointer-events-none absolute left-4 top-16 md:top-20">
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: planetColor }}>
            Find by Mission
          </p>
          <p className="mt-1 max-w-56 text-xs text-white/60">
            Pick a research objective; results focus the globe on each analog site.
          </p>
        </div>
      </div>

      {/* Side panel */}
      <aside className="nice-scroll min-h-0 flex-1 overflow-y-auto border-t border-white/10 bg-black/35 backdrop-blur md:w-[46%] md:flex-none md:border-l md:border-t-0">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#050a14]/90 px-5 py-3 backdrop-blur">
          <p className="pt-14 font-mono text-[11px] uppercase tracking-widest md:pt-12" style={{ color: planetColor }}>Step 1 · Choose the target</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <PlanetToggle
              planet={planet}
              onChange={(p) => {
                setPlanet(p);
                if (mission && !mission.planets.includes(p)) setMissionId(null);
              }}
            />
          </div>
          {mission && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <p className="min-w-0 truncate text-sm">
                <span className="mr-2" aria-hidden>
                  {MISSION_ICONS[mission.id] ?? "🎯"}
                </span>
                <span className="font-medium">{mission.name}</span>
              </p>
              <button
                onClick={() => {
                  setMissionId(null);
                  setFocusId(null);
                }}
                className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:bg-white/10"
              >
                Change
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-5 pb-16">
          {!mission && (
            <div className="rise-in">
              <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: planetColor }}>
                Step 2 · Choose a research objective
              </p>
              <p className="mt-1 text-sm text-white/65">
                The eight analog sites are ranked by the variables that matter for your objective,
                not by the general similarity score.
              </p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {MISSIONS.map((m) => {
                  const available = m.planets.includes(planet);
                  return (
                    <li key={m.id}>
                      <button
                        disabled={!available}
                        onClick={() => {
                          setMissionId(m.id);
                          setFocusId(null);
                        }}
                        className={`card block h-full w-full p-4 text-left ${
                          available ? "card-interactive" : "cursor-not-allowed opacity-50"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5 text-lg"
                            aria-hidden
                          >
                            {MISSION_ICONS[m.id] ?? "🎯"}
                          </span>
                          <span className="text-sm font-semibold leading-tight">{m.name}</span>
                        </span>
                        <span className="mt-2 block text-xs leading-relaxed text-white/65">{m.description}</span>
                        <span className="mt-2 block text-[11px] text-white/60">
                          {available ? `${m.variables.length} variables` : "Mars only"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
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
  const color = colorFor(planet);
  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
          Mission · {planet === "moon" ? "Moon" : "Mars"}
        </p>
        <h2 className="mt-1 text-xl font-bold">{mission.name}</h2>
        <p className="mt-1 text-sm text-white/55">{mission.description}</p>
        <p className="mt-2 text-xs text-white/60">
          Variables used: {mission.variables.map((v) => v.label).join(", ")}
        </p>
      </div>

      <ScoreDisclaimer>
        Mission-fit scores are exploratory rankings calculated from preliminary variable
        assessments. They support research prioritization and do not certify operational
        suitability.
      </ScoreDisclaimer>

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
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">
            Insufficient Data
          </p>
          <p className="mt-1 text-[11px] text-white/60">
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
                <span className="ml-2 text-[11px] text-white/60">
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
  const assessment = getAssessment(site, planet);
  const top = [...result.contributions]
    .filter((c) => c.effectiveScore !== null)
    .sort((a, b) => (b.effectiveScore ?? 0) - (a.effectiveScore ?? 0))
    .slice(0, 3);
  const cls = classifyScore(result.score);

  return (
    <article
      id={`result-${site.id}`}
      className={`scroll-mt-40 rounded-2xl border p-4 transition-colors ${
        focused ? "border-sky-400/50 bg-sky-400/[0.07]" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            #{rank} recommended analog
          </p>
          <h3 className="mt-0.5 truncate text-lg font-bold">{site.name}</h3>
          <p className="text-xs text-white/60">{site.country}</p>
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
        <p className="mt-1.5 text-[11px] text-white/60">
          Data coverage: {Math.round(result.coverage * 100)}% · {result.scoredCount} of{" "}
          {result.contributions.length} mission variables scored
        </p>
      </div>

      {top.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wider text-white/60">Main contributions</p>
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
        <p className="mt-2 text-[11px] text-white/60">
          Not documented for this site: {result.missingVars.join(", ")}.
        </p>
      )}
      {result.naVars.length > 0 && (
        <p className="mt-1 text-[11px] text-white/60">
          Marked N/A (excluded): {result.naVars.join(", ")}.
        </p>
      )}

      {assessment.limitations[0] && (
        <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-white/60">
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
