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
  'Velg en enkel database som passer godt med Vercel, for eksempel Supabase, Neon eller Vercel Postgres.',
  'Start med å lagre recommendations og settlements. Det gir raskest verdi for backtesting.',
  'Behold localStorage som fallback mens database-integrasjonen testes.',
  'Lag API-ruter for å skrive og lese historikk i stedet for å skrive direkte fra klienten.',
  'Legg inn createdAt, updatedAt og datakilde på alle rader slik at historikken kan etterprøves.',
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
              Et forslag til hvordan appen kan gå fra lokal historikk i nettleseren til ekte database-lagring av anbefalinger, odds og resultater.
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Foreslåtte tabeller</h2>
                <p className="section-subtitle">En enkel datamodell for historikk, backtest og settlement.</p>
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
            Før databasen kobles på, bør vi være sikre på hvilke data som skal lagres ved anbefalingstidspunktet. Det er det som gjør backtesten etterprøvbar.
          </section>
        </aside>
      </section>
    </main>
  );
}
