'use client';

import { useEffect, useMemo, useState } from 'react';

type Recommendation = {
  fixtureId: string;
  match: string;
  kickoff: string;
  market: string;
  bookmakerOdds: number;
  expectedValue: number;
  confidence: number;
};

type FixturesResponse = {
  recommendations?: Recommendation[];
  generatedAt?: string;
  source?: string;
};

type TrackerOpenRow = {
  fixtureId: string;
  match: string;
  market: string;
  odds: number;
  confidence: number;
  expectedValue: number;
  kickoff: string;
  savedAt: string;
  snapshotId: string;
  dataQuality?: 'green' | 'yellow' | 'red';
  source?: string;
};

type TrackerSettledRow = TrackerOpenRow & {
  status: 'settled';
  homeGoals: number;
  awayGoals: number;
  won: boolean;
  profit: number;
  settledAt: string;
};

type TrackerHistoryResponse = {
  ok?: boolean;
  storageMode?: string;
  updatedAt?: string;
  open?: TrackerOpenRow[];
  settled?: TrackerSettledRow[];
  error?: string;
};

type ActionResponse = TrackerHistoryResponse & {
  inserted?: number;
  message?: string;
  settled?: TrackerSettledRow[];
  pending?: unknown[];
  unsupported?: unknown[];
};

const marketLabels: Record<string, string> = {
  home: 'Hjemmeseier',
  draw: 'Uavgjort',
  away: 'Borteseier',
  over2_5: 'Over 2.5',
  under2_5: 'Under 2.5',
  btts_yes: 'Begge lag scorer',
  btts_no: 'Begge lag scorer ikke',
};

function marketLabel(market: string) {
  return marketLabels[market] ?? market;
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
    return new Date(value).toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function dataQualityFromSource(source?: string): TrackerOpenRow['dataQuality'] {
  if (source === 'live') return 'green';
  if (source === 'partial-live') return 'yellow';
  return 'red';
}

function qualityLabel(value?: string) {
  if (value === 'green') return 'Grønn';
  if (value === 'yellow') return 'Gul';
  if (value === 'red') return 'Rød';
  return 'Ukjent';
}

function buildRowsFromRecommendations(fixtures: FixturesResponse | null): TrackerOpenRow[] {
  const source = fixtures?.source ?? 'unknown';
  const quality = dataQualityFromSource(source);
  return (fixtures?.recommendations ?? []).slice(0, 8).map((rec) => ({
    fixtureId: rec.fixtureId,
    match: rec.match,
    market: marketLabel(rec.market),
    odds: rec.bookmakerOdds,
    confidence: rec.confidence,
    expectedValue: rec.expectedValue,
    kickoff: rec.kickoff,
    savedAt: new Date().toISOString(),
    snapshotId: fixtures?.generatedAt ?? new Date().toISOString(),
    dataQuality: quality,
    source,
  }));
}

export default function V2TrackerServerSyncPanel() {
  const [fixtures, setFixtures] = useState<FixturesResponse | null>(null);
  const [history, setHistory] = useState<TrackerHistoryResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [qualityFilter, setQualityFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const [fixturesResponse, historyResponse] = await Promise.all([
        fetch('/api/fixtures', { cache: 'no-store' }),
        fetch('/api/tracker/history', { cache: 'no-store' }),
      ]);

      const [fixturesJson, historyJson] = await Promise.all([
        fixturesResponse.json(),
        historyResponse.json(),
      ]);

      if (!fixturesResponse.ok) throw new Error(fixturesJson?.error ?? 'Kunne ikke hente fixtures');
      if (!historyResponse.ok || !historyJson.ok) throw new Error(historyJson?.error ?? 'Kunne ikke hente trackerhistorikk');

      setFixtures(fixturesJson);
      setHistory(historyJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukjent tracker-feil');
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: string, request: () => Promise<Response>, success: (json: ActionResponse) => string) {
    setActionLoading(action);
    setError(null);
    setStatus(null);

    try {
      const response = await request();
      const json = (await response.json()) as ActionResponse;
      if (!response.ok || !json.ok) throw new Error(json.error ?? `${action} feilet`);
      setStatus(success(json));
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Ukjent feil ved ${action}`);
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const snapshotRows = useMemo(() => buildRowsFromRecommendations(fixtures), [fixtures]);
  const openRows = history?.open ?? [];
  const settledRows = history?.settled ?? [];

  const summary = useMemo(() => {
    const profit = settledRows.reduce((sum, row) => sum + (row.profit ?? 0), 0);
    const wins = settledRows.filter((row) => row.won).length;
    return {
      pending: openRows.length,
      settled: settledRows.length,
      profit,
      roi: settledRows.length ? profit / settledRows.length : 0,
      hitRate: settledRows.length ? wins / settledRows.length : 0,
      snapshotRows: snapshotRows.length,
    };
  }, [openRows, settledRows, snapshotRows]);

  const filteredOpen = useMemo(() => openRows.filter((row) => {
    if (statusFilter === 'settled') return false;
    if (qualityFilter !== 'all' && row.dataQuality !== qualityFilter) return false;
    return true;
  }), [openRows, qualityFilter, statusFilter]);

  const filteredSettled = useMemo(() => settledRows.filter((row) => {
    if (statusFilter === 'pending') return false;
    if (qualityFilter !== 'all' && row.dataQuality !== qualityFilter) return false;
    return true;
  }), [settledRows, qualityFilter, statusFilter]);

  return (
    <section className="hero-card">
      <div className="hero-topline">
        <div>
          <div className="eyebrow">Premier League Betting Model</div>
          <h1 className="hero-title">V2 Tracker</h1>
          <p className="hero-subtitle">
            Server-synket tracker som skriver anbefalinger til /api/tracker/history og leser pending/settled historikk fra tracker-store.
          </p>
        </div>
        <div className="updated-at">Storage: {history?.storageMode ?? 'laster...'} · Source: {fixtures?.source ?? '–'}</div>
      </div>

      {error ? <div className="warning-box">{error}</div> : null}
      {status ? <div className="info-panel"><p>{status}</p></div> : null}

      <div className="summary-grid" style={{ marginTop: 20 }}>
        <div className="summary-card"><div className="summary-label">Snapshot rows</div><div className="summary-value">{summary.snapshotRows}</div></div>
        <div className="summary-card"><div className="summary-label">Pending</div><div className="summary-value">{summary.pending}</div></div>
        <div className="summary-card"><div className="summary-label">Settled</div><div className="summary-value">{summary.settled}</div></div>
        <div className="summary-card"><div className="summary-label">Profit</div><div className="summary-value green">{units(summary.profit)}</div></div>
      </div>

      <div className="summary-grid" style={{ marginTop: 16 }}>
        <div className="summary-card"><div className="summary-label">ROI</div><div className="summary-value green">{pct(summary.roi)}</div></div>
        <div className="summary-card"><div className="summary-label">Hit rate</div><div className="summary-value">{pct(summary.hitRate)}</div></div>
        <div className="summary-card"><div className="summary-label">Datakvalitet snapshot</div><div className="summary-value" style={{ fontSize: 20 }}>{qualityLabel(dataQualityFromSource(fixtures?.source))}</div></div>
        <div className="summary-card"><div className="summary-label">Updated</div><div className="summary-value" style={{ fontSize: 18 }}>{formatDate(history?.updatedAt)}</div></div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Handlinger</h3>
        <div className="filters-grid">
          <div>
            <label className="field-label">Status</label>
            <select className="select-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">Alle</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
            </select>
          </div>
          <div>
            <label className="field-label">Datakvalitet</label>
            <select className="select-input" value={qualityFilter} onChange={(event) => setQualityFilter(event.target.value as typeof qualityFilter)}>
              <option value="all">Alle</option>
              <option value="green">Grønn</option>
              <option value="yellow">Gul</option>
              <option value="red">Rød</option>
            </select>
          </div>
        </div>

        <div className="app-nav-links" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
          <button type="button" className="app-nav-link" disabled={loading || actionLoading === 'save' || snapshotRows.length === 0} onClick={() => runAction(
            'save',
            () => fetch('/api/tracker/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ open: snapshotRows }),
            }),
            (json) => `Lagret snapshot til tracker-store. Pending: ${json.open?.length ?? 0}`,
          )}>
            {actionLoading === 'save' ? 'Lagrer...' : 'Save snapshot'}
          </button>
          <button type="button" className="app-nav-link" disabled={actionLoading === 'auto'} onClick={() => runAction(
            'auto',
            () => fetch('/api/tracker/auto-settle', { method: 'POST' }),
            (json) => json.message ?? `Auto-settle: ${json.settled?.length ?? 0} settled`,
          )}>
            {actionLoading === 'auto' ? 'Kjører...' : 'Auto-settle'}
          </button>
          <button type="button" className="app-nav-link" disabled={actionLoading === 'seed'} onClick={() => runAction(
            'seed',
            () => fetch('/api/tracker/seed-demo', { method: 'POST' }),
            (json) => `Seed demo lagt inn: ${json.inserted ?? 0} rader`,
          )}>
            {actionLoading === 'seed' ? 'Seeder...' : 'Seed demo'}
          </button>
          <button type="button" className="app-nav-link" disabled={actionLoading === 'reset'} onClick={() => runAction(
            'reset',
            () => fetch('/api/tracker/history', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ kind: 'all' }),
            }),
            () => 'Tracker-store er nullstilt.',
          )}>
            {actionLoading === 'reset' ? 'Nullstiller...' : 'Reset'}
          </button>
          <button type="button" className="app-nav-link" disabled={loading} onClick={loadAll}>Refresh</button>
          <a href="/api/tracker/export?format=csv" className="app-nav-link">CSV</a>
          <a href="/api/tracker/export" className="app-nav-link">JSON</a>
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Snapshot fra dashboard</h3>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {snapshotRows.length === 0 ? <div className="empty-box">Ingen anbefalinger i snapshot.</div> : snapshotRows.map((row) => (
            <div key={`${row.fixtureId}-${row.market}-snapshot`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">Snapshot · {qualityLabel(row.dataQuality)}</div>
              <div className="metric-pill-value">{row.match}</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>{row.market} · Odds {row.odds.toFixed(2)} · EV {pct(row.expectedValue)} · Confidence {row.confidence.toFixed(0)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Pending</h3>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {filteredOpen.length === 0 ? <div className="empty-box">Ingen pending rows innenfor filtrene.</div> : filteredOpen.slice(0, 12).map((row) => (
            <div key={`${row.fixtureId}-${row.market}-open`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">Pending · {qualityLabel(row.dataQuality)}</div>
              <div className="metric-pill-value">{row.match}</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>{row.market} · Kickoff {formatDate(row.kickoff)} · Odds {row.odds?.toFixed?.(2) ?? '–'} · EV {pct(row.expectedValue)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Settled</h3>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {filteredSettled.length === 0 ? <div className="empty-box">Ingen settled rows innenfor filtrene.</div> : filteredSettled.slice(0, 12).map((row) => (
            <div key={`${row.fixtureId}-${row.market}-settled`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">{row.won ? 'Win' : 'Loss'} · {qualityLabel(row.dataQuality)}</div>
              <div className="metric-pill-value">{row.match}</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>{row.market} · Resultat {row.homeGoals}-{row.awayGoals} · Profit {units(row.profit)} · Settled {formatDate(row.settledAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
