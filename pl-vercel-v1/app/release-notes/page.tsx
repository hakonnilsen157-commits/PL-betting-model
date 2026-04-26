const highlights = [
  'V2.22 er testklar med Release notes, Deploy checklist, Quick test, Test lab, Upstash setup og Persistent test.',
  'Quick test er finpusset til 10 steg med tydelig start i Release notes og Deploy checklist.',
  'Deploy checklist er utvidet til 9 steg med GitHub issues-seksjon og Redis/Persistent test-sjekk.',
  'QA har nå Release flow og GitHub issue flow for issue #2 og issue #3.',
  'GitHub issue #3 er neste manuelle mål for Upstash Redis i Vercel.',
];

const testOrder = [
  { href: '/release-notes', label: '1. Release notes', text: 'Start her for kort oversikt over siste versjon.' },
  { href: '/deploy-checklist', label: '2. Deploy checklist', text: 'Test appen etter hver Vercel deploy.' },
  { href: '/quick-test', label: '3. Quick test', text: 'Følg 10-stegs hurtigtesten.' },
  { href: '/test-lab', label: '4. Test lab', text: 'Kjør snapshot, demo-data, auto-settle og eksport.' },
  { href: '/upstash-setup', label: '5. Upstash setup', text: 'Sett opp persistent Redis-lagring.' },
  { href: '/persistent-test', label: '6. Persistent test', text: 'Bekreft at historikk overlever redeploy.' },
];

const manualTasks = [
  'Issue #2 brukes til V2.20/V2.22 deploy-testen.',
  'Issue #3 brukes til V2.21/V2.22 Upstash-oppsett i Vercel.',
  'Når Upstash er satt opp, kjør Persistent test før historikken brukes seriøst.',
  'Hvis en test feiler, noter side, knapp, miljø og feilmelding i riktig issue.',
];

const nextSteps = [
  'Vent til Vercel er ferdig med siste deploy.',
  'Åpne Release notes og følg testrekkefølgen.',
  'Kjør Quick test og Test lab for å verifisere V2-flyten.',
  'Fullfør issue #3 når du er klar for persistent historikk.',
];

export default function ReleaseNotesPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Model</div>
            <h1 className="hero-title">Release notes</h1>
            <p className="hero-subtitle">Kort oversikt over hva V2.22 inneholder og hvordan den bør testes.</p>
          </div>
          <div className="updated-at">V2.22</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Høydepunkter</h2>
                <p className="section-subtitle">Det viktigste som er på plass i V2.22.</p>
              </div>
              <div className="badge-soft">V2.22</div>
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

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Neste steg</h2>
                <p className="section-subtitle">Anbefalt rekkefølge videre.</p>
              </div>
              <div className="badge-soft">Next</div>
            </div>
            <div className="reason-list">
              {nextSteps.map((item, index) => (
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

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Manuelle GitHub-oppgaver</h2>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {manualTasks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
