import { NextResponse } from 'next/server';
import { getLiveDashboard } from '@/lib/live-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const round = Number(searchParams.get('round') ?? 34);

  try {
    const dashboard = await getLiveDashboard(round);
    return NextResponse.json({ round: dashboard.round, dataMode: dashboard.source, generatedAt: dashboard.generatedAt, recommendations: dashboard.recommendations });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
