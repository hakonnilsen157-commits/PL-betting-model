import { NextResponse } from 'next/server';
import { getLiveDashboard } from '@/lib/live-data';
import { mergePersistentOpenRows, getTrackerStorageMode } from '@/lib/tracker-persistent-store';
import { TrackerDataQuality, TrackerSavedPick } from '@/lib/tracker-store';

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

function dataQualityFromSource(source?: string): TrackerDataQuality {
  if (source === 'live') return 'green';
  if (source === 'partial-live') return 'yellow';
  return 'red';
}

async function buildSnapshotRows(limit = 8): Promise<{ rows: TrackerSavedPick[]; source?: string; generatedAt?: string }> {
  const dashboard = await getLiveDashboard();
  const source = dashboard.source ?? 'unknown';
  const dataQuality = dataQualityFromSource(source);
  const generatedAt = dashboard.generatedAt ?? new Date().toISOString();

  const rows = (dashboard.recommendations ?? []).slice(0, limit).map((rec) => ({
    fixtureId: rec.fixtureId,
    match: rec.match,
    market: marketLabel(rec.market),
    odds: rec.bookmakerOdds,
    confidence: rec.confidence,
    expectedValue: rec.expectedValue,
    kickoff: rec.kickoff,
    savedAt: new Date().toISOString(),
    snapshotId: generatedAt,
    dataQuality,
    source,
  }));

  return { rows, source, generatedAt };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? 8);
  const snapshot = await buildSnapshotRows(Number.isFinite(limit) ? limit : 8);

  return NextResponse.json({
    ok: true,
    storageMode: getTrackerStorageMode(),
    ...snapshot,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Number(body?.limit ?? 8);
    const snapshot = await buildSnapshotRows(Number.isFinite(limit) ? limit : 8);
    const store = await mergePersistentOpenRows(snapshot.rows);

    return NextResponse.json({
      ok: true,
      inserted: snapshot.rows.length,
      storageMode: getTrackerStorageMode(),
      source: snapshot.source,
      generatedAt: snapshot.generatedAt,
      ...store,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown snapshot error' },
      { status: 500 }
    );
  }
}
