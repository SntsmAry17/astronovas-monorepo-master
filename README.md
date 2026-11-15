# AstroNovas · TerraAnalog

An interactive web platform for the **NASA Space Apps Challenge 2026** that identifies and
characterizes terrestrial analog environments for the Moon and Mars — places on Earth useful for
planetary research, technology testing and exploration studies.

## What it does

- **Interactive 3D Earth globe** (globe.gl/Three.js) with markers for eight analog locations.
- **Explore Sites** — pick Moon or Mars, open any location's geographic profile, planetary
  similarity assessment (overall + seven scientific categories with variable-level scores), and its
  full scientific report.
- **Find by Mission** — pick a research objective (rover mobility, geology, water/ice, thermal
  testing, dust/wind, lava tubes, astrobiology) and get a transparent, reproducible ranking of the
  eight sites based on the variables that matter for that objective.
- **16 full scientific reports** — two per site (`TER-XX-MOON`, `TER-XX-MARS`), prerendered at
  `/report/ter-XX-planet`.
- **Live NASA data** — each site profile queries the NASA POWER API for its representative
  coordinates (air temperature, wind, UV index, precipitation; 2001–2025 climatology).
- **Methodology & sources** — classification scale, mission-fit formula, NASA resources used and
  scientific limitations, all documented at `/methodology`.

## Structure (npm workspaces monorepo)

```
.
├─ frontend/   Next.js 16 + Tailwind 4 + globe.gl app (pages, components, API routes, site data)
└─ backend/    Supabase schema/migrations kept for future dynamic data (not required to run)
```

Scientific content lives in `frontend/src/data/sites/ter-01.json … ter-08.json` — one file per
location with its geographic card, lunar and Martian assessments, seven categories, all variable
scores, and the complete report text. Documented scientific corrections are already applied.

## Run it

```bash
npm install          # once, at the repo root (installs frontend + backend workspaces)
npm run dev          # http://localhost:3000
npm run build        # production build (frontend)
npm start            # serve the production build
```

No environment variables are required — the app runs entirely on bundled data plus public NASA
endpoints. See `frontend/.env.example` for the optional NASA API key.

## Where the data comes from

- Site documents TER-01…TER-08 compiled by the team (scientific corrections applied).
- Planetary variable catalogs built on NASA mission data (LRO/LOLA/LROC/Diviner, MGS/MOLA,
  MRO/HiRISE/CRISM/SHARAD, Mars Odyssey/THEMIS, Curiosity suite).
- NASA POWER API (live climatology per site).
- Textures: Blue Marble (NASA), LROC mosaic (NASA/GSFC/ASU), Viking MDIM 2.1 (USGS).

All similarity percentages and mission-fit scores are **exploratory AI-assisted assessments** for
research prioritization — not validated measurements or mission-suitability certifications.
