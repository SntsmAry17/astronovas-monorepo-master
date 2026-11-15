import { NextResponse } from "next/server";
import { fetchClimatology } from "@/lib/nasa";
import { getSite } from "@/lib/sites";

/** NASA POWER climatology for a site's representative coordinates. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("site") ?? "";
  const site = getSite(slug);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });

  const data = await fetchClimatology(site.lat, site.lng);
  return NextResponse.json(
    {
      siteId: site.id,
      coordinates: { lat: site.lat, lng: site.lng },
      source: "NASA POWER",
      data,
    },
    {
      // Success is cached for a day by fetchClimatology; keep failures short-lived at the edge.
      headers: {
        "Cache-Control": data
          ? "public, max-age=3600, stale-while-revalidate=86400"
          : "public, max-age=30",
      },
    },
  );
}
