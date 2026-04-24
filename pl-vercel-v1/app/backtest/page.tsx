const metricCards = [
  {
    label: 'ROI',
    value: 'Måles per marked',
    description: 'ROI bør måles separat for 1X2, over/under og begge lag scorer.',
  },
  {
    label: 'Hit rate',
    value: 'Treffprosent',
    description: 'Treffprosent må alltid vurderes sammen med odds og forventet verdi.',
  },
  {
    label: 'CLV',
    value: 'Closing line value',
    description: 'Hvis modellen ofte slår closing line, er det et bedre signal enn enkelttreff.',
  },
  {
    label: 'Sample size',
    value: 'Antall picks',
    description: 'Modellen bør ikke vurderes seriøst før den har nok historikk per marked.',
  },
];

const backtestPlan = [
  'Lagre alle anbefalinger før kampstart med timestamp, marked, odds, EV og confidence.',
  'Lagre datakilde og om anbefalingen brukte live odds, delvis live data eller fallback-data.',
  'Hente sluttresultat etter kamp og automatisk merke pick som win eller loss.',
  'Beregne profit ved flat stake på 1 unit per pick.',
  'Splitte resultatene på marked, confidence-bånd og EV-bånd.',
  'Sammenligne odds ved anbefaling med closing odds når dette er tilgjengelig.',
];

const qualityBands = [
  {
    title: 'Grønn sone',
    text: 'Live odds, live kampdata, høy EV, solid confidence og tydelig modellforklaring.',
  },
  {
    title: 'Gul sone',
    text: 'Delvis live data eller moderat confidence. Kan logges, men bør vurderes forsiktig.',
  },
  {
    title: 'Rød sone',
    text: 'Mock/fallback-data, lav confidence eller svak forklaring. Bør ikke brukes som ekte signal.',
  },
];

export default function BacktestPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Backtest</h1>
            <p className="hero-subtitle">
              En side for hvordan modellen bør måles over tid. Målet er å gå fra fine anbefalinger til faktisk dokumentert historikk.
            </p>
          </div>
          <div className="updated-at">Testing framework</div>
        </div>

        <div className="summary-grid" style={{ marginTop: 20 }}>
          {metricCards.map((card) => (
            <div key={card.label} className="summary-card">
              <div className="summary-label">{card.label}</div>
              <div className="summary-value" style={{ fontSize: 22 }}>{card.value}</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Backtest-plan</h2>
                <p className="section-subtitle">Hva som må logges for å vite om modellen faktisk har edge.</p>
              </div>
              <div className="badge-soft">Historikk</div>
            </div>

            <div className="reason-list">
              {backtestPlan.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Datakvalitet</h2>
                <p className="section-subtitle">Enkel fargekode for hvor mye tillit et signal bør få.</p>
              </div>
              <div className="badge-soft">Quality</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {qualityBands.map((band) => (
                <div key={band.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Sone</div>
                  <div className="metric-pill-value">{band.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{band.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Hvorfor backtest?</h2>
            <p className="section-subtitle">
              En modell kan se smart ut på enkeltkamper, men bare historikk viser om den faktisk har verdi. Backtest gjør at vi kan se hvilke markeder som fungerer og hvilke som bør fjernes.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Neste tekniske steg</h2>
            <p className="section-subtitle">
              Det neste store løftet er å lagre anbefalinger i en database i stedet for bare lokalt i nettleseren. Da kan appen bygge ekte historikk over tid.
            </p>
          </section>

          <section className="warning-box">
            Ikke vurder modellen etter én runde. Målet er å samle nok data til å se mønstre per marked, oddsintervall og confidence-nivå.
          </section>
        </aside>
      </section>
    </main>
  );
}
