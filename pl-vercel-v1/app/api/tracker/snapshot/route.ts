import { NextResponse } from 'next/server';
import { getLiveDashboard } from '@/lib/live-data';
import { getPersistentTrackerStore, mergePersistentOpenRows, getTrackerStorageMode } from '@/lib/tracker-persistent-store';
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

function rowKey(row: { fixtureId: string; market: string }) {
  return `${row.fixtureId}__${row.market}`;
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
    rowCount: snapshot.rows.length,
    message: snapshot.rows.length > 0
      ? `Snapshot has ${snapshot.rows.length} recommendation rows.`
      : 'Snapshot has 0 recommendation rows. The model did not find positive EV picks right now.',
    ...snapshot,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Number(body?.limit ?? 8);
    const snapshot = await buildSnapshotRows(Number.isFinite(limit) ? limit : 8);
    const before = await getPersistentTrackerStore();
    const beforeKeys = new Set(before.open.map(rowKey));
    const snapshotKeys = snapshot.rows.map(rowKey);
    const addedRows = snapshotKeys.filter((key) => !beforeKeys.has(key)).length;
    const updatedRows = snapshot.rows.length - addedRows;
    const store = await mergePersistentOpenRows(snapshot.rows);

    return NextResponse.json({
      ok: true,
      inserted: snapshot.rows.length,
      addedRows,
      updatedRows,
      beforeOpenRows: before.open.length,
      afterOpenRows: store.open.length,
      storageMode: getTrackerStorageMode(),
      source: snapshot.source,
      generatedAt: snapshot.generatedAt,
      message: snapshot.rows.length === 0
        ? 'No rows saved because the model found 0 positive EV recommendations right now.'
        : addedRows === 0
          ? `Saved snapshot updated ${updatedRows} existing open rows. Open row count did not increase because these picks were already in tracker.`
          : `Saved snapshot added ${addedRows} new open rows and updated ${updatedRows} existing rows.`,
      ...store,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown snapshot error' },
      { status: 500 }
    );
  }
}
