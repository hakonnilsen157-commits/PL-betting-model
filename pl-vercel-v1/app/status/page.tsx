'use client';

import { useEffect, useMemo, useState } from 'react';

type HealthResponse = {
  ok?: boolean;
  timestamp?: string;
  dataMode?: string;
};

type LiveStatusResponse = {
  dataMode?: string;
  hasOddsApiKey?: boolean;
  hasApiFootballKey?: boolean;
  oddsSportKey?: string;
  oddsRegions?: string;
  apiFootballLeagueId?: string;
  apiFootballSeason?: string;
};

type TrackerStatsResponse = {
  ok?: boolean;
  storageMode?: string;
  updatedAt?: string;
  summary?: {
    pendingCount: number;
    settledCount: number;
    profit: number;
    roi: number;
    hitRate: number;
  };
};

type EndpointStatus = {
  name: string;
  path: string;
  ok: boolean;
  status: number;
};

function yesNo(value?: boolean) {
  return value ? 'Ja' : 'Nei';
}

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

async function probeEndpoint(name: string, path: string): Promise<EndpointStatus> {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    return { name, path, ok: response.ok, status: response.status };
  } catch {
    return { name, path, ok: false, status: 0 };
  }
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatusResponse | null>(null);
  const [trackerStats, setTrackerStats] = useState<TrackerStatsResponse | null>(null);
  const [endpointStatuses, setEndpointStatuses] = useState<EndpointStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const [healthResponse, liveStatusResponse, trackerStatsResponse, probes] = await Promise.all([
        fetch('/api/health', { cache: 'no-store' }),
        fetch('/api/live-status', { cache: 'no-store' }),
        fetch('/api/tracker/stats', { cache: 'no-store' }),
        Promise.all([
          probeEndpoint('Fixtures', '/api/fixtures'),
          probeEndpoint('Tracker history', '/api/tracker/history'),
          probeEndpoint('Tracker stats', '/api/tracker/stats'),
          probeEndpoint('Tracker export', '/api/tracker/export'),
          probeEndpoint('Seed demo preview', '/api/tracker/seed-demo'),
        ]),
      ]);

      const [healthJson, liveStatusJson, trackerStatsJson] = await Promise.all([
        healthResponse.json(),
        liveStatusResponse.json(),
        trackerStatsResponse.json(),
      ]);

      setHealth(healthJson);
      setLiveStatus(liveStatusJson);
      setTrackerStats(trackerStatsJson);
      setEndpointStatuses(probes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent statusfeil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const dataQuality = useMemo(() => {
    if (!liveStatus) return 'Ukjent';
    if (liveStatus.hasOddsApiKey && liveStatus.hasApiFootballKey) return 'Live data klar';
    if (liveStatus.hasApiFootballKey) return 'Delvis live';
    return 'Mock/fallback';
  }, [liveStatus]);

  const endpointOkCount = endpointStatuses.filter((item) => item.ok).length;

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Systemstatus</h1>
            <p className="hero-subtitle">
              En teknisk status-side som viser app health, datamodus, tracker-store, API-ruter og om live API-nøkler er konfigurert.
            </p>
          </div>
          <button type="button" onClick={loadStatus} className="app-nav-link" disabled={loading}>
            {loading ? 'Sjekker...' : 'Oppdater status'}
          </button>
        </div>

        {error ? (
          <div className="warning-box">Kunne ikke hente status: {error}</div>
        ) : null}

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">App health</div>
            <div className="summary-value green">{health?.ok ? 'OK' : loading ? '...' : 'Feil'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Datamodus</div>
            <div className="summary-value">{liveStatus?.dataMode ?? health?.dataMode ?? '–'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Datakvalitet</div>
            <div className="summary-value">{dataQuality}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">API probes</div>
            <div className="summary-value">{endpointStatuses.length ? `${endpointOkCount}/${endpointStatuses.length}` : '–'}</div>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Live data</h2>
                <p className="section-subtitle">Status for eksterne datakilder og miljøvariabler.</p>
              </div>
              <div className="badge-soft">API</div>
            </div>

            <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="summary-card">
                <div className="summary-label">Odds API key</div>
                <div className="summary-value">{yesNo(liveStatus?.hasOddsApiKey)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">API-Football key</div>
                <div className="summary-value">{yesNo(liveStatus?.hasApiFootballKey)}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Sport key</div>
                <div className="summary-value" style={{ fontSize: 20 }}>{liveStatus?.oddsSportKey ?? '–'}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Odds regioner</div>
                <div className="summary-value" style={{ fontSize: 20 }}>{liveStatus?.oddsRegions ?? '–'}</div>
              </div>
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Endpoint probes</h2>
                <p className="section-subtitle">Rask sjekk av interne API-ruter.</p>
              </div>
              <div className="badge-soft">Routes</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {endpointStatuses.length === 0 ? <div className="empty-box">Ingen probes lastet ennå.</div> : endpointStatuses.map((item) => (
                <div key={item.path} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{item.ok ? 'OK' : 'Feil'} · HTTP {item.status || '–'}</div>
                  <div className="metric-pill-value">{item.name}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{item.path}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Tracker store</h2>
            <p className="section-subtitle">
              Storage: {trackerStats?.storageMode ?? '–'} · Pending: {trackerStats?.summary?.pendingCount ?? '–'} · Settled: {trackerStats?.summary?.settledCount ?? '–'}
            </p>
            <p className="section-subtitle">
              Profit: {units(trackerStats?.summary?.profit)} · ROI: {pct(trackerStats?.summary?.roi)} · Hit rate: {pct(trackerStats?.summary?.hitRate)}
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Premier League</h2>
            <p className="section-subtitle">
              League ID: {liveStatus?.apiFootballLeagueId ?? '–'} · Sesong: {liveStatus?.apiFootballSeason ?? '–'}
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Sist sjekket</h2>
            <p className="section-subtitle">{formatDate(health?.timestamp)}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}
