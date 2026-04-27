import { NextResponse } from 'next/server';

const ODDS_BASE = 'https://api.the-odds-api.com/v4';
const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';

const ODDS_REGIONS = process.env.ODDS_REGIONS ?? 'uk,eu';
const SPORT_KEY = process.env.ODDS_SPORT_KEY ?? 'soccer_epl';
const FOOTBALL_DATA_COMPETITION = process.env.FOOTBALL_DATA_COMPETITION ?? 'PL';

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
  status?: number;
};

async function checkFootballData(): Promise<CheckResult> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return { name: 'football-data.org', ok: false, detail: 'Missing FOOTBALL_DATA_API_KEY' };
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const end = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const response = await fetch(`${FOOTBALL_DATA_BASE}/competitions/${FOOTBALL_DATA_COMPETITION}/matches?dateFrom=${today}&dateTo=${end}`, {
      cache: 'no-store',
      headers: {
        'X-Auth-Token': apiKey,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      return {
        name: 'football-data.org',
        ok: false,
        status: response.status,
        detail: text.slice(0, 300),
      };
    }

    const json = JSON.parse(text);
    const count = Array.isArray(json.matches) ? json.matches.length : 0;
    return {
      name: 'football-data.org',
      ok: true,
      status: response.status,
      detail: `${count} upcoming matches found for ${FOOTBALL_DATA_COMPETITION}`,
    };
  } catch (error) {
    return {
      name: 'football-data.org',
      ok: false,
      detail: error instanceof Error ? error.message : 'Unknown football-data error',
    };
  }
}

async function checkOddsApi(): Promise<CheckResult> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return { name: 'The Odds API', ok: false, detail: 'Missing ODDS_API_KEY' };
  }

  try {
    const qs = new URLSearchParams({
      apiKey,
      regions: ODDS_REGIONS,
      markets: 'h2h,totals',
      oddsFormat: 'decimal',
      dateFormat: 'iso',
    });

    const response = await fetch(`${ODDS_BASE}/sports/${SPORT_KEY}/odds?${qs.toString()}`, {
      cache: 'no-store',
    });

    const text = await response.text();
    if (!response.ok) {
      return {
        name: 'The Odds API',
        ok: false,
        status: response.status,
        detail: text.slice(0, 500),
      };
    }

    const json = JSON.parse(text);
    const count = Array.isArray(json) ? json.length : 0;
    return {
      name: 'The Odds API',
      ok: true,
      status: response.status,
      detail: `${count} odds events found for ${SPORT_KEY} in regions ${ODDS_REGIONS}`,
    };
  } catch (error) {
    return {
      name: 'The Odds API',
      ok: false,
      detail: error instanceof Error ? error.message : 'Unknown odds error',
    };
  }
}

export async function GET() {
  const [footballData, oddsApi] = await Promise.all([checkFootballData(), checkOddsApi()]);
  const dataMode = process.env.DATA_MODE ?? 'mock';
  const allLive = dataMode === 'live' && footballData.ok && oddsApi.ok;
  const partialLive = dataMode === 'live' && footballData.ok && !oddsApi.ok;

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    mode: allLive ? 'live' : partialLive ? 'partial-live' : dataMode === 'live' ? 'live-error' : 'mock',
    env: {
      DATA_MODE: dataMode,
      ODDS_SPORT_KEY: SPORT_KEY,
      ODDS_REGIONS,
      FOOTBALL_DATA_COMPETITION,
      hasFootballDataKey: Boolean(process.env.FOOTBALL_DATA_API_KEY),
      hasOddsApiKey: Boolean(process.env.ODDS_API_KEY),
    },
    checks: [footballData, oddsApi],
  });
}
