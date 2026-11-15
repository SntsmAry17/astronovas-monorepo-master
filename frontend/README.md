# TerraAnalog frontend

Next.js 16 (App Router, Turbopack, Cache Components) + Tailwind 4 + globe.gl/Three.js.

## Routes

| Route | Purpose |
|---|---|
| `/` | Home — hero, interactive globe, the two modes, site grid |
| `/explore` | Explore Sites — globe + Moon/Mars toggle + geographic, similarity and category cards. Deep links: `/explore?site=<slug>&planet=moon|mars` |
| `/mission` | Find by Mission — objective picker, exploratory mission-fit ranking, result cards linked to the globe and reports |
| `/report/ter-XX-moon|mars` | 16 full scientific reports (statically generated) |
| `/methodology` | Sources, scoring rules, classification scale, limitations |
| `/api/climate?site=<slug>` | NASA POWER climatology for the site's coordinates |

## Data

`src/data/sites/ter-01.json … ter-08.json` — one file per terrestrial analog location:
site identity/coords, geographic card, and `moon`/`mars` assessments (overall score,
classification, summary, applications, report sections, and the seven categories with
variable-level scores, explanations and utilities). `score: null` = N/A (never rendered as 0%).

Types: `src/lib/types.ts`. Accessors/classification helpers: `src/lib/sites.ts`.
Mission definitions + deterministic scoring (documented weighted mean, coverage gate):
`src/lib/missions.ts`. NASA POWER client (cached): `src/lib/nasa.ts`.

## Commands

```bash
npm run dev      # dev server :3000
npm run build    # production build
npm start        # serve build
npm run lint     # eslint
```
