import { MIN_COVERAGE, MIN_VARS, MISSIONS } from "@/lib/missions";

export const metadata = {
  title: "Scientific Sources and Methodology — AstroNovas TerraAnalog",
};

export default function MethodologyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-24">
      <p className="font-mono text-[11px] uppercase tracking-widest text-sky-300">Transparency</p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">Scientific Sources and Methodology</h1>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        How TerraAnalog compares terrestrial environments with the Moon and Mars, where its data
        comes from, and what its scores do — and do not — mean.
      </p>

      <Section title="Purpose of the comparisons">
        <p>
          TerraAnalog helps researchers, educators and mission designers identify terrestrial
          locations that can serve as partial analogs of lunar or Martian environments — for
          technology testing, field campaigns and comparative planetology. An analog is useful for
          specific processes or instruments; it is never a full environmental equivalent.
        </p>
      </Section>

      <Section title="Where the data comes from">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white/85">Site and assessment content.</strong> Eight terrestrial
            location documents compiled by the team (TER-01…TER-08), each with lunar and Martian
            assessments, category scores, variable-level explanations and full scientific reports.
            Documented scientific corrections were applied before publication.
          </li>
          <li>
            <strong className="text-white/85">Planetary reference variables.</strong> Global lunar and
            Martian variable catalogs built on NASA mission data and instruments (see below), used as
            the comparison baseline — not as direct inputs to any score.
          </li>
          <li>
            <strong className="text-white/85">Live NASA data.</strong> Each site profile queries the{" "}
            <a className="text-sky-300 hover:underline" href="https://power.larc.nasa.gov/" target="_blank" rel="noopener noreferrer">
              NASA POWER
            </a>{" "}
            API for the site&apos;s representative coordinates: annual-mean air temperature at 2 m
            (T2M), wind speed at 10 m (WS10M), all-sky UV index and corrected precipitation,
            climatology 2001–2025. These are point climatologies — not measurements of the whole
            region — and are shown separately from the exploratory similarity scores.
          </li>
        </ul>
      </Section>

      <Section title="Similarity percentages">
        <p>
          All similarity percentages (overall, category and variable level) come from the
          project&apos;s exploratory scoring system: preliminary AI-assisted assessments based on
          compiled scientific descriptions. They are not independently validated measurements, not
          produced by the cited NASA instruments, and not certified indicators of mission
          suitability. Values marked N/A mean “not applicable” — never 0% — and are excluded from
          calculations.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 text-sm">
          <table className="w-full">
            <tbody>
              {[
                ["90–100%", "Very High"],
                ["75–<90%", "High"],
                ["50–<75%", "Moderate"],
                ["25–<50%", "Low"],
                ["0–<25%", "Very Low"],
                ["N/A", "Not Applicable"],
              ].map(([range, label]) => (
                <tr key={label} className="border-b border-white/5 last:border-0">
                  <td className="w-32 px-4 py-2 font-mono text-white/70">{range}</td>
                  <td className="px-4 py-2 text-white/80">{label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Mission-fit ranking">
        <p>
          “Find by Mission” ranks sites using only the variables relevant to the selected objective —
          not the general similarity score. For each mission, a fixed set of expected variables is
          defined in an explicit configuration ({MISSIONS.length} missions, equal weights by
          default — a prototype heuristic, not a NASA-validated weighting).
        </p>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 font-mono text-[13px] text-white/75">
          <p>Mission Fit Score = Σ(variable score × weight) / Σ(weights of scored variables)</p>
          <p className="mt-2">Data Coverage = Σ(weights of scored vars) / Σ(weights of scored + missing vars)</p>
        </div>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>N/A variables are excluded entirely — they are “not applicable”, not missing.</li>
          <li>
            A site shows a score only with ≥{MIN_VARS} scored variables and ≥{Math.round(MIN_COVERAGE * 100)}%
            coverage; otherwise it is reported as <em>Insufficient Data</em> (missing data ≠ low
            compatibility).
          </li>
          <li>
            Each result card shows the variables that contributed, the coverage share and the
            variables not documented for that site.
          </li>
        </ul>
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 text-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5 text-left text-xs uppercase tracking-wider text-white/50">
                <th className="px-4 py-2 font-medium">Mission</th>
                <th className="px-4 py-2 font-medium">Variables</th>
              </tr>
            </thead>
            <tbody>
              {MISSIONS.map((m) => (
                <tr key={m.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-white/80">
                    {m.name}
                    {m.planets.length === 1 && (
                      <span className="ml-2 text-[11px] text-orange-300/80">Mars only</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-white/60">{m.variables.map((v) => v.label).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="NASA resources used">
        <p className="text-white/60">
          Resources referenced across the site assessments and planetary catalogs:
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ResourceGroup
            title="Live data"
            items={[
              "NASA POWER API — T2M, WS10M, PRECTOTCORR, ALLSKY_SFC_UV_INDEX climatology per site",
              "NASA Earthdata — earthdata.nasa.gov",
              "NASA Worldview — worldview.earthdata.nasa.gov",
            ]}
          />
          <ResourceGroup
            title="Moon"
            items={[
              "Lunar Reconnaissance Orbiter (LRO): LOLA, LROC, Diviner",
              "Moon Mineralogy Mapper (M³)",
              "NASA PDS / PDS Geosciences — pds.nasa.gov",
              "LROC WMS — wms.lroc.asu.edu/lroc",
            ]}
          />
          <ResourceGroup
            title="Mars"
            items={[
              "Mars Global Surveyor / MOLA",
              "Mars Reconnaissance Orbiter: HiRISE, CTX, CRISM, SHARAD",
              "Mars Odyssey / THEMIS",
              "Curiosity: REMS, SAM, CheMin, APXS",
              "Mars Orbital Data Explorer — ode.rsl.wustl.edu/mars",
            ]}
          />
          <ResourceGroup
            title="Texture imagery"
            items={[
              "Earth: Blue Marble (NASA)",
              "Moon: LROC mosaic (NASA/GSFC/Arizona State University)",
              "Mars: Viking MDIM 2.1 mosaic (USGS/NASA)",
            ]}
          />
        </div>
        <p className="mt-3 text-[13px] text-white/50">
          USGS and Copernicus Data Space are also cited as terrestrial sources in the reports.
          Compiled bibliographic references appear inside each scientific report; scores attributed
          to the project are never presented as NASA measurements.
        </p>
      </Section>

      <Section title="Limitations you should know">
        <ul className="list-disc space-y-2 pl-5">
          <li>Geological or geomorphological similarity does not imply environmental equivalence.</li>
          <li>No terrestrial site reproduces lunar vacuum, gravity, radiation or regolith properties.</li>
          <li>The presence of terrestrial microorganisms does not demonstrate life on Mars.</li>
          <li>
            Representative coordinates describe a region, not a single measurement point; elevation
            values are regional approximations.
          </li>
          <li>A mission-fit recommendation is a research-prioritization aid — not approval or certification for a real mission.</li>
          <li>NASA POWER values are point climatologies for the listed coordinates, subject to the dataset&apos;s own resolution and uncertainty.</li>
        </ul>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="border-b border-white/10 pb-2 text-xl font-bold">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/70">{children}</div>
    </section>
  );
}

function ResourceGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-white/65">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
