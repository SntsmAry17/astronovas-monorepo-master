"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_JUDGMENT_NOTE, DEFAULT_COLOR, PLANETS, SCORE_DISCLAIMER, classifyScore } from "@/lib/format";
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
export function ScoreBar({ score, color = DEFAULT_COLOR, height = 6 }: { score: number | null; color?: string; height?: number }) {
  if (score === null) {
    return (
      <div className="w-full rounded-full bg-white/5 text-[10px] leading-none text-white/60" style={{ height: height * 2.2 }}>
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

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/mission", label: "Missions" },
  { href: "/methodology", label: "Method" },
];

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
          <span className="hidden text-sm font-semibold tracking-wide sm:inline">
            AstroNovas <span className="text-white/60">· TerraAnalog</span>
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors md:px-4 md:text-sm ${
                  active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
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

export function ScoreDisclaimer({ className = "p-3 text-[11px]", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <p className={`rounded-lg border border-amber-400/20 bg-amber-400/5 leading-relaxed text-amber-200/80 ${className}`}>
      {children ?? SCORE_DISCLAIMER}
    </p>
  );
}

/** Explains that category scores are expert judgment, not the mean of their variables. */
export function CategoryJudgmentNote({ className = "mt-3 text-[11px]" }: { className?: string }) {
  return (
    <p className={`leading-relaxed text-white/60 ${className}`} role="note">
      <span className="font-medium text-white/70">How to read category scores: </span>
      {CATEGORY_JUDGMENT_NOTE}
    </p>
  );
}

/** Circular score gauge. N/A renders a dashed empty ring, never 0%. */
export function ScoreRing({
  score,
  color = DEFAULT_COLOR,
  size = 88,
  stroke = 7,
  label,
}: {
  score: number | null;
  color?: string;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : Math.min(100, Math.max(0, score));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Score"}: ${score === null ? "not applicable" : `${score}%`}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} strokeDasharray={score === null ? "3 5" : undefined} />
        {score !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)", filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-mono text-lg font-bold leading-none" style={{ color }}>
            {score === null ? "N/A" : `${Number(score.toFixed(1))}%`}
          </p>
          {label && <p className="mt-1 text-[9px] uppercase tracking-wider text-white/60">{label}</p>}
        </div>
      </div>
    </div>
  );
}

/** Underlined tab bar (WAI-ARIA tabs pattern, arrow-key navigation). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  color = DEFAULT_COLOR,
  idPrefix,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  color?: string;
  idPrefix: string;
}) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    onChange(next.id);
    document.getElementById(`${idPrefix}-tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" className="flex gap-1 border-b border-white/10">
      {tabs.map((t, i) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            id={`${idPrefix}-tab-${t.id}`}
            role="tab"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`relative -mb-px px-4 py-2.5 text-sm font-medium transition-colors ${active ? "text-white" : "text-white/60 hover:text-white"}`}
          >
            {t.label}
            <span
              className="absolute inset-x-3 bottom-0 h-0.5 rounded-full transition-opacity"
              style={{ background: color, opacity: active ? 1 : 0 }}
            />
          </button>
        );
      })}
    </div>
  );
}
