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

type SeedResponse = {
  ok?: boolean;
  inserted?: number;
  error?: string;
};

type ClearResponse = {
  ok?: boolean;
  error?: string;
};

type AutoSettleResponse = {
  ok?: boolean;
  settled?: unknown[];
  pending?: unknown[];
  unsupported?: unknown[];
  message?: string;
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

function sampleStatus(settled?: number) {
  if (!settled) return 'Ingen settled picks ennå';
  if (settled < 25) return 'Tidlig testfase';
  if (settled < 100) return 'Begynnende datagrunnlag';
  return 'Mer robust sample';
}

function modelVerdict(roi?: number, settled?: number) {
  if (!settled) return 'Mangler historikk';
  if (settled < 25) return 'Ikke vurder edge ennå';
  if ((roi ?? 0) > 0.05) return 'Positivt signal';
  if ((roi ?? 0) > 0) return 'Svakt positivt signal';
  return 'Trenger forbedring';
}

export default function TrackerStatsPage() {
  const [data, setData] = useState<TrackerStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [autoSettling, setAutoSettling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  async function seedDemoData() {
    setSeeding(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/tracker/seed-demo', { method: 'POST' });
      const json = (await response.json()) as SeedResponse;
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke legge inn demo-data');
      setMessage(`Demo-data lagt inn: ${json.inserted ?? 0} rader`);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent seed-feil');
    } finally {
      setSeeding(false);
    }
  }

  async function runAutoSettlement() {
    setAutoSettling(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/tracker/auto-settle', { method: 'POST' });
      const json = (await response.json()) as AutoSettleResponse;
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke kjøre auto-settlement');
      setMessage(json.message ?? `Auto-settlement: ${(json.settled ?? []).length} settled · ${(json.pending ?? []).length} pending · ${(json.unsupported ?? []).length} unsupported`);
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent auto-settlement-feil');
    } finally {
      setAutoSettling(false);
    }
  }

  async function clearTrackerHistory() {
    setClearing(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/tracker/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'all' }),
      });
      const json = (await response.json()) as ClearResponse;
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke nullstille trackerhistorikk');
      setMessage('Trackerhistorikk er nullstilt.');
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent reset-feil');
    } finally {
      setClearing(false);
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
          <div className="app-nav-links">
            <button type="button" onClick={loadStats} className="app-nav-link" disabled={loading}>
              {loading ? 'Laster...' : 'Oppdater'}
            </button>
            <button type="button" onClick={seedDemoData} className="app-nav-link" disabled={seeding}>
              {seeding ? 'Legger inn...' : 'Seed demo'}
            </button>
            <button type="button" onClick={runAutoSettlement} className="app-nav-link" disabled={autoSettling}>
              {autoSettling ? 'Kjører...' : 'Auto-settle'}
            </button>
            <button type="button" onClick={clearTrackerHistory} className="app-nav-link" disabled={clearing}>
              {clearing ? 'Nullstiller...' : 'Reset store'}
            </button>
            <a href="/api/tracker/export?format=csv" className="app-nav-link">CSV export</a>
            <a href="/api/tracker/export" className="app-nav-link">JSON export</a>
          </div>
        </div>

        {message ? <div className="info-panel"><p>{message}</p></div> : null}
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
            <div className="summary-label">Sample status</div>
            <div className="summary-value" style={{ fontSize: 20 }}>{sampleStatus(summary?.settledCount)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Model verdict</div>
            <div className="summary-value" style={{ fontSize: 20 }}>{modelVerdict(summary?.roi, summary?.settledCount)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Storage</div>
            <div className="summary-value" style={{ fontSize: 20 }}>{data?.storageMode ?? '–'}</div>
          </div>
        </div>

        <div className="summary-grid" style={{ marginTop: 16 }}>
          <div className="summary-card">
            <div className="summary-label">Snittodds</div>
            <div className="summary-value">{summary?.avgOdds?.toFixed(2) ?? '–'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Snitt EV pending</div>
            <div className="summary-value green">{pct(summary?.avgEv)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Snitt confidence pending</div>
            <div className="summary-value">{summary?.avgConfidence?.toFixed(1) ?? '–'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Sist oppdatert</div>
            <div className="summary-value" style={{ fontSize: 18 }}>{formatDate(data?.updatedAt)}</div>
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

          <section className="warning-box">
            Sample status og model verdict er kun en grov rettesnor. Modellen bør ikke vurderes seriøst før den har mange settled picks per marked.
          </section>
        </aside>
      </section>
    </main>
  );
}
