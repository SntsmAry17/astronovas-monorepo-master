import { Suspense } from "react";
import ExploreApp from "@/components/ExploreApp";
import { SITE_SUMMARIES, getSite } from "@/lib/sites";
import type { Planet } from "@/lib/types";

export const metadata = {
  title: "Explore Sites — AstroNovas TerraAnalog",
  description:
    "Explore eight terrestrial analog sites on an interactive globe and compare them with the Moon or Mars.",
};

interface SP {
  site?: string;
  planet?: string;
}

export default function ExplorePage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Suspense
      fallback={<div className="grid h-screen place-items-center text-white/60">Loading…</div>}
    >
      <Loader searchParams={searchParams} />
    </Suspense>
  );
}

async function Loader({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const planet: Planet = sp.planet === "mars" ? "mars" : "moon";
  const initial = sp.site ? getSite(sp.site) : undefined;
  // The client keeps the URL in sync with its own state (history.replaceState), so no
  // remount is needed; the selected site's full detail is resolved here, on the server.
  return (
    <ExploreApp
      sites={SITE_SUMMARIES}
      initialSite={initial?.slug ?? null}
      initialPlanet={planet}
      initialDetail={initial ?? null}
    />
  );
}
