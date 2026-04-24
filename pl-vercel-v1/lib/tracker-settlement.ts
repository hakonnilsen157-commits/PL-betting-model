import {
  TrackerSavedPick,
  TrackerSettledPick,
} from '@/lib/tracker-store';

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

export type TrackerSettlementResult = {
  settled: TrackerSettledPick[];
  pending: Array<TrackerSavedPick & { status?: string }>;
  unsupported: Array<TrackerSavedPick & { reason?: string }>;
  checkedAt: string;
};

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';

export function toRawMarket(market: string) {
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

export function marketWon(market: string, homeGoals: number, awayGoals: number) {
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

export function extractFootballDataId(fixtureId: string) {
  if (!fixtureId.startsWith('fd-')) return null;
  const id = Number(fixtureId.replace('fd-', ''));
  return Number.isFinite(id) ? id : null;
}

export function isSettlementReady(kickoff: string) {
  const ts = new Date(kickoff).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() >= ts + 2 * 60 * 60 * 1000;
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

export async function settleTrackerPicks(picks: TrackerSavedPick[]): Promise<TrackerSettlementResult> {
  const settled: TrackerSettledPick[] = [];
  const pending: Array<TrackerSavedPick & { status?: string }> = [];
  const unsupported: Array<TrackerSavedPick & { reason?: string }> = [];

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

  return {
    settled,
    pending,
    unsupported,
    checkedAt: new Date().toISOString(),
  };
}
