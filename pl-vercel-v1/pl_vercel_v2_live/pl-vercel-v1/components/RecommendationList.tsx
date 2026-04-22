import { Recommendation } from '@/lib/types';

function marketLabel(market: Recommendation['market']): string {
  const labels: Record<Recommendation['market'], string> = {
    home: 'Hjemmeseier',
    draw: 'Uavgjort',
    away: 'Borteseier',
    over2_5: 'Over 2.5',
    under2_5: 'Under 2.5',
    btts_yes: 'BTTS Ja',
    btts_no: 'BTTS Nei',
  };

  return labels[market];
}

export function RecommendationList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="list">
      {recommendations.map((rec, index) => (
        <div key={`${rec.fixtureId}-${rec.market}`} className="item">
          <div className="row">
            <strong>#{index + 1} {rec.match}</strong>
            <span className="badge">{marketLabel(rec.market)}</span>
          </div>
          <p className="subtle" style={{ margin: '10px 0 12px' }}>{rec.note}</p>
          <div className="row mono" style={{ flexWrap: 'wrap' }}>
            <span>Odds: {rec.bookmakerOdds}</span>
            <span>Fair: {rec.fairOdds}</span>
            <span className="pos">Edge: {(rec.edge * 100).toFixed(1)}%</span>
            <span className="pos">EV: {(rec.expectedValue * 100).toFixed(1)}%</span>
            <span>Confidence: {rec.confidence}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
