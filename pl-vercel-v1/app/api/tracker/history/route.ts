import { NextResponse } from 'next/server';
import {
  clearPersistentTrackerStore,
  getPersistentTrackerStore,
  getTrackerStorageMode,
  mergePersistentOpenRows,
  mergePersistentSettledRows,
  replacePersistentTrackerStore,
} from '@/lib/tracker-persistent-store';
import { TrackerSavedPick, TrackerSettledPick } from '@/lib/tracker-store';

export async function GET() {
  const store = await getPersistentTrackerStore();
  return NextResponse.json({ ok: true, storageMode: getTrackerStorageMode(), ...store });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const open = Array.isArray(body?.open) ? (body.open as TrackerSavedPick[]) : [];
    const settled = Array.isArray(body?.settled) ? (body.settled as TrackerSettledPick[]) : [];

    if (body?.mode === 'replace') {
      const store = await replacePersistentTrackerStore({ open, settled });
      return NextResponse.json({ ok: true, storageMode: getTrackerStorageMode(), ...store });
    }

    let store = await getPersistentTrackerStore();
    if (open.length) store = await mergePersistentOpenRows(open);
    if (settled.length) store = await mergePersistentSettledRows(settled);

    return NextResponse.json({ ok: true, storageMode: getTrackerStorageMode(), ...store });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown tracker history error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const kind = body?.kind === 'settled' || body?.kind === 'all' ? body.kind : 'open';
    const store = await clearPersistentTrackerStore(kind);
    return NextResponse.json({ ok: true, storageMode: getTrackerStorageMode(), ...store });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown tracker clear error' },
      { status: 500 }
    );
  }
}
