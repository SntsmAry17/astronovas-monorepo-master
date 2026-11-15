import ter01 from "@/data/sites/ter-01.json";
import ter02 from "@/data/sites/ter-02.json";
import ter03 from "@/data/sites/ter-03.json";
import ter04 from "@/data/sites/ter-04.json";
import ter05 from "@/data/sites/ter-05.json";
import ter06 from "@/data/sites/ter-06.json";
import ter07 from "@/data/sites/ter-07.json";
import ter08 from "@/data/sites/ter-08.json";
import type { Assessment, CategoryId, Classification, Planet, TerSite } from "./types";

export const SITES: TerSite[] = [
  ter01,
  ter02,
  ter03,
  ter04,
  ter05,
  ter06,
  ter07,
  ter08,
] as unknown as TerSite[];

export const CATEGORY_ORDER: { id: CategoryId; name: string }[] = [
  { id: "topography", name: "Topography and Geomorphology" },
  { id: "thermal", name: "Thermal and Environmental Conditions" },
  { id: "geology", name: "Geology and Mineralogy" },
  { id: "water", name: "Water, Ice and Resources" },
  { id: "atmosphere", name: "Atmosphere, Dust and Surface Dynamics" },
  { id: "subsurface", name: "Subsurface and Natural Structures" },
  { id: "biology", name: "Biology and Habitability" },
];

export const PLANETS: { id: Planet; name: string; color: string }[] = [
  { id: "moon", name: "Moon", color: "#93c5fd" },
  { id: "mars", name: "Mars", color: "#fb923c" },
];

export function getSite(slug: string): TerSite | undefined {
  return SITES.find((s) => s.slug === slug || s.id.toLowerCase() === slug.toLowerCase());
}

export function getAssessment(site: TerSite, planet: Planet): Assessment {
  return planet === "moon" ? site.moon : site.mars;
}

export function getAssessmentById(id: string): { site: TerSite; assessment: Assessment } | undefined {
  for (const site of SITES) {
    for (const a of [site.moon, site.mars]) {
      if (a.id.toLowerCase() === id.toLowerCase()) return { site, assessment: a };
    }
  }
  return undefined;
}

/** Route id for report pages, e.g. "ter-01-moon". */
export function reportId(assessment: Assessment): string {
  return assessment.id.toLowerCase();
}

export function classifyScore(score: number | null): Classification {
  if (score === null) return "Not Applicable";
  if (score >= 90) return "Very High";
  if (score >= 75) return "High";
  if (score >= 50) return "Moderate";
  if (score >= 25) return "Low";
  return "Very Low";
}

/** Formats a score for display; N/A stays N/A (never shown as 0%). */
export function fmtScore(score: number | null): string {
  return score === null ? "N/A" : `${Number(score.toFixed(1))}%`;
}
