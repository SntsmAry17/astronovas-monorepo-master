import ter01 from "@/data/sites/ter-01.json";
import ter02 from "@/data/sites/ter-02.json";
import ter03 from "@/data/sites/ter-03.json";
import ter04 from "@/data/sites/ter-04.json";
import ter05 from "@/data/sites/ter-05.json";
import ter06 from "@/data/sites/ter-06.json";
import ter07 from "@/data/sites/ter-07.json";
import ter08 from "@/data/sites/ter-08.json";
import type { Assessment, MissionSite, SiteSummary, TerSite } from "./types";

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

export function getSite(slug: string): TerSite | undefined {
  return SITES.find((s) => s.slug === slug || s.id.toLowerCase() === slug.toLowerCase());
}

export function getAssessmentById(id: string): { site: TerSite; assessment: Assessment } | undefined {
  for (const site of SITES) {
    for (const a of [site.moon, site.mars]) {
      if (a.id.toLowerCase() === id.toLowerCase()) return { site, assessment: a };
    }
  }
  return undefined;
}

export function toSummary(site: TerSite): SiteSummary {
  const sum = (a: Assessment) => ({
    id: a.id,
    overallScore: a.overallScore,
    categoryScores: Object.fromEntries(a.categories.map((c) => [c.id, c.score])),
  });
  return {
    id: site.id,
    slug: site.slug,
    name: site.name,
    country: site.country,
    lat: site.lat,
    lng: site.lng,
    moon: sum(site.moon),
    mars: sum(site.mars),
  };
}

export function toMissionSite(site: TerSite): MissionSite {
  const slim = (a: Assessment) => ({
    id: a.id,
    limitations: a.limitations.slice(0, 1),
    categories: a.categories.map((c) => ({
      id: c.id,
      variables: c.variables.map((v) => ({ id: v.id, name: v.name, score: v.score })),
    })),
  });
  return {
    id: site.id,
    slug: site.slug,
    name: site.name,
    country: site.country,
    lat: site.lat,
    lng: site.lng,
    moon: slim(site.moon),
    mars: slim(site.mars),
  };
}

export const SITE_SUMMARIES: SiteSummary[] = SITES.map(toSummary);
export const MISSION_SITES: MissionSite[] = SITES.map(toMissionSite);
