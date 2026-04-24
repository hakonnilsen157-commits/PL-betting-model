const terms = [
  {
    term: 'EV',
    full: 'Expected Value',
    explanation: 'Forventet verdi. Positiv EV betyr at modellen mener oddsen er bedre enn den burde være ut fra estimert sannsynlighet.',
  },
  {
    term: 'Implied probability',
    full: 'Implisitt sannsynlighet',
    explanation: 'Sannsynligheten oddsen tilsvarer. Odds 2.00 tilsvarer omtrent 50 prosent før margin.',
  },
  {
    term: 'Fair odds',
    full: 'Rettferdig odds',
    explanation: 'Oddsen modellen mener ville vært riktig basert på egen sannsynlighetsvurdering.',
  },
  {
    term: 'Edge',
    full: 'Modellfordel',
    explanation: 'Forskjellen mellom modellens sannsynlighet og markedets implied probability.',
  },
  {
    term: 'Confidence',
    full: 'Styrkeindikator',
    explanation: 'En praktisk indikator på hvor tydelig modellen mener signalet er. Det er ikke en garanti for treff.',
  },
  {
    term: 'CLV',
    full: 'Closing Line Value',
    explanation: 'Måler om oddsen du fant var bedre enn sluttoddsen. Positiv CLV over tid er ofte et sterkt kvalitetstegn.',
  },
  {
    term: 'ROI',
    full: 'Return on Investment',
    explanation: 'Profit delt på total innsats. Bør måles over mange picks og helst per marked.',
  },
  {
    term: 'Flat stake',
    full: 'Lik innsats per pick',
    explanation: 'Samme innsats på hvert spill. Nyttig i testfasen fordi resultatene blir enklere å tolke.',
  },
  {
    term: 'Fallback-data',
    full: 'Reservegrunnlag',
    explanation: 'Data som brukes når live-kilder mangler. Nyttig i utvikling, men bør merkes tydelig og vektes lavere.',
  },
  {
    term: 'Settlement',
    full: 'Resultatføring',
    explanation: 'Når en pick flyttes fra åpen til avgjort etter at kampen er ferdig og resultatet er kjent.',
  },
];

export default function GlossaryPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Glossary</h1>
            <p className="hero-subtitle">
              En enkel ordliste for begrepene i appen, slik at dashboard, tracker og backtest blir lettere å tolke.
            </p>
          </div>
          <div className="updated-at">Begreper</div>
        </div>
      </section>

      <section className="list-card">
        <div className="list-card-header">
          <div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Begreper</h2>
            <p className="section-subtitle">Korte forklaringer på de viktigste ordene i modellen.</p>
          </div>
          <div className="badge-soft">{terms.length} terms</div>
        </div>

        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {terms.map((item) => (
            <div key={item.term} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">{item.full}</div>
              <div className="metric-pill-value">{item.term}</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>{item.explanation}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
