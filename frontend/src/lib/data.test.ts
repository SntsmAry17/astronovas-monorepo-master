import { describe, expect, it } from "vitest";
import { ELEVATION_TOLERANCE_M, REFERENCE_ELEVATION_M, elevationMismatch } from "./climate";
import { CATEGORY_ORDER, classifyScore, fmtScore } from "./format";
import { MIN_COVERAGE, MISSIONS, rankForMission } from "./missions";
import { MISSION_SITES, SITES, toSummary } from "./sites";
import type { Planet } from "./types";

const PLANET_IDS: Planet[] = ["moon", "mars"];
const validScore = (s: number | null) => s === null || (typeof s === "number" && s >= 0 && s <= 100);

describe("site data integrity", () => {
  it("has eight uniquely identified sites with valid coordinates", () => {
    expect(SITES).toHaveLength(8);
    expect(new Set(SITES.map((s) => s.id)).size).toBe(8);
    expect(new Set(SITES.map((s) => s.slug)).size).toBe(8);
    for (const s of SITES) {
      expect(s.lat).toBeGreaterThanOrEqual(-90);
      expect(s.lat).toBeLessThanOrEqual(90);
      expect(s.lng).toBeGreaterThanOrEqual(-180);
      expect(s.lng).toBeLessThanOrEqual(180);
    }
  });

  for (const site of SITES) {
    for (const p of PLANET_IDS) {
      it(`${site.id} ${p}: shape and score ranges`, () => {
        const a = site[p];
        expect(a.planet).toBe(p);
        expect(a.id.toLowerCase()).toBe(`${site.id}-${p}`.toLowerCase());
        expect(validScore(a.overallScore)).toBe(true);
        expect(a.categories.map((c) => c.id)).toEqual(CATEGORY_ORDER.map((c) => c.id));
        for (const c of a.categories) {
          expect(validScore(c.score)).toBe(true);
          for (const v of c.variables) expect(validScore(v.score)).toBe(true);
        }
        expect(a.sources.length).toBeGreaterThan(0);
      });
    }
  }
});

describe("score helpers", () => {
  it("classifies on the documented thresholds", () => {
    expect(classifyScore(null)).toBe("Not Applicable");
    expect(classifyScore(90)).toBe("Very High");
    expect(classifyScore(89.9)).toBe("High");
    expect(classifyScore(75)).toBe("High");
    expect(classifyScore(50)).toBe("Moderate");
    expect(classifyScore(25)).toBe("Low");
    expect(classifyScore(24.9)).toBe("Very Low");
  });
  it("never renders N/A as 0%", () => {
    expect(fmtScore(null)).toBe("N/A");
    expect(fmtScore(0)).toBe("0%");
    expect(fmtScore(56.04)).toBe("56%");
  });
});

describe("slim payloads", () => {
  it("summaries and mission sites keep scores consistent with the full data", () => {
    for (const site of SITES) {
      const sum = toSummary(site);
      expect(sum.moon.overallScore).toBe(site.moon.overallScore);
      for (const c of site.mars.categories) expect(sum.mars.categoryScores[c.id]).toBe(c.score);
    }
    expect(JSON.stringify(MISSION_SITES).length).toBeLessThan(JSON.stringify(SITES).length / 3);
  });
});

describe("mission ranking", () => {
  it("is deterministic and orders scored sites before insufficient-data sites", () => {
    for (const m of MISSIONS) {
      for (const p of m.planets) {
        const a = rankForMission(MISSION_SITES, p, m);
        const b = rankForMission(MISSION_SITES, p, m);
        expect(a.map((r) => [r.site.id, r.score])).toEqual(b.map((r) => [r.site.id, r.score]));
        const scores = a.map((r) => r.score);
        const firstNull = scores.indexOf(null);
        if (firstNull >= 0) expect(scores.slice(firstNull).every((s) => s === null)).toBe(true);
        const numeric = scores.filter((s): s is number => s !== null);
        expect([...numeric].sort((x, y) => y - x)).toEqual(numeric);
        for (const r of a) {
          if (r.score !== null) expect(r.coverage).toBeGreaterThanOrEqual(MIN_COVERAGE);
        }
      }
    }
  });

  it("every mission variable alias matches data for at least one site (guards against silent renames)", () => {
    const unmatched: string[] = [];
    for (const m of MISSIONS) {
      for (const p of m.planets) {
        const results = rankForMission(MISSION_SITES, p, m);
        for (const mv of m.variables) {
          const hit = results.some((r) => r.contributions.find((c) => c.missionVar.id === mv.id)?.status !== "missing");
          if (!hit) unmatched.push(`${m.id}/${p}/${mv.id}`);
        }
      }
    }
    expect(unmatched).toEqual([]);
  });
});

describe("NASA POWER elevation check", () => {
  it("has a reference elevation for every site", () => {
    expect(Object.keys(REFERENCE_ELEVATION_M).sort()).toEqual(SITES.map((s) => s.id).sort());
  });
  it("flags the known mismatches (Mauna Kea summit, Danakil depression) and not matching cells", () => {
    expect(elevationMismatch("TER-02", 636)).not.toBeNull();
    expect(elevationMismatch("TER-07", 1063)).not.toBeNull();
    expect(elevationMismatch("TER-06", 3017)).toBeNull();
    expect(elevationMismatch("TER-05", 200 - ELEVATION_TOLERANCE_M)).toBeNull();
    expect(elevationMismatch("TER-01", null)).toBeNull();
  });
});
