import { NextResponse } from 'next/server';
import {
  clearTrackerStore,
  getTrackerStore,
  mergeTrackerOpenRows,
  mergeTrackerSettledRows,
  replaceTrackerStore,
  TrackerSavedPick,
  TrackerSettledPick,
} from '@/lib/tracker-store';

export async function GET() {
  return NextResponse.json({ ok: true, ...getTrackerStore() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const open = Array.isArray(body?.open) ? (body.open as TrackerSavedPick[]) : [];
    const settled = Array.isArray(body?.settled) ? (body.settled as TrackerSettledPick[]) : [];

    if (body?.mode === 'replace') {
      return NextResponse.json({ ok: true, ...replaceTrackerStore({ open, settled }) });
    }

    let store = getTrackerStore();
    if (open.length) store = mergeTrackerOpenRows(open);
    if (settled.length) store = mergeTrackerSettledRows(settled);

    return NextResponse.json({ ok: true, ...store });
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
    return NextResponse.json({ ok: true, ...clearTrackerStore(kind) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown tracker clear error' },
      { status: 500 }
    );
  }
}
