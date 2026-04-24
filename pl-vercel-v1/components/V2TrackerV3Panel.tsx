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
  dataQuality: 'green' | 'yellow' | 'red';
  source: string;
};

type SettledRow = SavedPickRow & {
  status: 'settled';
  homeGoals?: number;
  awayGoals?: number;
  won: boolean;
  profit: number;
  settledAt: string;
  settlementSource: 'auto' | 'seed';
};

type SettlementResponse = {
  ok: boolean;
  settled?: Array<SavedPickRow & {
    status: 'settled';
    homeGoals: number;
    awayGoals: number;
    won: boolean;
    profit: number;
    settledAt: string;
  }>;
  pending?: SavedPickRow[];
  unsupported?: Array<SavedPickRow & { reason?: string }>;
  error?: string;
};

const TRACKER_STORAGE_KEY = 'pl-betting-model-v3-open-history';
const SETTLED_STORAGE_KEY = 'pl-betting-model-v3-settled-history';

const marketLabels: Record<string, string> = {
  home: 'Hjemmeseier',
  draw: 'Uavgjort',
  away: 'Borteseier',
  over2_5: 'Over 2.5',
  under2_5: 'Under 2.5',
  btts_yes: 'Begge lag scorer',
  btts_no: 'Begge lag scorer ikke',
};

function formatMarket(market?: string) {
  return market ? marketLabels[market] ?? market : 'Ingen';
}

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

function dataQualityFromSource(source?: string): SavedPickRow['dataQuality'] {
  if (source === 'live') return 'green';
  if (source === 'partial-live') return 'yellow';
  return 'red';
}

function dataQualityLabel(value: SavedPickRow['dataQuality']) {
  if (value === 'green') return 'Grønn · live';
  if (value === 'yellow') return 'Gul · delvis live';
  return 'Rød · fallback/mock';
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

function saveJsonArray<T>(key: string, rows: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

function rowKey(row: Pick<SavedPickRow, 'fixtureId' | 'market'>) {
  return `${row.fixtureId}__${row.market}`;
}

function dedupeOpenRows(rows: SavedPickRow[]) {
  const map = new Map<string, SavedPickRow>();
  for (const row of rows) {
    const existing = map.get(rowKey(row));
    if (!existing || new Date(row.savedAt).getTime() > new Date(existing.savedAt).getTime()) {
      map.set(rowKey(row), row);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function dedupeSettledRows(rows: SettledRow[]) {
  const map = new Map<string, SettledRow>();
  for (const row of rows) {
    const existing = map.get(rowKey(row));
    if (!existing || new Date(row.settledAt).getTime() > new Date(existing.settledAt).getTime()) {
      map.set(rowKey(row), row);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
}

function buildSeedSettledRows(): SettledRow[] {
  const rows: SettledRow[] = [];
  for (const pick of trackerSeedPicks) {
    const result = trackerSeedResults.find((item) => item.fixtureId === pick.fixtureId);
    if (!result) continue;
    const won = marketWon(pick.market, result.homeGoals, result.awayGoals);
    rows.push({
      fixtureId: pick.fixtureId,
      match: `${pick.homeTeam} vs ${pick.awayTeam}`,
      market: formatMarket(pick.market),
      odds: pick.bookmakerOdds,
      confidence: pick.confidence,
      expectedValue: pick.expectedValue,
      kickoff: pick.kickoff,
      savedAt: pick.kickoff,
      snapshotId: 'seed-demo',
      dataQuality: 'red',
      source: 'seed-demo',
      status: 'settled',
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      won,
      profit: won ? pick.bookmakerOdds - 1 : -1,
      settledAt: pick.kickoff,
      settlementSource: 'seed',
    });
  }
  return rows;
}

function downloadText(filename: string, text: string, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(openRows: SavedPickRow[], settledRows: SettledRow[]) {
  const header = ['status', 'fixtureId', 'match', 'market', 'odds', 'confidence', 'expectedValue', 'profit', 'won', 'homeGoals', 'awayGoals', 'kickoff', 'savedAt', 'settledAt', 'dataQuality', 'source'];
  const open = openRows.map((row) => ['pending', row.fixtureId, row.match, row.market, row.odds, row.confidence, row.expectedValue, '', '', '', '', row.kickoff, row.savedAt, '', row.dataQuality, row.source]);
  const settled = settledRows.map((row) => ['settled', row.fixtureId, row.match, row.market, row.odds, row.confidence, row.expectedValue, row.profit, row.won, row.homeGoals ?? '', row.awayGoals ?? '', row.kickoff, row.savedAt, row.settledAt, row.dataQuality, row.source]);
  return [header, ...open, ...settled].map((line) => line.map(csvEscape).join(',')).join('\n');
}

export default function V2TrackerV3Panel() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [openHistory, setOpenHistory] = useState<SavedPickRow[]>([]);
  const [settledHistory, setSettledHistory] = useState<SettledRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
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
      setOpenHistory(readJsonArray<SavedPickRow>(TRACKER_STORAGE_KEY));
      setSettledHistory(readJsonArray<SettledRow>(SETTLED_STORAGE_KEY));
    }

    load().catch((error) => setSettlementStatus(error instanceof Error ? error.message : 'Kunne ikke laste tracker.'));
  }, []);

  const currentOpenRows = useMemo<SavedPickRow[]>(() => {
    const source = dashboard?.source ?? 'unknown';
    const dataQuality = dataQualityFromSource(source);
    return (dashboard?.recommendations ?? []).slice(0, 5).map((rec) => ({
      fixtureId: rec.fixtureId,
      match: rec.match,
      market: formatMarket(rec.market),
      odds: rec.bookmakerOdds,
      confidence: rec.confidence,
      expectedValue: rec.expectedValue,
      kickoff: rec.kickoff,
      savedAt: new Date().toISOString(),
      snapshotId: dashboard?.generatedAt ?? new Date().toISOString(),
      dataQuality,
      source,
    }));
  }, [dashboard]);

  useEffect(() => {
    if (currentOpenRows.length === 0) return;
    const merged = dedupeOpenRows([...readJsonArray<SavedPickRow>(TRACKER_STORAGE_KEY), ...currentOpenRows]);
    saveJsonArray(TRACKER_STORAGE_KEY, merged);
    setOpenHistory(merged);
  }, [currentOpenRows]);

  const seedSettledRows = useMemo(() => buildSeedSettledRows(), []);
  const allSettledRows = useMemo(() => dedupeSettledRows([...settledHistory, ...seedSettledRows]), [settledHistory, seedSettledRows]);
  const settlementQueue = useMemo(() => openHistory.filter((row) => isSettlementReady(row.kickoff)).slice(0, 10), [openHistory]);

  const filteredOpen = useMemo(() => {
    return openHistory.filter((row) => {
      if (statusFilter === 'settled') return false;
      if (marketFilter !== 'all' && row.market !== marketFilter) return false;
      if (qualityFilter !== 'all' && row.dataQuality !== qualityFilter) return false;
      return true;
    });
  }, [openHistory, statusFilter, marketFilter, qualityFilter]);

  const filteredSettled = useMemo(() => {
    return allSettledRows.filter((row) => {
      if (statusFilter === 'pending') return false;
      if (marketFilter !== 'all' && row.market !== marketFilter) return false;
      if (qualityFilter !== 'all' && row.dataQuality !== qualityFilter) return false;
      return true;
    });
  }, [allSettledRows, statusFilter, marketFilter, qualityFilter]);

  const marketOptions = useMemo(() => {
    return Array.from(new Set([...openHistory.map((row) => row.market), ...allSettledRows.map((row) => row.market)])).sort();
  }, [openHistory, allSettledRows]);

  const summary = useMemo(() => {
    const totalSettled = allSettledRows.length;
    const wins = allSettledRows.filter((row) => row.won).length;
    const profit = allSettledRows.reduce((sum, row) => sum + row.profit, 0);
    const avgEv = openHistory.length ? openHistory.reduce((sum, row) => sum + row.expectedValue, 0) / openHistory.length : 0;
    const greenRows = openHistory.filter((row) => row.dataQuality === 'green').length + allSettledRows.filter((row) => row.dataQuality === 'green').length;
    const allRows = openHistory.length + allSettledRows.length;
    return {
      pending: openHistory.length,
      settled: totalSettled,
      hitRate: totalSettled ? wins / totalSettled : 0,
      profit,
      roi: totalSettled ? profit / totalSettled : 0,
      avgEv,
      dataQualityShare: allRows ? greenRows / allRows : 0,
    };
  }, [openHistory, allSettledRows]);

  const marketStats = useMemo(() => {
    const map = new Map<string, { market: string; picks: number; wins: number; profit: number; roi: number }>();
    for (const row of allSettledRows) {
      const current = map.get(row.market) ?? { market: row.market, picks: 0, wins: 0, profit: 0, roi: 0 };
      current.picks += 1;
      current.wins += row.won ? 1 : 0;
      current.profit += row.profit;
      current.roi = current.picks ? current.profit / current.picks : 0;
      map.set(row.market, current);
    }
    return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
  }, [allSettledRows]);

  const profitTrend = useMemo(() => {
    let cumulative = 0;
    return [...allSettledRows]
      .sort((a, b) => new Date(a.settledAt).getTime() - new Date(b.settledAt).getTime())
      .map((row) => {
        cumulative += row.profit;
        return { ...row, cumulative };
      })
      .slice(-6);
  }, [allSettledRows]);

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

      const newlySettled: SettledRow[] = (json.settled ?? []).map((row) => ({
        ...row,
        settlementSource: 'auto',
      }));
      const mergedSettled = dedupeSettledRows([...readJsonArray<SettledRow>(SETTLED_STORAGE_KEY), ...newlySettled]);
      const settledKeys = new Set(newlySettled.map(rowKey));
      const remainingOpen = readJsonArray<SavedPickRow>(TRACKER_STORAGE_KEY).filter((row) => !settledKeys.has(rowKey(row)));

      saveJsonArray(SETTLED_STORAGE_KEY, mergedSettled);
      saveJsonArray(TRACKER_STORAGE_KEY, remainingOpen);
      setSettledHistory(mergedSettled);
      setOpenHistory(remainingOpen);
      setSettlementStatus(`Sjekket ${settlementQueue.length} picks · ${newlySettled.length} settled · ${(json.pending ?? []).length} pending · ${(json.unsupported ?? []).length} unsupported`);
    } catch (error) {
      setSettlementStatus(error instanceof Error ? error.message : 'Ukjent settlement-feil.');
    } finally {
      setSettlementLoading(false);
    }
  }

  function exportCsv() {
    downloadText(`pl-tracker-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(openHistory, allSettledRows), 'text/csv');
  }

  function exportJson() {
    downloadText(
      `pl-tracker-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ exportedAt: new Date().toISOString(), source: dashboard?.source, openHistory, settledHistory: allSettledRows, summary, marketStats }, null, 2),
      'application/json',
    );
  }

  function resetAll() {
    saveJsonArray(TRACKER_STORAGE_KEY, []);
    saveJsonArray(SETTLED_STORAGE_KEY, []);
    setOpenHistory([]);
    setSettledHistory([]);
    setSettlementStatus('Trackerhistorikk er nullstilt. Seed-demo vises fortsatt i settled historikk.');
  }

  return (
    <section className="hero-card">
      <div className="hero-topline">
        <div>
          <div className="eyebrow">Premier League Betting Model</div>
          <h1 className="hero-title">V2 Tracker</h1>
          <p className="hero-subtitle">
            Tracker med pending/settled-filter, CSV/JSON-eksport, datakvalitet, market stats, profittrend og settlement queue.
          </p>
        </div>
        <div className="updated-at">Kilde: {dashboard?.source ?? 'laster...'} · {dataQualityLabel(dataQualityFromSource(dashboard?.source))}</div>
      </div>

      <div className="summary-grid" style={{ marginTop: 20 }}>
        <div className="summary-card"><div className="summary-label">Pending picks</div><div className="summary-value">{summary.pending}</div></div>
        <div className="summary-card"><div className="summary-label">Settled picks</div><div className="summary-value">{summary.settled}</div></div>
        <div className="summary-card"><div className="summary-label">ROI</div><div className="summary-value green">{pct(summary.roi)}</div></div>
        <div className="summary-card"><div className="summary-label">Profit</div><div className="summary-value green">{summary.profit.toFixed(2)}u</div></div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Tracker controls</h3>
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
            <label className="field-label">Marked</label>
            <select className="select-input" value={marketFilter} onChange={(event) => setMarketFilter(event.target.value)}>
              <option value="all">Alle</option>
              {marketOptions.map((market) => <option key={market} value={market}>{market}</option>)}
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
          <div>
            <label className="field-label">Handlinger</label>
            <div className="app-nav-links" style={{ justifyContent: 'flex-start' }}>
              <button type="button" className="app-nav-link" onClick={exportCsv}>CSV</button>
              <button type="button" className="app-nav-link" onClick={exportJson}>JSON</button>
              <button type="button" className="app-nav-link" onClick={resetAll}>Reset</button>
            </div>
          </div>
        </div>
      </div>

      <div className="summary-grid" style={{ marginTop: 16 }}>
        <div className="summary-card"><div className="summary-label">Treffrate</div><div className="summary-value">{pct(summary.hitRate)}</div></div>
        <div className="summary-card"><div className="summary-label">Snitt EV pending</div><div className="summary-value green">{pct(summary.avgEv)}</div></div>
        <div className="summary-card"><div className="summary-label">Grønn datakvalitet</div><div className="summary-value">{pct(summary.dataQualityShare)}</div></div>
        <div className="summary-card"><div className="summary-label">Klar for settlement</div><div className="summary-value">{settlementQueue.length}</div></div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Settlement queue</h3>
        <p className="section-subtitle">Picks blir klare for settlement to timer etter kickoff.</p>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          <button type="button" onClick={runSettlementCheck} disabled={settlementLoading || settlementQueue.length === 0} className="metric-pill" style={{ cursor: settlementQueue.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left' }}>
            <div className="metric-pill-label">Handling</div>
            <div className="metric-pill-value">{settlementLoading ? 'Sjekker...' : 'Kjør settlement-sjekk'}</div>
          </button>
          {settlementStatus ? <div className="metric-pill"><div className="metric-pill-label">Status</div><div className="metric-pill-value">{settlementStatus}</div></div> : null}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Market stats</h3>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {marketStats.length === 0 ? <div className="empty-box">Ingen market stats ennå.</div> : marketStats.map((row) => (
            <div key={row.market} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">{row.picks} picks · ROI {pct(row.roi)}</div>
              <div className="metric-pill-value">{row.market}</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>Wins {row.wins}/{row.picks} · Profit {row.profit > 0 ? '+' : ''}{row.profit.toFixed(2)}u</p>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Profit trend</h3>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {profitTrend.length === 0 ? <div className="empty-box">Ingen profit trend ennå.</div> : profitTrend.map((row) => (
            <div key={`${row.fixtureId}-${row.market}-${row.settledAt}`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">{formatDate(row.settledAt)} · {row.won ? 'Win' : 'Loss'}</div>
              <div className="metric-pill-value">{row.cumulative > 0 ? '+' : ''}{row.cumulative.toFixed(2)}u</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>{row.match} · {row.market}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Pending picks</h3>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {filteredOpen.length === 0 ? <div className="empty-box">Ingen pending picks innenfor filtrene.</div> : filteredOpen.slice(0, 12).map((row) => (
            <div key={`${row.fixtureId}-${row.market}-pending`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">Pending · {row.market} · {dataQualityLabel(row.dataQuality)}</div>
              <div className="metric-pill-value">{row.match}</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>Kickoff {formatDate(row.kickoff)} · Odds {row.odds.toFixed(2)} · EV {pct(row.expectedValue)} · Confidence {row.confidence.toFixed(0)}/100</p>
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel" style={{ marginTop: 16 }}>
        <h3>Settled history</h3>
        <div className="metrics-grid" style={{ marginTop: 14 }}>
          {filteredSettled.length === 0 ? <div className="empty-box">Ingen settled picks innenfor filtrene.</div> : filteredSettled.slice(0, 12).map((row) => (
            <div key={`${row.fixtureId}-${row.market}-${row.settlementSource}`} className="metric-pill" style={{ textAlign: 'left' }}>
              <div className="metric-pill-label">{row.settlementSource === 'auto' ? 'Auto' : 'Seed'} · {row.won ? 'Win' : 'Loss'} · {row.market}</div>
              <div className="metric-pill-value">{row.match}</div>
              <p className="section-subtitle" style={{ marginTop: 8 }}>
                Resultat {typeof row.homeGoals === 'number' ? `${row.homeGoals}-${row.awayGoals}` : '–'} · Profit {row.profit > 0 ? '+' : ''}{row.profit.toFixed(2)}u · {dataQualityLabel(row.dataQuality)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
