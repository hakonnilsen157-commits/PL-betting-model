'use client';

import { useEffect, useState } from 'react';

type LiveStatusResponse = {
  ok?: boolean;
  checkedAt?: string;
  mode?: string;
  env?: {
    DATA_MODE?: string;
    ODDS_SPORT_KEY?: string;
    ODDS_REGIONS?: string;
    FOOTBALL_DATA_COMPETITION?: string;
    hasFootballDataKey?: boolean;
    hasOddsApiKey?: boolean;
  };
  checks?: Array<{
    name: string;
    ok: boolean;
    detail: string;
    status?: number;
  }>;
  error?: string;
};

function formatDate(value?: string) {
  if (!value) return '–';
  try {
    return new Date(value).toLocaleString('no-NO');
  } catch {
    return value;
  }
}

function modeLabel(mode?: string) {
  if (mode === 'live') return 'Live';
  if (mode === 'partial-live') return 'Partial live';
  if (mode === 'live-error') return 'Live error';
  if (mode === 'mock') return 'Mock';
  return mode ?? '–';
}

export default function LiveStatusPage() {
  const [data, setData] = useState<LiveStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/live-status', { cache: 'no-store' });
      const json = (await response.json()) as LiveStatusResponse;
      if (!response.ok || !json.ok) throw new Error(json.error ?? 'Kunne ikke hente live-status');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent live-status-feil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  const checks = data?.checks ?? [];
  const allOk = checks.length > 0 && checks.every((check) => check.ok) && data?.env?.DATA_MODE === 'live';

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Live status</h1>
            <p className="hero-subtitle">
              Kontrollerer om appen faktisk får inn ekte kamper og ekte bookmaker-odds akkurat nå.
            </p>
          </div>
          <button type="button" onClick={loadStatus} className="app-nav-link" disabled={loading}>
            {loading ? 'Sjekker...' : 'Oppdater'}
          </button>
        </div>

        {error ? <div className="warning-box" style={{ marginTop: 18 }}>{error}</div> : null}

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">Status</div>
            <div className="summary-value green">{modeLabel(data?.mode)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">DATA_MODE</div>
            <div className="summary-value">{data?.env?.DATA_MODE ?? '–'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Odds API key</div>
            <div className="summary-value">{data?.env?.hasOddsApiKey ? 'Ja' : 'Nei'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Football data key</div>
            <div className="summary-value">{data?.env?.hasFootballDataKey ? 'Ja' : 'Nei'}</div>
          </div>
        </div>

        <div className="info-panel" style={{ marginTop: 18 }}>
          <h3>{allOk ? 'Alt ser live-klart ut' : 'Live-status må sjekkes'}</h3>
          <p>
            For full live-modus må DATA_MODE være live, football-data.org må fungere, og The Odds API må returnere odds-events.
          </p>
          <p className="section-subtitle">
            Sist sjekket: {formatDate(data?.checkedAt)} · Sport key: {data?.env?.ODDS_SPORT_KEY ?? '–'} · Regions: {data?.env?.ODDS_REGIONS ?? '–'} · Competition: {data?.env?.FOOTBALL_DATA_COMPETITION ?? '–'}
          </p>
        </div>
      </section>

      <section className="list-card">
        <div className="list-card-header">
          <div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Live checks</h2>
            <p className="section-subtitle">Her ser du nøyaktig hvilken kilde som eventuelt feiler.</p>
          </div>
          <div className="badge-soft">{checks.length} checks</div>
        </div>

        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {checks.length === 0 ? (
            <div className="empty-box">Ingen checks lastet ennå.</div>
          ) : checks.map((check) => (
            <div key={check.name} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">{check.ok ? 'OK' : 'Feil'}{check.status ? ` · HTTP ${check.status}` : ''}</div>
              <div className="metric-pill-value">{check.name}</div>
              <p className="section-subtitle" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{check.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
