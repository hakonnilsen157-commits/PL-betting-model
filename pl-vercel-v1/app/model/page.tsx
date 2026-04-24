const modelFactors = [
  {
    title: 'Markedssannsynlighet',
    description: 'Modellen sammenligner sin egen estimerte sannsynlighet med implied probability fra oddsen.',
  },
  {
    title: 'Expected Value',
    description: 'EV brukes som hovedsignal for om oddsen ser høy nok ut sammenlignet med modellens vurdering.',
  },
  {
    title: 'Confidence',
    description: 'Confidence brukes som en praktisk styrkeindikator for hvor tydelig caset er, ikke som en garanti.',
  },
  {
    title: 'Kampkontekst',
    description: 'Form, tabell, hjemme-/borteprofil, måltrend og tilgjengelig kampdata bør påvirke vurderingen.',
  },
  {
    title: 'Datakvalitet',
    description: 'Live data bør vektes høyere enn fallback eller mock-data. Modellen skal være ærlig på datagrunnlaget.',
  },
  {
    title: 'Historisk testing',
    description: 'Modellen bør måles mot faktiske resultater over tid før man stoler på signalene.',
  },
];

const improvementIdeas = [
  'Logge alle anbefalinger før kampstart med odds, EV, confidence og kilde.',
  'Måle ROI per marked: 1X2, over/under og begge lag scorer.',
  'Lage terskler som skjuler spill med lav confidence eller svak datakvalitet.',
  'Sammenligne modellens closing line mot oddsen som ble fanget da anbefalingen ble laget.',
  'Bygge en enkel score for datakvalitet per kamp.',
];

export default function ModelPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Modellforklaring</h1>
            <p className="hero-subtitle">
              En enkel forklaring av hvordan modellen bør forstås, hvilke signaler som er viktige, og hvordan den kan forbedres videre.
            </p>
          </div>
          <div className="updated-at">Model notes</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Viktige modellfaktorer</h2>
                <p className="section-subtitle">Signalene som bør inngå i vurderingen av et spill.</p>
              </div>
              <div className="badge-soft">Faktorer</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {modelFactors.map((factor) => (
                <div key={factor.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Faktor</div>
                  <div className="metric-pill-value">{factor.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{factor.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Neste modellforbedringer</h2>
                <p className="section-subtitle">Konkrete tiltak som gjør modellen mer testbar og mer seriøs.</p>
              </div>
              <div className="badge-soft">Backtest</div>
            </div>

            <div className="reason-list">
              {improvementIdeas.map((idea, index) => (
                <div key={idea} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{idea}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Sunn modellfilosofi</h2>
            <p className="section-subtitle">
              En god bettingmodell bør være selektiv. Det er bedre at modellen finner få tydelige spots enn at den tvinger frem anbefalinger i alle kamper.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva vi bør unngå</h2>
            <p className="section-subtitle">
              Vi bør unngå å presentere fallback-data som live-data, overvurdere kortsiktige resultater og justere modellen etter enkelttap.
            </p>
          </section>

          <section className="warning-box">
            Modellen er et beslutningsstøtteverktøy. Den bør evalueres med historikk, disiplin og tydelige regler før man vurderer om den faktisk har edge.
          </section>
        </aside>
      </section>
    </main>
  );
}
