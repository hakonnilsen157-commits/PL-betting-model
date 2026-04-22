import { NextResponse } from 'next/server';
import { getRoundFixtures } from '@/lib/model';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const round = Number(searchParams.get('round') ?? 34);

  return NextResponse.json({
    round,
    dataMode: process.env.DATA_MODE ?? 'mock',
    fixtures: getRoundFixtures(round),
  });
}
