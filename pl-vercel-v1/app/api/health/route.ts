import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    dataMode: process.env.DATA_MODE ?? 'mock',
  });
}
