import { NextResponse } from 'next/server';
import {
  getPersistentTrackerStore,
  getTrackerStorageMode,
  mergePersistentSettledRows,
} from '@/lib/tracker-persistent-store';
import { isSettlementReady, settleTrackerPicks } from '@/lib/tracker-settlement';

export async function POST() {
  try {
    const store = await getPersistentTrackerStore();
    const ready = store.open.filter((pick) => isSettlementReady(pick.kickoff)).slice(0, 20);

    if (!ready.length) {
      return NextResponse.json({
        ok: true,
        storageMode: getTrackerStorageMode(),
        settled: [],
        pending: [],
        unsupported: [],
        checkedAt: new Date().toISOString(),
        store,
        message: 'No picks ready for settlement',
      });
    }

    const result = await settleTrackerPicks(ready);
    const nextStore = result.settled.length > 0 ? await mergePersistentSettledRows(result.settled) : await getPersistentTrackerStore();

    return NextResponse.json({
      ok: true,
      storageMode: getTrackerStorageMode(),
      ...result,
      store: nextStore,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown auto-settlement error',
      },
      { status: 500 }
    );
  }
}
