import { NextResponse } from "next/server";
import { SITES, getSite } from "@/lib/sites";

export function generateStaticParams() {
  return SITES.map((s) => ({ slug: s.slug }));
}

/** Full detail (both assessments) for one site, loaded on demand by the explore panel. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getSite(slug);
  if (!site) return NextResponse.json({ error: "Unknown site" }, { status: 404 });
  return NextResponse.json(site, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
