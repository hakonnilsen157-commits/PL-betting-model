const phases = [
  {
    title: 'Fase 1: Stabil appen',
    status: 'Pågår',
    items: [
      'Sikre at Vercel build alltid går grønt',
      'Rydde bort dupliserte komponenter og midlertidige løsninger',
      'Ha en enkel tracker som viser åpne og avgjorte picks',
    ],
  },
  {
    title: 'Fase 2: Bedre datagrunnlag',
    status: 'Neste',
    items: [
      'Koble fixtures, tabell, form og odds tydeligere sammen',
      'Merke fallback-data tydelig slik at modellen ikke later som alt er live',
      'Lage bedre forklaring på hvorfor et spill anbefales',
    ],
  },
  {
    title: 'Fase 3: Ekte historikk',
    status: 'Neste',
    items: [
      'Flytte trackerhistorikk fra nettleser til database',
      'Lagre alle anbefalinger med timestamp og oddsgrunnlag',
      'Automatisk flytte kamper fra pending til settled etter kamp',
    ],
  },
  {
    title: 'Fase 4: Modellforbedring',
    status: 'Senere',
    items: [
      'Måle faktisk ROI per marked og confidence-nivå',
      'Skru ned anbefalinger som historisk underpresterer',
      'Legge inn strengere filter for usikre eller mangelfulle datakilder',
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
              En enkel utviklingsplan for å gjøre modellen mer stabil, mer datadrevet og mer nyttig over tid.
            </p>
          </div>
          <div className="updated-at">V1 → V2</div>
        </div>

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">Nåværende status</div>
            <div className="summary-value">Live</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Deploy</div>
            <div className="summary-value green">Vercel</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Tracker</div>
            <div className="summary-value">V2</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Neste mål</div>
            <div className="summary-value">Data</div>
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
            <h2 className="section-title">Viktig merknad</h2>
            <p className="section-subtitle">
              Dette er et analyseverktøy og ikke en garanti for gevinst. Alle anbefalinger bør behandles som hypoteser som må testes mot faktisk historikk.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
