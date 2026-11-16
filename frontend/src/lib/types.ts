/** Planetary target of an assessment. */
export type Planet = "moon" | "mars";

/** The seven scientific comparison categories (fixed order). */
export type CategoryId =
  | "topography"
  | "thermal"
  | "geology"
  | "water"
  | "atmosphere"
  | "subsurface"
  | "biology";

export type Classification =
  | "Very High"
  | "High"
  | "Moderate"
  | "Low"
  | "Very Low"
  | "Not Applicable";

/** A single comparable variable inside a category. `score: null` means N/A — never 0. */
export interface SubVariable {
  id: string;
  name: string;
  score: number | null;
  explanation: string;
  utility: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  score: number | null;
  classification: Classification;
  description: string;
  utility: string;
  variables: SubVariable[];
}

export interface SourceGroup {
  label: string;
  items: string[];
}

/** A planetary similarity assessment: `TER-XX-MOON` or `TER-XX-MARS`. */
export interface Assessment {
  id: string;
  planet: Planet;
  overallScore: number;
  classification: Classification;
  /** General description of similarities shown on the similarity card. */
  summary: string;
  /** Main scientific applications. */
  applications: string[];
  /** Full scientific report sections (order preserved from the source documents). */
  objective: string;
  characterization: string[];
  limitations: string[];
  conclusion: string[];
  sources: SourceGroup[];
  methodology: string[];
  categories: Category[];
}

export interface ExtraMarker {
  name: string;
  lat: number;
  lng: number;
}

/** One of the eight terrestrial analog locations (TER-01 … TER-08). */
export interface TerSite {
  id: string;
  slug: string;
  name: string;
  country: string;
  regions?: string;
  lat: number;
  lng: number;
  elevation: string;
  environmentType: string;
  features: string[];
  description: string;
  relevance: string;
  geoNote: string;
  extraMarkers?: ExtraMarker[];
  moon: Assessment;
  mars: Assessment;
}

/** Minimum a globe needs to draw and select a site. */
export interface GlobeSite {
  id: string;
  slug: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

export interface AssessmentSummary {
  id: string;
  overallScore: number;
  categoryScores: Partial<Record<CategoryId, number | null>>;
}

/** Lightweight site sent to client components (no reports, no variable text). */
export interface SiteSummary extends GlobeSite {
  moon: AssessmentSummary;
  mars: AssessmentSummary;
}

/** Variable scores only — everything the mission-fit ranking needs. */
export interface MissionAssessment {
  id: string;
  limitations: string[];
  categories: { id: CategoryId; variables: { id: string; name: string; score: number | null }[] }[];
}

export interface MissionSite extends GlobeSite {
  moon: MissionAssessment;
  mars: MissionAssessment;
}
