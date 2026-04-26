'use client';

import { useEffect, useMemo, useState } from 'react';

type Probe = { label: string; path: string; ok: boolean; status: number; detail: string };
type Log = { at: string; title: string; detail: string };
type Summary = {
  storageMode?: string;
  openRows?: number;
  settledRows?: number;
  readiness?: number;
  issues?: number;
  recommendations?: number;
  profit?: number;
  roi?: number;
};

const endpoints = [
  ['Health', '/api/health'],
  ['Storage', '/api/tracker/storage-status'],
  ['Snapshot', '/api/tracker/snapshot'],
  ['History', '/api/tracker/history'],
  ['Stats', '/api/tracker/stats'],
  ['Quality', '/api/tracker/quality'],
  ['Insights', '/api/tracker/insights'],
  ['Diagnostics', '/api/tracker/diagnostics'],
  ['Export', '/api/tracker/export'],
] as const;

const testFlow = [
  { label: 'Oppdater alt', hint: 'Kjør API-sjekk og oppdater sammendrag.', action: 'refresh' },
  { label: 'Save snapshot', hint: 'Lagre dagens anbefalinger i tracker-store.', action: 'snapshot' },
  { label: 'Seed demo', hint: 'Legg inn testdata for Stats/Quality/Insights.', action: 'seed' },
  { label: 'Auto-settle', hint: 'Test settlement-flyten.', action: 'settle' },
  { label: 'Sjekk Stats/Quality/Insights', hint: 'Åpne analysesidene etter at data er lagret.', href: '/tracker-stats' },
  { label: 'Eksporter CSV/JSON', hint: 'Last ned trackerhistorikk.', href: '/api/tracker/export?format=csv' },
] as const;

function timeNow() {
  return new Date().toLocaleString('no-NO');
}

function percent(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${(value * 100).toFixed(1)}%`;
}

function units(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}u`;
}

function detail(json: unknown) {
  if (!json || typeof json !== 'object') return 'Svar mottatt';
  const obj = json as Record<string, unknown>;
  if (typeof obj.error === 'string') return obj.error;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.storageMode === 'string') return `storageMode: ${obj.storageMode}`;
  if (typeof obj.inserted === 'number') return `inserted: ${obj.inserted}`;
  if (typeof obj.ok === 'boolean') return obj.ok ? 'ok: true' : 'ok: false';
  return 'Svar mottatt';
}

async function fetchWithTimeout(path: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(path, {
      ...init,
      cache: init?.cache ?? 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function jsonOrNull(res: Response) {
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;
  return res.json().catch(() => null);
}

export default function TestLabPage() {
  const [probes, setProbes] = useState<Probe[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  function addLog(title: string, logDetail: string) {
    setLogs((items) => [{ at: timeNow(), title, detail: logDetail }, ...items].slice(0, 10));
  }

  async function refresh() {
    setBusy(true);
    const started = timeNow();
    try {
      const next = await Promise.all(endpoints.map(async ([label, path]) => {
        try {
          const res = await fetchWithTimeout(path);
          const json = await jsonOrNull(res);
          return { label, path, ok: res.ok, status: res.status, detail: detail(json) };
        } catch (error) {
          const aborted = error instanceof DOMException && error.name === 'AbortError';
          return { label, path, ok: false, status: 0, detail: aborted ? 'Timeout etter 8 sekunder' : error instanceof Error ? error.message : 'Ukjent feil' };
        }
      }));
      setProbes(next);

      const [storageResult, statsResult, insightsResult, diagnosticsResult] = await Promise.allSettled([
        fetchWithTimeout('/api/tracker/storage-status').then((res) => res.json()),
        fetchWithTimeout('/api/tracker/stats').then((res) => res.json()),
        fetchWithTimeout('/api/tracker/insights').then((res) => res.json()),
        fetchWithTimeout('/api/tracker/diagnostics').then((res) => res.json()),
      ]);

      const storage = storageResult.status === 'fulfilled' ? storageResult.value : {};
      const stats = statsResult.status === 'fulfilled' ? statsResult.value : {};
      const insights = insightsResult.status === 'fulfilled' ? insightsResult.value : {};
      const diagnostics = diagnosticsResult.status === 'fulfilled' ? diagnosticsResult.value : {};

      setSummary({
        storageMode: storage.storageMode,
        openRows: storage.summary?.openRows,
        settledRows: storage.summary?.settledRows,
        readiness: diagnostics.readinessScore,
        issues: diagnostics.issues?.length ?? 0,
        recommendations: insights.recommendations?.length ?? 0,
        profit: stats.summary?.profit,
        roi: stats.summary?.roi,
      });

      const ok = next.filter((item) => item.ok).length;
      setLastUpdated(started);
      addLog('Oppdater alt', `API probes: ${ok}/${next.length}`);
    } catch (error) {
      addLog('Oppdater alt', error instanceof Error ? error.message : 'Ukjent feil');
    } finally {
      setBusy(false);
    }
  }

  async function run(name: string, title: string, request: () => Promise<Response>) {
    setAction(name);
    try {
      const res = await request();
      const json = await res.json().catch(() => ({}));
      addLog(title, detail(json));
      await refresh();
    } catch (error) {
      addLog(title, error instanceof Error ? error.message : 'Ukjent feil');
    } finally {
      setAction(null);
    }
  }

  function runFlowAction(flowAction: string) {
    if (flowAction === 'refresh') return refresh();
    if (flowAction === 'snapshot') return run('snapshot', 'Save snapshot', () => fetchWithTimeout('/api/tracker/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 8 }) }));
    if (flowAction === 'seed') return run('seed', 'Seed demo', () => fetchWithTimeout('/api/tracker/seed-demo', { method: 'POST' }));
    if (flowAction === 'settle') return run('settle', 'Auto-settle', () => fetchWithTimeout('/api/tracker/auto-settle', { method: 'POST' }));
    return undefined;
  }

  useEffect(() => {
    refresh();
  }, []);

  const okCount = useMemo(() => probes.filter((item) => item.ok).length, [probes]);

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Model</div>
            <h1 className="hero-title">Test lab</h1>
            <p className="hero-subtitle">En praktisk testsentral for V2-flyten: snapshot, demo-data, status, export og API-sjekker.</p>
          </div>
          <div className="app-nav-links">
            <button type="button" className="app-nav-link" onClick={refresh}>{busy ? 'Tester...' : 'Oppdater alt'}</button>
            <a href="/quick-test" className="app-nav-link">Quick test</a>
            <a href="/qa" className="app-nav-link">QA</a>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          style={{
            width: '100%',
            marginTop: 20,
            border: '1px solid #9cc3f7',
            borderRadius: 22,
            padding: 18,
            background: '#edf5ff',
            color: '#102033',
            fontSize: 20,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 10px 22px rgba(16, 32, 51, 0.08)',
          }}
        >
          {busy ? 'Tester API-er nå...' : 'Trykk her: Oppdater alt'}
        </button>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          {lastUpdated ? `Sist oppdatert: ${lastUpdated}` : 'Denne knappen skal oppdatere API probes, storage og sammendrag.'}
        </p>

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card"><div className="summary-label">API probes</div><div className="summary-value">{probes.length ? `${okCount}/${probes.length}` : '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Storage</div><div className="summary-value" style={{ fontSize: 20 }}>{summary?.storageMode ?? '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Readiness</div><div className="summary-value green">{typeof summary?.readiness === 'number' ? `${summary.readiness}%` : '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Profit / ROI</div><div className="summary-value green" style={{ fontSize: 20 }}>{units(summary?.profit)} · {percent(summary?.roi)}</div></div>
        </div>
        <div className="summary-grid" style={{ marginTop: 16 }}>
          <div className="summary-card"><div className="summary-label">Open rows</div><div className="summary-value">{summary?.openRows ?? '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Settled rows</div><div className="summary-value">{summary?.settledRows ?? '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Issues</div><div className="summary-value">{summary?.issues ?? '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Recommendations</div><div className="summary-value">{summary?.recommendations ?? '–'}</div></div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header"><div><h2 className="section-title" style={{ marginBottom: 0 }}>Anbefalt testflyt</h2><p className="section-subtitle">De første stegene er nå ekte knapper. Den blå knappen øverst er enklest å teste først.</p></div><div className="badge-soft">Flow</div></div>
            <div className="reason-list">
              {testFlow.map((item, index) => {
                const content = <><span className="reason-number">{index + 1}</span><div><div className="metric-pill-value">{item.label}</div><p className="section-subtitle" style={{ marginTop: 4 }}>{item.hint}</p></div></>;
                if ('action' in item) {
                  return <button key={item.label} type="button" className="reason-card" disabled={action !== null} onClick={() => runFlowAction(item.action)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>{content}</button>;
                }
                return <a key={item.label} href={item.href} className="reason-card" style={{ textDecoration: 'none' }}>{content}</a>;
              })}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header"><div><h2 className="section-title" style={{ marginBottom: 0 }}>Test actions</h2><p className="section-subtitle">Samme handlinger samlet som knapper.</p></div><div className="badge-soft">V2</div></div>
            <div className="summary-grid" style={{ marginTop: 14 }}>
              <button type="button" className="summary-card" disabled={action !== null} onClick={() => run('snapshot', 'Save snapshot', () => fetchWithTimeout('/api/tracker/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 8 }) }))}><div className="summary-label">Step 1</div><div className="summary-value" style={{ fontSize: 20 }}>{action === 'snapshot' ? 'Lagrer...' : 'Save snapshot'}</div></button>
              <button type="button" className="summary-card" disabled={action !== null} onClick={() => run('seed', 'Seed demo', () => fetchWithTimeout('/api/tracker/seed-demo', { method: 'POST' }))}><div className="summary-label">Demo</div><div className="summary-value" style={{ fontSize: 20 }}>{action === 'seed' ? 'Legger inn...' : 'Seed demo'}</div></button>
              <button type="button" className="summary-card" disabled={action !== null} onClick={() => run('settle', 'Auto-settle', () => fetchWithTimeout('/api/tracker/auto-settle', { method: 'POST' }))}><div className="summary-label">Resultat</div><div className="summary-value" style={{ fontSize: 20 }}>{action === 'settle' ? 'Kjører...' : 'Auto-settle'}</div></button>
              <button type="button" className="summary-card" disabled={action !== null} onClick={() => run('reset', 'Reset store', () => fetchWithTimeout('/api/tracker/history', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'all' }) }))}><div className="summary-label">Reset</div><div className="summary-value" style={{ fontSize: 20 }}>{action === 'reset' ? 'Nullstiller...' : 'Reset store'}</div></button>
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header"><div><h2 className="section-title" style={{ marginBottom: 0 }}>API probes</h2><p className="section-subtitle">Sentrale API-endepunkter.</p></div><div className="badge-soft">{okCount}/{probes.length || 0}</div></div>
            <div className="metrics-grid" style={{ marginTop: 14 }}>{probes.map((item) => <div key={item.path} className="metric-pill" style={{ textAlign: 'left' }}><div className="metric-pill-label">{item.ok ? 'OK' : 'Feil'} · HTTP {item.status || '–'}</div><div className="metric-pill-value">{item.label}</div><p className="section-subtitle" style={{ marginTop: 8 }}>{item.path}</p><p className="section-subtitle" style={{ marginTop: 4 }}>{item.detail}</p></div>)}</div>
          </section>
        </div>
        <aside className="right-column">
          <section className="detail-card"><h2 className="section-title">Exports</h2><div className="app-nav-links" style={{ marginTop: 12 }}><a href="/api/tracker/export?format=csv" className="app-nav-link">CSV</a><a href="/api/tracker/export" className="app-nav-link">JSON</a><a href="/api/tracker/diagnostics" className="app-nav-link">Diagnostics</a></div></section>
          <section className="detail-card" style={{ marginTop: 16 }}><h2 className="section-title">Nyttige sider</h2><div className="app-nav-links" style={{ marginTop: 12 }}><a href="/tracker-stats" className="app-nav-link">Stats</a><a href="/quality" className="app-nav-link">Quality</a><a href="/insights" className="app-nav-link">Insights</a><a href="/diagnostics" className="app-nav-link">Diagnostics</a><a href="/backtest" className="app-nav-link">Backtest</a></div></section>
          <section className="detail-card" style={{ marginTop: 16 }}><h2 className="section-title">Action log</h2><div className="reason-list" style={{ marginTop: 16 }}>{logs.length === 0 ? <div className="empty-box">Ingen handlinger kjørt ennå.</div> : logs.map((log) => <div key={`${log.at}-${log.title}-${log.detail}`} className="reason-card"><span className="reason-number">•</span><div><div className="metric-pill-value">{log.title}</div><p className="section-subtitle" style={{ marginTop: 4 }}>{log.at} · {log.detail}</p></div></div>)}</div></section>
          <section className="warning-box">Reset store nullstiller trackerhistorikken. Bruk den helst bare når du tester demo-data.</section>
        </aside>
      </section>
    </main>
  );
}
