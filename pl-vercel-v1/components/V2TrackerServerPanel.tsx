'use client';

import { useEffect, useMemo, useState } from 'react';
import { trackerSeedPicks, trackerSeedResults } from '@/lib/mock-data';

type Recommendation = {
  fixtureId: string;
  match: string;
  kickoff: string;
  market: string;
  bookmakerOdds: number;
  expectedValue: number;
  confidence: number;
};

type SavedPickRow = {
  fixtureId: string;
  match: string;
  market: string;
  odds: number;
  confidence: number;
  expectedValue: number;
  kickoff: string;
  savedAt: string;
  snapshotId: string;
};

type SettledPickRow = SavedPickRow & {
  status: 'settled';
  homeGoals: number;
  awayGoals: number;
  won: boolean;
  profit: number;
  settledAt: string;
};

type DisplaySettledRow = {
  fixtureId: string;
  match: string;
  market: string;
  odds: number;
  confidence: number;
  expectedValue: number;
  won: boolean;
  profit: number;
  source: 'server' | 'seed';
  homeGoals?: number;
  awayGoals?: number;
  settledAt?: string;
};

type TrackerHistoryResponse = {
  ok: boolean;
  open?: SavedPickRow[];
  settled?: SettledPickRow[];
  updatedAt?: string;
  error?: string;
};

type SettlementResponse = {
  ok: boolean;
  settled?: SettledPickRow[];
  pending?: Array<SavedPickRow & { status?: string }>;
  unsupported?: Array<SavedPickRow & { reason?: string }>;
  checkedAt?: string;
  error?: string;
};

type DashboardResponse = {
  recommendations: Recommendation[];
  generatedAt?: string;
  source?: string;
};

function pct(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(date?: string) {
  if (!date) return '–';
  try {
    return new Date(date).toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

function formatMarket(market?: string) {
  const map: Record<string, string> = {
    home: 'Hjemmeseier',
    draw: 'Uavgjort',
    away: 'Borteseier',
    over2_5: 'Over 2.5',
    under2_5: 'Under 2.5',
    btts_yes: 'Begge lag scorer',
    btts_no: 'Begge lag scorer ikke',
  };
  return market ? map[market] ?? market : 'Ingen';
}

function marketWon(market: string, homeGoals: number, awayGoals: number) {
  switch (market) {
    case 'home':
      return homeGoals > awayGoals;
    case 'draw':
      return homeGoals === awayGoals;
    case 'away':
      return awayGoals > homeGoals;
    case 'over2_5':
      return homeGoals + awayGoals > 2.5;
    case 'under2_5':
      return homeGoals + awayGoals < 2.5;
    case 'btts_yes':
      return homeGoals > 0 && awayGoals > 0;
    case 'btts_no':
      return homeGoals === 0 || awayGoals === 0;
    default:
      return false;
  }
}

function isSettlementReady(kickoff: string) {
  const ts = new Date(kickoff).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() >= ts + 2 * 60 * 60 * 1000;
}

function buildSeedSettledRows(): DisplaySettledRow[] {
  return trackerSeedPicks
    .map((pick) => {
      const result = trackerSeedResults.find((item) => item.fixtureId === pick.fixtureId);
      if (!result) return null;
      const won = marketWon(pick.market, result.homeGoals, result.awayGoals);
      return {
        fixtureId: pick.fixtureId,
        match: `${pick.homeTeam} vs ${pick.awayTeam}`,
        market: formatMarket(pick.market),
        odds: pick.bookmakerOdds,
        confidence: pick.confidence,
        expectedValue: pick.expectedValue,
        won,
        profit: won ? pick.bookmakerOdds - 1 : -1,
        source: 'seed' as const,
        homeGoals: result.homeGoals,
        awayGoals: result.awayGoals,
        settledAt: pick.kickoff,
      };
    })
    .filter((row): row is DisplaySettledRow => row !== null);
}

function toJsonDownload(data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pl-tracker-server-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function V2TrackerServerPanel() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [openHistory, setOpenHistory] = useState<SavedPickRow[]>([]);
  const [settledHistory, setSettledHistory] = useState<SettledPickRow[]>([]);
  const [serverUpdatedAt, setServerUpdatedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Laster tracker...');
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    const response = await fetch('/api/tracker/history', { cache: 'no-store' });
    const json = (await response.json()) as TrackerHistoryResponse;
    if (!json.ok) throw new Error(json.error ?? 'Kunne ikke hente tracker-historikk');
    setOpenHistory(json.open ?? []);
    setSettledHistory(json.settled ?? []);
    setServerUpdatedAt(json.updatedAt ?? null);
    return json;
  }

  useEffect(() => {
    async function load() {
      const [fixturesResponse] = await Promise.all([
        fetch('/api/fixtures', { cache: 'no-store' }),
        loadHistory(),
      ]);
      const fixturesJson = await fixturesResponse.json();
      setDashboard({
        recommendations: fixturesJson.recommendations ?? [],
        generatedAt: fixturesJson.generatedAt,
        source: fixturesJson.source,
      });
      setStatus('Serverhistorikk er aktiv.');
    }

    load().catch((error) => setStatus(error instanceof Error ? error.message : 'Ukjent lastefeil'));
  }, []);

  const currentOpenPicks = useMemo<SavedPickRow[]>(() => {
    const recommendations = dashboard?.recommendations ?? [];
    return recommendations.slice(0, 5).map((rec) => ({
      fixtureId: rec.fixtureId,
      match: rec.match,
      market: formatMarket(rec.market),
      odds: rec.bookmakerOdds,
      confidence: rec.confidence,
      expectedValue: rec.expectedValue,
      kickoff: rec.kickoff,
      savedAt: new Date().toISOString(),
      snapshotId: dashboard?.generatedAt ?? new Date().toISOString(),
    }));
  }, [dashboard]);

  useEffect(() => {
    if (currentOpenPicks.length === 0) return;

    async function saveOpenPicks() {
      const response = await fetch('/api/tracker/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open: currentOpenPicks }),
      });
      const json = (await response.json()) as TrackerHistoryResponse;
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke lagre open picks');
      setOpenHistory(json.open ?? []);
      setSettledHistory(json.settled ?? []);
      setServerUpdatedAt(json.updatedAt ?? null);
      setStatus('Open picks er lagret på server-memory.');
    }

    saveOpenPicks().catch((error) => setStatus(error instanceof Error ? error.message : 'Ukjent lagringsfeil'));
  }, [currentOpenPicks]);

  const settlementQueue = useMemo(() => openHistory.filter((row) => isSettlementReady(row.kickoff)).slice(0, 10), [openHistory]);
  const seedSettledRows = useMemo(() => buildSeedSettledRows(), []);
  const serverSettledRows = useMemo<DisplaySettledRow[]>(() => settledHistory.map((row) => ({
    fixtureId: row.fixtureId,
    match: row.match,
    market: row.market,
    odds: row.odds,
    confidence: row.confidence,
    expectedValue: row.expectedValue,
    won: row.won,
    profit: row.profit,
    source: 'server' as const,
    homeGoals: row.homeGoals,
    awayGoals: row.awayGoals,
    settledAt: row.settledAt,
  })), [settledHistory]);
  const settledRows = useMemo(() => [...serverSettledRows, ...seedSettledRows], [serverSettledRows, seedSettledRows]);

  const settledSummary = useMemo(() => {
    const total = settledRows.length;
    const wins = settledRows.filter((row) => row.won).length;
    const profit = settledRows.reduce((sum, row) => sum + row.profit, 0);
    const avgOdds = total > 0 ? settledRows.reduce((sum, row) => sum + row.odds, 0) / total : 0;
    return { total, wins, hitRate: total ? wins / total : 0, profit, roi: total ? profit / total : 0, avgOdds };
  }, [settledRows]);

  const openSummary = useMemo(() => {
    const total = openHistory.length;
    const avgEv = total ? openHistory.reduce((sum, row) => sum + row.expectedValue, 0) / total : 0;
    const avgConfidence = total ? openHistory.reduce((sum, row) => sum + row.confidence, 0) / total : 0;
    const uniqueMatches = new Set(openHistory.map((row) => row.match)).size;
    return { total, avgEv, avgConfidence, uniqueMatches };
  }, [openHistory]);

  const settlementSummary = useMemo(() => {
    const total = settlementQueue.length;
    const avgEv = total ? settlementQueue.reduce((sum, row) => sum + row.expectedValue, 0) / total : 0;
    const oldest = settlementQueue.length ? settlementQueue[settlementQueue.length - 1].kickoff : null;
    return { total, avgEv, oldest };
  }, [settlementQueue]);

  async function refreshServerHistory() {
    setLoading(true);
    try {
      await loadHistory();
      setStatus('Serverhistorikk er oppdatert.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Ukjent refresh-feil');
    } finally {
      setLoading(false);
    }
  }

  async function runSettlementCheck() {
    if (settlementQueue.length === 0 || loading) return;
    setLoading(true);
    setStatus('Sjekker resultater...');
    try {
      const settleResponse = await fetch('/api/tracker/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: settlementQueue }),
      });
      const settleJson = (await settleResponse.json()) as SettlementResponse;
      if (!settleJson.ok) throw new Error(settleJson.error ?? 'Settlement feilet');

      if ((settleJson.settled ?? []).length > 0) {
        const historyResponse = await fetch('/api/tracker/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settled: settleJson.settled }),
        });
        const historyJson = (await historyResponse.json()) as TrackerHistoryResponse;
        if (!historyJson.ok) throw new Error(historyJson.error ?? 'Kunne ikke lagre settled picks');
        setOpenHistory(historyJson.open ?? []);
        setSettledHistory(historyJson.settled ?? []);
        setServerUpdatedAt(historyJson.updatedAt ?? null);
      }

      setStatus(`Sjekket ${settlementQueue.length} · ${(settleJson.settled ?? []).length} settled · ${(settleJson.pending ?? []).length} pending · ${(settleJson.unsupported ?? []).length} unsupported`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Ukjent settlement-feil');
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory(kind: 'open' | 'settled' | 'all') {
    setLoading(true);
    try {
      const response = await fetch('/api/tracker/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const json = (await response.json()) as TrackerHistoryResponse;
      if (!json.ok) throw new Error(json.error ?? 'Kunne ikke nullstille historikk');
      setOpenHistory(json.open ?? []);
      setSettledHistory(json.settled ?? []);
      setServerUpdatedAt(json.updatedAt ?? null);
      setStatus(kind === 'all' ? 'All serverhistorikk er nullstilt.' : `${kind} historikk er nullstilt.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Ukjent reset-feil');
    } finally {
      setLoading(false);
    }
  }

  function exportTrackerHistory() {
    toJsonDownload({
      exportedAt: new Date().toISOString(),
      source: dashboard?.source,
      storage: 'server-memory',
      openHistory,
      serverSettledHistory: settledHistory,
      seededSettledRows: seedSettledRows,
      summary: { settled: settledSummary, open: openSummary, settlementQueue: settlementSummary },
    });
  }

  return (
    <section className="hero-card">
      <div className="hero-topline">
        <div>
          <div className="eyebrow">Premier League Betting Model</div>
          <h1 className="hero-title">V2 Tracker</h1>
          <p className="hero-subtitle">
            Server-backed tracker med open picks, settlement queue, auto-settlement og eksport.
          </p>
        </div>
        <div className="updated-at">Kilde: {dashboard?.source ?? 'laster...'} · Server: {formatDate(serverUpdatedAt ?? undefined)}</div>
      </div>

      <div className="info-panel" style={{ marginTop: 20 }}>
        <h3>Server tracker status</h3>
        <p className="section-subtitle">{status}</p>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Lagringslag</div><div className="summary-value">Server</div></div>
          <div className="summary-card"><div className="summary-label">Open</div><div className="summary-value">{openHistory.length}</div></div>
          <div className="summary-card"><div className="summary-label">Auto-settled</div><div className="summary-value">{serverSettledRows.length}</div></div>
          <div className="summary-card"><div className="summary-label">Ready</div><div className="summary-value">{settlementQueue.length}</div></div>
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Settled picks</h3>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Settled picks</div><div className="summary-value">{settledSummary.total}</div></div>
          <div className="summary-card"><div className="summary-label">Treffrate</div><div className="summary-value">{pct(settledSummary.hitRate)}</div></div>
          <div className="summary-card"><div className="summary-label">Profit</div><div className="summary-value green">{settledSummary.profit.toFixed(2)}u</div></div>
          <div className="summary-card"><div className="summary-label">ROI</div><div className="summary-value green">{pct(settledSummary.roi)}</div></div>
        </div>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Server-settled</div><div className="summary-value">{serverSettledRows.length}</div></div>
          <div className="summary-card"><div className="summary-label">Seed demo</div><div className="summary-value">{seedSettledRows.length}</div></div>
          <div className="summary-card"><div className="summary-label">Snittodds</div><div className="summary-value">{settledSummary.avgOdds.toFixed(2)}</div></div>
          <div className="summary-card"><div className="summary-label">Status</div><div className="summary-value">Live</div></div>
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Open picks history</h3>
        <p className="section-subtitle">Open picks lagres nå via `/api/tracker/history` i server-memory.</p>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Lagrede picks</div><div className="summary-value">{openSummary.total}</div></div>
          <div className="summary-card"><div className="summary-label">Unike kamper</div><div className="summary-value">{openSummary.uniqueMatches}</div></div>
          <div className="summary-card"><div className="summary-label">Snitt EV</div><div className="summary-value green">{pct(openSummary.avgEv)}</div></div>
          <div className="summary-card"><div className="summary-label">Snitt confidence</div><div className="summary-value">{openSummary.avgConfidence.toFixed(0)}/100</div></div>
        </div>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {openHistory.length === 0 ? <div className="empty-box">Ingen open picks lagret på server ennå.</div> : openHistory.slice(0, 6).map((row) => (
            <div key={`${row.fixtureId}-${row.market}-server-open`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">Open · {row.market}</div>
              <div className="metric-pill-value">{row.match}</div>
              <div className="section-subtitle" style={{ marginTop: 8 }}>Kickoff {formatDate(row.kickoff)} · EV {pct(row.expectedValue)} · Confidence {row.confidence.toFixed(0)}/100</div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Settlement queue</h3>
        <p className="section-subtitle">Picks er klare når kickoff er passert med to timer. Klikk for å sjekke resultat og flytte til settled.</p>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Klar</div><div className="summary-value">{settlementSummary.total}</div></div>
          <div className="summary-card"><div className="summary-label">Snitt EV</div><div className="summary-value green">{pct(settlementSummary.avgEv)}</div></div>
          <div className="summary-card"><div className="summary-label">Eldste kickoff</div><div className="summary-value">{formatDate(settlementSummary.oldest ?? undefined)}</div></div>
          <div className="summary-card"><div className="summary-label">Neste steg</div><div className="summary-value">Auto</div></div>
        </div>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          <button type="button" onClick={runSettlementCheck} disabled={loading || settlementQueue.length === 0} className="metric-pill" style={{ cursor: settlementQueue.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Handling</div>
            <div className="metric-pill-value">{loading ? 'Jobber...' : 'Kjør settlement-sjekk'}</div>
          </button>
          <button type="button" onClick={refreshServerHistory} className="metric-pill" style={{ cursor: 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Refresh</div>
            <div className="metric-pill-value">Hent serverhistorikk</div>
          </button>
          <button type="button" onClick={exportTrackerHistory} className="metric-pill" style={{ cursor: 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Eksport</div>
            <div className="metric-pill-value">Last ned JSON</div>
          </button>
          <button type="button" onClick={() => clearHistory('open')} className="metric-pill" style={{ cursor: 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Nullstill</div>
            <div className="metric-pill-value">Open history</div>
          </button>
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Settled history</h3>
        <p className="section-subtitle">Viser både server-settled og seedede demo-picks, med resultat og profit.</p>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {settledRows.length === 0 ? <div className="empty-box">Ingen settled picks ennå.</div> : settledRows.slice(0, 10).map((row) => (
            <div key={`${row.fixtureId}-${row.market}-${row.source}`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">{row.source === 'server' ? 'Server' : 'Seed'} · {row.won ? 'Win' : 'Loss'} · {row.market}</div>
              <div className="metric-pill-value">{row.match}</div>
              <div className="section-subtitle" style={{ marginTop: 8 }}>
                Resultat {typeof row.homeGoals === 'number' ? `${row.homeGoals}-${row.awayGoals}` : '–'} · Profit {row.profit > 0 ? '+' : ''}{row.profit.toFixed(2)}u · Odds {row.odds.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
