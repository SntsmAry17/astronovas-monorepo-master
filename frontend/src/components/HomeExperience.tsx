"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtScore, getAssessment } from "@/lib/sites";
import type { TerSite } from "@/lib/types";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-white/40">Loading globe…</div>,
});

export default function HomeExperience({ sites }: { sites: TerSite[] }) {
  const router = useRouter();
  return (
    <main>
      {/* Hero + globe */}
      <section className="relative flex min-h-screen flex-col">
        <div className="absolute inset-0">
          <Globe
            sites={sites}
            activeId={null}
            zoom={false}
            onSelect={(id) => {
              const s = sites.find((x) => x.id === id);
              if (s) router.push(`/explore?site=${s.slug}`);
            }}
          />
        </div>
        <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 pt-24">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-widest text-sky-300">
              AstroNovas · NASA Space Apps Challenge 2026
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
              Explore Earth&apos;s Analog Environments for the Moon and Mars
            </h1>
            <p className="mt-4 text-lg text-white/70">
              Discover, compare, and investigate terrestrial locations that offer valuable
              environments for planetary exploration research.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/50">
              Our interactive platform brings together eight terrestrial analog regions,
              scientific characteristics, exploratory planetary similarity assessments, and
              mission-oriented recommendations.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="rounded-full bg-sky-400 px-6 py-3 font-semibold text-slate-950 transition-colors hover:bg-sky-300"
              >
                Explore Sites
              </Link>
              <Link
                href="/mission"
                className="rounded-full border border-orange-300/50 bg-orange-400/10 px-6 py-3 font-semibold text-orange-200 transition-colors hover:bg-orange-400/20"
              >
                Find by Mission
              </Link>
            </div>
            <p className="mt-6 text-xs text-white/35">
              Tip: drag the globe to rotate it, and click a marker to jump straight into a
              site profile.
            </p>
          </div>
        </div>
      </section>

      {/* Two modes */}
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-16 md:grid-cols-2">
        <ModeCard
          href="/explore"
          title="Explore Sites"
          body="Explore terrestrial analog regions, compare their characteristics with the Moon or Mars, and access detailed scientific reports."
          items={[
            "Interactive 3D globe with eight locations",
            "Moon / Mars similarity assessments",
            "Seven scientific categories with variable-level scores",
            "Sixteen full scientific reports",
          ]}
        />
        <ModeCard
          href="/mission"
          title="Find by Mission"
          body="Select a planetary research objective and discover which terrestrial environments may provide the most relevant analog opportunities."
          items={[
            "Seven research objectives, from rover mobility to astrobiology",
            "Transparent exploratory mission-fit scoring",
            "Data coverage and missing-variable reporting",
            "Ranked result cards linked to site profiles",
          ]}
        />
      </section>

      {/* The sites */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <p className="font-mono text-[11px] uppercase tracking-widest text-sky-300">
          The eight analog regions
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sites.map((s) => (
            <Link
              key={s.id}
              href={`/explore?site=${s.slug}`}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-sky-400/40 hover:bg-white/[0.07]"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">{s.id}</p>
              <p className="mt-1 font-semibold leading-tight">{s.name}</p>
              <p className="mt-0.5 text-xs text-white/50">{s.country}</p>
              <p className="mt-3 flex justify-between font-mono text-xs">
                <span className="text-sky-300">Moon {fmtScore(getAssessment(s, "moon").overallScore)}</span>
                <span className="text-orange-300">Mars {fmtScore(getAssessment(s, "mars").overallScore)}</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Transparency */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="text-xl font-bold">Built on open scientific data</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
            TerraAnalog compiles published scientific descriptions of eight terrestrial analog
            regions and compares them against planetary variables documented from NASA missions and
            instruments — including LRO (LOLA, LROC, Diviner), MGS/MOLA, MRO (HiRISE, CRISM, SHARAD),
            Mars Odyssey/THEMIS and NASA POWER climatology, queried live for each site&apos;s
            representative coordinates.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
            All similarity percentages are exploratory, AI-assisted assessments — not certified
            measurements. Methodology, scoring rules and full source lists are documented openly.
          </p>
          <Link
            href="/methodology"
            className="mt-5 inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-white/75 hover:bg-white/10"
          >
            Scientific sources and methodology →
          </Link>
        </div>
      </section>
    </main>
  );
}

function ModeCard({
  href,
  title,
  body,
  items,
}: {
  href: string;
  title: string;
  body: string;
  items: string[];
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-sky-400/40 hover:bg-white/[0.06] md:p-8"
    >
      <h2 className="text-2xl font-bold group-hover:text-sky-200">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
      <ul className="mt-4 space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-sm text-white/55">
            <span className="text-sky-400">·</span>
            {i}
          </li>
        ))}
      </ul>
    </Link>
  );
}
