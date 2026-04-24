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

type DashboardResponse = {
  recommendations: Recommendation[];
  generatedAt?: string;
  source?: string;
};

type TrackerRow = {
  fixtureId: string;
  match: string;
  market: string;
  odds: number;
  confidence: number;
  expectedValue: number;
  won: boolean;
  profit: number;
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

type AutoSettledPick = SavedPickRow & {
  status: 'settled';
  homeGoals: number;
  awayGoals: number;
  won: boolean;
  profit: number;
  settledAt: string;
};

type SettledDisplayRow = TrackerRow & {
  source: 'auto' | 'seed';
  homeGoals?: number;
  awayGoals?: number;
  settledAt?: string;
};

type SettlementResponse = {
  ok: boolean;
  settled?: AutoSettledPick[];
  pending?: Array<SavedPickRow & { status?: string }>;
  unsupported?: Array<SavedPickRow & { reason?: string }>;
  checkedAt?: string;
  error?: string;
};

const TRACKER_STORAGE_KEY = 'pl-betting-model-v2-pick-history';
const SETTLED_STORAGE_KEY = 'pl-betting-model-v2-settled-history';

function pct(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(date: string) {
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

function readJsonArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readSavedHistory(): SavedPickRow[] {
  return readJsonArray<SavedPickRow>(TRACKER_STORAGE_KEY);
}

function readSettledHistory(): AutoSettledPick[] {
  return readJsonArray<AutoSettledPick>(SETTLED_STORAGE_KEY);
}

function dedupeRows(rows: SavedPickRow[]) {
  const map = new Map<string, SavedPickRow>();
  for (const row of rows) {
    const key = `${row.fixtureId}__${row.market}`;
    const existing = map.get(key);
    if (!existing || new Date(row.savedAt).getTime() > new Date(existing.savedAt).getTime()) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function dedupeSettledRows(rows: AutoSettledPick[]) {
  const map = new Map<string, AutoSettledPick>();
  for (const row of rows) {
    const key = `${row.fixtureId}__${row.market}`;
    const existing = map.get(key);
    if (!existing || new Date(row.settledAt).getTime() > new Date(existing.settledAt).getTime()) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
}

function removeSettledFromSaved(saved: SavedPickRow[], settled: AutoSettledPick[]) {
  const settledKeys = new Set(settled.map((row) => `${row.fixtureId}__${row.market}`));
  return saved.filter((row) => !settledKeys.has(`${row.fixtureId}__${row.market}`));
}

function buildSeedSettledRows(): SettledDisplayRow[] {
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
        source: 'seed',
        homeGoals: result.homeGoals,
        awayGoals: result.awayGoals,
        settledAt: pick.kickoff,
      } satisfies SettledDisplayRow;
    })
    .filter((row): row is SettledDisplayRow => row !== null);
}

function toJsonDownload(data: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pl-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function V2TrackerPanel() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [savedHistory, setSavedHistory] = useState<SavedPickRow[]>([]);
  const [settledHistory, setSettledHistory] = useState<AutoSettledPick[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [settlementStatus, setSettlementStatus] = useState<string | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/fixtures', { cache: 'no-store' });
      const json = await response.json();
      setDashboard({
        recommendations: json.recommendations ?? [],
        generatedAt: json.generatedAt,
        source: json.source,
      });
      setSavedHistory(readSavedHistory());
      setSettledHistory(readSettledHistory());
    }

    load().catch(console.error);
  }, []);

  const openPicks = useMemo<SavedPickRow[]>(() => {
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
    if (typeof window === 'undefined' || openPicks.length === 0) return;
    const merged = dedupeRows([...readSavedHistory(), ...openPicks]);
    window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(merged));
    setSavedHistory(merged);
    setLastSavedAt(new Date().toISOString());
  }, [openPicks]);

  const seedSettledRows = useMemo(() => buildSeedSettledRows(), []);
  const autoSettledRows = useMemo<SettledDisplayRow[]>(() => settledHistory.map((row) => ({
    fixtureId: row.fixtureId,
    match: row.match,
    market: row.market,
    odds: row.odds,
    confidence: row.confidence,
    expectedValue: row.expectedValue,
    won: row.won,
    profit: row.profit,
    source: 'auto',
    homeGoals: row.homeGoals,
    awayGoals: row.awayGoals,
    settledAt: row.settledAt,
  })), [settledHistory]);

  const settledRows = useMemo(() => [...autoSettledRows, ...seedSettledRows], [autoSettledRows, seedSettledRows]);

  const settledSummary = useMemo(() => {
    const total = settledRows.length;
    const wins = settledRows.filter((row) => row.won).length;
    const profit = settledRows.reduce((sum, row) => sum + row.profit, 0);
    const avgOdds = total > 0 ? settledRows.reduce((sum, row) => sum + row.odds, 0) / total : 0;
    return {
      total,
      wins,
      hitRate: total > 0 ? wins / total : 0,
      profit,
      roi: total > 0 ? profit / total : 0,
      avgOdds,
    };
  }, [settledRows]);

  const openSummary = useMemo(() => {
    const total = openPicks.length;
    const avgEv = total > 0 ? openPicks.reduce((sum, row) => sum + row.expectedValue, 0) / total : 0;
    const avgConfidence = total > 0 ? openPicks.reduce((sum, row) => sum + row.confidence, 0) / total : 0;
    return { total, avgEv, avgConfidence };
  }, [openPicks]);

  const savedSummary = useMemo(() => {
    const total = savedHistory.length;
    const uniqueMatches = new Set(savedHistory.map((row) => row.match)).size;
    return {
      total,
      uniqueMatches,
      latest: savedHistory[0]?.savedAt ?? null,
    };
  }, [savedHistory]);

  const settlementQueue = useMemo(() => {
    return savedHistory.filter((row) => isSettlementReady(row.kickoff)).slice(0, 10);
  }, [savedHistory]);

  const settlementSummary = useMemo(() => {
    const total = settlementQueue.length;
    const avgEv = total > 0 ? settlementQueue.reduce((sum, row) => sum + row.expectedValue, 0) / total : 0;
    const oldest = settlementQueue.length ? settlementQueue[settlementQueue.length - 1].kickoff : null;
    return { total, avgEv, oldest };
  }, [settlementQueue]);

  async function runSettlementCheck() {
    if (settlementQueue.length === 0 || settlementLoading) return;
    setSettlementLoading(true);
    setSettlementStatus('Sjekker resultater...');

    try {
      const response = await fetch('/api/tracker/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: settlementQueue }),
      });
      const json = (await response.json()) as SettlementResponse;

      if (!json.ok) {
        setSettlementStatus(json.error ?? 'Settlement feilet.');
        return;
      }

      const newlySettled = json.settled ?? [];
      const mergedSettled = dedupeSettledRows([...readSettledHistory(), ...newlySettled]);
      const remainingSaved = removeSettledFromSaved(readSavedHistory(), newlySettled);

      window.localStorage.setItem(SETTLED_STORAGE_KEY, JSON.stringify(mergedSettled));
      window.localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(remainingSaved));
      setSettledHistory(mergedSettled);
      setSavedHistory(remainingSaved);
      setSettlementStatus(`Sjekket ${settlementQueue.length} picks · ${newlySettled.length} settled · ${(json.pending ?? []).length} pending · ${(json.unsupported ?? []).length} unsupported`);
    } catch (error) {
      setSettlementStatus(error instanceof Error ? error.message : 'Ukjent settlement-feil.');
    } finally {
      setSettlementLoading(false);
    }
  }

  function resetOpenHistory() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(TRACKER_STORAGE_KEY);
    setSavedHistory([]);
    setLastSavedAt(null);
    setSettlementStatus('Åpen historikk er nullstilt.');
  }

  function resetSettledHistory() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(SETTLED_STORAGE_KEY);
    setSettledHistory([]);
    setSettlementStatus('Auto-settled historikk er nullstilt. Seed-data beholdes som demo-grunnlag.');
  }

  function exportTrackerHistory() {
    toJsonDownload({
      exportedAt: new Date().toISOString(),
      source: dashboard?.source,
      openHistory: savedHistory,
      autoSettledHistory: settledHistory,
      seededSettledRows: seedSettledRows,
      summary: {
        settled: settledSummary,
        open: openSummary,
        saved: savedSummary,
        settlementQueue: settlementSummary,
      },
    });
  }

  return (
    <section className="hero-card">
      <div className="hero-topline">
        <div>
          <div className="eyebrow">Premier League Betting Model</div>
          <h1 className="hero-title">V2 Tracker</h1>
          <p className="hero-subtitle">
            Refaktorert tracker-side med open picks, lokal historikk, settlement readiness og auto-settlement.
          </p>
        </div>
        <div className="updated-at">Kilde: {dashboard?.source ?? 'laster...'}</div>
      </div>

      <div className="info-panel" style={{ marginTop: 20 }}>
        <h3>Settled picks</h3>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Settled picks</div><div className="summary-value">{settledSummary.total}</div></div>
          <div className="summary-card"><div className="summary-label">Treffrate</div><div className="summary-value">{pct(settledSummary.hitRate)}</div></div>
          <div className="summary-card"><div className="summary-label">Profit</div><div className="summary-value green">{settledSummary.profit.toFixed(2)}u</div></div>
          <div className="summary-card"><div className="summary-label">ROI</div><div className="summary-value green">{pct(settledSummary.roi)}</div></div>
        </div>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Auto-settled</div><div className="summary-value">{autoSettledRows.length}</div></div>
          <div className="summary-card"><div className="summary-label">Seed demo</div><div className="summary-value">{seedSettledRows.length}</div></div>
          <div className="summary-card"><div className="summary-label">Snittodds</div><div className="summary-value">{settledSummary.avgOdds.toFixed(2)}</div></div>
          <div className="summary-card"><div className="summary-label">Status</div><div className="summary-value">Live</div></div>
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Open picks snapshot</h3>
        <p className="section-subtitle">Dagens åpne picks lagres som lokalt snapshot i browseren.</p>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Åpne picks</div><div className="summary-value">{openSummary.total}</div></div>
          <div className="summary-card"><div className="summary-label">Snitt EV</div><div className="summary-value green">{pct(openSummary.avgEv)}</div></div>
          <div className="summary-card"><div className="summary-label">Snitt confidence</div><div className="summary-value">{openSummary.avgConfidence.toFixed(0)}/100</div></div>
          <div className="summary-card"><div className="summary-label">Status</div><div className="summary-value">Pending</div></div>
        </div>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {openPicks.length === 0 ? <div className="empty-box">Ingen åpne picks akkurat nå.</div> : openPicks.map((row) => (
            <div key={`${row.fixtureId}-${row.market}-open`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">Pending · {row.market}</div>
              <div className="metric-pill-value">{row.match}</div>
              <div className="section-subtitle" style={{ marginTop: 8 }}>Kickoff {formatDate(row.kickoff)} · EV {pct(row.expectedValue)} · Confidence {row.confidence.toFixed(0)}/100</div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Lokal historikklagring</h3>
        <p className="section-subtitle">Første lagring skjer i nettleseren. Senere kan dette flyttes til database/server.</p>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Lagrede picks</div><div className="summary-value">{savedSummary.total}</div></div>
          <div className="summary-card"><div className="summary-label">Unike kamper</div><div className="summary-value">{savedSummary.uniqueMatches}</div></div>
          <div className="summary-card"><div className="summary-label">Sist lagret</div><div className="summary-value">{savedSummary.latest ? formatDate(savedSummary.latest) : '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Lagringslag</div><div className="summary-value">Browser</div></div>
        </div>
        {lastSavedAt ? <p className="section-subtitle" style={{ marginTop: 12 }}>Snapshot oppdatert lokalt: {formatDate(lastSavedAt)}</p> : null}
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Settlement readiness</h3>
        <p className="section-subtitle">Lagrede picks blir merket som klare når kickoff er passert med to timer.</p>
        <div className="summary-grid" style={{ marginTop: 14 }}>
          <div className="summary-card"><div className="summary-label">Klar for settlement</div><div className="summary-value">{settlementSummary.total}</div></div>
          <div className="summary-card"><div className="summary-label">Snitt EV i kø</div><div className="summary-value green">{pct(settlementSummary.avgEv)}</div></div>
          <div className="summary-card"><div className="summary-label">Eldste kickoff</div><div className="summary-value">{settlementSummary.oldest ? formatDate(settlementSummary.oldest) : '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Neste steg</div><div className="summary-value">Auto</div></div>
        </div>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          <button type="button" onClick={runSettlementCheck} disabled={settlementLoading || settlementQueue.length === 0} className="metric-pill" style={{ cursor: settlementQueue.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Handling</div>
            <div className="metric-pill-value">{settlementLoading ? 'Sjekker...' : 'Kjør settlement-sjekk'}</div>
          </button>
          <button type="button" onClick={exportTrackerHistory} className="metric-pill" style={{ cursor: 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Eksport</div>
            <div className="metric-pill-value">Last ned JSON</div>
          </button>
          <button type="button" onClick={resetOpenHistory} className="metric-pill" style={{ cursor: 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Nullstill</div>
            <div className="metric-pill-value">Open history</div>
          </button>
          <button type="button" onClick={resetSettledHistory} className="metric-pill" style={{ cursor: 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Nullstill</div>
            <div className="metric-pill-value">Auto-settled</div>
          </button>
        </div>
        {settlementStatus ? <p className="section-subtitle" style={{ marginTop: 12 }}>{settlementStatus}</p> : null}
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {settlementQueue.length === 0 ? <div className="empty-box">Ingen lagrede picks er klare for settlement akkurat nå.</div> : settlementQueue.slice(0, 5).map((row) => (
            <div key={`${row.fixtureId}-${row.market}-ready`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">Ready · {row.market}</div>
              <div className="metric-pill-value">{row.match}</div>
              <div className="section-subtitle" style={{ marginTop: 8 }}>Kickoff {formatDate(row.kickoff)} · lagret {formatDate(row.savedAt)} · EV {pct(row.expectedValue)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Settled history</h3>
        <p className="section-subtitle">Viser både auto-settled picks og seedede demo-picks, med resultat og profit per pick.</p>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {settledRows.length === 0 ? <div className="empty-box">Ingen settled picks ennå.</div> : settledRows.slice(0, 10).map((row) => (
            <div key={`${row.fixtureId}-${row.market}-${row.source}`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">{row.source === 'auto' ? 'Auto' : 'Seed'} · {row.won ? 'Win' : 'Loss'} · {row.market}</div>
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
