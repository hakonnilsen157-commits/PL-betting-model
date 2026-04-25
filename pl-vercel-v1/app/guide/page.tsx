const steps = [
  {
    title: '1. Sjekk deploy først',
    text: 'Bruk Deploy checklist etter hver Vercel deploy. Den gir deg riktig rekkefølge for test og feilsøking.',
  },
  {
    title: '2. Start med Test lab',
    text: 'Bruk Test lab når du vil prøve V2 raskt. Der kan du kjøre snapshot, demo-data, auto-settle, reset, API probes og export fra samme sted.',
  },
  {
    title: '3. Start med Dashboard',
    text: 'Bruk dashboardet for å se kamper, beste anbefalinger, EV, confidence og modellens korte forklaring per spill.',
  },
  {
    title: '4. Filtrer på marked og EV',
    text: 'Juster marked og minimum EV for å se om det finnes færre, men tydeligere verdi-cases.',
  },
  {
    title: '5. Lagre server snapshot i V2 Tracker',
    text: 'V2 Tracker bruker server snapshot API-et for å bygge og lagre anbefalinger til tracker-store.',
  },
  {
    title: '6. Følg pending og settled',
    text: 'Tracker-siden viser pending picks, settled historikk, datakvalitet, eksport og auto-settlement handlinger.',
  },
  {
    title: '7. Bruk Stats',
    text: 'Stats-siden viser ROI, hit rate, market stats, profit trend og gir deg knapper for seed demo, auto-settle, reset og eksport.',
  },
  {
    title: '8. Bruk Quality',
    text: 'Quality-siden viser hvilke tracker-rader som har svak datakvalitet, manglende felt, lav EV eller lav confidence.',
  },
  {
    title: '9. Bruk Insights',
    text: 'Insights-siden oppsummerer trackerhistorikken og foreslår neste tiltak basert på ROI, sample size, marked og datakvalitet.',
  },
  {
    title: '10. Bruk Diagnostics',
    text: 'Diagnostics-siden gir en readiness score og viser om tracker-oppsettet er klart for mer seriøs testing.',
  },
  {
    title: '11. Sjekk Status ved feil',
    text: 'Status-siden viser health, API probes, storage mode, Redis ping, tracker store, quality score, insights, diagnostics og om API-nøkler er satt.',
  },
];

const rules = [
  'Spill kun hypotetiske eller små test-stakes mens modellen bygges.',
  'Før logg over anbefalinger, odds og resultat før du vurderer om modellen faktisk har edge.',
  'Prioriter kamper der modellen har tydelig forklaring, høy EV, solid confidence og god datakvalitet.',
  'Unngå å øke innsats etter tap. Modellen skal testes disiplinert, ikke jages.',
  'Ikke vurder modellen seriøst før den har nok settled picks per marked.',
];

const workflow = [
  'Deploy checklist: sjekk at ny Vercel deploy er klar og testbar.',
  'Test lab: rask test av snapshot, seed demo, auto-settle, reset, probes og export.',
  'Dashboard: finn mulige verdi-cases.',
  'V2 Tracker: lagre server snapshot og følg pending/settled.',
  'Stats: vurder ROI, hit rate og profittrend.',
  'Quality: sjekk om trackerhistorikken har svake rader.',
  'Insights: få anbefalte neste tiltak basert på historikken.',
  'Diagnostics: sjekk om tracker-oppsettet er klart for seriøs testing.',
  'Status: sjekk storage mode, Redis ping og API health hvis noe virker rart.',
  'Backtest: vurder hvilke markeder som faktisk fungerer over tid.',
];

const deployGuide = [
  'Sjekk at Vercel deployment står som Ready før du tester.',
  'Åpne Deploy checklist etter deploy og følg punktene derfra.',
  'Start gjerne med Quick test og Test lab for rask verifisering.',
  'Hvis noe feiler, gå til Status, Diagnostics og API reference før du endrer kode.',
];

const testLabGuide = [
  'Start med Oppdater alt for å se om alle API probes er OK.',
  'Bruk Save snapshot for å lagre dagens anbefalinger i tracker-store.',
  'Bruk Seed demo hvis du vil teste Stats, Quality, Insights og Backtest med eksempeldata.',
  'Bruk Auto-settle for å teste settlement-flyten.',
  'Bruk Reset store kun når du vil nullstille testdata.',
];

const storageGuide = [
  'server-memory er fint til rask testing, men historikk kan forsvinne ved deploy eller restart.',
  'upstash-redis betyr at tracker-store er persistent og bedre egnet til V2-testing.',
  'Bruk /api/tracker/storage-status eller Status-siden for å se hvilken storage mode appen faktisk bruker.',
  'Når Redis er satt riktig, bør pending/settled historikk fortsatt finnes etter redeploy.',
];

const insightsGuide = [
  'Insights bør brukes som en beslutningsstøtte, ikke som fasit.',
  'Lav sample size betyr at modellen trenger mer historikk før konklusjoner trekkes.',
  'Negative markeder kan brukes til å stramme inn eller pause enkelte markedstyper.',
  'Positive markeder bør følges videre, men må bekreftes over flere kamper og flere runder.',
];

const diagnosticsGuide = [
  'Readiness score forteller om tracker-oppsettet er klart for mer seriøs modelltesting.',
  'Persistent storage bør være OK før historikken brukes som beslutningsgrunnlag.',
  'Lav sample size betyr at ROI og hit rate fortsatt er svake signaler.',
  'Issues-listen bør brukes som en konkret oppgaveliste før neste modellfase.',
];

export default function GuidePage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Brukerguide</h1>
            <p className="hero-subtitle">
              En praktisk guide for hvordan du bør lese dashboardet, bruke tracker-flyten og teste modellen på en ryddig måte.
            </p>
          </div>
          <div className="updated-at">Guide</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Slik bruker du appen</h2>
                <p className="section-subtitle">En enkel flyt fra deploy-test til analyse, logging, stats, quality, insights, diagnostics og storage check.</p>
              </div>
              <div className="badge-soft">11 steg</div>
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Anbefalt arbeidsflyt</h2>
                <p className="section-subtitle">Hvordan sidene bør brukes sammen.</p>
              </div>
              <div className="badge-soft">Workflow</div>
            </div>

            <div className="reason-list">
              {workflow.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Deploy guide</h2>
                <p className="section-subtitle">Hva du gjør rett etter ny Vercel deploy.</p>
              </div>
              <div className="badge-soft">Deploy</div>
            </div>

            <div className="reason-list">
              {deployGuide.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Test lab guide</h2>
                <p className="section-subtitle">Raskeste måte å teste V2-flyten i dag.</p>
              </div>
              <div className="badge-soft">Test</div>
            </div>

            <div className="reason-list">
              {testLabGuide.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Insights guide</h2>
                <p className="section-subtitle">Hvordan du bør tolke anbefalingene fra Insights-siden.</p>
              </div>
              <div className="badge-soft">Insights</div>
            </div>

            <div className="reason-list">
              {insightsGuide.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Diagnostics guide</h2>
                <p className="section-subtitle">Hvordan du bør tolke readiness score og issues.</p>
              </div>
              <div className="badge-soft">Diagnostics</div>
            </div>

            <div className="reason-list">
              {diagnosticsGuide.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Storage guide</h2>
                <p className="section-subtitle">Hvordan du bør tenke rundt server-memory, Redis og trackerhistorikk.</p>
              </div>
              <div className="badge-soft">Storage</div>
            </div>

            <div className="reason-list">
              {storageGuide.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Testregler</h2>
                <p className="section-subtitle">Regler for å unngå at modellen brukes for aggressivt før den er validert.</p>
              </div>
              <div className="badge-soft">Disiplin</div>
            </div>

            <div className="reason-list">
              {rules.map((rule, index) => (
                <div key={rule} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div>
                    <div className="metric-pill-value">{rule}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Hva betyr Deploy checklist?</h2>
            <p className="section-subtitle">
              Deploy checklist er siden du bruker rett etter Vercel har bygget ny versjon. Den hjelper deg å teste raskt og strukturert.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva betyr Test lab?</h2>
            <p className="section-subtitle">
              Test lab er en samlet testside for V2-flyten. Den gjør det enklere å prøve appen uten å hoppe mellom mange sider.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva betyr EV?</h2>
            <p className="section-subtitle">
              EV betyr forventet verdi. Positiv EV betyr at modellen mener oddsen er høyere enn den burde være, men det betyr ikke at spillet nødvendigvis vinner.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva betyr confidence?</h2>
            <p className="section-subtitle">
              Confidence er en praktisk styrkeindikator. Den bør brukes sammen med EV, datakvalitet, markedstype og kampbildet.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva betyr quality score?</h2>
            <p className="section-subtitle">
              Quality score er en intern sjekk av tracker-data. Lav score betyr at raden bør undersøkes før den brukes i backtest eller modellvurdering.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva betyr Insights?</h2>
            <p className="section-subtitle">
              Insights er en enkel tolkning av trackerhistorikken som hjelper deg å se hva som bør testes, strammes inn eller følges videre.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva betyr Diagnostics?</h2>
            <p className="section-subtitle">
              Diagnostics er en readiness-sjekk som viser om tracker-oppsettet, lagringen og datagrunnlaget er klart for mer seriøs testing.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva betyr storage mode?</h2>
            <p className="section-subtitle">
              Storage mode forteller om trackerhistorikken ligger midlertidig i server-memory eller persistent i Upstash Redis.
            </p>
          </section>

          <section className="warning-box">
            Dette er et analyseverktøy under utvikling. Det bør brukes til læring, testing og modellforbedring — ikke som en garanti for gevinst.
          </section>
        </aside>
      </section>
    </main>
  );
}
