import type { CategoryId, Classification, Planet } from "./types";

/**
 * Pure helpers and constants shared by server AND client code.
 * Keep this file free of data imports: importing `lib/sites` from a client
 * component would bundle all eight site JSON documents into the browser.
 */

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

export const DEFAULT_COLOR = "#38bdf8";

export function planetColor(planet: Planet): string {
  return PLANETS.find((p) => p.id === planet)?.color ?? DEFAULT_COLOR;
}

/** Picks the lunar or Martian assessment from anything shaped like a site. */
export function getAssessment<T>(site: { moon: T; mars: T }, planet: Planet): T {
  return planet === "moon" ? site.moon : site.mars;
}

/** Route id for report pages, e.g. "ter-01-moon". */
export function reportId(assessment: { id: string }): string {
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

export const SCORE_DISCLAIMER =
  "Similarity percentages are preliminary AI-assisted assessments based on compiled scientific descriptions. They are not independently validated measurements or certified indicators of mission suitability.";

export const CATEGORY_JUDGMENT_NOTE =
  "Category percentages are expert judgments of overall similarity for that category. They are not the arithmetic average of the variable scores listed below, so a category can sit above or below its variables.";
