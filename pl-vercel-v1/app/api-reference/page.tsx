const endpoints = [
  {
    method: 'GET',
    path: '/api/health',
    purpose: 'Sjekker at appen svarer og viser enkel runtime-status.',
  },
  {
    method: 'GET',
    path: '/api/live-status',
    purpose: 'Viser datamodus og hvilke API-nøkler som er konfigurert.',
  },
  {
    method: 'GET',
    path: '/api/fixtures',
    purpose: 'Henter kamper og anbefalinger som dashboardet bruker.',
  },
  {
    method: 'GET',
    path: '/api/tracker/history',
    purpose: 'Henter trackerhistorikk med åpne og avgjorte picks.',
  },
  {
    method: 'POST',
    path: '/api/tracker/history',
    purpose: 'Lagrer eller merger åpne/avgjorte tracker-rader.',
  },
  {
    method: 'DELETE',
    path: '/api/tracker/history',
    purpose: 'Nullstiller åpen historikk, settled historikk eller alt.',
  },
  {
    method: 'POST',
    path: '/api/tracker/settle',
    purpose: 'Forsøker å sette resultat på en liste med picks.',
  },
  {
    method: 'POST',
    path: '/api/tracker/auto-settle',
    purpose: 'Kjører settlement direkte mot tracker-store.',
  },
  {
    method: 'GET',
    path: '/api/tracker/stats',
    purpose: 'Returnerer ROI, hit rate, profittrend, market stats og datakvalitet.',
  },
  {
    method: 'GET',
    path: '/api/tracker/export',
    purpose: 'Eksporterer trackerhistorikk som JSON.',
  },
  {
    method: 'GET',
    path: '/api/tracker/export?format=csv',
    purpose: 'Eksporterer trackerhistorikk som CSV.',
  },
  {
    method: 'GET',
    path: '/api/tracker/seed-demo',
    purpose: 'Forhåndsviser demo-rader som kan legges inn i tracker-store.',
  },
  {
    method: 'POST',
    path: '/api/tracker/seed-demo',
    purpose: 'Legger demo-resultater inn i tracker-store for testing av stats og backtest.',
  },
];

const usageNotes = [
  'API-rutene bør brukes av appen, ikke direkte fra klientkode mot eksterne API-er.',
  'Trackerhistorikk bør etter hvert lagres i persistent database eller Redis.',
  'Export-rutene gjør det enklere å hente historikk ut til Excel eller videre analyse.',
  'Stats-ruten bør bli grunnlaget for ekte backtest-dashboardet.',
  'Seed-demo-ruten er kun for testing og bør ikke brukes som ekte modellhistorikk.',
];

export default function ApiReferencePage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">API reference</h1>
            <p className="hero-subtitle">
              En intern oversikt over API-rutene appen bruker. Nyttig for debugging, videreutvikling og testing av trackerflyten.
            </p>
          </div>
          <div className="updated-at">Internal API</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Endpoints</h2>
                <p className="section-subtitle">Ruter som finnes i Next.js-appen.</p>
              </div>
              <div className="badge-soft">{endpoints.length} routes</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {endpoints.map((endpoint) => (
                <div key={`${endpoint.method}-${endpoint.path}`} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{endpoint.method}</div>
                  <div className="metric-pill-value">{endpoint.path}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{endpoint.purpose}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Bruksnotater</h2>
            <div className="reason-list">
              {usageNotes.map((note, index) => (
                <div key={note} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            API-nøkler og secrets skal aldri eksponeres til frontend. Bruk server-ruter og environment variables.
          </section>
        </aside>
      </section>
    </main>
  );
}
