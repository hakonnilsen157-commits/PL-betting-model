const qaChecks = [
  {
    title: 'Dashboard laster',
    description: 'Forsiden skal laste uten feilmelding og vise kamper, anbefalinger og filtre.',
  },
  {
    title: 'Filtre fungerer',
    description: 'Marked-filter og minimum EV-slider skal endre listen med anbefalinger.',
  },
  {
    title: 'Kampvalg fungerer',
    description: 'Når du klikker på en kamp eller anbefaling, skal detaljpanelet oppdatere seg.',
  },
  {
    title: 'V2 Tracker laster',
    description: 'Tracker-siden skal vise åpne picks, historikk og settled demo-data uten krasj.',
  },
  {
    title: 'Status-siden svarer',
    description: 'Status-siden skal hente /api/health og /api/live-status uten feil.',
  },
  {
    title: 'Mobilvisning fungerer',
    description: 'Navigasjon, kort og dashboard skal være brukbart på mobilskjerm.',
  },
];

const deployChecks = [
  'Sjekk at nyeste deployment i Vercel står som Ready.',
  'Kontroller at commit-hashen i Vercel matcher siste commit i GitHub.',
  'Åpne forsiden i inkognito eller ny fane etter deploy.',
  'Test Dashboard, V2 Tracker, Status og Changelog etter større endringer.',
  'Hvis build feiler, les nederste del av Vercel build logs først.',
];

const bugTemplate = [
  'Hvilken side feilet?',
  'Hva trykket du på rett før feilen?',
  'Var det på mobil eller desktop?',
  'Kom feilen i appen eller i Vercel build logs?',
  'Kopier feilmeldingen eller ta skjermbilde.',
];

export default function QAPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">QA checklist</h1>
            <p className="hero-subtitle">
              En enkel testside for å sjekke at appen fungerer etter deploy. Bruk denne når vi gjør større endringer eller når Vercel har bygget en ny versjon.
            </p>
          </div>
          <div className="updated-at">Testing</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>App-sjekker</h2>
                <p className="section-subtitle">Funksjoner som bør testes etter deploy.</p>
              </div>
              <div className="badge-soft">QA</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {qaChecks.map((check) => (
                <div key={check.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Sjekk</div>
                  <div className="metric-pill-value">{check.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{check.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Deploy-sjekker</h2>
                <p className="section-subtitle">Hva som bør sjekkes i Vercel og GitHub.</p>
              </div>
              <div className="badge-soft">Vercel</div>
            </div>

            <div className="reason-list">
              {deployChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Bug report-mal</h2>
            <p className="section-subtitle">Når noe feiler, er dette nok informasjon til å finne årsaken raskere.</p>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {bugTemplate.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Den raskeste måten å fikse feil på er å sende hele Vercel-loggen fra nederste feilmelding og opp til første relevante filnavn.
          </section>
        </aside>
      </section>
    </main>
  );
}
