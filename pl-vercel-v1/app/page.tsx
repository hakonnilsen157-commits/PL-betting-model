import { RecommendationList } from '@/components/RecommendationList';
import { getLiveDashboard } from '@/lib/live-data';

const fallbackRound = 34;

export default async function HomePage() {
  const dashboard = await getLiveDashboard(fallbackRound);
  const recommendations = dashboard.recommendations;
  const fixtures = dashboard.fixtures;

  return (
    <main className="container">
      <div className="header">
        <div>
          <p className="badge">Premier League model • Vercel V2</p>
          <h1 className="h1">Betting dashboard for Gameweek {dashboard.round || fallbackRound}</h1>
          <p className="subtle">
            V2 kan bruke live fixtures, odds og injuries når DATA_MODE=live og API-nøkler er satt. Uten det faller den tilbake til mock-data.
          </p>
        </div>
      </div>

      <div className="grid">
        <section className="card third">
          <div className="kpi-label">Antall kampanbefalinger</div>
          <div className="kpi">{recommendations.length}</div>
        </section>
        <section className="card third">
          <div className="kpi-label">Beste forventede verdi</div>
          <div className="kpi pos">{((recommendations[0]?.expectedValue ?? 0) * 100).toFixed(1)}%</div>
        </section>
        <section className="card third">
          <div className="kpi-label">Data mode</div>
          <div className="kpi">{dashboard.source}</div>
        </section>

        <section className="card half">
          <h2 style={{ marginTop: 0 }}>Topp 10 spill denne runden</h2>
          <p className="subtle">Utvalgt på edge + expected value. H2H, totals og BTTS er inkludert.</p>
          <RecommendationList recommendations={recommendations} />
        </section>

        <section className="card half">
          <h2 style={{ marginTop: 0 }}>Kamper i runden</h2>
          <table className="table">
            <thead>
              <tr><th>Kamp</th><th>Kickoff</th><th>Topp spill</th><th>EV</th></tr>
            </thead>
            <tbody>
              {fixtures.map((fixture) => (
                <tr key={fixture.id}>
                  <td>{fixture.homeTeam} vs {fixture.awayTeam}</td>
                  <td>{new Date(fixture.kickoff).toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Oslo' })}</td>
                  <td>{fixture.topRecommendation.market}</td>
                  <td className="pos">{(fixture.topRecommendation.expectedValue * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Live-oppsett</h2>
          <p className="subtle">For live-modus: sett DATA_MODE=live i Vercel og legg inn ODDS_API_KEY og API_FOOTBALL_KEY. Cron-endepunktet kan da brukes til å hente odds, fixtures og injuries på faste intervaller.</p>
          <div className="mono" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{`ENV:\nDATA_MODE=live\nODDS_API_KEY=...\nAPI_FOOTBALL_KEY=...\nAPI_FOOTBALL_SEASON=${new Date().getUTCFullYear()}\nODDS_REGIONS=uk,eu\nODDS_SPORT_KEY=soccer_epl\nCRON_SECRET=...`}</div>
        </section>
      </div>
    </main>
  );
}
