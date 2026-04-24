import { NextResponse } from 'next/server';
import { getPersistentTrackerStore, getTrackerStorageMode } from '@/lib/tracker-persistent-store';

type SettledLike = {
  market?: string;
  odds?: number;
  expectedValue?: number;
  confidence?: number;
  won?: boolean;
  profit?: number;
  dataQuality?: string;
  source?: string;
  settledAt?: string;
};

type OpenLike = {
  market?: string;
  expectedValue?: number;
  confidence?: number;
  dataQuality?: string;
  source?: string;
};

function pctSafe(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function qualityOf(row: { dataQuality?: string; source?: string }) {
  if (row.dataQuality === 'green' || row.source === 'live') return 'green';
  if (row.dataQuality === 'yellow' || row.source === 'partial-live') return 'yellow';
  return 'red';
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}

export async function GET() {
  const store = await getPersistentTrackerStore();
  const open = store.open as OpenLike[];
  const settled = store.settled as SettledLike[];

  const settledCount = settled.length;
  const pendingCount = open.length;
  const wins = settled.filter((row) => row.won).length;
  const profit = settled.reduce((sum, row) => sum + (typeof row.profit === 'number' ? row.profit : 0), 0);
  const avgOdds = settledCount ? settled.reduce((sum, row) => sum + (typeof row.odds === 'number' ? row.odds : 0), 0) / settledCount : 0;
  const avgEv = open.length ? open.reduce((sum, row) => sum + (typeof row.expectedValue === 'number' ? row.expectedValue : 0), 0) / open.length : 0;
  const avgConfidence = open.length ? open.reduce((sum, row) => sum + (typeof row.confidence === 'number' ? row.confidence : 0), 0) / open.length : 0;

  const byMarket = new Map<string, { market: string; picks: number; wins: number; profit: number; roi: number; avgOdds: number }>();
  for (const row of settled) {
    const market = row.market ?? 'unknown';
    const current = byMarket.get(market) ?? { market, picks: 0, wins: 0, profit: 0, roi: 0, avgOdds: 0 };
    current.picks += 1;
    current.wins += row.won ? 1 : 0;
    current.profit += typeof row.profit === 'number' ? row.profit : 0;
    current.avgOdds += typeof row.odds === 'number' ? row.odds : 0;
    current.roi = pctSafe(current.profit, current.picks);
    byMarket.set(market, current);
  }

  const marketStats = Array.from(byMarket.values()).map((row) => ({
    ...row,
    profit: round(row.profit),
    roi: round(row.roi),
    hitRate: round(pctSafe(row.wins, row.picks)),
    avgOdds: round(pctSafe(row.avgOdds, row.picks)),
  })).sort((a, b) => b.profit - a.profit);

  const qualityCounts = [...open, ...settled].reduce<Record<string, number>>((acc, row) => {
    const quality = qualityOf(row);
    acc[quality] = (acc[quality] ?? 0) + 1;
    return acc;
  }, { green: 0, yellow: 0, red: 0 });

  let cumulative = 0;
  const profitTrend = [...settled]
    .sort((a, b) => new Date(a.settledAt ?? '').getTime() - new Date(b.settledAt ?? '').getTime())
    .map((row) => {
      cumulative += typeof row.profit === 'number' ? row.profit : 0;
      return {
        market: row.market ?? 'unknown',
        settledAt: row.settledAt,
        profit: round(typeof row.profit === 'number' ? row.profit : 0),
        cumulative: round(cumulative),
      };
    });

  return NextResponse.json({
    ok: true,
    storageMode: getTrackerStorageMode(),
    updatedAt: store.updatedAt,
    summary: {
      pendingCount,
      settledCount,
      wins,
      hitRate: round(pctSafe(wins, settledCount)),
      profit: round(profit),
      roi: round(pctSafe(profit, settledCount)),
      avgOdds: round(avgOdds),
      avgEv: round(avgEv),
      avgConfidence: round(avgConfidence),
    },
    marketStats,
    qualityCounts,
    profitTrend,
  });
}
