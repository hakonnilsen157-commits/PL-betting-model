'use client';

import { useEffect, useState } from 'react';

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

function pct(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(value?: string) {
  if (!value) return '–';
  try {
    return new Date(value).toLocaleString('no-NO');
  } catch {
    return value;
  }
}

function units(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}u`;
}

export default function TrackerStatsPage() {
  const [data, setData] = useState<TrackerStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tracker/stats', { cache: 'no-store' });
      const json = (await response.json()) as TrackerStatsResponse;
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke hente tracker stats');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent stats-feil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const summary = data?.summary;
  const qualityCounts = data?.qualityCounts ?? { green: 0, yellow: 0, red: 0 };

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Tracker stats</h1>
            <p className="hero-subtitle">
              En mer datadrevet stats-side som leser trackerhistorikk fra API-et og viser nøkkeltall for backtest, marked og datakvalitet.
            </p>
          </div>
          <button type="button" onClick={loadStats} className="app-nav-link" disabled={loading}>
            {loading ? 'Laster...' : 'Oppdater'}
          </button>
        </div>

        {error ? <div className="warning-box">{error}</div> : null}

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">Pending</div>
            <div className="summary-value">{summary?.pendingCount ?? '–'}</div>
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

        <div className="summary-grid" style={{ marginTop: 16 }}>
          <div className="summary-card">
            <div className="summary-label">Hit rate</div>
            <div className="summary-value">{pct(summary?.hitRate)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Snittodds</div>
            <div className="summary-value">{summary?.avgOdds?.toFixed(2) ?? '–'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Snitt EV pending</div>
            <div className="summary-value green">{pct(summary?.avgEv)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Storage</div>
            <div className="summary-value" style={{ fontSize: 20 }}>{data?.storageMode ?? '–'}</div>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Marked stats</h2>
                <p className="section-subtitle">ROI, treffrate og profit splittet per marked.</p>
              </div>
              <div className="badge-soft">Markets</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {(data?.marketStats ?? []).length === 0 ? (
                <div className="empty-box">Ingen markedstatistikk ennå.</div>
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
                <h2 className="section-title" style={{ marginBottom: 0 }}>Profit trend</h2>
                <p className="section-subtitle">Kumulativ utvikling basert på settled historikk.</p>
              </div>
              <div className="badge-soft">Trend</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {(data?.profitTrend ?? []).length === 0 ? (
                <div className="empty-box">Ingen profit trend ennå.</div>
              ) : data?.profitTrend?.slice(-8).map((row, index) => (
                <div key={`${row.settledAt}-${row.market}-${index}`} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{formatDate(row.settledAt)} · {row.market}</div>
                  <div className="metric-pill-value">{units(row.cumulative)}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>Pick profit {units(row.profit)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Datakvalitet</h2>
            <div className="summary-grid" style={{ gridTemplateColumns: '1fr', marginTop: 14 }}>
              <div className="summary-card">
                <div className="summary-label">Grønn</div>
                <div className="summary-value">{qualityCounts.green ?? 0}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Gul</div>
                <div className="summary-value">{qualityCounts.yellow ?? 0}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Rød</div>
                <div className="summary-value">{qualityCounts.red ?? 0}</div>
              </div>
            </div>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Sist oppdatert</h2>
            <p className="section-subtitle">{formatDate(data?.updatedAt)}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}
