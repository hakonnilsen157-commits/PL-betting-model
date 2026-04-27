'use client';

import { useEffect, useMemo, useState } from 'react';

type SettledPick = {
  fixtureId: string;
  match: string;
  market: string;
  odds: number;
  confidence: number;
  expectedValue: number;
  kickoff: string;
  savedAt: string;
  snapshotId: string;
  status: 'settled';
  homeGoals: number;
  awayGoals: number;
  won: boolean;
  profit: number;
  settledAt: string;
  dataQuality?: 'green' | 'yellow' | 'red';
  source?: string;
};

type HistoryResponse = {
  ok?: boolean;
  storageMode?: string;
  open?: unknown[];
  settled?: SettledPick[];
  updatedAt?: string;
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
    return new Date(value).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatDateTime(value?: string) {
  if (!value) return '–';
  try {
    return new Date(value).toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function resultText(row: SettledPick) {
  return `${row.homeGoals}-${row.awayGoals}`;
}

function statusText(row: SettledPick) {
  return row.won ? 'Won' : 'Lost';
}

function statusStyle(row: SettledPick) {
  return {
    color: row.won ? '#1b7f4c' : '#9d2f2f',
    fontWeight: 800,
  };
}

export default function SettledPicksPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tracker/history', { cache: 'no-store' });
      const json = (await response.json()) as HistoryResponse;
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke hente settled picks');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent feil ved lasting av settled picks');
    } finally {
      setLoading(false);
    }
  }

  async function seedDemoData() {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/tracker/seed-demo', { method: 'POST' });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke legge inn demo-data');
      setMessage(`La inn ${json.inserted ?? 0} demo-picks i settled history.`);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent feil ved demo-data');
    }
  }

  async function clearSettled() {
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/tracker/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'settled' }),
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke nullstille settled picks');
      setMessage('Settled picks er nullstilt.');
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent feil ved nullstilling');
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const settledRows = useMemo(() => {
    return [...(data?.settled ?? [])].sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
  }, [data]);

  const summary = useMemo(() => {
    const total = settledRows.length;
    const wins = settledRows.filter((row) => row.won).length;
    const losses = total - wins;
    const profit = settledRows.reduce((sum, row) => sum + row.profit, 0);
    const roi = total > 0 ? profit / total : 0;
    const hitRate = total > 0 ? wins / total : 0;
    return { total, wins, losses, profit, roi, hitRate };
  }, [settledRows]);

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Settled picks</h1>
            <p className="hero-subtitle">
              Oversikt over modellens forslag som er ferdigspilt og evaluert med resultat, status og profit.
            </p>
          </div>

          <div className="app-nav-links">
            <button type="button" onClick={loadHistory} className="app-nav-link" disabled={loading}>
              {loading ? 'Laster...' : 'Oppdater'}
            </button>
            <button type="button" onClick={seedDemoData} className="app-nav-link">
              Seed demo
            </button>
            <button type="button" onClick={clearSettled} className="app-nav-link">
              Tøm settled
            </button>
          </div>
        </div>

        {message ? <div className="info-panel" style={{ marginTop: 18 }}><p>{message}</p></div> : null}
        {error ? <div className="warning-box" style={{ marginTop: 18 }}>{error}</div> : null}

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card">
            <div className="summary-label">Settled picks</div>
            <div className="summary-value">{summary.total}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Won / Lost</div>
            <div className="summary-value">{summary.wins}/{summary.losses}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Treffrate</div>
            <div className="summary-value">{pct(summary.hitRate)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Profit / ROI</div>
            <div className="summary-value green">{units(summary.profit)} · {pct(summary.roi)}</div>
          </div>
        </div>

        <div className="info-panel" style={{ marginTop: 18 }}>
          <h3>Hva vises her?</h3>
          <p>
            Dette er pick history for ferdigspilte kamper. Når et åpent pick blir avgjort, flyttes det fra pending/open til settled og får status som won eller lost basert på sluttresultatet.
          </p>
          <p className="section-subtitle">
            Lagring: {data?.storageMode ?? '–'} · Sist oppdatert: {formatDateTime(data?.updatedAt)}
          </p>
        </div>
      </section>

      <section className="list-card">
        <div className="list-card-header">
          <div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Pick history</h2>
            <p className="section-subtitle">Dato, kamp, pick, odds, resultat, status og profit.</p>
          </div>
          <div className="badge-soft">{settledRows.length} rader</div>
        </div>

        {loading ? (
          <div className="empty-box">Laster settled picks...</div>
        ) : settledRows.length === 0 ? (
          <div className="empty-box">
            Ingen settled picks ennå. Trykk “Seed demo” for å legge inn eksempelrader, eller kjør auto-settle fra Tracker stats når du har åpne picks.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
              <thead>
                <tr>
                  {['Dato', 'Kamp', 'Pick', 'Odds', 'Resultat', 'Status', 'Profit', 'EV', 'Confidence'].map((header) => (
                    <th
                      key={header}
                      style={{
                        textAlign: 'left',
                        padding: '12px 10px',
                        borderBottom: '1px solid rgba(20, 83, 45, 0.16)',
                        fontSize: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#5f6f65',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settledRows.map((row) => (
                  <tr key={`${row.fixtureId}-${row.market}`}>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)', whiteSpace: 'nowrap' }}>{formatDate(row.kickoff)}</td>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)', fontWeight: 750 }}>{row.match}</td>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)' }}>{row.market}</td>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)' }}>{row.odds.toFixed(2)}</td>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)' }}>{resultText(row)}</td>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)' }}><span style={statusStyle(row)}>{statusText(row)}</span></td>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)', fontWeight: 800 }}>{units(row.profit)}</td>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)' }}>{pct(row.expectedValue)}</td>
                    <td style={{ padding: '14px 10px', borderBottom: '1px solid rgba(20, 83, 45, 0.10)' }}>{row.confidence.toFixed(0)}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
