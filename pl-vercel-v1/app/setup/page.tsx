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
  {
    name: 'UPSTASH_REDIS_REST_URL',
    value: 'secret URL',
    description: 'Persistent tracker-lagring. Når denne settes sammen med token, bruker tracker-store Redis i stedet for server-memory.',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    value: 'secret token',
    description: 'Token til Upstash Redis. Må settes sammen med UPSTASH_REDIS_REST_URL.',
  },
];

const setupSteps = [
  'Start med Release notes for å se siste anbefalte testrekkefølge.',
  'Gå til prosjektet i Vercel.',
  'Åpne Settings og deretter Environment Variables.',
  'Legg inn API-nøkler som secrets, ikke direkte i koden.',
  'Sett DATA_MODE til ønsket modus.',
  'Legg inn Upstash Redis-variablene når du jobber med issue #3.',
  'Redeploy prosjektet etter at environment variables er lagret.',
  'Åpne /api/tracker/storage-status og sjekk at storageMode viser upstash-redis.',
  'Sjekk Status-siden i appen etter deploy og bekreft at Redis ping viser OK.',
  'Kjør Persistent test og sjekk at open/settled rows finnes etter en ny redeploy.',
];

const storageModes = [
  {
    title: 'server-memory',
    text: 'Fungerer uten ekstra oppsett, men historikk kan forsvinne ved nye deploys eller serverless restart.',
  },
  {
    title: 'upstash-redis',
    text: 'Persistent lagring via Upstash Redis. Dette er bedre for V2-testing fordi trackerhistorikken kan overleve deploys.',
  },
];

const redisChecks = [
  '/api/tracker/storage-status skal vise storageMode: upstash-redis når variablene er satt.',
  'Redis ping på Status-siden skal vise OK.',
  'V2 Tracker eller Test lab skal kunne lagre server snapshot uten feil.',
  'Stats og Quality skal vise samme antall tracker-rader etter lagring.',
  'Persistent test skal vise at historikken fortsatt er der etter redeploy.',
  'Issue #3 kan først lukkes når Redis og Persistent test er bekreftet.',
];

const helpfulPages = [
  { href: '/release-notes', label: 'Release notes' },
  { href: '/upstash-setup', label: 'Upstash setup' },
  { href: '/persistent-test', label: 'Persistent test' },
  { href: '/deploy-checklist', label: 'Deploy checklist' },
  { href: '/status', label: 'Status' },
  { href: '/diagnostics', label: 'Diagnostics' },
];

const issueNotes = [
  'Issue #2: brukes til deploy-test og generell V2-test.',
  'Issue #3: brukes til Upstash Redis, Vercel env vars og persistent redeploy-test.',
  'Ikke lim inn hemmelige tokens i GitHub issues.',
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
              En praktisk side for hvordan appen bør konfigureres i Vercel når den skal bruke live API-er, persistent tracker og mer seriøse datakilder.
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

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Storage modes</h2>
                <p className="section-subtitle">Hvordan trackerhistorikken lagres i V2.</p>
              </div>
              <div className="badge-soft">Tracker</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {storageModes.map((mode) => (
                <div key={mode.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Storage</div>
                  <div className="metric-pill-value">{mode.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{mode.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Redis verifisering</h2>
                <p className="section-subtitle">Sjekker som bekrefter at persistent tracker-store virker.</p>
              </div>
              <div className="badge-soft">Redis</div>
            </div>

            <div className="reason-list">
              {redisChecks.map((check, index) => (
                <div key={check} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{check}</div>
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

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Nyttige sider</h2>
            <div className="app-nav-links" style={{ marginTop: 12 }}>
              {helpfulPages.map((link) => (
                <a key={link.href} href={link.href} className="app-nav-link">{link.label}</a>
              ))}
            </div>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">GitHub issues</h2>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {issueNotes.map((note, index) => (
                <div key={note} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{note}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            API-nøkler og Redis-token skal aldri legges direkte i GitHub-repoet eller GitHub issues. De bør alltid lagres som environment variables eller secrets i Vercel.
          </section>
        </aside>
      </section>
    </main>
  );
}
