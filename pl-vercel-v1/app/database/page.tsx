const tables = [
  {
    name: 'fixtures',
    purpose: 'Lagrer kamper med fixtureId, lag, kickoff, runde og status.',
    fields: ['fixtureId', 'homeTeam', 'awayTeam', 'kickoff', 'round', 'status'],
  },
  {
    name: 'recommendations',
    purpose: 'Lagrer modellens anbefalinger før kampstart.',
    fields: ['id', 'fixtureId', 'market', 'odds', 'expectedValue', 'confidence', 'createdAt'],
  },
  {
    name: 'odds_snapshots',
    purpose: 'Lagrer oddsgrunnlaget modellen brukte da anbefalingen ble laget.',
    fields: ['id', 'fixtureId', 'bookmaker', 'market', 'odds', 'capturedAt'],
  },
  {
    name: 'settlements',
    purpose: 'Lagrer resultatføring etter kamp.',
    fields: ['id', 'recommendationId', 'homeGoals', 'awayGoals', 'won', 'profit', 'settledAt'],
  },
  {
    name: 'data_quality',
    purpose: 'Lagrer kvalitet og kilde for datagrunnlaget.',
    fields: ['id', 'fixtureId', 'mode', 'hasLiveOdds', 'hasLiveTeamData', 'qualityScore'],
  },
];

const databaseSteps = [
  'Start med Upstash Redis for enkel persistent tracker-store i V2.',
  'Bruk /api/tracker/history som eneste skrivepunkt for trackerhistorikk.',
  'Bruk /api/tracker/stats som grunnlag for Stats og Backtest-dashboard.',
  'Når datamodellen er stabil, flytt til relasjonsdatabase som Supabase, Neon eller Vercel Postgres.',
  'Legg inn createdAt, updatedAt og datakilde på alle rader slik at historikken kan etterprøves.',
];

const storageOptions = [
  {
    title: 'server-memory',
    strength: 'Raskest å teste',
    weakness: 'Forsvinner ved restart/deploy og bør ikke brukes som langsiktig historikk.',
  },
  {
    title: 'Upstash Redis',
    strength: 'God V2-løsning',
    weakness: 'Key-value store. Perfekt for tracker-store nå, men mindre egnet for avansert analyse senere.',
  },
  {
    title: 'Supabase / Neon / Postgres',
    strength: 'Best for V3',
    weakness: 'Krever tydeligere schema, migrasjoner og mer struktur i appen.',
  },
];

export default function DatabasePage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Database plan</h1>
            <p className="hero-subtitle">
              Et forslag til hvordan appen kan gå fra localStorage/server-memory til persistent tracker-store og senere relasjonsdatabase for ekte backtest.
            </p>
          </div>
          <div className="updated-at">Storage layer</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Storage options</h2>
                <p className="section-subtitle">Praktisk vei fra V2-prototype til robust historikk.</p>
              </div>
              <div className="badge-soft">Storage</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {storageOptions.map((option) => (
                <div key={option.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{option.strength}</div>
                  <div className="metric-pill-value">{option.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{option.weakness}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Foreslåtte tabeller</h2>
                <p className="section-subtitle">En enkel datamodell for historikk, backtest og settlement når vi går videre til Postgres.</p>
              </div>
              <div className="badge-soft">Schema</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {tables.map((table) => (
                <div key={table.name} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Tabell</div>
                  <div className="metric-pill-value">{table.name}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{table.purpose}</p>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>
                    Felter: {table.fields.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Implementeringsrekkefølge</h2>
            <div className="reason-list">
              {databaseSteps.map((step, index) => (
                <div key={step} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{step}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Før vi går tungt inn i database, bør tracker-store og stats API brukes aktivt. Da ser vi hvilke felt som faktisk trengs før vi låser schema.
          </section>
        </aside>
      </section>
    </main>
  );
}
