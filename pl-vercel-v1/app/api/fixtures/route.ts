import { NextResponse } from 'next/server';
import { getLiveDashboard } from '@/lib/live-data';

export async function GET() {
  try {
    const dashboard = await getLiveDashboard();
    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
