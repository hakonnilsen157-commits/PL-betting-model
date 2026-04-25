import { NextResponse } from 'next/server';
import { getPersistentTrackerStore, getTrackerStorageMode } from '@/lib/tracker-persistent-store';

async function pingUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return {
      configured: false,
      ok: false,
      message: 'Upstash Redis environment variables are not configured.',
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['PING']),
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        configured: true,
        ok: false,
        message: `Upstash ping failed with HTTP ${response.status}: ${text.slice(0, 160)}`,
      };
    }

    const json = await response.json();
    return {
      configured: true,
      ok: json.result === 'PONG',
      message: json.result === 'PONG' ? 'Upstash Redis responded with PONG.' : 'Upstash responded, but not with PONG.',
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown Upstash ping error',
    };
  }
}

export async function GET() {
  try {
    const [store, redis] = await Promise.all([
      getPersistentTrackerStore(),
      pingUpstash(),
    ]);

    return NextResponse.json({
      ok: true,
      storageMode: getTrackerStorageMode(),
      redis,
      summary: {
        openRows: store.open.length,
        settledRows: store.settled.length,
        updatedAt: store.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, storageMode: getTrackerStorageMode(), error: error instanceof Error ? error.message : 'Unknown storage status error' },
      { status: 500 }
    );
  }
}
