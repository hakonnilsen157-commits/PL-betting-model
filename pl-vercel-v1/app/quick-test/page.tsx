const testSteps = [
  {
    title: '1. Les Release notes',
    text: 'Start på /release-notes for å se hva siste versjon inneholder og hvilken testrekkefølge som anbefales.',
  },
  {
    title: '2. Åpne Deploy checklist',
    text: 'Bruk /deploy-checklist rett etter Vercel deploy for å teste appen i riktig rekkefølge.',
  },
  {
    title: '3. Åpne Test lab',
    text: 'Start på /test-lab og trykk Oppdater alt. Målet er at API probes viser flest mulig OK.',
  },
  {
    title: '4. Lagre snapshot',
    text: 'Trykk Save snapshot. Dette lagrer anbefalinger til tracker-store slik at resten av sidene får data.',
  },
  {
    title: '5. Fyll demo-data',
    text: 'Trykk Seed demo hvis du vil teste stats, quality, insights og backtest med settled eksempeldata.',
  },
  {
    title: '6. Kjør auto-settle',
    text: 'Trykk Auto-settle for å teste settlement-flyten. Dette er mest nyttig når det finnes pending picks.',
  },
  {
    title: '7. Sjekk sidene',
    text: 'Åpne Stats, Quality, Insights, Diagnostics og Backtest. Sjekk at tallene henger sammen.',
  },
  {
    title: '8. Eksporter data',
    text: 'Last ned CSV eller JSON fra Test lab for å se at trackerhistorikken kan tas ut.',
  },
  {
    title: '9. Oppdater GitHub issues',
    text: 'Bruk issue #2 til deploy-testen. Bruk issue #3 til Upstash og persistent historikk.',
  },
  {
    title: '10. Test redeploy senere',
    text: 'Når Upstash Redis er satt opp, lagrer du data, redeployer og sjekker at historikken fortsatt finnes med Persistent test.',
  },
];

const expectedResults = [
  'Release notes laster og viser V2.20-høydepunkter.',
  'Deploy checklist viser 9-stegs deploy-test.',
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
  'Issue #2 brukes som testprotokoll for V2.20 deploy-testen.',
  'Issue #3 brukes som manuell oppgave for Upstash Redis i Vercel.',
  'Issue #3 bør først lukkes når storageMode er upstash-redis og Persistent test er bestått.',
  'Hvis noe feiler, noter side, knapp, miljø og feilmelding i riktig issue.',
];

const quickLinks = [
  { href: '/release-notes', label: 'Release notes' },
  { href: '/deploy-checklist', label: 'Deploy checklist' },
  { href: '/test-lab', label: 'Test lab' },
  { href: '/upstash-setup', label: 'Upstash setup' },
  { href: '/persistent-test', label: 'Persistent test' },
  { href: '/qa', label: 'QA' },
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
            <a href="/release-notes" className="app-nav-link">Release notes</a>
            <a href="/deploy-checklist" className="app-nav-link">Deploy checklist</a>
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
              <div className="badge-soft">10 steg</div>
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
              Åpne Release notes, gå videre til Deploy checklist, og bruk Test lab til Oppdater alt, Save snapshot og Seed demo.
            </p>
            <div className="app-nav-links" style={{ marginTop: 12 }}>
              {quickLinks.map((link) => (
                <a key={link.href} href={link.href} className="app-nav-link">{link.label}</a>
              ))}
            </div>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">GitHub issues</h2>
            <p className="section-subtitle">
              Issue #2 og #3 fungerer som praktiske arbeidslister for deploy-test og Upstash-oppsett.
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
