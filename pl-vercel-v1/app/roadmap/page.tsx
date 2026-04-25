const phases = [
  {
    title: 'Fase 1: Stabil appen',
    status: 'Fullført',
    items: [
      'Vercel build er grønn igjen etter typedRoutes-fiks',
      'Global navigasjon er erstattet med kompakt Meny-knapp som fungerer bedre på mobil',
      'Status- og QA-sider er på plass for enklere feilsøking',
    ],
  },
  {
    title: 'Fase 2: Tracker, stats, quality, insights, diagnostics, test lab og backtest',
    status: 'Nesten ferdig',
    items: [
      'Deploy checklist, Quick test og GitHub issue #2 gjør det enklere å teste V2 etter hver Vercel deploy',
      'Test lab samler snapshot, seed demo, auto-settle, reset, API probes, tracker summary og export på én side',
      'V2 Tracker bruker server snapshot API og tracker-store i stedet for lokal bygging i klienten',
      'Stats-siden viser ROI, hit rate, market stats og profittrend fra API',
      'Quality-siden viser quality score, issue counts og svakeste tracker-rader',
      'Insights-siden foreslår neste tiltak basert på ROI, sample size, market performance og datakvalitet',
      'Diagnostics-siden viser readiness score, readiness checks og issues for tracker-oppsettet',
      'Backtest-siden bruker nå både tracker stats og tracker insights for å vise historikk og modelltiltak samlet',
      'Guide og QA forklarer nå hvordan Deploy checklist, Upstash setup, Persistent test og Test lab brukes til rask V2-testing',
      'Seed demo, reset store, auto-settle og CSV/JSON export er tilgjengelig fra UI',
    ],
  },
  {
    title: 'Fase 3: Persistent historikk',
    status: 'Klar for oppsett',
    items: [
      'Storage-status API er på plass for å sjekke server-memory vs upstash-redis',
      'Status-siden viser Redis-konfigurasjon, Redis ping og tracker-store summary',
      'Diagnostics sjekker om persistent storage er aktivert før seriøs modellvurdering',
      'Upstash setup forklarer nøyaktig hvilke Vercel environment variables som må legges inn',
      'Persistent test beskriver hvordan trackerhistorikken testes før og etter redeploy',
      'Deploy checklist og QA beskriver hvordan historikk bør testes etter redeploy',
      'Setup, Guide, QA og Database plan dokumenterer server-memory → Upstash → Postgres veien',
      'Neste manuelle steg er å legge inn Upstash Redis-variablene i Vercel og kjøre Persistent test',
    ],
  },
  {
    title: 'Fase 4: Datakvalitet og settlement',
    status: 'Neste',
    items: [
      'Bruke live resultater til automatisk settlement når API-nøkkel er satt',
      'Skille tydelig mellom live, partial-live, seed-demo og fallback-data',
      'Bruke quality score, insights, diagnostics og backtest til å flagge picks med svak datakvalitet, lav EV eller lav confidence',
    ],
  },
  {
    title: 'Fase 5: Modellforbedring',
    status: 'Senere',
    items: [
      'Måle faktisk ROI per marked, EV-bånd og confidence-nivå',
      'Skru ned eller fjerne markeder som historisk underpresterer',
      'Bygge mer forklarbare anbefalinger med tydelig pluss/minus-signal per kamp',
    ],
  },
];

export default function RoadmapPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Roadmap</h1>
            <p className="hero-subtitle">
              En oppdatert utviklingsplan for å gjøre modellen mer stabil, mer datadrevet og mer nyttig over tid.
            </p>
          </div>
          <div className="updated-at">V2 roadmap</div>
        </div>

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">Nåværende status</div>
            <div className="summary-value">V2.20</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Deploy</div>
            <div className="summary-value green">Vercel</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Tracker</div>
            <div className="summary-value">Server API</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Neste mål</div>
            <div className="summary-value">Upstash</div>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          {phases.map((phase) => (
            <section key={phase.title} className="list-card" style={{ marginBottom: 16 }}>
              <div className="list-card-header">
                <div>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>{phase.title}</h2>
                  <p className="section-subtitle">Status: {phase.status}</p>
                </div>
                <div className="badge-soft">{phase.status}</div>
              </div>

              <div className="metrics-grid" style={{ marginTop: 14 }}>
                {phase.items.map((item) => (
                  <div key={item} className="metric-pill" style={{ textAlign: 'left' }}>
                    <div className="metric-pill-label">Tiltak</div>
                    <div className="metric-pill-value">{item}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Prinsipper</h2>
            <p className="section-subtitle">
              Modellen bør være forsiktig, forklarbar og ærlig på datakvalitet. Målet er ikke å anbefale flest mulig spill, men å finne færre og bedre cases.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">V2-fokus</h2>
            <p className="section-subtitle">
              Hovedfokus videre er persistent trackerhistorikk, trygg auto-settlement, mer ekte backtest og klarere datakvalitet per anbefaling.
            </p>
          </section>

          <section className="warning-box">
            Dette er et analyseverktøy og ikke en garanti for gevinst. Alle anbefalinger bør behandles som hypoteser som må testes mot faktisk historikk.
          </section>
        </aside>
      </section>
    </main>
  );
}
