import { getRoundRecommendations, getRoundFixtures, scoreFixture } from '@/lib/model';
import { MatchFixture, OddsLine } from '@/lib/types';

const ODDS_BASE = 'https://api.the-odds-api.com/v4';
const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4';

const ODDS_BOOKMAKERS = process.env.ODDS_BOOKMAKERS ?? '';
const ODDS_REGIONS = process.env.ODDS_REGIONS ?? 'uk,eu';
const SPORT_KEY = process.env.ODDS_SPORT_KEY ?? 'soccer_epl';
const MAX_FIXTURES = Number(process.env.MAX_FIXTURES ?? '10');
const FOOTBALL_DATA_COMPETITION = process.env.FOOTBALL_DATA_COMPETITION ?? 'PL';

type OddsApiOutcome = { name: string; price: number; point?: number };
type OddsApiMarket = { key: string; outcomes: OddsApiOutcome[] };
type OddsApiBookmaker = { key: string; title: string; last_update: string; markets: OddsApiMarket[] };
type OddsApiEvent = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsApiBookmaker[];
};

type FootballDataStandingRow = {
  position?: number;
  team?: {
    id?: number;
    name?: string;
    shortName?: string;
    tla?: string;
  };
  playedGames?: number;
  won?: number;
  draw?: number;
  lost?: number;
  points?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
};

type FootballDataStandingsResponse = {
  standings?: Array<{
    type?: string;
    table?: FootballDataStandingRow[];
  }>;
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  homeTeam: {
    id?: number;
    name: string;
    shortName?: string;
    tla?: string;
  };
  awayTeam: {
    id?: number;
    name: string;
    shortName?: string;
    tla?: string;
  };
  score?: {
    fullTime?: {
      home?: number | null;
      away?: number | null;
    };
    winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  };
};

type FootballDataMatchesResponse = {
  matches?: FootballDataMatch[];
};

type TeamContext = {
  teamId?: number;
  teamName: string;
  rank?: number;
  points?: number;
  form?: string;
  goalsFor?: number;
  goalsAgainst?: number;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  homePlayed?: number;
  homeWins?: number;
  homeDraws?: number;
  homeLosses?: number;
  awayPlayed?: number;
  awayWins?: number;
  awayDraws?: number;
  awayLosses?: number;
  homeGoalsFor?: number;
  homeGoalsAgainst?: number;
  awayGoalsFor?: number;
  awayGoalsAgainst?: number;
};

function isLiveMode() {
  return (process.env.DATA_MODE ?? 'mock') === 'live';
}

function normalizeTeamName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .replace('AFC Bournemouth', 'Bournemouth')
    .replace('Bournemouth AFC', 'Bournemouth')
    .replace('Nottingham Forest FC', 'Nottm Forest')
    .replace('Nottingham Forest', 'Nottm Forest')
    .replace('Wolverhampton Wanderers FC', 'Wolves')
    .replace('Wolverhampton Wanderers', 'Wolves')
    .replace('Tottenham Hotspur FC', 'Tottenham')
    .replace('Tottenham Hotspur', 'Tottenham')
    .replace('Manchester United FC', 'Manchester United')
    .replace('Manchester City FC', 'Manchester City')
    .replace('Newcastle United FC', 'Newcastle United')
    .replace('Brighton & Hove Albion FC', 'Brighton and Hove Albion')
    .replace('Leeds United FC', 'Leeds United')
    .replace('West Ham United FC', 'West Ham United')
    .trim();
}

function parseMoneyline(bookmaker?: OddsApiBookmaker) {
  return bookmaker?.markets.find((m) => m.key === 'h2h')?.outcomes ?? [];
}

function parseTotals(bookmaker?: OddsApiBookmaker) {
  const outcomes = bookmaker?.markets.find((m) => m.key === 'totals')?.outcomes ?? [];
  const over = outcomes.find((o) => o.name.toLowerCase() === 'over' && Number(o.point) === 2.5);
  const under = outcomes.find((o) => o.name.toLowerCase() === 'under' && Number(o.point) === 2.5);
  return { over2_5: over?.price ?? 1.95, under2_5: under?.price ?? 1.95 };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed ${response.status}: ${text.slice(0, 400)}`);
  }

  return response.json() as Promise<T>;
}

async function fetchFootballDataJson<T>(path: string): Promise<T> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing FOOTBALL_DATA_API_KEY');
  }

  return fetchJson<T>(`${FOOTBALL_DATA_BASE}${path}`, {
    headers: {
      'X-Auth-Token': apiKey,
    },
  });
}

function resultLetterForTeam(teamId: number, match: FootballDataMatch): 'W' | 'D' | 'L' | null {
  const winner = match.score?.winner;
  const homeId = match.homeTeam.id;
  const awayId = match.awayTeam.id;

  if (!winner || winner === null) return 'D';

  if (homeId === teamId) {
    if (winner === 'HOME_TEAM') return 'W';
    if (winner === 'DRAW') return 'D';
    return 'L';
  }

  if (awayId === teamId) {
    if (winner === 'AWAY_TEAM') return 'W';
    if (winner === 'DRAW') return 'D';
    return 'L';
  }

  return null;
}

async function fetchRecentFormForTeam(teamId: number): Promise<string | undefined> {
  try {
    const data = await fetchFootballDataJson<FootballDataMatchesResponse>(
      `/teams/${teamId}/matches?status=FINISHED&limit=5`
    );

    const matches = data.matches ?? [];
    if (!matches.length) return undefined;

    const form = matches
      .map((match) => resultLetterForTeam(teamId, match))
      .filter((x): x is 'W' | 'D' | 'L' => x !== null)
      .slice(0, 5)
      .join('');

    return form || undefined;
  } catch {
    return undefined;
  }
}

async function fetchStandingsMap(): Promise<Map<string, TeamContext>> {
  try {
    const data = await fetchFootballDataJson<FootballDataStandingsResponse>(
      `/competitions/${FOOTBALL_DATA_COMPETITION}/standings`
    );

    const totalTable =
      data.standings?.find((s) => s.type === 'TOTAL')?.table ??
      data.standings?.[0]?.table ??
      [];

    const homeTable =
      data.standings?.find((s) => s.type === 'HOME')?.table ?? [];

    const awayTable =
      data.standings?.find((s) => s.type === 'AWAY')?.table ?? [];

    const homeMap = new Map<number, FootballDataStandingRow>();
    const awayMap = new Map<number, FootballDataStandingRow>();

    for (const row of homeTable) {
      if (row.team?.id) homeMap.set(row.team.id, row);
    }
    for (const row of awayTable) {
      if (row.team?.id) awayMap.set(row.team.id, row);
    }

    const map = new Map<string, TeamContext>();

    for (const row of totalTable) {
      const rawName = row.team?.shortName || row.team?.name || '';
      const name = normalizeTeamName(rawName);
      if (!name) continue;

      const teamId = row.team?.id;
      const home = teamId ? homeMap.get(teamId) : undefined;
      const away = teamId ? awayMap.get(teamId) : undefined;

      map.set(name, {
        teamId,
        teamName: name,
        rank: row.position,
        points: row.points,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        played: row.playedGames,
        wins: row.won,
        draws: row.draw,
        losses: row.lost,
        homePlayed: home?.playedGames,
        homeWins: home?.won,
        homeDraws: home?.draw,
        homeLosses: home?.lost,
        awayPlayed: away?.playedGames,
        awayWins: away?.won,
        awayDraws: away?.draw,
        awayLosses: away?.lost,
        homeGoalsFor: home?.goalsFor,
        homeGoalsAgainst: home?.goalsAgainst,
        awayGoalsFor: away?.goalsFor,
        awayGoalsAgainst: away?.goalsAgainst,
      });
    }

    return map;
  } catch {
    return new Map();
  }
}

async function enrichRecentFormForRelevantTeams(
  standingsMap: Map<string, TeamContext>,
  liveOdds: OddsApiEvent[]
): Promise<Map<string, TeamContext>> {
  const next = new Map(standingsMap);

  const relevantNames = new Set<string>();
  for (const event of liveOdds) {
    relevantNames.add(normalizeTeamName(event.home_team));
    relevantNames.add(normalizeTeamName(event.away_team));
  }

  for (const teamName of relevantNames) {
    const ctx = next.get(teamName);
    if (!ctx?.teamId) continue;

    const form = await fetchRecentFormForTeam(ctx.teamId);
    if (!form) continue;

    next.set(teamName, {
      ...ctx,
      form,
    });
  }

  return next;
}

export async function fetchLiveOdds(): Promise<OddsApiEvent[]> {
  if (!process.env.ODDS_API_KEY) throw new Error('Missing ODDS_API_KEY');

  const qs = new URLSearchParams({
    apiKey: process.env.ODDS_API_KEY,
    regions: ODDS_REGIONS,
    markets: 'h2h,totals',
    oddsFormat: 'decimal',
    dateFormat: 'iso',
  });

  if (ODDS_BOOKMAKERS) qs.set('bookmakers', ODDS_BOOKMAKERS);

  return fetchJson<OddsApiEvent[]>(`${ODDS_BASE}/sports/${SPORT_KEY}/odds?${qs.toString()}`);
}

export async function getLiveDashboard(round?: number) {
  if (!isLiveMode()) {
    const selectedRound = round ?? 34;
    return {
      round: selectedRound,
      fixtures: getRoundFixtures(selectedRound),
      recommendations: getRoundRecommendations(selectedRound),
      source: 'mock',
      generatedAt: new Date().toISOString(),
      debug: { mode: 'mock' },
    };
  }

  const liveOdds = await fetchLiveOdds();
  const baseStandingsMap = await fetchStandingsMap();
  const standingsMap = await enrichRecentFormForRelevantTeams(baseStandingsMap, liveOdds);

  const mappedFixtures: Array<
    MatchFixture & {
      homeContext?: TeamContext;
      awayContext?: TeamContext;
    }
  > = [];
  const mappedOdds: OddsLine[] = [];
  const skippedNoH2H: Array<{ home: string; away: string; bookmaker?: string }> = [];

  for (const event of liveOdds) {
    const homeTeam = normalizeTeamName(event.home_team);
    const awayTeam = normalizeTeamName(event.away_team);
    const bookmaker = event.bookmakers?.[0];
    const h2h = parseMoneyline(bookmaker);
    const totals = parseTotals(bookmaker);

    const home = h2h.find((o) => normalizeTeamName(o.name) === homeTeam)?.price;
    const away = h2h.find((o) => normalizeTeamName(o.name) === awayTeam)?.price;
    const draw = h2h.find((o) => o.name.toLowerCase() === 'draw')?.price;

    if (!home || !away || !draw) {
      skippedNoH2H.push({ home: homeTeam, away: awayTeam, bookmaker: bookmaker?.title });
      continue;
    }

    mappedFixtures.push({
      id: String(event.id),
      round: round ?? 34,
      kickoff: event.commence_time,
      homeTeam,
      awayTeam,
      daysRestHome: 6,
      daysRestAway: 6,
      injuriesHome: 0,
      injuriesAway: 0,
      homeContext: standingsMap.get(homeTeam),
      awayContext: standingsMap.get(awayTeam),
    });

    mappedOdds.push({
      fixtureId: String(event.id),
      bookmaker: bookmaker?.title ?? 'Market',
      home,
      draw,
      away,
      over2_5: totals.over2_5,
      under2_5: totals.under2_5,
      btts_yes: 1.9,
      btts_no: 1.9,
      capturedAt: bookmaker?.last_update ?? new Date().toISOString(),
    });
  }

  const recommendations = mappedFixtures
    .flatMap((fixture) => scoreFixture(fixture, mappedOdds))
    .filter((rec) => rec.edge > 0.02 && rec.expectedValue > 0.02)
    .sort((a, b) => b.expectedValue - a.expectedValue || b.edge - a.edge)
    .slice(0, 10);

  const fixtureCards = mappedFixtures.map((fixture) => {
    const recs = scoreFixture(fixture, mappedOdds);
    return {
      ...fixture,
      latestOdds: mappedOdds.find((o) => o.fixtureId === fixture.id),
      topRecommendation: [...recs].sort((a, b) => b.expectedValue - a.expectedValue)[0],
    };
  });

  return {
    round: round ?? mappedFixtures[0]?.round ?? 34,
    fixtures: fixtureCards,
    recommendations,
    source: 'live',
    generatedAt: new Date().toISOString(),
    debug: {
      mode: 'live',
      liveOddsCount: liveOdds.length,
      standingsCount: standingsMap.size,
      recentFormTeamsCount: Array.from(standingsMap.values()).filter((x) => !!x.form).length,
      firstFixture: fixtureCards[0]
        ? {
            homeTeam: fixtureCards[0].homeTeam,
            awayTeam: fixtureCards[0].awayTeam,
            homeContext: fixtureCards[0].homeContext ?? null,
            awayContext: fixtureCards[0].awayContext ?? null,
          }
        : null,
      skippedNoH2H: skippedNoH2H.slice(0, 10),
    },
  };
}
