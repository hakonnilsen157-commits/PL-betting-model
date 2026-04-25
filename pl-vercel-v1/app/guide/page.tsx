const steps = [
  {
    title: '1. Start med Dashboard',
    text: 'Bruk dashboardet for å se kamper, beste anbefalinger, EV, confidence og modellens korte forklaring per spill.',
  },
  {
    title: '2. Filtrer på marked og EV',
    text: 'Juster marked og minimum EV for å se om det finnes færre, men tydeligere verdi-cases.',
  },
  {
    title: '3. Lagre server snapshot i V2 Tracker',
    text: 'V2 Tracker bruker server snapshot API-et for å bygge og lagre anbefalinger til tracker-store.',
  },
  {
    title: '4. Følg pending og settled',
    text: 'Tracker-siden viser pending picks, settled historikk, datakvalitet, eksport og auto-settlement handlinger.',
  },
  {
    title: '5. Bruk Stats',
    text: 'Stats-siden viser ROI, hit rate, market stats, profit trend og gir deg knapper for seed demo, auto-settle, reset og eksport.',
  },
  {
    title: '6. Bruk Quality',
    text: 'Quality-siden viser hvilke tracker-rader som har svak datakvalitet, manglende felt, lav EV eller lav confidence.',
  },
  {
    title: '7. Sjekk Status ved feil',
    text: 'Status-siden viser health, API probes, storage mode, Redis ping, tracker store, quality score og om API-nøkler er satt.',
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
  'Dashboard: finn mulige verdi-cases.',
  'V2 Tracker: lagre server snapshot og følg pending/settled.',
  'Stats: vurder ROI, hit rate og profittrend.',
  'Quality: sjekk om trackerhistorikken har svake rader.',
  'Status: sjekk storage mode, Redis ping og API health hvis noe virker rart.',
  'Backtest: vurder hvilke markeder som faktisk fungerer over tid.',
];

const storageGuide = [
  'server-memory er fint til rask testing, men historikk kan forsvinne ved deploy eller restart.',
  'upstash-redis betyr at tracker-store er persistent og bedre egnet til V2-testing.',
  'Bruk /api/tracker/storage-status eller Status-siden for å se hvilken storage mode appen faktisk bruker.',
  'Når Redis er satt riktig, bør pending/settled historikk fortsatt finnes etter redeploy.',
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
                <p className="section-subtitle">En enkel flyt fra analyse til logging, stats, quality og storage check.</p>
              </div>
              <div className="badge-soft">7 steg</div>
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
