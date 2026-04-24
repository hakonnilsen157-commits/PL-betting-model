import { NextResponse } from 'next/server';
import { settleTrackerPicks } from '@/lib/tracker-settlement';
import { TrackerSavedPick } from '@/lib/tracker-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const picks = Array.isArray(body?.picks) ? (body.picks as TrackerSavedPick[]) : [];
    const result = await settleTrackerPicks(picks);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown settlement error',
      },
      { status: 500 }
    );
  }
}
