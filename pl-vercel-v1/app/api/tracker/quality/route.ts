import { NextResponse } from 'next/server';
import { getPersistentTrackerStore, getTrackerStorageMode } from '@/lib/tracker-persistent-store';

type TrackerRowLike = {
  fixtureId?: string;
  match?: string;
  market?: string;
  odds?: number;
  confidence?: number;
  expectedValue?: number;
  dataQuality?: string;
  source?: string;
  kickoff?: string;
  savedAt?: string;
  settledAt?: string;
};

function qualityOf(row: TrackerRowLike) {
  if (row.dataQuality === 'green' || row.source === 'live') return 'green';
  if (row.dataQuality === 'yellow' || row.source === 'partial-live') return 'yellow';
  return 'red';
}

function rowIssues(row: TrackerRowLike, status: 'pending' | 'settled') {
  const issues: string[] = [];

  if (!row.fixtureId) issues.push('Mangler fixtureId');
  if (!row.match) issues.push('Mangler kampnavn');
  if (!row.market) issues.push('Mangler marked');
  if (typeof row.odds !== 'number' || row.odds <= 1) issues.push('Ugyldig odds');
  if (typeof row.expectedValue !== 'number') issues.push('Mangler EV');
  if (typeof row.confidence !== 'number') issues.push('Mangler confidence');
  if (!row.kickoff) issues.push('Mangler kickoff');
  if (!row.savedAt) issues.push('Mangler savedAt');
  if (status === 'settled' && !row.settledAt) issues.push('Mangler settledAt');

  const quality = qualityOf(row);
  if (quality === 'red') issues.push('Lav datakvalitet');
  if (typeof row.confidence === 'number' && row.confidence < 45) issues.push('Lav confidence');
  if (typeof row.expectedValue === 'number' && row.expectedValue < 0.02) issues.push('Lav EV');

  return issues;
}

function scoreRow(row: TrackerRowLike, status: 'pending' | 'settled') {
  const issues = rowIssues(row, status);
  const quality = qualityOf(row);
  let score = 100;

  score -= issues.length * 10;
  if (quality === 'yellow') score -= 15;
  if (quality === 'red') score -= 30;
  if (typeof row.confidence === 'number') score += Math.max(-10, Math.min(10, (row.confidence - 55) / 2));
  if (typeof row.expectedValue === 'number') score += Math.max(-8, Math.min(12, row.expectedValue * 100));

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function GET() {
  const store = await getPersistentTrackerStore();
  const pending = (store.open as TrackerRowLike[]).map((row) => ({
    status: 'pending' as const,
    fixtureId: row.fixtureId,
    match: row.match,
    market: row.market,
    quality: qualityOf(row),
    score: scoreRow(row, 'pending'),
    issues: rowIssues(row, 'pending'),
  }));

  const settled = (store.settled as TrackerRowLike[]).map((row) => ({
    status: 'settled' as const,
    fixtureId: row.fixtureId,
    match: row.match,
    market: row.market,
    quality: qualityOf(row),
    score: scoreRow(row, 'settled'),
    issues: rowIssues(row, 'settled'),
  }));

  const rows = [...pending, ...settled];
  const avgScore = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;
  const issueCounts = rows.reduce<Record<string, number>>((acc, row) => {
    for (const issue of row.issues) acc[issue] = (acc[issue] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    ok: true,
    storageMode: getTrackerStorageMode(),
    updatedAt: store.updatedAt,
    summary: {
      totalRows: rows.length,
      pendingRows: pending.length,
      settledRows: settled.length,
      avgScore,
      issueCounts,
      greenRows: rows.filter((row) => row.quality === 'green').length,
      yellowRows: rows.filter((row) => row.quality === 'yellow').length,
      redRows: rows.filter((row) => row.quality === 'red').length,
    },
    rows: rows.sort((a, b) => a.score - b.score),
  });
}
