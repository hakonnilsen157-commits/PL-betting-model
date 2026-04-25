'use client';

import { useEffect, useState } from 'react';

type DiagnosticsResponse = {
  ok?: boolean;
  storageMode?: string;
  updatedAt?: string;
  readinessScore?: number;
  readinessBand?: 'green' | 'yellow' | 'red';
  summary?: {
    openRows: number;
    settledRows: number;
    totalRows: number;
    avgQualityScore: number;
    profit: number;
    roi: number;
    hitRate: number;
  };
  readinessChecks?: Array<{
    name: string;
    ok: boolean;
    detail: string;
  }>;
  issues?: string[];
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

function bandLabel(value?: string) {
  if (value === 'green') return 'Klar';
  if (value === 'yellow') return 'Delvis klar';
  if (value === 'red') return 'Ikke klar';
  return 'Ukjent';
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDiagnostics() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tracker/diagnostics', { cache: 'no-store' });
      const json = (await response.json()) as DiagnosticsResponse;
      if (!response.ok || !json.ok) throw new Error(json.error ?? 'Kunne ikke hente diagnostics');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent diagnostics-feil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const summary = data?.summary;
  const checks = data?.readinessChecks ?? [];
  const issues = data?.issues ?? [];

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Diagnostics</h1>
            <p className="hero-subtitle">
              En samlet readiness-sjekk for tracker-oppsettet før historikken brukes seriøst i modellvurdering og backtest.
            </p>
          </div>
          <button type="button" onClick={loadDiagnostics} className="app-nav-link" disabled={loading}>
            {loading ? 'Sjekker...' : 'Oppdater'}
          </button>
        </div>

        {error ? <div className="warning-box">{error}</div> : null}

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">Readiness</div>
            <div className="summary-value green">{data?.readinessScore ?? '–'}%</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>{bandLabel(data?.readinessBand)}</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Storage</div>
            <div className="summary-value" style={{ fontSize: 20 }}>{data?.storageMode ?? '–'}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Sist oppdatert {formatDate(data?.updatedAt)}</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total rows</div>
            <div className="summary-value">{summary?.totalRows ?? '–'}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Open {summary?.openRows ?? 0} · Settled {summary?.settledRows ?? 0}</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Quality score</div>
            <div className="summary-value">{summary?.avgQualityScore ?? '–'}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Snittscore på tracker-radene.</p>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Readiness checks</h2>
                <p className="section-subtitle">Kontroller som må være grønne før modellen brukes seriøst.</p>
              </div>
              <div className="badge-soft">Checks</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {checks.length === 0 ? <div className="empty-box">Ingen diagnostics checks ennå.</div> : checks.map((check) => (
                <div key={check.name} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{check.ok ? 'OK' : 'Må sjekkes'}</div>
                  <div className="metric-pill-value">{check.name}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{check.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Issues</h2>
                <p className="section-subtitle">Punkter som bør løses før seriøs modellvurdering.</p>
              </div>
              <div className="badge-soft">Issues</div>
            </div>

            <div className="reason-list">
              {issues.length === 0 ? (
                <div className="empty-box">Ingen issues funnet.</div>
              ) : issues.map((issue, index) => (
                <div key={issue} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{issue}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Performance summary</h2>
            <p className="section-subtitle">
              Profit: {units(summary?.profit)} · ROI: {pct(summary?.roi)} · Hit rate: {pct(summary?.hitRate)}
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Hva brukes dette til?</h2>
            <p className="section-subtitle">
              Diagnostics gir en rask vurdering av om tracker-oppsettet er klart for mer seriøs testing, eller om det fortsatt mangler storage, historikk eller datakvalitet.
            </p>
          </section>

          <section className="warning-box">
            Readiness score er ikke et bevis på at modellen er lønnsom. Den sier bare hvor klart datagrunnlaget og tracker-oppsettet er for videre testing.
          </section>
        </aside>
      </section>
    </main>
  );
}
