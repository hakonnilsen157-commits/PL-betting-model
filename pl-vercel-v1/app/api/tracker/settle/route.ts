import { NextResponse } from 'next/server';

type SavedPickInput = {
  fixtureId: string;
  match: string;
  market: string;
  odds: number;
  confidence: number;
  expectedValue: number;
  kickoff: string;
  savedAt: string;
  snapshotId: string;
};

type FootballDataMatchResponse = {
  id: number;
  status: string;
  score?: {
    fullTime?: {
      home?: number | null;
      away?: number | null;
    };
  };
};

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';

function toRawMarket(market: string) {
  const normalized = market.toLowerCase();
  if (normalized.includes('hjemme')) return 'home';
  if (normalized.includes('uavgjort')) return 'draw';
  if (normalized.includes('borte')) return 'away';
  if (normalized.includes('over')) return 'over2_5';
  if (normalized.includes('under')) return 'under2_5';
  if (normalized.includes('ikke')) return 'btts_no';
  if (normalized.includes('begge')) return 'btts_yes';
  return market;
}

function marketWon(market: string, homeGoals: number, awayGoals: number) {
  const raw = toRawMarket(market);
  switch (raw) {
    case 'home':
      return homeGoals > awayGoals;
    case 'draw':
      return homeGoals === awayGoals;
    case 'away':
      return awayGoals > homeGoals;
    case 'over2_5':
      return homeGoals + awayGoals > 2.5;
    case 'under2_5':
      return homeGoals + awayGoals < 2.5;
    case 'btts_yes':
      return homeGoals > 0 && awayGoals > 0;
    case 'btts_no':
      return homeGoals === 0 || awayGoals === 0;
    default:
      return false;
  }
}

function extractFootballDataId(fixtureId: string) {
  if (!fixtureId.startsWith('fd-')) return null;
  const id = Number(fixtureId.replace('fd-', ''));
  return Number.isFinite(id) ? id : null;
}

async function fetchFootballDataMatch(matchId: number) {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) throw new Error('Missing FOOTBALL_DATA_API_KEY');

  const response = await fetch(`${FOOTBALL_DATA_BASE}/matches/${matchId}`, {
    cache: 'no-store',
    headers: {
      'X-Auth-Token': apiKey,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`football-data failed ${response.status}: ${text.slice(0, 300)}`);
  }

  return response.json() as Promise<FootballDataMatchResponse>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const picks = Array.isArray(body?.picks) ? (body.picks as SavedPickInput[]) : [];
    const settled = [];
    const pending = [];
    const unsupported = [];

    for (const pick of picks.slice(0, 20)) {
      const matchId = extractFootballDataId(pick.fixtureId);
      if (!matchId) {
        unsupported.push({ ...pick, reason: 'Only football-data fixture ids can auto-settle right now' });
        continue;
      }

      const match = await fetchFootballDataMatch(matchId);
      const homeGoals = match.score?.fullTime?.home;
      const awayGoals = match.score?.fullTime?.away;

      if (match.status !== 'FINISHED' || typeof homeGoals !== 'number' || typeof awayGoals !== 'number') {
        pending.push({ ...pick, status: match.status });
        continue;
      }

      const won = marketWon(pick.market, homeGoals, awayGoals);
      settled.push({
        ...pick,
        status: 'settled',
        homeGoals,
        awayGoals,
        won,
        profit: won ? pick.odds - 1 : -1,
        settledAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      ok: true,
      settled,
      pending,
      unsupported,
      checkedAt: new Date().toISOString(),
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
