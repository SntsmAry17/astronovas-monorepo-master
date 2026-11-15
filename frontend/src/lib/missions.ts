import type { Assessment, Planet, SubVariable, TerSite } from "./types";
import { getAssessment } from "./sites";

/**
 * Mission definitions and the exploratory mission-fit scoring.
 *
 * Method (deterministic, documented, reproducible):
 *   Mission Fit Score = Sum(variable score x mission weight) / Sum(weights of scored variables)
 *   Data Coverage     = Sum(weights of scored vars) / Sum(weights of scored + missing vars)
 *
 * A site shows a score only when at least MIN_VARS variables produced a numeric score and
 * coverage is at least MIN_COVERAGE; otherwise it is reported as "Insufficient Data".
 * Variables scored N/A are excluded entirely (they are "not applicable", not missing).
 *
 * The equal weights below are a prototype heuristic — not a NASA-validated weighting.
 * They live in one explicit config so the team can replace them later.
 */

export const MIN_VARS = 2;
export const MIN_COVERAGE = 0.5;

export interface MissionVariable {
  id: string;
  label: string;
  /** Variable ids / normalized names in the assessment data that satisfy this variable. */
  aliases: string[];
  weight: number;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  /** Planets where the mission can run (astrobiology is Mars-only). */
  planets: Planet[];
  variables: MissionVariable[];
}

const v = (id: string, label: string, aliases: string[], weight = 1): MissionVariable => ({
  id,
  label,
  aliases: [id, ...aliases],
  weight,
});

export const MISSIONS: Mission[] = [
  {
    id: "rover-mobility",
    name: "Rover Mobility and Navigation",
    description:
      "Oriented to testing movement, navigation and terrain reconnaissance for robotic vehicles.",
    planets: ["moon", "mars"],
    variables: [
      v("slope", "Slope", ["slopes", "gradient", "slope_gradient"]),
      v("surface_roughness", "Surface Roughness", ["roughness", "terrain_roughness"]),
      v("surface_obstacles", "Surface Obstacles", ["obstacles", "rock_obstacles", "surface_obstacles_and_rocks"]),
      v("relief", "Relief", ["terrain_relief", "relief_forms"]),
      v("surface_material", "Surface Material", ["surface_materials", "ground_material", "regolith_material", "surface_regolith"]),
    ],
  },
  {
    id: "geology-mineralogy",
    name: "Geological and Mineralogical Research",
    description: "Oriented to identifying materials, structures and geological processes.",
    planets: ["moon", "mars"],
    variables: [
      v("rock_type", "Rock Type", ["rock_types", "lithology", "basaltic_rock"]),
      v("mineralogical_composition", "Mineralogical Composition", ["mineral_composition", "mineralogy"]),
      v("chemical_composition", "Chemical Composition", ["geochemistry", "chemistry", "perchlorate_sulfate_chemistry", "perchlorate_and_sulfate_chemistry", "elemental_composition"]),
      v("geological_formations", "Geological Formations", ["geological_structures", "formations", "alluvial_fans_and_paleolakes", "volcanic_formations"]),
      v("geological_alteration", "Geological Alteration", ["alteration", "weathering", "hyperarid_chemical_weathering", "chemical_weathering", "hydrothermal_alteration"]),
    ],
  },
  {
    id: "water-ice-resources",
    name: "Water, Ice and Resource Investigation",
    description: "Oriented to investigating ice, frozen ground and related resources.",
    planets: ["moon", "mars"],
    variables: [
      v("surface_ice", "Surface Ice", ["ice", "surface_water_ice", "snow_and_ice", "surface_or_polar_ice"]),
      v("subsurface_ice", "Subsurface Ice", ["buried_ice", "ground_ice", "underground_ice", "subsurface_ice_and_permafrost"]),
      v("permafrost", "Permafrost", ["frozen_ground", "permafrost_ground", "subsurface_ice_and_permafrost"]),
      v("hydrogen_bearing_materials", "Hydrogen-Bearing Materials", ["hydrogen", "hydrated_minerals", "hydrated_minerals_and_clays", "equivalent_hydrogen", "hydrogen_equivalent", "hydrogen_signals"]),
      v("mineral_resources", "Mineral Resources", ["resources", "minerals_and_resources", "salt_and_brine_resources", "salt_resources", "evaporite_resources", "salts_and_brines"]),
    ],
  },
  {
    id: "thermal-testing",
    name: "Thermal and Environmental Equipment Testing",
    description: "Oriented to evaluating instruments against environmental conditions.",
    planets: ["moon", "mars"],
    variables: [
      v("surface_temperature", "Surface Temperature", ["temperature", "ground_temperature"]),
      v("max_min_temperatures", "Maximum and Minimum Temperatures", ["temperature_extremes", "extreme_temperatures", "max_min_temperature", "maximum_and_minimum_temperatures"]),
      v("thermal_variation", "Thermal Variation", ["thermal_cycles", "temperature_variation", "thermal_amplitude", "diurnal_variation", "seasonality"]),
      v("solar_illumination", "Solar Illumination", ["illumination", "insolation", "insolation_and_uv_radiation", "uv_radiation", "solar_radiation", "solar_exposure"]),
      v("atmospheric_pressure", "Atmospheric Conditions / Pressure", ["atmospheric_conditions", "atmospheric_conditions_exosphere", "atmospheric_conditions_vacuum", "atmospheric_composition", "atmospheric_dryness", "pressure", "atmosphere", "atmospheric_pressure_and_vacuum", "vacuum"]),
    ],
  },
  {
    id: "dust-wind",
    name: "Dust, Wind and Surface Processes",
    description: "Oriented to the study of particles and surface processes.",
    planets: ["moon", "mars"],
    variables: [
      v("wind", "Wind", ["winds", "wind_regime", "wind_regime_and_winds", "wind_speed"]),
      v("dust", "Dust / Abrasive Dust", ["abrasive_dust", "dust_particles", "suspended_dust_particles", "suspended_dust", "fine_particles"]),
      v("dust_storms", "Dust Storms", ["local_dust_storms", "storms", "dust_storm_events"]),
      v("aeolian_erosion", "Aeolian Erosion", ["wind_erosion", "eolian_erosion", "aeolian_erosion_and_sediments", "aeolian_erosion_and_yardangs"]),
      v("sediments_and_dunes", "Sediments and Granular Deposits", ["sediments", "dunes", "dunes_and_sediments", "granular_deposits", "sediments_and_granular_deposits", "sand_dunes", "aeolian_erosion_and_sediments"]),
    ],
  },
  {
    id: "subsurface-caves",
    name: "Lava Tubes and Subsurface Exploration",
    description: "Oriented to cavities, structures and underground navigation.",
    planets: ["moon", "mars"],
    variables: [
      v("caves", "Caves", ["cavities", "caves_and_cavities", "caves_and_lava_tubes", "cavities_and_tubes", "lava_tubes_and_caves", "natural_cavities"]),
      v("lava_tubes", "Lava Tubes", ["caves_and_lava_tubes", "cavities_and_tubes", "volcanic_tubes", "lava_tube_systems"]),
      v("fractures", "Cavities and Fractures", ["tectonic_fractures", "fractures", "cavities_and_fractures", "fractures_and_faults", "fractures_and_desiccation_cracks", "faults_and_fractures"]),
      v("subsurface_structure", "Subsurface Structure", ["subsurface_structures", "stratigraphic_structure", "stratigraphy", "sedimentary_stratigraphy", "subsurface_geology"]),
      v("material_thickness", "Material Thickness", ["regolith_thickness", "thickness", "regolith", "ice_thickness", "deposit_thickness"]),
    ],
  },
  {
    id: "astrobiology",
    name: "Astrobiology and Biosignature Research",
    description:
      "Oriented to extremophile life, habitability limits and biosignature preservation. Available for Mars; not used as a direct biological comparison with the Moon.",
    planets: ["mars"],
    variables: [
      v("extremophile_organisms", "Extremophile Organisms", ["extremophiles", "microorganisms", "extremophile_microorganisms", "terrestrial_extremophile_microorganisms_as_a_model", "extremophile_life"]),
      v("habitability_conditions", "Habitability Conditions", ["habitability", "habitability_limits", "limits_of_habitability", "habitability_potential"]),
      v("biosignatures", "Potential Biosignatures", ["potential_biosignatures", "biosignature_preservation", "biosignature_preservation_in_salts", "biosignature_preservation_in_salt", "biosignature_detection", "preservation_of_biosignatures"]),
      v("biological_adaptations", "Biological Adaptations", ["adaptations", "adaptation_mechanisms", "microbial_adaptations", "direct_biological_similarity"]),
    ],
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

function flatVariables(assessment: Assessment): SubVariable[] {
  return assessment.categories.flatMap((c) => c.variables);
}

export interface VariableContribution {
  missionVar: MissionVariable;
  /** Matched data variables for this mission variable. */
  matched: { name: string; score: number | null }[];
  /** Mean of the matched numeric scores; null when all matches are N/A. */
  effectiveScore: number | null;
  status: "scored" | "na" | "missing";
}

export interface MissionResult {
  site: TerSite;
  /** Exploratory mission-fit score 0–100, or null when data is insufficient. */
  score: number | null;
  /** Share of expected mission variables that produced a numeric score (0–1). */
  coverage: number;
  contributions: VariableContribution[];
  scoredCount: number;
  missingVars: string[];
  naVars: string[];
}

/**
 * Computes the exploratory mission-fit ranking for all sites on one planet.
 * Deterministic and reproducible; uses only the documented variable scores.
 */
export function rankForMission(sites: TerSite[], planet: Planet, mission: Mission): MissionResult[] {
  const results = sites.map((site): MissionResult => {
    const assessment = getAssessment(site, planet);
    const dataVars = flatVariables(assessment);
    const keys = dataVars.map((dv) => ({ dv, keys: new Set([norm(dv.id), norm(dv.name)]) }));

    const contributions: VariableContribution[] = mission.variables.map((mv) => {
      const wanted = new Set(mv.aliases.map(norm));
      const matched = keys.filter((k) => [...k.keys].some((key) => wanted.has(key))).map((k) => k.dv);
      const numeric = matched.filter((m) => m.score !== null);
      if (matched.length === 0) return { missionVar: mv, matched: [], effectiveScore: null, status: "missing" };
      if (numeric.length === 0)
        return {
          missionVar: mv,
          matched: matched.map((m) => ({ name: m.name, score: m.score })),
          effectiveScore: null,
          status: "na",
        };
      const effectiveScore = numeric.reduce((s, m) => s + (m.score as number), 0) / numeric.length;
      return {
        missionVar: mv,
        matched: matched.map((m) => ({ name: m.name, score: m.score })),
        effectiveScore,
        status: "scored",
      };
    });

    const scored = contributions.filter((c) => c.status === "scored");
    const missing = contributions.filter((c) => c.status === "missing");
    const scoreWeight = scored.reduce((s, c) => s + c.missionVar.weight, 0);
    const totalWeight = scored.reduce((s, c) => s + c.missionVar.weight, 0) + missing.reduce((s, c) => s + c.missionVar.weight, 0);
    const coverage = totalWeight === 0 ? 0 : scoreWeight / totalWeight;
    const weighted = scored.reduce((s, c) => s + (c.effectiveScore as number) * c.missionVar.weight, 0);
    const enough = scored.length >= MIN_VARS && coverage >= MIN_COVERAGE;

    return {
      site,
      score: enough ? Math.round((weighted / scoreWeight) * 10) / 10 : null,
      coverage,
      contributions,
      scoredCount: scored.length,
      missingVars: missing.map((c) => c.missionVar.label),
      naVars: contributions.filter((c) => c.status === "na").map((c) => c.missionVar.label),
    };
  });

  // Ranked: scored results first (desc), then insufficient-data sites (alphabetical).
  return results.sort((a, b) => {
    if (a.score === null && b.score === null) return a.site.name.localeCompare(b.site.name);
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });
}
