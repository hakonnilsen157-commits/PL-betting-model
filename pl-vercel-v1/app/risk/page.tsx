const riskRules = [
  {
    title: 'Flat stake først',
    text: 'Test modellen med lik innsats per pick. Det gjør historikken enklere å lese og hindrer at enkelttap får for stor betydning.',
  },
  {
    title: 'Ingen chasing',
    text: 'Ikke øk innsatsen etter tap. Modellen skal evalueres over mange picks, ikke reddes av neste kamp.',
  },
  {
    title: 'Maks antall picks',
    text: 'Sett en grense for hvor mange picks som kan tas per runde. En selektiv modell er ofte bedre enn en modell som spiller alt.',
  },
  {
    title: 'Datakvalitet først',
    text: 'Picks basert på fallback eller mangelfulle data bør ikke behandles som fullverdige live-signaler.',
  },
];

const stakingFramework = [
  'Start med papirtesting eller svært små test-stakes mens modellen bygges.',
  'Bruk 1 unit som standard per pick i testperioden.',
  'Ikke vurder høyere innsats før modellen har dokumentert historikk over mange kamper.',
  'Hold bankrollen separat fra privatøkonomi og sett et fast tapsmaks før testing.',
  'Stopp testingen hvis du merker at du spiller for å vinne tilbake tap.',
];

const redFlags = [
  'Du endrer filter bare for å finne flere spill.',
  'Du ignorerer lav confidence fordi oddsen virker fristende.',
  'Du bruker mock eller fallback-data som om det var live-data.',
  'Du vurderer modellen etter én god eller én dårlig runde.',
  'Du øker innsats etter tap.',
];

export default function RiskPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Risk & staking</h1>
            <p className="hero-subtitle">
              En egen side for disiplin, risikostyring og trygg testing av modellen. Målet er å bygge en god modell uten å la entusiasme styre innsatsen.
            </p>
          </div>
          <div className="updated-at">Risk framework</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Risikoregler</h2>
                <p className="section-subtitle">Regler som bør ligge fast før modellen får mer tillit.</p>
              </div>
              <div className="badge-soft">Risk</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {riskRules.map((rule) => (
                <div key={rule.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Regel</div>
                  <div className="metric-pill-value">{rule.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{rule.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Staking-rammeverk</h2>
                <p className="section-subtitle">Forslag til en forsiktig og målbar måte å teste modellen på.</p>
              </div>
              <div className="badge-soft">Units</div>
            </div>

            <div className="reason-list">
              {stakingFramework.map((item, index) => (
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
            <h2 className="section-title">Røde flagg</h2>
            <div className="reason-list">
              {redFlags.map((flag, index) => (
                <div key={flag} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{flag}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Modellen skal brukes til analyse og læring. Den skal ikke brukes som grunnlag for aggressiv betting, chasing eller innsats du ikke tåler å tape.
          </section>
        </aside>
      </section>
    </main>
  );
}
