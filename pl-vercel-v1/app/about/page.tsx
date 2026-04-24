const goals = [
  'Bygge en ryddig prototype for Premier League-analyse.',
  'Gjøre anbefalinger mer forklarbare med EV, confidence og datakvalitet.',
  'Teste modellen over tid før man stoler på signalene.',
  'Skille tydelig mellom live data, delvis live data og fallback/mock-data.',
  'Lage et godt grunnlag for videre utvikling med tracker, backtest og historikk.',
];

const appSections = [
  {
    title: 'Dashboard',
    text: 'Hovedsiden for kamper, anbefalinger, filtre, EV og kampanalyse.',
  },
  {
    title: 'V2 Tracker',
    text: 'Tracker for åpne picks, demo-resultater, lokal historikk og videre settlement-flyt.',
  },
  {
    title: 'Data',
    text: 'Forklarer hvilke datakilder appen trenger og hvordan datakvalitet bør håndteres.',
  },
  {
    title: 'Backtest',
    text: 'Plan for hvordan modellen skal måles med ROI, hit rate, CLV og sample size.',
  },
  {
    title: 'Risk',
    text: 'Risikoregler og staking-prinsipper for trygg og disiplinert testing.',
  },
  {
    title: 'Setup',
    text: 'Oversikt over Vercel-oppsett og environment variables.',
  },
];

export default function AboutPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">About</h1>
            <p className="hero-subtitle">
              Dette er en prototype for å analysere Premier League-kamper, finne mulige verdi-spill og bygge en mer seriøs tracker- og backtestflyt over tid.
            </p>
          </div>
          <div className="updated-at">Project overview</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Prosjektmål</h2>
                <p className="section-subtitle">Hva appen prøver å bli.</p>
              </div>
              <div className="badge-soft">Mål</div>
            </div>

            <div className="reason-list">
              {goals.map((goal, index) => (
                <div key={goal} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{goal}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Appstruktur</h2>
                <p className="section-subtitle">Kort forklaring av de viktigste sidene.</p>
              </div>
              <div className="badge-soft">Sider</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {appSections.map((section) => (
                <div key={section.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Side</div>
                  <div className="metric-pill-value">{section.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{section.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Retning videre</h2>
            <p className="section-subtitle">
              Den største verdien videre kommer fra ekte lagring av anbefalinger, automatisk settlement og historikk som viser om modellen faktisk har edge over tid.
            </p>
          </section>

          <section className="warning-box">
            Dette er et analyse- og læringsprosjekt. Det bør vurderes som en prototype til modellen har dokumentert historikk.
          </section>
        </aside>
      </section>
    </main>
  );
}
