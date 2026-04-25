const testSteps = [
  {
    title: '1. Åpne Test lab',
    text: 'Start på /test-lab og trykk Oppdater alt. Målet er at API probes viser flest mulig OK.',
  },
  {
    title: '2. Lagre snapshot',
    text: 'Trykk Save snapshot. Dette lagrer anbefalinger til tracker-store slik at resten av sidene får data.',
  },
  {
    title: '3. Fyll demo-data',
    text: 'Trykk Seed demo hvis du vil teste stats, quality, insights og backtest med settled eksempeldata.',
  },
  {
    title: '4. Kjør auto-settle',
    text: 'Trykk Auto-settle for å teste settlement-flyten. Dette er mest nyttig når det finnes pending picks.',
  },
  {
    title: '5. Sjekk sidene',
    text: 'Åpne Stats, Quality, Insights, Diagnostics og Backtest. Sjekk at tallene henger sammen.',
  },
  {
    title: '6. Eksporter data',
    text: 'Last ned CSV eller JSON fra Test lab for å se at trackerhistorikken kan tas ut.',
  },
  {
    title: '7. Oppdater GitHub issue #2',
    text: 'Når du har testet, kan issue #2 brukes som sjekkliste for hva som fungerte og hva som eventuelt må fikses.',
  },
  {
    title: '8. Test redeploy senere',
    text: 'Når Upstash Redis er satt opp, lagrer du data, redeployer og sjekker at historikken fortsatt finnes.',
  },
];

const expectedResults = [
  'Test lab laster uten krasj på mobil.',
  'API probes viser OK på de viktigste tracker-rutene.',
  'Save snapshot gir en ny logglinje og oppdaterer tracker-store.',
  'Stats viser pending/settled, ROI og profit.',
  'Quality viser kvalitetsscore og datakvalitet.',
  'Insights viser anbefalte neste tiltak.',
  'Diagnostics viser readiness score og issues.',
  'CSV/JSON export åpner eller laster ned data.',
];

const knownLimits = [
  'Uten Upstash Redis kan historikken forsvinne ved deploy/restart.',
  'Uten ekte live resultater er auto-settlement fortsatt begrenset.',
  'Demo-data skal bare brukes til testing av flyt, ikke modellvurdering.',
  'Lav sample size betyr at ROI og hit rate ikke er pålitelige ennå.',
];

const issueChecks = [
  'Issue #2 er oppdatert med hva som allerede er bygget.',
  'Issue #2 har egen manuell testliste for deploy-testen.',
  'Issue #2 holdes åpen til du har testet appen i Vercel.',
  'Når alt fungerer kan issue #2 lukkes eller brukes som mal for neste testøkt.',
];

export default function QuickTestPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Quick test</h1>
            <p className="hero-subtitle">
              En kort testplan for å prøve V2 i dag uten å måtte huske rekkefølgen selv.
            </p>
          </div>
          <div className="app-nav-links">
            <a href="/test-lab" className="app-nav-link">Åpne Test lab</a>
            <a href="/qa" className="app-nav-link">QA</a>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Testrekkefølge</h2>
                <p className="section-subtitle">Følg disse punktene når du tester i dag.</p>
              </div>
              <div className="badge-soft">8 steg</div>
            </div>
            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {testSteps.map((step) => (
                <div key={step.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Test</div>
                  <div className="metric-pill-value">{step.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Forventet resultat</h2>
                <p className="section-subtitle">Dette bør du se når flyten fungerer.</p>
              </div>
              <div className="badge-soft">OK</div>
            </div>
            <div className="reason-list">
              {expectedResults.map((item, index) => (
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
            <h2 className="section-title">Raskeste start</h2>
            <p className="section-subtitle">
              Åpne Test lab, trykk Oppdater alt, Save snapshot og Seed demo. Da får du raskt data på de fleste V2-sidene.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">GitHub issue #2</h2>
            <p className="section-subtitle">
              Issue #2 fungerer nå som testprotokoll for V2-testen etter deploy.
            </p>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {issueChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Kjente begrensninger</h2>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {knownLimits.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Bruk Reset store hvis du vil starte testen på nytt, men husk at den nullstiller trackerhistorikken.
          </section>
        </aside>
      </section>
    </main>
  );
}
