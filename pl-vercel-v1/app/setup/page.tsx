const envVars = [
  {
    name: 'DATA_MODE',
    value: 'mock | live | partial-live',
    description: 'Bestemmer om appen skal bruke mock-data, live-data eller en blanding.',
  },
  {
    name: 'ODDS_API_KEY',
    value: 'secret',
    description: 'API-nøkkel for oddsdata. Bør legges inn som environment variable i Vercel.',
  },
  {
    name: 'API_FOOTBALL_KEY',
    value: 'secret',
    description: 'API-nøkkel for fixtures, tabell, form og resultater.',
  },
  {
    name: 'ODDS_SPORT_KEY',
    value: 'soccer_epl',
    description: 'Sport/league key for Premier League hos oddsleverandøren.',
  },
  {
    name: 'ODDS_REGIONS',
    value: 'uk,eu',
    description: 'Hvilke bookmaker-regioner odds-API-et skal hente fra.',
  },
  {
    name: 'API_FOOTBALL_LEAGUE_ID',
    value: '39',
    description: 'League ID for Premier League.',
  },
  {
    name: 'API_FOOTBALL_SEASON',
    value: '2025',
    description: 'Sesongen appen skal hente data for.',
  },
];

const setupSteps = [
  'Gå til prosjektet i Vercel.',
  'Åpne Settings og deretter Environment Variables.',
  'Legg inn API-nøkler som secrets, ikke direkte i koden.',
  'Sett DATA_MODE til ønsket modus.',
  'Redeploy prosjektet etter at environment variables er lagret.',
  'Sjekk Status-siden i appen etter deploy for å bekrefte at nøklene er registrert.',
];

export default function SetupPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Setup</h1>
            <p className="hero-subtitle">
              En praktisk side for hvordan appen bør konfigureres i Vercel når den skal bruke live API-er og mer seriøse datakilder.
            </p>
          </div>
          <div className="updated-at">Configuration</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Environment variables</h2>
                <p className="section-subtitle">Konfigurasjon som bør ligge i Vercel, ikke hardkodes i appen.</p>
              </div>
              <div className="badge-soft">Vercel</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {envVars.map((item) => (
                <div key={item.name} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{item.value}</div>
                  <div className="metric-pill-value">{item.name}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Slik settes det opp</h2>
            <div className="reason-list">
              {setupSteps.map((step, index) => (
                <div key={step} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{step}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            API-nøkler skal aldri legges direkte i GitHub-repoet. De bør alltid lagres som environment variables eller secrets i Vercel.
          </section>
        </aside>
      </section>
    </main>
  );
}
