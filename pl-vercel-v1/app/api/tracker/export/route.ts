import { NextResponse } from 'next/server';
import { getPersistentTrackerStore, getTrackerStorageMode } from '@/lib/tracker-persistent-store';

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(open: unknown[], settled: unknown[]) {
  const header = [
    'status',
    'fixtureId',
    'match',
    'market',
    'odds',
    'confidence',
    'expectedValue',
    'profit',
    'won',
    'homeGoals',
    'awayGoals',
    'kickoff',
    'savedAt',
    'settledAt',
    'snapshotId',
  ];

  const openRows = open.map((row) => {
    const item = row as Record<string, unknown>;
    return [
      'pending',
      item.fixtureId,
      item.match,
      item.market,
      item.odds,
      item.confidence,
      item.expectedValue,
      '',
      '',
      '',
      '',
      item.kickoff,
      item.savedAt,
      '',
      item.snapshotId,
    ];
  });

  const settledRows = settled.map((row) => {
    const item = row as Record<string, unknown>;
    return [
      'settled',
      item.fixtureId,
      item.match,
      item.market,
      item.odds,
      item.confidence,
      item.expectedValue,
      item.profit,
      item.won,
      item.homeGoals,
      item.awayGoals,
      item.kickoff,
      item.savedAt,
      item.settledAt,
      item.snapshotId,
    ];
  });

  return [header, ...openRows, ...settledRows]
    .map((line) => line.map(csvEscape).join(','))
    .join('\n');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'json';
  const store = await getPersistentTrackerStore();

  if (format === 'csv') {
    const csv = toCsv(store.open, store.settled);
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pl-tracker-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    exportedAt: new Date().toISOString(),
    storageMode: getTrackerStorageMode(),
    ...store,
  });
}
