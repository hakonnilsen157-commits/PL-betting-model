const steps = [
  {
    title: '1. Opprett Upstash Redis',
    text: 'Lag en Redis database i Upstash. Velg en region nær Vercel-prosjektet hvis mulig.',
  },
  {
    title: '2. Finn REST credentials',
    text: 'Kopier REST URL og REST TOKEN fra Upstash-databasen.',
  },
  {
    title: '3. Legg inn i Vercel',
    text: 'Gå til Vercel Project Settings → Environment Variables og legg inn UPSTASH_REDIS_REST_URL og UPSTASH_REDIS_REST_TOKEN.',
  },
  {
    title: '4. Redeploy appen',
    text: 'Kjør en ny deploy i Vercel slik at miljøvariablene blir tilgjengelige i runtime.',
  },
  {
    title: '5. Sjekk storage status',
    text: 'Åpne /api/tracker/storage-status eller Status-siden og bekreft at storageMode er upstash-redis.',
  },
  {
    title: '6. Test historikk',
    text: 'Lagre snapshot i Test lab, redeploy og sjekk at open/settled rows fortsatt finnes etter deploy.',
  },
];

const variables = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
];

const verify = [
  'storageMode viser upstash-redis.',
  'Redis configured viser Ja.',
  'Redis ping viser OK.',
  'Trackerhistorikk finnes fortsatt etter redeploy.',
  'Diagnostics persistent storage-check blir OK.',
];

const commonErrors = [
  'Variabelnavn er skrevet feil i Vercel.',
  'Kun Preview er satt, men Production mangler miljøvariabler.',
  'Appen er ikke redeployet etter at variablene ble lagt inn.',
  'REST URL eller TOKEN er kopiert med ekstra mellomrom.',
  'Upstash database er slettet eller ikke tilgjengelig.',
];

export default function UpstashSetupPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Upstash setup</h1>
            <p className="hero-subtitle">
              Steg-for-steg oppsett for persistent trackerhistorikk med Upstash Redis i Vercel.
            </p>
          </div>
          <div className="app-nav-links">
            <a href="/deploy-checklist" className="app-nav-link">Deploy checklist</a>
            <a href="/status" className="app-nav-link">Status</a>
            <a href="/diagnostics" className="app-nav-link">Diagnostics</a>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Oppsett</h2>
                <p className="section-subtitle">Dette er neste manuelle steg for at historikk skal overleve deploy.</p>
              </div>
              <div className="badge-soft">Redis</div>
            </div>
            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {steps.map((step) => (
                <div key={step.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Steg</div>
                  <div className="metric-pill-value">{step.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Verifisering</h2>
                <p className="section-subtitle">Dette bør være sant etter oppsett og redeploy.</p>
              </div>
              <div className="badge-soft">OK</div>
            </div>
            <div className="reason-list">
              {verify.map((item, index) => (
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
            <h2 className="section-title">Environment variables</h2>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {variables.map((variable, index) => (
                <div key={variable} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{variable}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Vanlige feil</h2>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {commonErrors.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Ikke legg REST TOKEN i frontend-kode eller GitHub. Den skal kun ligge som secret/environment variable i Vercel.
          </section>
        </aside>
      </section>
    </main>
  );
}
