const highlights = [
  'V2.20 er testklar med Deploy checklist, Quick test, Test lab, Upstash setup og Persistent test.',
  'Trackerflyten kan testes fra én samlet side med snapshot, seed demo, auto-settle, reset og eksport.',
  'Persistent historikk er forberedt med Upstash Redis og egen redeploy-test.',
  'Guide, QA, Roadmap, Changelog og GitHub issue #2 er oppdatert med dagens testflyt.',
];

const testOrder = [
  { href: '/deploy-checklist', label: '1. Deploy checklist', text: 'Start her etter hver Vercel deploy.' },
  { href: '/quick-test', label: '2. Quick test', text: 'Kort testrekkefølge for manuell testing.' },
  { href: '/test-lab', label: '3. Test lab', text: 'Kjør snapshot, demo-data, auto-settle og eksport.' },
  { href: '/upstash-setup', label: '4. Upstash setup', text: 'Sett opp persistent Redis-lagring.' },
  { href: '/persistent-test', label: '5. Persistent test', text: 'Bekreft at historikk overlever redeploy.' },
];

export default function ReleaseNotesPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Model</div>
            <h1 className="hero-title">Release notes</h1>
            <p className="hero-subtitle">Kort oversikt over hva V2.20 inneholder og hvordan den bør testes.</p>
          </div>
          <div className="updated-at">V2.20</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Høydepunkter</h2>
                <p className="section-subtitle">Det viktigste som er på plass i V2.20.</p>
              </div>
              <div className="badge-soft">V2.20</div>
            </div>
            <div className="reason-list">
              {highlights.map((item, index) => (
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
            <h2 className="section-title">Testrekkefølge</h2>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {testOrder.map((item) => (
                <a key={item.href} href={item.href} className="reason-card" style={{ textDecoration: 'none' }}>
                  <span className="reason-number">→</span>
                  <div>
                    <div className="metric-pill-value">{item.label}</div>
                    <p className="section-subtitle" style={{ marginTop: 4 }}>{item.text}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
