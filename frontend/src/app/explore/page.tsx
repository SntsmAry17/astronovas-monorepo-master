import { Suspense } from "react";
import ExploreApp from "@/components/ExploreApp";
import { SITES } from "@/lib/sites";
import type { Planet } from "@/lib/types";

interface SP {
  site?: string;
  planet?: string;
}

export default function ExplorePage({ searchParams }: { searchParams: Promise<SP> }) {
  return (
    <Suspense
      fallback={<div className="grid h-screen place-items-center text-white/40">Loading…</div>}
    >
      <Loader searchParams={searchParams} />
    </Suspense>
  );
}

async function Loader({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const planet: Planet = sp.planet === "mars" ? "mars" : "moon";
  // Key forces a remount when the URL targets a different site/planet, so
  // state always matches the link the user clicked (e.g. a globe marker).
  return (
    <ExploreApp
      key={`${sp.site ?? "none"}-${planet}`}
      sites={SITES}
      initialSite={sp.site ?? null}
      initialPlanet={planet}
    />
  );
}
