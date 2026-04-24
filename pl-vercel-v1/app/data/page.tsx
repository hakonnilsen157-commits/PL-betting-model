const dataSources = [
  {
    name: 'Fixtures',
    status: 'Kjører i appen',
    description: 'Kampoppsettet brukes som grunnlag for anbefalinger, tracker og kampvisning.',
  },
  {
    name: 'Odds',
    status: 'Avhenger av API-nøkkel',
    description: 'Bookmaker-odds bør brukes til å beregne implied probability, fair odds, edge og EV.',
  },
  {
    name: 'Tabell og form',
    status: 'Delvis live / fallback',
    description: 'Tabellplassering, poeng, målscore og form kan brukes til å forklare hvorfor et spill vurderes.',
  },
  {
    name: 'Resultater',
    status: 'Neste store steg',
    description: 'Sluttresultater trengs for automatisk settlement og ekte historikk.',
  },
];

const dataPrinciples = [
  'Skill alltid tydelig mellom live data, delvis live data og mock/fallback-data.',
  'Ikke la modellen gi høy confidence når datagrunnlaget er svakt.',
  'Lagre tidspunktet data ble hentet, slik at historikken kan etterprøves.',
  'Bruk samme struktur på data uansett om kilden er API, fallback eller senere database.',
  'Vis brukeren når odds eller lagdata mangler, i stedet for å skjule det.',
];

const nextDataSteps = [
  {
    title: '1. Standardiser datamodell',
    text: 'Sørg for at kamper, odds, anbefalinger og resultater har stabile feltnavn og ID-er.',
  },
  {
    title: '2. Lagre anbefalinger',
    text: 'Når modellen lager en anbefaling, bør den lagres med fixtureId, marked, odds, EV, confidence og datakilde.',
  },
  {
    title: '3. Hent resultater',
    text: 'Etter kamp bør appen hente sluttresultat og merke anbefalinger som win, loss eller void.',
  },
  {
    title: '4. Bygg historikkvisning',
    text: 'Når data er lagret, kan appen vise ROI, hit rate og utvikling over tid per marked.',
  },
];

export default function DataPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Data</h1>
            <p className="hero-subtitle">
              Oversikt over hvilke datakilder modellen trenger, hvordan data bør merkes, og hva som må på plass for å gjøre appen mer ekte.
            </p>
          </div>
          <div className="updated-at">Data layer</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Datakilder</h2>
                <p className="section-subtitle">Hva appen bruker eller bør bruke videre.</p>
              </div>
              <div className="badge-soft">Sources</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {dataSources.map((source) => (
                <div key={source.name} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{source.status}</div>
                  <div className="metric-pill-value">{source.name}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{source.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Neste datasteg</h2>
                <p className="section-subtitle">En praktisk rekkefølge for å gå fra prototype til mer seriøs modell.</p>
              </div>
              <div className="badge-soft">Plan</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {nextDataSteps.map((step) => (
                <div key={step.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Neste</div>
                  <div className="metric-pill-value">{step.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{step.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Dataprinsipper</h2>
            <div className="reason-list">
              {dataPrinciples.map((principle, index) => (
                <div key={principle} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{principle}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Jo bedre datakvalitet modellen får, jo mer nyttig blir den. Men det viktigste er å merke datakilden ærlig, slik at fallback-data ikke ser ut som live-data.
          </section>
        </aside>
      </section>
    </main>
  );
}
