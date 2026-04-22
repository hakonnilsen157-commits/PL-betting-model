import { RecommendationList } from '@/components/RecommendationList';
import { getRoundFixtures, getRoundRecommendations } from '@/lib/model';

const currentRound = 34;

export default function HomePage() {
  const recommendations = getRoundRecommendations(currentRound);
  const fixtures = getRoundFixtures(currentRound);

  return (
    <main className="container">
      <div className="header">
        <div>
          <p className="badge">Premier League model • Vercel V1</p>
          <h1 className="h1">Betting dashboard for Gameweek {currentRound}</h1>
          <p className="subtle">
            V1 bruker mock-data, men arkitekturen er klar for ekte odds, skader, fixtures og cron-basert refresh.
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
          <div className="kpi">{process.env.DATA_MODE ?? 'mock'}</div>
        </section>

        <section className="card half">
          <h2 style={{ marginTop: 0 }}>Topp 10 spill denne runden</h2>
          <p className="subtle">Utvalgt på edge + expected value. Ikke begrenset til H/U/B.</p>
          <RecommendationList recommendations={recommendations} />
        </section>

        <section className="card half">
          <h2 style={{ marginTop: 0 }}>Kamper i runden</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Kamp</th>
                <th>Kickoff</th>
                <th>Topp spill</th>
                <th>EV</th>
              </tr>
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
          <h2 style={{ marginTop: 0 }}>Arkitektur</h2>
          <p className="subtle">
            Frontend i Next.js. Modell-logikk i server-side kode/API-ruter. Daglig oppdatering via Vercel Cron. I V2 kobles
            fixtures, odds og injuries til ekte datakilder og lagres i database.
          </p>
          <div className="mono" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
{`Frontend: Next.js App Router
API: /api/fixtures, /api/recommendations, /api/cron/refresh
Model layer: lib/model.ts
Data adapters (V2): odds, injuries, fixtures
Storage (V2): Postgres/Supabase/Neon
Scheduler: Vercel Cron (daglig på Hobby)`}
          </div>
        </section>
      </div>
    </main>
  );
}
