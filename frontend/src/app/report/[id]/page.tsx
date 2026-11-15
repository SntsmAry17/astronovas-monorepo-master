import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClassificationBadge, ScoreBar } from "@/components/ui";
import { PLANETS, SITES, fmtScore, getAssessmentById, reportId } from "@/lib/sites";
import type { Planet } from "@/lib/types";

interface Params {
  id: string;
}

export function generateStaticParams(): Params[] {
  return SITES.flatMap((s) => [s.moon, s.mars].map((a) => ({ id: reportId(a) })));
}

export default function ReportPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense
      fallback={<div className="grid min-h-screen place-items-center text-white/40">Loading report…</div>}
    >
      <Report params={params} />
    </Suspense>
  );
}

async function Report({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const found = getAssessmentById(id);
  if (!found) notFound();
  const { site, assessment: a } = found;
  const planet: Planet = a.planet;
  const color = PLANETS.find((p) => p.id === planet)?.color ?? "#38bdf8";
  const planetName = planet === "moon" ? "Moon" : "Mars";

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-24">
      {/* Header */}
      <Link
        href={`/explore?site=${site.slug}&planet=${planet}`}
        className="text-sm text-sky-300 hover:underline"
      >
        ← Back to {site.name} profile
      </Link>
      <header className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color }}>
          Scientific Report · {a.id}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
          {site.name} as a {planetName === "Moon" ? "Lunar" : "Martian"} Terrestrial Analog
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {site.name}, {site.country} · Representative coordinates {Math.abs(site.lat).toFixed(4)}°{" "}
          {site.lat >= 0 ? "N" : "S"}, {Math.abs(site.lng).toFixed(4)}° {site.lng >= 0 ? "E" : "W"}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="font-mono text-3xl font-bold" style={{ color }}>
            {fmtScore(a.overallScore)}
          </p>
          <div>
            <ClassificationBadge score={a.overallScore} label={a.classification} />
            <p className="mt-1 text-[11px] text-white/40">Exploratory general similarity</p>
          </div>
        </div>
      </header>

      {/* 1. Objective */}
      <ReportSection n={1} title="Assessment Objective">
        <p>{a.objective}</p>
      </ReportSection>

      {/* 2. Characterization */}
      <ReportSection n={2} title="Terrestrial Site Characterization">
        {a.characterization.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </ReportSection>

      {/* 3. General similarity results */}
      <ReportSection n={3} title="General Similarity Results">
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/50">
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="w-32 px-4 py-2.5 font-medium">Similarity</th>
                <th className="hidden w-28 px-4 py-2.5 font-medium sm:table-cell">Class</th>
              </tr>
            </thead>
            <tbody>
              {a.categories.map((c) => (
                <tr key={c.id} className="border-t border-white/5">
                  <td className="px-4 py-2.5 text-white/80">{c.name}</td>
                  <td className="px-4 py-2.5 font-mono" style={{ color }}>
                    {fmtScore(c.score)}
                  </td>
                  <td className="hidden px-4 py-2.5 sm:table-cell">
                    <ClassificationBadge score={c.score} label={c.classification} />
                  </td>
                </tr>
              ))}
              <tr className="border-t border-white/15 bg-white/5 font-semibold">
                <td className="px-4 py-2.5">Overall</td>
                <td className="px-4 py-2.5 font-mono" style={{ color }}>
                  {fmtScore(a.overallScore)}
                </td>
                <td className="hidden px-4 py-2.5 sm:table-cell">
                  <ClassificationBadge score={a.overallScore} label={a.classification} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ReportSection>

      {/* 4. Detailed scientific analysis */}
      <ReportSection n={4} title="Detailed Scientific Analysis">
        <div className="space-y-8">
          {a.categories.map((c, i) => (
            <section key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-bold">
                  4.{i + 1} {c.name}
                </h3>
                <p className="font-mono text-lg font-semibold" style={{ color }}>
                  {fmtScore(c.score)}
                </p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{c.description}</p>
              <p className="mt-1.5 text-sm text-white/55">
                <span className="font-medium text-white/70">General utility: </span>
                {c.utility}
              </p>
              <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                {c.variables.map((v) => (
                  <div key={v.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold text-white/90">{v.name}</p>
                      <p className="shrink-0 font-mono text-sm" style={{ color }}>
                        {fmtScore(v.score)}
                      </p>
                    </div>
                    <div className="mt-1 max-w-md">
                      <ScoreBar score={v.score} color={color} />
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{v.explanation}</p>
                    <p className="mt-1 text-xs text-white/45">
                      <span className="font-medium text-white/55">Scientific utility: </span>
                      {v.utility}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </ReportSection>

      {/* 5. Applications */}
      <ReportSection n={5} title="Scientific Applications">
        <ul className="list-disc space-y-1 pl-5">
          {a.applications.map((app) => (
            <li key={app}>{app}</li>
          ))}
        </ul>
      </ReportSection>

      {/* 6. Limitations */}
      <ReportSection n={6} title="Environmental Limitations">
        {a.limitations.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </ReportSection>

      {/* 7. Conclusion */}
      <ReportSection n={7} title="Scientific Conclusion">
        {a.conclusion.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </ReportSection>

      {/* 8. Sources */}
      <ReportSection n={8} title="Scientific Sources">
        <div className="space-y-4">
          {a.sources.map((g) => (
            <div key={g.label}>
              <p className="text-sm font-semibold text-white/80">{g.label}</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13px] text-white/60">
                {g.items.map((item) => (
                  <SourceItem key={item} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ReportSection>

      {/* 9. Methodology */}
      <ReportSection n={9} title="Assessment Methodology">
        {a.methodology.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </ReportSection>

      <div className="mt-10 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-relaxed text-amber-200/70">
        Similarity percentages are preliminary AI-assisted assessments based on compiled scientific
        descriptions. They are not independently validated measurements or certified indicators of
        mission suitability.
      </div>
    </main>
  );
}

function ReportSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="border-b border-white/10 pb-2 text-lg font-bold text-white/90">
        <span className="mr-2 font-mono text-sky-300">{n}.</span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/75">{children}</div>
    </section>
  );
}

function SourceItem({ item }: { item: string }) {
  const urlMatch = item.match(/(https?:\/\/\S+)/);
  if (!urlMatch) return <li>{item}</li>;
  const [label, url] = [item.replace(urlMatch[0], "").replace(/[:–-]\s*$/, "").trim(), urlMatch[0]];
  return (
    <li>
      {label && <span>{label}: </span>}
      <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-sky-300 hover:underline">
        {url}
      </a>
    </li>
  );
}
