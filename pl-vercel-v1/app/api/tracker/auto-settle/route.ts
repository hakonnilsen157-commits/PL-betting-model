import { NextResponse } from 'next/server';
import { getTrackerStore, mergeTrackerSettledRows } from '@/lib/tracker-store';
import { isSettlementReady, settleTrackerPicks } from '@/lib/tracker-settlement';

export async function POST() {
  try {
    const store = getTrackerStore();
    const ready = store.open.filter((pick) => isSettlementReady(pick.kickoff)).slice(0, 20);

    if (!ready.length) {
      return NextResponse.json({
        ok: true,
        settled: [],
        pending: [],
        unsupported: [],
        checkedAt: new Date().toISOString(),
        store,
        message: 'No picks ready for settlement',
      });
    }

    const result = await settleTrackerPicks(ready);
    const nextStore = result.settled.length > 0 ? mergeTrackerSettledRows(result.settled) : getTrackerStore();

    return NextResponse.json({
      ok: true,
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
