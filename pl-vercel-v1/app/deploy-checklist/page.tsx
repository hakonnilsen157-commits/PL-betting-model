const checks = [
  {
    title: '1. Vercel deploy er Ready',
    text: 'Sjekk at siste deployment er ferdig og står som Ready før du tester appen.',
  },
  {
    title: '2. Åpne Quick test',
    text: 'Start på /quick-test for å følge riktig testrekkefølge.',
  },
  {
    title: '3. Åpne Test lab',
    text: 'Trykk Oppdater alt og sjekk at API probes svarer.',
  },
  {
    title: '4. Test tracker handlinger',
    text: 'Kjør Save snapshot, Seed demo og Auto-settle. Sjekk at action log oppdateres.',
  },
  {
    title: '5. Sjekk analyse-sider',
    text: 'Åpne Stats, Quality, Insights, Diagnostics og Backtest etter testdata er lagt inn.',
  },
  {
    title: '6. Test export',
    text: 'Åpne CSV og JSON export fra Test lab.',
  },
  {
    title: '7. Sjekk Upstash-status',
    text: 'Hvis Redis er satt opp, åpne Upstash setup og Status for å bekrefte upstash-redis og Redis ping OK.',
  },
  {
    title: '8. Oppdater issue #2',
    text: 'Bruk GitHub issue #2 som testprotokoll og marker hva som er testet.',
  },
];

const failSteps = [
  'Hvis siden ikke laster: sjekk Vercel build log først.',
  'Hvis API probes feiler: åpne Status og API reference.',
  'Hvis tracker ikke lagrer: sjekk Storage status og Diagnostics.',
  'Hvis historikk forsvinner etter redeploy: sett opp Upstash Redis i Vercel via Upstash setup-siden.',
  'Hvis Redis ikke slår inn: sjekk variabelnavn, Production/Preview scope og redeploy.',
  'Hvis en knapp ikke virker: noter hvilken knapp og kopier feilmeldingen.',
];

const links = [
  { href: '/quick-test', label: 'Quick test' },
  { href: '/test-lab', label: 'Test lab' },
  { href: '/upstash-setup', label: 'Upstash setup' },
  { href: '/status', label: 'Status' },
  { href: '/diagnostics', label: 'Diagnostics' },
  { href: '/api-reference', label: 'API reference' },
  { href: '/qa', label: 'QA' },
];

const redisChecks = [
  'UPSTASH_REDIS_REST_URL er lagt inn i Vercel.',
  'UPSTASH_REDIS_REST_TOKEN er lagt inn i Vercel.',
  'Appen er redeployet etter at variablene ble lagt inn.',
  'Status viser storageMode upstash-redis.',
  'Diagnostics persistent storage-check er OK.',
];

export default function DeployChecklistPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Deploy checklist</h1>
            <p className="hero-subtitle">
              En enkel sjekkliste for hva som bør testes rett etter at Vercel har bygget en ny versjon.
            </p>
          </div>
          <div className="app-nav-links">
            <a href="/quick-test" className="app-nav-link">Quick test</a>
            <a href="/test-lab" className="app-nav-link">Test lab</a>
            <a href="/upstash-setup" className="app-nav-link">Upstash</a>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Etter deploy</h2>
                <p className="section-subtitle">Følg disse punktene når du tester ny versjon.</p>
              </div>
              <div className="badge-soft">8 steg</div>
            </div>
            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {checks.map((check) => (
                <div key={check.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Deploy test</div>
                  <div className="metric-pill-value">{check.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{check.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Hvis noe feiler</h2>
                <p className="section-subtitle">Rask feilsøkingsrekkefølge.</p>
              </div>
              <div className="badge-soft">Debug</div>
            </div>
            <div className="reason-list">
              {failSteps.map((item, index) => (
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
            <h2 className="section-title">Nyttige sider</h2>
            <div className="app-nav-links" style={{ marginTop: 12 }}>
              {links.map((link) => (
                <a key={link.href} href={link.href} className="app-nav-link">{link.label}</a>
              ))}
            </div>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Redis sjekk</h2>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {redisChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Den viktigste manuelle testen nå er at /test-lab fungerer etter deploy. Persistent historikk krever fortsatt Upstash Redis.
          </section>
        </aside>
      </section>
    </main>
  );
}
