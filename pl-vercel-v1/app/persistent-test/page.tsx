const testSteps = [
  {
    title: '1. Sjekk storage mode',
    text: 'Åpne Status eller /api/tracker/storage-status. Før Upstash er satt opp vil du se server-memory. Etter oppsett skal du se upstash-redis.',
  },
  {
    title: '2. Lagre testdata',
    text: 'Åpne Test lab og trykk Save snapshot. Bruk eventuelt Seed demo hvis du vil ha settled eksempeldata.',
  },
  {
    title: '3. Noter antall rader',
    text: 'Noter open rows og settled rows i Test lab, Status eller Diagnostics før redeploy.',
  },
  {
    title: '4. Redeploy i Vercel',
    text: 'Kjør en ny deployment i Vercel etter at data er lagret.',
  },
  {
    title: '5. Sjekk historikken igjen',
    text: 'Åpne Test lab eller Status etter redeploy og kontroller at antall rader fortsatt er der.',
  },
  {
    title: '6. Godkjenn persistent test',
    text: 'Hvis historikken fortsatt finnes etter redeploy, fungerer persistent lagring.',
  },
];

const passCriteria = [
  'storageMode er upstash-redis.',
  'Redis ping er OK.',
  'Open/settled rows finnes før redeploy.',
  'Open/settled rows finnes fortsatt etter redeploy.',
  'Diagnostics viser at persistent storage-check er OK.',
];

const failCriteria = [
  'storageMode er fortsatt server-memory etter redeploy.',
  'Redis ping feiler.',
  'Historikk finnes før redeploy, men forsvinner etterpå.',
  'Vercel mangler én eller begge Upstash-variablene.',
  'Variablene finnes bare i Preview, men ikke Production.',
];

const usefulLinks = [
  { href: '/upstash-setup', label: 'Upstash setup' },
  { href: '/test-lab', label: 'Test lab' },
  { href: '/status', label: 'Status' },
  { href: '/diagnostics', label: 'Diagnostics' },
  { href: '/api/tracker/storage-status', label: 'Storage API' },
];

export default function PersistentTestPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Persistent test</h1>
            <p className="hero-subtitle">
              En praktisk test for å bekrefte at trackerhistorikken overlever redeploy når Upstash Redis er satt opp.
            </p>
          </div>
          <div className="app-nav-links">
            <a href="/upstash-setup" className="app-nav-link">Upstash setup</a>
            <a href="/test-lab" className="app-nav-link">Test lab</a>
            <a href="/status" className="app-nav-link">Status</a>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Testrekkefølge</h2>
                <p className="section-subtitle">Følg denne når Upstash-variablene er lagt inn i Vercel.</p>
              </div>
              <div className="badge-soft">6 steg</div>
            </div>
            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {testSteps.map((step) => (
                <div key={step.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Persistent test</div>
                  <div className="metric-pill-value">{step.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Bestått når</h2>
                <p className="section-subtitle">Dette bør være sant etter testen.</p>
              </div>
              <div className="badge-soft">Pass</div>
            </div>
            <div className="reason-list">
              {passCriteria.map((item, index) => (
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
              {usefulLinks.map((link) => (
                <a key={link.href} href={link.href} className="app-nav-link">{link.label}</a>
              ))}
            </div>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Ikke bestått hvis</h2>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {failCriteria.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Denne testen er mest relevant etter at Upstash Redis er satt opp. Før det er server-memory forventet.
          </section>
        </aside>
      </section>
    </main>
  );
}
