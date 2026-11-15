"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLANETS, classifyScore } from "@/lib/sites";
import type { Classification, Planet } from "@/lib/types";

export const CLASSIFICATION_STYLE: Record<Classification, string> = {
  "Very High": "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  High: "bg-teal-400/15 text-teal-300 border-teal-400/30",
  Moderate: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  Low: "bg-orange-400/15 text-orange-300 border-orange-400/30",
  "Very Low": "bg-rose-400/15 text-rose-300 border-rose-400/30",
  "Not Applicable": "bg-slate-400/15 text-slate-300 border-slate-400/30",
};

export function ClassificationBadge({ score, label }: { score: number | null; label?: Classification }) {
  const cls = label ?? classifyScore(score);
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${CLASSIFICATION_STYLE[cls]}`}>
      {cls}
    </span>
  );
}

/** Percentage bar that renders N/A distinctly (never as 0%). */
export function ScoreBar({ score, color = "#38bdf8", height = 6 }: { score: number | null; color?: string; height?: number }) {
  if (score === null) {
    return (
      <div className="w-full rounded-full bg-white/5 text-[10px] leading-none text-white/40" style={{ height: height * 2.2 }}>
        <span className="px-2">N/A</span>
      </div>
    );
  }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10" style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, score))}%`, background: color }}
      />
    </div>
  );
}

export function PlanetToggle({ planet, onChange }: { planet: Planet; onChange: (p: Planet) => void }) {
  return (
    <div className="inline-flex rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur" role="group" aria-label="Planet selection">
      {PLANETS.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          aria-pressed={planet === p.id}
          className={`rounded-full px-6 py-2.5 text-base font-semibold transition-all ${
            planet === p.id ? "text-slate-950" : "text-white/60 hover:text-white"
          }`}
          style={planet === p.id ? { background: p.color } : undefined}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

export function Nav() {
  const pathname = usePathname();
  // The home page already presents every destination — no bar needed there.
  if (pathname === "/") return null;
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full border border-sky-400/40 bg-sky-400/10 font-mono text-xs text-sky-300">
            AN
          </span>
          <span className="text-sm font-semibold tracking-wide">
            AstroNovas <span className="text-white/50">· TerraAnalog</span>
          </span>
        </Link>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs text-white/70 backdrop-blur transition-colors hover:bg-white/10 hover:text-white md:text-sm"
        >
          ← Home
        </Link>
      </div>
    </header>
  );
}

export function SectionTitle({ kicker, title, children }: { kicker?: string; title: string; children?: React.ReactNode }) {
  return (
    <div>
      {kicker && <p className="font-mono text-[11px] uppercase tracking-widest text-sky-300">{kicker}</p>}
      <h2 className="mt-1 text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}
