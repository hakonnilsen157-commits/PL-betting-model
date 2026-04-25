const changes = [
  {
    version: 'V2.21',
    title: 'Release notes og Upstash issue',
    items: [
      'Lagt til /release-notes som kort oversikt over siste versjon og anbefalt testrekkefølge.',
      'Koblet Release notes inn i menyen under Prosjekt.',
      'Oppdatert Guide med Release notes som første steg og 14-stegs arbeidsflyt.',
      'Opprettet GitHub issue #3 som manuell V2.21-oppgave for Upstash Redis i Vercel.',
      'Oppdatert Release notes med skille mellom issue #2 for deploy-test og issue #3 for Upstash-oppsett.',
    ],
  },
  {
    version: 'V2.20',
    title: 'Upstash og persistent testing',
    items: [
      'Lagt til /upstash-setup med steg-for-steg oppsett av Upstash Redis i Vercel.',
      'Lagt til /persistent-test for å bekrefte at trackerhistorikk overlever redeploy.',
      'Koblet Upstash setup og Persistent test inn i menyen under Prosjekt.',
      'Oppdatert Deploy checklist med Upstash-verifisering, Redis-sjekk og flere feilsøkingspunkter.',
      'Oppdatert Guide med 13-stegs arbeidsflyt, Upstash guide og Persistent test guide.',
      'Oppdatert QA med Upstash flow, Persistent test flow og redeploy-test av open/settled rows.',
    ],
  },
  {
    version: 'V2.19',
    title: 'Deploy checklist og testflyt',
    items: [
      'Lagt til /deploy-checklist som egen side for testing rett etter Vercel deploy.',
      'Koblet Deploy checklist inn i menyen under Prosjekt.',
      'Oppdatert Guide med Deploy checklist som første steg, 11-stegs arbeidsflyt og egen Deploy guide.',
      'Oppdatert QA med Deploy checklist, Quick test og egen deploy flow.',
      'Oppdatert Quick test med GitHub issue #2 som testprotokoll.',
    ],
  },
  {
    version: 'V2.18',
    title: 'Test lab og raskere V2-testing',
    items: [
      'Lagt til /test-lab som samlet testsentral for snapshot, seed demo, auto-settle, reset, API probes og export.',
      'Koblet Test lab inn i den kompakte menyen slik at den er lett å finne på mobil.',
      'Oppdatert Guide med Test lab som første steg, 10-stegs arbeidsflyt og egen Test lab guide.',
      'Oppdatert QA med Test lab flow, deploy-sjekk via /test-lab og test av snapshot/export fra samme side.',
    ],
  },
  {
    version: 'V2.17',
    title: 'Diagnostics i brukerguiden',
    items: [
      'Oppdatert Guide med 9-stegs arbeidsflyt der Diagnostics er eget steg.',
      'Lagt til egen Diagnostics guide som forklarer readiness score, persistent storage, sample size og issues.',
      'Utvidet anbefalt arbeidsflyt med Diagnostics mellom Insights og Status.',
      'Lagt inn forklaring av hva Diagnostics betyr i sidepanelet på Guide-siden.',
    ],
  },
  {
    version: 'V2.16',
    title: 'Tracker Diagnostics',
    items: [
      'Lagt til /api/tracker/diagnostics med readiness score, checks og issues for tracker-oppsettet.',
      'Lagt til egen Diagnostics-side med readiness, storage, quality score, rows og performance summary.',
      'Koblet Diagnostics inn i menyen og Status-siden.',
      'Oppdatert API reference og QA med diagnostics-rute, diagnostics-side og persistent storage-check.',
    ],
  },
  {
    version: 'V2.15',
    title: 'Backtest bruker Insights',
    items: [
      'Oppdatert Backtest til å hente både /api/tracker/stats og /api/tracker/insights.',
      'Lagt inn anbefalte neste tiltak direkte på Backtest-siden.',
      'Utvidet Backtest med tydeligere storage-status og datakvalitet i sidepanelet.',
      'Gjort Backtest mer nyttig som samleside for historikk, markedssignaler og modelltiltak.',
    ],
  },
  {
    version: 'V2.14',
    title: 'Insights i brukerguiden',
    items: [
      'Oppdatert Guide med 8-stegs arbeidsflyt der Insights er eget steg.',
      'Lagt til egen Insights guide som forklarer hvordan anbefalingene bør tolkes.',
      'Utvidet anbefalt arbeidsflyt med Dashboard → Tracker → Stats → Quality → Insights → Status → Backtest.',
      'Lagt inn forklaring av hva Insights betyr i sidepanelet på Guide-siden.',
    ],
  },
  {
    version: 'V2.13',
    title: 'Tracker Insights',
    items: [
      'Lagt til /api/tracker/insights som oppsummerer trackerhistorikk, market insights og anbefalte neste tiltak.',
      'Lagt til egen Insights-side med recommendations, market insights, quality mix og tracker summary.',
      'Koblet Insights inn i den kompakte menyen.',
      'Utvidet Status, API reference og QA med insights-sjekker.',
    ],
  },
  {
    version: 'V2.12',
    title: 'Oppdatert guide og databaseplan',
    items: [
      'Oppdatert Guide med server snapshot workflow, storage mode og Redis/server-memory forklaring.',
      'Oppdatert Database plan med dagens V2.11 storage-flow og aktuelle tracker-API-ruter.',
      'Lagt inn fremtidige tabeller for tracker_snapshots og tracker_picks.',
      'Tydeliggjort veien fra server-memory til Upstash Redis og senere Postgres.',
    ],
  },
  {
    version: 'V2.11',
    title: 'Storage-status og Redis-verifisering',
    items: [
      'Lagt til /api/tracker/storage-status for å vise storage mode, Redis-konfigurasjon og tracker-store summary.',
      'Utvidet Status-siden med Redis ping, storage mode og storage-status probe.',
      'Oppdatert API reference med storage-status-rute og quick test-lenke.',
      'Utvidet Setup og QA med konkrete steg for å verifisere at trackerhistorikk overlever redeploy med Upstash Redis.',
    ],
  },
  {
    version: 'V2.10',
    title: 'Kompakt mobilmeny',
    items: [
      'Byttet stor toppnavigasjon til kompakt Meny-knapp som ikke dekker innholdet på mobil.',
      'Flyttet navigasjonen til egen klientkomponent med aktiv side og automatisk lukking ved klikk.',
      'Lagt til aktiv markering i menyen med blå highlight og checkmark.',
      'Ryddet layout.tsx slik at layouten er enklere å vedlikeholde videre.',
    ],
  },
  {
    version: 'V2.9',
    title: 'Server snapshot og tracker-store flyt',
    items: [
      'Lagt til /api/tracker/snapshot for å bygge tracker-rader server-side fra anbefalinger.',
      'Oppdatert V2 Tracker til å bruke server snapshot i stedet for å bygge tracker-rader i klienten.',
      'Utvidet Status med snapshot rows, snapshot source og tracker snapshot probe.',
      'Utvidet QA med egen server snapshot → tracker-store → stats/quality/export testflyt.',
    ],
  },
  {
    version: 'V2.8',
    title: 'Quality layer og helsesjekk',
    items: [
      'Lagt til tracker quality API med quality score, issues og svakeste tracker-rader.',
      'Lagt til Quality-side med green/yellow/red mix og issue counts.',
      'Utvidet Status-siden med quality score, quality mix og tracker quality probe.',
      'Oppdatert API reference med quality-rute og quick test-lenke.',
    ],
  },
  {
    version: 'V2.7',
    title: 'Tracker API og statsflyt',
    items: [
      'Lagt til tracker stats API med ROI, hit rate, market stats, datakvalitet og profittrend.',
      'Lagt til Stats-side som leser fra tracker stats API-et.',
      'Lagt til CSV/JSON export API for trackerhistorikk.',
      'Lagt til seed-demo API og knapp på Stats-siden for å fylle testdata.',
    ],
  },
  {
    version: 'V2.6',
    title: 'Tracker og navigasjon',
    items: [
      'Oppgradert V2 Tracker med filter på status, marked og datakvalitet.',
      'Lagt til CSV/JSON-eksport fra tracker UI.',
      'Ryddet toppmenyen i grupper: App, Analyse og Prosjekt.',
      'Lagt til API reference-side med oversikt over interne API-ruter.',
    ],
  },
  {
    version: 'V2.5',
    title: 'Prosjekt- og kvalitetssider',
    items: [
      'Lagt til Glossary, Setup, About, QA og Database plan.',
      'Lagt til Risk-side med staking- og risikoregler.',
      'Lagt til Changelog som intern prosjektlogg.',
    ],
  },
  {
    version: 'V2.4',
    title: 'Data og backtest-struktur',
    items: [
      'Lagt til Data-side med oversikt over datakilder og datakvalitet.',
      'Lagt til Backtest-side med plan for historikk, ROI, hit rate og CLV.',
      'Utvidet navigasjonen med flere støttesider for videre utvikling.',
    ],
  },
  {
    version: 'V2.3',
    title: 'Dokumentasjon i appen',
    items: [
      'Lagt til Guide-side med praktisk brukerveiledning.',
      'Lagt til Model-side med forklaring av modellfaktorer.',
      'Lagt til Status-side for API- og datamodusstatus.',
    ],
  },
  {
    version: 'V2.2',
    title: 'Navigasjon og struktur',
    items: [
      'Lagt inn global toppmeny.',
      'Lagt til Roadmap-side.',
      'Gjort appen enklere å klikke rundt i uten å skrive URL manuelt.',
    ],
  },
  {
    version: 'V2.1',
    title: 'Tracker og deploy-fiks',
    items: [
      'Fikset TypeScript-feil i tracker-komponenten.',
      'Ryddet bort problematisk server-tracker-komponent.',
      'Skrudde TypeScript-sjekk på igjen etter opprydding.',
    ],
  },
  {
    version: 'V1.0',
    title: 'Første Vercel-versjon',
    items: [
      'Dashboard med kamper, anbefalinger, EV og confidence.',
      'Vercel deployment koblet mot GitHub.',
      'Grunnlag for videre Premier League-modell.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Changelog</h1>
            <p className="hero-subtitle">
              En enkel oversikt over hva som er lagt til i appen, slik at utviklingen kan følges over tid.
            </p>
          </div>
          <div className="updated-at">Build history</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          {changes.map((change) => (
            <section key={change.version} className="list-card" style={{ marginBottom: 16 }}>
              <div className="list-card-header">
                <div>
                  <h2 className="section-title" style={{ marginBottom: 0 }}>{change.version}: {change.title}</h2>
                  <p className="section-subtitle">Endringer og forbedringer i denne fasen.</p>
                </div>
                <div className="badge-soft">{change.version}</div>
              </div>

              <div className="reason-list">
                {change.items.map((item, index) => (
                  <div key={item} className="reason-card">
                    <span className="reason-number">{index + 1}</span>
                    <div className="metric-pill-value">{item}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Hvorfor changelog?</h2>
            <p className="section-subtitle">
              Når appen utvikles raskt, er det nyttig å ha en enkel oversikt over hva som faktisk er gjort. Det gjør det enklere å teste, feilsøke og planlegge neste steg.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Neste forbedring</h2>
            <p className="section-subtitle">
              Etter hvert kan denne siden kobles mot ekte GitHub-commits eller release notes, men foreløpig fungerer den som en ryddig prosjektlogg inne i appen.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
