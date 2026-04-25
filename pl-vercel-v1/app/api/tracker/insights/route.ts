import { NextResponse } from 'next/server';
import { getPersistentTrackerStore, getTrackerStorageMode } from '@/lib/tracker-persistent-store';

type TrackerRowLike = {
  fixtureId?: string;
  match?: string;
  market?: string;
  odds?: number;
  confidence?: number;
  expectedValue?: number;
  dataQuality?: 'green' | 'yellow' | 'red';
  source?: string;
  won?: boolean;
  profit?: number;
  settledAt?: string;
};

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function qualityOf(row: TrackerRowLike) {
  if (row.dataQuality === 'green' || row.source === 'live') return 'green';
  if (row.dataQuality === 'yellow' || row.source === 'partial-live') return 'yellow';
  return 'red';
}

function avg(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function groupByMarket(rows: TrackerRowLike[]) {
  const map = new Map<string, TrackerRowLike[]>();
  for (const row of rows) {
    const key = row.market ?? 'Ukjent marked';
    map.set(key, [...(map.get(key) ?? []), row]);
  }
  return Array.from(map.entries()).map(([market, marketRows]) => {
    const settled = marketRows.filter((row) => typeof row.profit === 'number');
    const profit = settled.reduce((sum, row) => sum + (row.profit ?? 0), 0);
    const wins = settled.filter((row) => row.won).length;
    return {
      market,
      picks: marketRows.length,
      settled: settled.length,
      profit,
      roi: settled.length ? profit / settled.length : 0,
      hitRate: settled.length ? wins / settled.length : 0,
      avgEv: avg(marketRows.map((row) => row.expectedValue ?? 0)),
      avgConfidence: avg(marketRows.map((row) => row.confidence ?? 0)),
    };
  }).sort((a, b) => b.profit - a.profit);
}

export async function GET() {
  const store = await getPersistentTrackerStore();
  const open = store.open as TrackerRowLike[];
  const settled = store.settled as TrackerRowLike[];
  const allRows = [...open, ...settled];

  const profit = settled.reduce((sum, row) => sum + (row.profit ?? 0), 0);
  const wins = settled.filter((row) => row.won).length;
  const roi = settled.length ? profit / settled.length : 0;
  const hitRate = settled.length ? wins / settled.length : 0;
  const qualityCounts = {
    green: allRows.filter((row) => qualityOf(row) === 'green').length,
    yellow: allRows.filter((row) => qualityOf(row) === 'yellow').length,
    red: allRows.filter((row) => qualityOf(row) === 'red').length,
  };

  const marketInsights = groupByMarket(allRows);
  const recommendations: string[] = [];

  if (getTrackerStorageMode() !== 'upstash-redis') {
    recommendations.push('Sett opp Upstash Redis før trackerhistorikken brukes seriøst. Nå kan historikk forsvinne ved deploy/restart.');
  }

  if (settled.length < 25) {
    recommendations.push(`Samle flere settled picks før modellen vurderes. Nå er sample kun ${settled.length}.`);
  } else if (roi > 0.05) {
    recommendations.push(`ROI er positiv (${pct(roi)}). Fortsett å logge, men sjekk at dette holder seg over flere markeder og flere kamper.`);
  } else if (roi < 0) {
    recommendations.push(`ROI er negativ (${pct(roi)}). Stram inn på EV, confidence eller markedene som underpresterer.`);
  }

  if (qualityCounts.red > qualityCounts.green + qualityCounts.yellow) {
    recommendations.push('Mange tracker-rader har rød datakvalitet. Ikke bruk disse tungt i backtest før live datakilder er bedre kontrollert.');
  }

  const weakMarkets = marketInsights.filter((market) => market.settled >= 5 && market.roi < -0.05).slice(0, 3);
  if (weakMarkets.length) {
    recommendations.push(`Vurder å skru ned marked(er) med svak ROI: ${weakMarkets.map((item) => item.market).join(', ')}.`);
  }

  const strongMarkets = marketInsights.filter((market) => market.settled >= 5 && market.roi > 0.05).slice(0, 3);
  if (strongMarkets.length) {
    recommendations.push(`Følg ekstra med på marked(er) med positiv historikk: ${strongMarkets.map((item) => item.market).join(', ')}.`);
  }

  if (!recommendations.length) {
    recommendations.push('Trackerflyten ser ryddig ut. Neste steg er mer historikk, mer settlement og strengere segmentering i backtest.');
  }

  return NextResponse.json({
    ok: true,
    storageMode: getTrackerStorageMode(),
    updatedAt: store.updatedAt,
    summary: {
      pendingCount: open.length,
      settledCount: settled.length,
      profit,
      roi,
      hitRate,
      qualityCounts,
    },
    marketInsights,
    recommendations,
  });
}
