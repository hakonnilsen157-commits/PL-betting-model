import { NextResponse } from 'next/server';
import { getLiveDashboard } from '@/lib/live-data';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (expected && authHeader !== expected) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const dashboard = await getLiveDashboard();
    return NextResponse.json({ ok: true, source: dashboard.source, round: dashboard.round, recommendations: dashboard.recommendations.length, fixtures: dashboard.fixtures.length, ranAt: dashboard.generatedAt, note: 'I denne versjonen hentes live-data direkte. Neste steg er å lagre snapshots i database.' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
