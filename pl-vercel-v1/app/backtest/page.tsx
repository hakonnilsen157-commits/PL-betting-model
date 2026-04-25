'use client';

import { useEffect, useMemo, useState } from 'react';

type TrackerStatsResponse = {
  ok?: boolean;
  storageMode?: string;
  updatedAt?: string;
  summary?: {
    pendingCount: number;
    settledCount: number;
    wins: number;
    hitRate: number;
    profit: number;
    roi: number;
    avgOdds: number;
    avgEv: number;
    avgConfidence: number;
  };
  marketStats?: Array<{
    market: string;
    picks: number;
    wins: number;
    profit: number;
    roi: number;
    hitRate: number;
    avgOdds: number;
  }>;
  qualityCounts?: Record<string, number>;
  profitTrend?: Array<{
    market: string;
    settledAt?: string;
    profit: number;
    cumulative: number;
  }>;
  error?: string;
};

type InsightsResponse = {
  ok?: boolean;
  recommendations?: string[];
  marketInsights?: Array<{
    market: string;
    picks: number;
    settled: number;
    profit: number;
    roi: number;
    hitRate: number;
    avgEv: number;
    avgConfidence: number;
  }>;
  error?: string;
};

const backtestPlan = [
  'Lagre alle anbefalinger før kampstart med timestamp, marked, odds, EV og confidence.',
  'Lagre datakilde og om anbefalingen brukte live odds, delvis live data eller fallback-data.',
  'Hente sluttresultat etter kamp og automatisk merke pick som win eller loss.',
  'Beregne profit ved flat stake på 1 unit per pick.',
  'Splitte resultatene på marked, confidence-bånd og EV-bånd.',
  'Sammenligne odds ved anbefaling med closing odds når dette er tilgjengelig.',
];

function pct(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${(value * 100).toFixed(1)}%`;
}

function units(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}u`;
}

function formatDate(value?: string) {
  if (!value) return '–';
  try {
    return new Date(value).toLocaleString('no-NO');
  } catch {
    return value;
  }
}

function sampleStatus(picks?: number) {
  if (!picks) return 'Ingen data';
  if (picks < 25) return 'For lite grunnlag';
  if (picks < 100) return 'Tidlig signal';
  return 'Mer robust grunnlag';
}

export default function BacktestPage() {
  const [data, setData] = useState<TrackerStatsResponse | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    setLoading(true);
    setError(null);

    try {
      const [statsResponse, insightsResponse] = await Promise.all([
        fetch('/api/tracker/stats', { cache: 'no-store' }),
        fetch('/api/tracker/insights', { cache: 'no-store' }),
      ]);

      const [statsJson, insightsJson] = await Promise.all([
        statsResponse.json(),
        insightsResponse.json(),
      ]);

      if (!statsResponse.ok || !statsJson.ok) throw new Error(statsJson.error ?? 'Kunne ikke hente backtest-data');
      if (!insightsResponse.ok || !insightsJson.ok) throw new Error(insightsJson.error ?? 'Kunne ikke hente insights-data');

      setData(statsJson);
      setInsights(insightsJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent backtest-feil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const summary = data?.summary;
  const bestMarket = useMemo(() => {
    const rows = data?.marketStats ?? [];
    return rows.length ? [...rows].sort((a, b) => b.profit - a.profit)[0] : null;
  }, [data]);

  const weakestMarket = useMemo(() => {
    const rows = data?.marketStats ?? [];
    return rows.length ? [...rows].sort((a, b) => a.profit - b.profit)[0] : null;
  }, [data]);

  const qualityCounts = data?.qualityCounts ?? { green: 0, yellow: 0, red: 0 };
  const totalQuality = (qualityCounts.green ?? 0) + (qualityCounts.yellow ?? 0) + (qualityCounts.red ?? 0);

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Backtest</h1>
            <p className="hero-subtitle">
              Backtest-siden leser tracker stats og tracker insights for å vise faktisk historikk, markedsinnsikt og neste tiltak.
            </p>
          </div>
          <button type="button" onClick={loadStats} className="app-nav-link" disabled={loading}>
            {loading ? 'Laster...' : 'Oppdater'}
          </button>
        </div>

        {error ? <div className="warning-box">{error}</div> : null}

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">ROI</div>
            <div className="summary-value green">{pct(summary?.roi)}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Profit {units(summary?.profit)} på {summary?.settledCount ?? 0} settled picks.</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Hit rate</div>
            <div className="summary-value">{pct(summary?.hitRate)}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>{summary?.wins ?? 0} wins av {summary?.settledCount ?? 0} settled.</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Sample size</div>
            <div className="summary-value">{summary?.settledCount ?? 0}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>{sampleStatus(summary?.settledCount)}</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Insights</div>
            <div className="summary-value">{insights?.recommendations?.length ?? 0}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Anbefalte neste tiltak.</p>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Insights fra historikken</h2>
                <p className="section-subtitle">Samme anbefalinger som Insights-siden, vist direkte i backtest.</p>
              </div>
              <div className="badge-soft">Insights</div>
            </div>

            <div className="reason-list">
              {(insights?.recommendations ?? []).length === 0 ? (
                <div className="empty-box">Ingen insights ennå.</div>
              ) : insights?.recommendations?.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Market performance</h2>
                <p className="section-subtitle">Backtest-resultater splittet per marked.</p>
              </div>
              <div className="badge-soft">Markets</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {(data?.marketStats ?? []).length === 0 ? (
                <div className="empty-box">Ingen settled market stats ennå. Bruk Seed demo på Stats-siden eller la tracker samle historikk.</div>
              ) : data?.marketStats?.map((row) => (
                <div key={row.market} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{row.picks} picks · {row.wins} wins</div>
                  <div className="metric-pill-value">{row.market}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>
                    Profit {units(row.profit)} · ROI {pct(row.roi)} · Hit rate {pct(row.hitRate)} · Snittodds {row.avgOdds.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Backtest-plan</h2>
                <p className="section-subtitle">Hva som fortsatt må logges for å vite om modellen faktisk har edge.</p>
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
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Backtest signal</h2>
            <p className="section-subtitle">
              Beste marked: {bestMarket ? `${bestMarket.market} (${units(bestMarket.profit)}, ROI ${pct(bestMarket.roi)})` : '–'}
            </p>
            <p className="section-subtitle">
              Svakeste marked: {weakestMarket ? `${weakestMarket.market} (${units(weakestMarket.profit)}, ROI ${pct(weakestMarket.roi)})` : '–'}
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Datakvalitet</h2>
            <p className="section-subtitle">
              Grønn: {qualityCounts.green ?? 0} · Gul: {qualityCounts.yellow ?? 0} · Rød: {qualityCounts.red ?? 0} · Total: {totalQuality}
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Storage</h2>
            <p className="section-subtitle">
              {data?.storageMode ?? '–'} · Sist oppdatert {formatDate(data?.updatedAt)}
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
