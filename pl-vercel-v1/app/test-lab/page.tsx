'use client';

import { useEffect, useMemo, useState } from 'react';

type Probe = { label: string; path: string; ok: boolean; status: number; detail: string };
type Log = { at: string; title: string; detail: string };

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

function timeNow() {
  return new Date().toLocaleString('no-NO');
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

export default function TestLabPage() {
  const [probes, setProbes] = useState<Probe[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  function addLog(title: string, logDetail: string) {
    setLogs((items) => [{ at: timeNow(), title, detail: logDetail }, ...items].slice(0, 10));
  }

  async function refresh() {
    setBusy(true);
    try {
      const next = await Promise.all(endpoints.map(async ([label, path]) => {
        try {
          const res = await fetch(path, { cache: 'no-store' });
          const json = (res.headers.get('content-type') ?? '').includes('application/json') ? await res.json() : null;
          return { label, path, ok: res.ok, status: res.status, detail: detail(json) };
        } catch (error) {
          return { label, path, ok: false, status: 0, detail: error instanceof Error ? error.message : 'Ukjent feil' };
        }
      }));
      setProbes(next);
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
          <button type="button" className="app-nav-link" onClick={refresh} disabled={busy}>{busy ? 'Tester...' : 'Oppdater alt'}</button>
        </div>
        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card"><div className="summary-label">API probes</div><div className="summary-value">{probes.length ? `${okCount}/${probes.length}` : '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Siste handling</div><div className="summary-value" style={{ fontSize: 20 }}>{logs[0]?.title ?? '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Status</div><div className="summary-value green">{busy || action ? 'Kjører' : 'Klar'}</div></div>
          <div className="summary-card"><div className="summary-label">Exports</div><div className="summary-value" style={{ fontSize: 20 }}>CSV/JSON</div></div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header"><div><h2 className="section-title" style={{ marginBottom: 0 }}>Test actions</h2><p className="section-subtitle">Knapper for rask testing.</p></div><div className="badge-soft">V2</div></div>
            <div className="summary-grid" style={{ marginTop: 14 }}>
              <button type="button" className="summary-card" disabled={action !== null} onClick={() => run('snapshot', 'Save snapshot', () => fetch('/api/tracker/snapshot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 8 }) }))}><div className="summary-label">Step 1</div><div className="summary-value" style={{ fontSize: 20 }}>{action === 'snapshot' ? 'Lagrer...' : 'Save snapshot'}</div></button>
              <button type="button" className="summary-card" disabled={action !== null} onClick={() => run('seed', 'Seed demo', () => fetch('/api/tracker/seed-demo', { method: 'POST' }))}><div className="summary-label">Demo</div><div className="summary-value" style={{ fontSize: 20 }}>{action === 'seed' ? 'Legger inn...' : 'Seed demo'}</div></button>
              <button type="button" className="summary-card" disabled={action !== null} onClick={() => run('settle', 'Auto-settle', () => fetch('/api/tracker/auto-settle', { method: 'POST' }))}><div className="summary-label">Resultat</div><div className="summary-value" style={{ fontSize: 20 }}>{action === 'settle' ? 'Kjører...' : 'Auto-settle'}</div></button>
              <button type="button" className="summary-card" disabled={action !== null} onClick={() => run('reset', 'Reset store', () => fetch('/api/tracker/history', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'all' }) }))}><div className="summary-label">Reset</div><div className="summary-value" style={{ fontSize: 20 }}>{action === 'reset' ? 'Nullstiller...' : 'Reset store'}</div></button>
            </div>
          </section>
          <section className="list-card">
            <div className="list-card-header"><div><h2 className="section-title" style={{ marginBottom: 0 }}>API probes</h2><p className="section-subtitle">Sentrale API-endepunkter.</p></div><div className="badge-soft">{okCount}/{probes.length || 0}</div></div>
            <div className="metrics-grid" style={{ marginTop: 14 }}>{probes.map((item) => <div key={item.path} className="metric-pill" style={{ textAlign: 'left' }}><div className="metric-pill-label">{item.ok ? 'OK' : 'Feil'} · HTTP {item.status || '–'}</div><div className="metric-pill-value">{item.label}</div><p className="section-subtitle" style={{ marginTop: 8 }}>{item.path}</p><p className="section-subtitle" style={{ marginTop: 4 }}>{item.detail}</p></div>)}</div>
          </section>
        </div>
        <aside className="right-column">
          <section className="detail-card"><h2 className="section-title">Exports</h2><div className="app-nav-links" style={{ marginTop: 12 }}><a href="/api/tracker/export?format=csv" className="app-nav-link">CSV</a><a href="/api/tracker/export" className="app-nav-link">JSON</a><a href="/api/tracker/diagnostics" className="app-nav-link">Diagnostics</a></div></section>
          <section className="detail-card" style={{ marginTop: 16 }}><h2 className="section-title">Action log</h2><div className="reason-list" style={{ marginTop: 16 }}>{logs.length === 0 ? <div className="empty-box">Ingen handlinger kjørt ennå.</div> : logs.map((log) => <div key={`${log.at}-${log.title}-${log.detail}`} className="reason-card"><span className="reason-number">•</span><div><div className="metric-pill-value">{log.title}</div><p className="section-subtitle" style={{ marginTop: 4 }}>{log.at} · {log.detail}</p></div></div>)}</div></section>
          <section className="warning-box">Reset store nullstiller trackerhistorikken. Bruk den helst bare når du tester demo-data.</section>
        </aside>
      </section>
    </main>
  );
}
