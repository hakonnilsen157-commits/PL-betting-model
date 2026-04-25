'use client';

import { useEffect, useState } from 'react';

type QualityResponse = {
  ok?: boolean;
  storageMode?: string;
  updatedAt?: string;
  summary?: {
    totalRows: number;
    pendingRows: number;
    settledRows: number;
    avgScore: number;
    issueCounts: Record<string, number>;
    greenRows: number;
    yellowRows: number;
    redRows: number;
  };
  rows?: Array<{
    status: 'pending' | 'settled';
    fixtureId?: string;
    match?: string;
    market?: string;
    quality: 'green' | 'yellow' | 'red';
    score: number;
    issues: string[];
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

function qualityLabel(value?: string) {
  if (value === 'green') return 'Grønn';
  if (value === 'yellow') return 'Gul';
  if (value === 'red') return 'Rød';
  return 'Ukjent';
}

function scoreVerdict(score?: number) {
  if (typeof score !== 'number') return 'Ingen data';
  if (score >= 80) return 'Sterk datakvalitet';
  if (score >= 60) return 'Brukbar, men bør følges';
  if (score >= 40) return 'Svak datakvalitet';
  return 'Bør undersøkes';
}

export default function QualityPage() {
  const [data, setData] = useState<QualityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadQuality() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tracker/quality', { cache: 'no-store' });
      const json = (await response.json()) as QualityResponse;
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke hente quality-data');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent quality-feil');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuality();
  }, []);

  const summary = data?.summary;
  const issueEntries = Object.entries(summary?.issueCounts ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Quality</h1>
            <p className="hero-subtitle">
              En egen side for datakvalitet i tracker-store. Den hjelper oss å finne svake rader før vi stoler på backtest og modellstatistikk.
            </p>
          </div>
          <button type="button" onClick={loadQuality} className="app-nav-link" disabled={loading}>
            {loading ? 'Laster...' : 'Oppdater'}
          </button>
        </div>

        {error ? <div className="warning-box">{error}</div> : null}

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">Quality score</div>
            <div className="summary-value green">{summary?.avgScore ?? '–'}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>{scoreVerdict(summary?.avgScore)}</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Rows</div>
            <div className="summary-value">{summary?.totalRows ?? '–'}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Pending {summary?.pendingRows ?? 0} · Settled {summary?.settledRows ?? 0}</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Storage</div>
            <div className="summary-value" style={{ fontSize: 20 }}>{data?.storageMode ?? '–'}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Sist oppdatert {formatDate(data?.updatedAt)}</p>
          </div>
          <div className="summary-card">
            <div className="summary-label">Issues</div>
            <div className="summary-value">{issueEntries.reduce((sum, [, count]) => sum + count, 0)}</div>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Antall registrerte quality-flagg.</p>
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Svakeste rader</h2>
                <p className="section-subtitle">Rader sortert fra lavest quality score til høyest.</p>
              </div>
              <div className="badge-soft">Rows</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {(data?.rows ?? []).length === 0 ? (
                <div className="empty-box">Ingen quality-rader ennå.</div>
              ) : data?.rows?.slice(0, 12).map((row, index) => (
                <div key={`${row.fixtureId}-${row.market}-${index}`} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">{row.status} · {qualityLabel(row.quality)} · Score {row.score}</div>
                  <div className="metric-pill-value">{row.match ?? row.fixtureId ?? 'Ukjent kamp'}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>
                    {row.market ?? 'Ukjent marked'} · {row.issues.length ? row.issues.join(', ') : 'Ingen issues'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Quality mix</h2>
            <div className="summary-grid" style={{ gridTemplateColumns: '1fr', marginTop: 14 }}>
              <div className="summary-card">
                <div className="summary-label">Grønn</div>
                <div className="summary-value">{summary?.greenRows ?? 0}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Gul</div>
                <div className="summary-value">{summary?.yellowRows ?? 0}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Rød</div>
                <div className="summary-value">{summary?.redRows ?? 0}</div>
              </div>
            </div>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Issue counts</h2>
            <div className="reason-list">
              {issueEntries.length === 0 ? (
                <div className="empty-box">Ingen issues registrert.</div>
              ) : issueEntries.map(([issue, count], index) => (
                <div key={issue} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{issue}: {count}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
