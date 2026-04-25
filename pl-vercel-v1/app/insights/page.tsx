'use client';

import { useEffect, useState } from 'react';

type InsightsResponse = {
  ok?: boolean;
  storageMode?: string;
  updatedAt?: string;
  summary?: {
    pendingCount: number;
    settledCount: number;
    profit: number;
    roi: number;
    hitRate: number;
    qualityCounts: {
      green: number;
      yellow: number;
      red: number;
    };
  };
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
  recommendations?: string[];
  error?: string;
};

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

export default function InsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadInsights() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tracker/insights', { cache: 'no-store' });
      const json = (await response.json()) as InsightsResponse;
      if (!response.ok || !json.ok) throw new Error(json.error ?? 'Kunne ikke hente insights');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent insights-feil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, []);

  const summary = data?.summary;
  const markets = data?.marketInsights ?? [];

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Insights</h1>
            <p className="hero-subtitle">
              En enkel innsiktsside som tolker trackerhistorikken og foreslår neste tiltak basert på ROI, sample size, datakvalitet og storage mode.
            </p>
          </div>
          <button type="button" onClick={loadInsights} className="app-nav-link" disabled={loading}>
            {loading ? 'Laster...' : 'Oppdater'}
          </button>
        </div>

        {error ? <div className="warning-box">{error}</div> : null}

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">Storage</div>
            <div className="summary-value" style={{ fontSize: 20 }}>{data?.storageMode ?? '–'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Settled</div>
            <div className="summary-value">{summary?.settledCount ?? '–'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">ROI</div>
            <div className="summary-value green">{pct(summary?.roi)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Profit</div>
            <div className="summary-value green">{units(summary?.profit)}</div>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Anbefalte neste tiltak</h2>
                <p className="section-subtitle">Generert fra trackerhistorikken.</p>
              </div>
              <div className="badge-soft">Insights</div>
            </div>

            <div className="reason-list">
              {(data?.recommendations ?? []).length === 0 ? (
                <div className="empty-box">Ingen anbefalinger ennå.</div>
              ) : data?.recommendations?.map((item, index) => (
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Market insights</h2>
                <p className="section-subtitle">Markedene sortert etter profit.</p>
              </div>
              <div className="badge-soft">Markets</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {markets.length === 0 ? (
                <div className="empty-box">Ingen market insights ennå.</div>
              ) : markets.map((market) => (
                <div key={market.market} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{market.settled} settled · {market.picks} picks</div>
                  <div className="metric-pill-value">{market.market}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>
                    Profit {units(market.profit)} · ROI {pct(market.roi)} · Hit rate {pct(market.hitRate)} · EV {pct(market.avgEv)} · Conf {market.avgConfidence.toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Quality mix</h2>
            <p className="section-subtitle">
              Green: {summary?.qualityCounts.green ?? 0} · Yellow: {summary?.qualityCounts.yellow ?? 0} · Red: {summary?.qualityCounts.red ?? 0}
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Tracker summary</h2>
            <p className="section-subtitle">
              Pending: {summary?.pendingCount ?? '–'} · Settled: {summary?.settledCount ?? '–'} · Hit rate: {pct(summary?.hitRate)}
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Sist oppdatert</h2>
            <p className="section-subtitle">{formatDate(data?.updatedAt)}</p>
          </section>

          <section className="warning-box">
            Insights er kun veiledende. Bruk dem til å finne hva som bør testes videre, ikke som fasit for hvilke spill som er lønnsomme.
          </section>
        </aside>
      </section>
    </main>
  );
}
