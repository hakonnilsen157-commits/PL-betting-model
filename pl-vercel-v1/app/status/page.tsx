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

function yesNo(value?: boolean) {
  return value ? 'Ja' : 'Nei';
}

function formatDate(value?: string) {
  if (!value) return '–';
  try {
    return new Date(value).toLocaleString('no-NO');
  } catch {
    return value;
  }
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const [healthResponse, liveStatusResponse] = await Promise.all([
        fetch('/api/health', { cache: 'no-store' }),
        fetch('/api/live-status', { cache: 'no-store' }),
      ]);

      const [healthJson, liveStatusJson] = await Promise.all([
        healthResponse.json(),
        liveStatusResponse.json(),
      ]);

      setHealth(healthJson);
      setLiveStatus(liveStatusJson);
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

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Systemstatus</h1>
            <p className="hero-subtitle">
              En enkel teknisk status-side som viser om appen svarer, hvilket datamodus den kjører i, og om live API-nøkler er konfigurert.
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
            <div className="summary-label">Sist sjekket</div>
            <div className="summary-value" style={{ fontSize: 18 }}>{formatDate(health?.timestamp)}</div>
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
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Premier League</h2>
            <p className="section-subtitle">
              League ID: {liveStatus?.apiFootballLeagueId ?? '–'} · Sesong: {liveStatus?.apiFootballSeason ?? '–'}
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Tolkning</h2>
            <p className="section-subtitle">
              Hvis API-nøkler mangler, kan appen fortsatt fungere med mock eller fallback-data. Det er nyttig for utvikling, men bør merkes tydelig når modellen vurderes.
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}
