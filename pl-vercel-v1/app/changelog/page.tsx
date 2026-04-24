const changes = [
  {
    version: 'V2.4',
    title: 'Data og backtest-struktur',
    items: [
      'Lagt til Data-side med oversikt over datakilder og datakvalitet.',
      'Lagt til Backtest-side med plan for historikk, ROI, hit rate og CLV.',
      'Utvidet navigasjonen med flere støttesider for videre utvikling.',
    ],
  },
  {
    version: 'V2.3',
    title: 'Dokumentasjon i appen',
    items: [
      'Lagt til Guide-side med praktisk brukerveiledning.',
      'Lagt til Model-side med forklaring av modellfaktorer.',
      'Lagt til Status-side for API- og datamodusstatus.',
    ],
  },
  {
    version: 'V2.2',
    title: 'Navigasjon og struktur',
    items: [
      'Lagt inn global toppmeny.',
      'Lagt til Roadmap-side.',
      'Gjort appen enklere å klikke rundt i uten å skrive URL manuelt.',
    ],
  },
  {
    version: 'V2.1',
    title: 'Tracker og deploy-fiks',
    items: [
      'Fikset TypeScript-feil i tracker-komponenten.',
      'Ryddet bort problematisk server-tracker-komponent.',
      'Skrudde TypeScript-sjekk på igjen etter opprydding.',
    ],
  },
  {
    version: 'V1.0',
    title: 'Første Vercel-versjon',
    items: [
      'Dashboard med kamper, anbefalinger, EV og confidence.',
      'Vercel deployment koblet mot GitHub.',
      'Grunnlag for videre Premier League-modell.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Changelog</h1>
            <p className="hero-subtitle">
              En enkel oversikt over hva som er lagt til i appen, slik at utviklingen kan følges over tid.
            </p>
          </div>
          <div className="updated-at">Build history</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          {changes.map((change) => (
            <section key={change.version} className="list-card" style={{ marginBottom: 16 }}>
              <div className="list-card-header">
                <div>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>{change.version}: {change.title}</h2>
                  <p className="section-subtitle">Endringer og forbedringer i denne fasen.</p>
                </div>
                <div className="badge-soft">{change.version}</div>
              </div>

              <div className="reason-list">
                {change.items.map((item, index) => (
                  <div key={item} className="reason-card">
                    <span className="reason-number">{index + 1}</span>
                    <div className="metric-pill-value">{item}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Hvorfor changelog?</h2>
            <p className="section-subtitle">
              Når appen utvikles raskt, er det nyttig å ha en enkel oversikt over hva som faktisk er gjort. Det gjør det enklere å teste, feilsøke og planlegge neste steg.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Neste forbedring</h2>
            <p className="section-subtitle">
              Etter hvert kan denne siden kobles mot ekte GitHub-commits eller release notes, men foreløpig fungerer den som en ryddig prosjektlogg inne i appen.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
