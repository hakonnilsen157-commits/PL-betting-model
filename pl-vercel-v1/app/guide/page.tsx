const steps = [
  {
    title: '1. Start med Dashboard',
    text: 'Bruk dashboardet for å se kampene, beste anbefalinger, EV, confidence og modellens korte forklaring per spill.',
  },
  {
    title: '2. Filtrer på marked og EV',
    text: 'Juster marked og minimum EV for å se om det finnes færre, men tydeligere verdi-cases.',
  },
  {
    title: '3. Sjekk V2 Tracker',
    text: 'Tracker-siden viser åpne picks, lokal historikk og demo-resultater slik at du kan følge hvordan modellen utvikler seg.',
  },
  {
    title: '4. Ikke stol blindt på ett tall',
    text: 'Bruk EV, confidence, oddsgrunnlag og kampanalyse sammen. Lav datakvalitet bør alltid vektes ned.',
  },
];

const rules = [
  'Spill kun hypotetiske eller små test-stakes mens modellen bygges.',
  'Før logg over anbefalinger, odds og resultat før du vurderer om modellen faktisk har edge.',
  'Prioriter kamper der modellen har tydelig forklaring, høy EV og solid confidence.',
  'Unngå å øke innsats etter tap. Modellen skal testes disiplinert, ikke jages.',
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
                <p className="section-subtitle">En enkel flyt fra analyse til logging.</p>
              </div>
              <div className="badge-soft">4 steg</div>
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

          <section className="warning-box">
            Dette er et analyseverktøy under utvikling. Det bør brukes til læring, testing og modellforbedring — ikke som en garanti for gevinst.
          </section>
        </aside>
      </section>
    </main>
  );
}
