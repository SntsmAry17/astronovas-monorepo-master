"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fmtScore } from "@/lib/format";
import type { SiteSummary } from "@/lib/types";
import { GlobeSkeleton, ScoreBar } from "./ui";

const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <GlobeSkeleton />,
});

const STATS = [
  { value: "8", label: "Analog regions" },
  { value: "16", label: "Scientific reports" },
  { value: "7", label: "Comparison categories" },
  { value: "7", label: "Research objectives" },
];

export default function HomeExperience({ sites }: { sites: SiteSummary[] }) {
  const router = useRouter();
  return (
    <main>
      {/* Hero: copy on the left, interactive globe on the right */}
      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-4 px-6 pb-10 pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-16">
        <div className="rise-in">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-sky-300">
            <span className="size-1.5 rounded-full bg-sky-300" aria-hidden />
            AstroNovas · NASA Space Apps Challenge 2026
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
            Explore Earth&apos;s analog environments for the{" "}
            <span className="bg-gradient-to-r from-sky-300 to-orange-300 bg-clip-text text-transparent">
              Moon and Mars
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            Discover, compare, and investigate terrestrial locations that offer valuable
            environments for planetary exploration research.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="rounded-full bg-sky-400 px-6 py-3 font-semibold text-slate-950 shadow-[0_0_30px_-6px_rgba(56,189,248,0.7)] transition-all hover:-translate-y-0.5 hover:bg-sky-300"
            >
              Explore sites
            </Link>
            <Link
              href="/mission"
              className="rounded-full border border-orange-300/50 bg-orange-400/10 px-6 py-3 font-semibold text-orange-200 transition-all hover:-translate-y-0.5 hover:bg-orange-400/20"
            >
              Find by mission
            </Link>
          </div>
          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="card px-3 py-3">
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-mono text-2xl font-bold text-white">{s.value}</dd>
                <p className="mt-0.5 text-[11px] leading-tight text-white/60" aria-hidden>
                  {s.label}
                </p>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative h-[52vh] min-h-80 lg:h-[78vh]">
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
          <p className="pointer-events-none absolute inset-x-0 bottom-0 text-center text-xs text-white/60">
            Drag to rotate · click a marker to open a site profile
          </p>
        </div>
      </section>

      {/* Two modes */}
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-12 md:grid-cols-2">
        <ModeCard
          href="/explore"
          icon="🌍"
          title="Explore sites"
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
          icon="🎯"
          title="Find by mission"
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
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-sky-300">The eight analog regions</p>
            <h2 className="mt-1 text-2xl font-bold">Pick a place to start</h2>
          </div>
          <Link href="/explore" className="hidden text-sm text-sky-300 hover:underline sm:block">
            Open the globe →
          </Link>
        </div>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sites.map((s) => (
            <li key={s.id}>
              <Link
                href={`/explore?site=${s.slug}`}
                className="card card-interactive group block h-full p-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">{s.id}</p>
                <p className="mt-1 font-semibold leading-tight group-hover:text-sky-200">{s.name}</p>
                <p className="mt-0.5 text-xs text-white/60">{s.country}</p>
                <div className="mt-4 space-y-2.5 text-xs">
                  <PlanetBar label="Moon" score={s.moon.overallScore} color="#93c5fd" />
                  <PlanetBar label="Mars" score={s.mars.overallScore} color="#fb923c" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Transparency */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-20">
        <div className="card p-6 md:p-8">
          <h2 className="text-xl font-bold">Built on open scientific data</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
            TerraAnalog compiles published scientific descriptions of eight terrestrial analog
            regions and compares them against planetary variables documented from NASA missions and
            instruments — including LRO (LOLA, LROC, Diviner), MGS/MOLA, MRO (HiRISE, CRISM, SHARAD),
            Mars Odyssey/THEMIS and NASA POWER climatology, queried live for each site&apos;s
            representative coordinates.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
            All similarity percentages are exploratory, AI-assisted assessments — not certified
            measurements. Methodology, scoring rules and full source lists are documented openly.
          </p>
          <Link
            href="/methodology"
            className="mt-5 inline-block rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10"
          >
            Scientific sources and methodology →
          </Link>
        </div>
      </section>
    </main>
  );
}

function PlanetBar({ label, score, color }: { label: string; score: number | null; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono">
        <span style={{ color }}>{label}</span>
        <span className="text-white/80">{fmtScore(score)}</span>
      </div>
      <ScoreBar score={score} color={color} height={5} />
    </div>
  );
}

function ModeCard({
  href,
  icon,
  title,
  body,
  items,
}: {
  href: string;
  icon: string;
  title: string;
  body: string;
  items: string[];
}) {
  return (
    <Link href={href} className="card card-interactive group block p-6 md:p-8">
      <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-xl" aria-hidden>
        {icon}
      </span>
      <h2 className="mt-4 text-2xl font-bold group-hover:text-sky-200">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{body}</p>
      <ul className="mt-4 space-y-1.5">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-sm text-white/65">
            <span className="text-sky-400">✓</span>
            {i}
          </li>
        ))}
      </ul>
      <span className="mt-5 inline-block text-sm font-medium text-sky-300 transition-transform group-hover:translate-x-1">
        Open →
      </span>
    </Link>
  );
}
