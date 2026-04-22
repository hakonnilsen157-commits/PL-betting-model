import { getRoundRecommendations, getRoundFixtures, scoreFixture } from '@/lib/model';
import { MatchFixture, OddsLine } from '@/lib/types';

const ODDS_BASE = 'https://api.the-odds-api.com/v4';
const FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const EPL_LEAGUE_ID = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? '39');
const DEFAULT_SEASON = Number(process.env.API_FOOTBALL_SEASON ?? new Date().getUTCFullYear());
const ODDS_BOOKMAKERS = process.env.ODDS_BOOKMAKERS ?? '';
const ODDS_REGIONS = process.env.ODDS_REGIONS ?? 'uk,eu';
const SPORT_KEY = process.env.ODDS_SPORT_KEY ?? 'soccer_epl';
const MAX_FIXTURES = Number(process.env.MAX_FIXTURES ?? '10');

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

type FootballFixture = {
  fixture: { id: number; date: string; status?: { short?: string } };
  league?: { round?: string };
  teams: { home: { name: string }; away: { name: string } };
};

type FootballInjury = {
  fixture?: { id?: number };
  team?: { name?: string };
  player?: { name?: string; id?: number; type?: string; reason?: string };
};

type FootballStandingSide = {
  played?: number;
  win?: number;
  draw?: number;
  lose?: number;
  goals?: {
    for?: number;
    against?: number;
  };
};

type FootballStandingsRow = {
  rank?: number;
  points?: number;
  form?: string;
  description?: string;
  team?: {
    id?: number;
    name?: string;
  };
  all?: FootballStandingSide;
  home?: FootballStandingSide;
  away?: FootballStandingSide;
};

type TeamContext = {
  teamId?: number;
  teamName: string;
  rank?: number;
  points?: number;
  form?: string;
  description?: string;
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
    .replace('Nottingham Forest', 'Nottm Forest')
    .replace('Wolverhampton Wanderers', 'Wolves')
    .replace('Manchester Utd', 'Manchester United')
    .replace('Manchester City', 'Manchester City')
    .replace('Tottenham Hotspur', 'Tottenham')
    .replace('Newcastle Utd', 'Newcastle United')
    .replace('Leeds', 'Leeds United')
    .replace('Brighton', 'Brighton and Hove Albion')
    .trim();
}

function extractRoundNumber(roundLabel?: string): number {
  const match = roundLabel?.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
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

function parseMoneyline(bookmaker?: OddsApiBookmaker) {
  return bookmaker?.markets.find((m) => m.key === 'h2h')?.outcomes ?? [];
}

function parseTotals(bookmaker?: OddsApiBookmaker) {
  const outcomes = bookmaker?.markets.find((m) => m.key === 'totals')?.outcomes ?? [];
  const over = outcomes.find((o) => o.name.toLowerCase() === 'over' && Number(o.point) === 2.5);
  const under = outcomes.find((o) => o.name.toLowerCase() === 'under' && Number(o.point) === 2.5);
  return { over2_5: over?.price ?? 1.95, under2_5: under?.price ?? 1.95 };
}

function buildSeasonsToTry() {
  const envSeason = Number(process.env.API_FOOTBALL_SEASON ?? new Date().getUTCFullYear());
  return Array.from(new Set([envSeason, envSeason - 1, 2025, 2026]));
}

export async function fetchLiveFixtures(): Promise<FootballFixture[]> {
  if (!process.env.API_FOOTBALL_KEY) return [];

  const seasonsToTry = buildSeasonsToTry();

  for (const season of seasonsToTry) {
    try {
      const qs = new URLSearchParams({
        league: String(EPL_LEAGUE_ID),
        season: String(season),
        timezone: 'Europe/Oslo',
      });

      const data = await fetchJson<{ response: FootballFixture[] }>(
        `${FOOTBALL_BASE}/fixtures?${qs.toString()}`,
        {
          headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY! },
        }
      );

      const fixtures = (data.response ?? [])
        .filter((f) => ['NS', 'TBD', 'PST'].includes(f.fixture.status?.short ?? 'NS'))
        .slice(0, MAX_FIXTURES);

      if (fixtures.length > 0) {
        console.log('API-FOOTBALL fixtures season hit:', season, fixtures.length);
        return fixtures;
      }

      console.log('API-FOOTBALL fixtures empty for season:', season);
    } catch (error) {
      console.log('API-FOOTBALL fixtures failed for season:', season, error);
    }
  }

  return [];
}

export async function fetchLiveInjuriesByFixtureIds(fixtureIds: number[]) {
  if (!process.env.API_FOOTBALL_KEY || fixtureIds.length === 0) return [] as FootballInjury[];

  const responses = await Promise.all(
    fixtureIds.map(async (fixtureId) => {
      try {
        const qs = new URLSearchParams({ fixture: String(fixtureId) });
        const data = await fetchJson<{ response: FootballInjury[] }>(
          `${FOOTBALL_BASE}/injuries?${qs.toString()}`,
          {
            headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY! },
          }
        );
        return data.response;
      } catch {
        return [] as FootballInjury[];
      }
    })
  );

  return responses.flat();
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

async function fetchLeagueStandingsMap(): Promise<Map<string, TeamContext>> {
  if (!process.env.API_FOOTBALL_KEY) return new Map();

  const seasonsToTry = buildSeasonsToTry();

  for (const season of seasonsToTry) {
    try {
      const qs = new URLSearchParams({
        league: String(EPL_LEAGUE_ID),
        season: String(season),
      });

      const data = await fetchJson<{
        response?: Array<{
          league?: {
            standings?: FootballStandingsRow[][];
          };
        }>;
      }>(`${FOOTBALL_BASE}/standings?${qs.toString()}`, {
        headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY! },
      });

      const rows = data.response?.[0]?.league?.standings?.[0] ?? [];
      if (!rows.length) {
        console.log('API-FOOTBALL standings empty for season:', season);
        continue;
      }

      const map = new Map<string, TeamContext>();

      for (const row of rows) {
        const name = normalizeTeamName(row.team?.name ?? '');
        if (!name) continue;

        map.set(name, {
          teamId: row.team?.id,
          teamName: name,
          rank: row.rank,
          points: row.points,
          form: row.form,
          description: row.description,
          goalsFor: row.all?.goals?.for,
          goalsAgainst: row.all?.goals?.against,
          played: row.all?.played,
          wins: row.all?.win,
          draws: row.all?.draw,
          losses: row.all?.lose,
          homePlayed: row.home?.played,
          homeWins: row.home?.win,
          homeDraws: row.home?.draw,
          homeLosses: row.home?.lose,
          awayPlayed: row.away?.played,
          awayWins: row.away?.win,
          awayDraws: row.away?.draw,
          awayLosses: row.away?.lose,
          homeGoalsFor: row.home?.goals?.for,
          homeGoalsAgainst: row.home?.goals?.against,
          awayGoalsFor: row.away?.goals?.for,
          awayGoalsAgainst: row.away?.goals?.against,
        });
      }

      console.log('API-FOOTBALL standings season hit:', season, map.size);
      return map;
    } catch (error) {
      console.log('API-FOOTBALL standings failed for season:', season, error);
    }
  }

  return new Map();
}

function countTeamInjuries(items: FootballInjury[], teamName: string) {
  return items.filter((x) => normalizeTeamName(x.team?.name ?? '') === normalizeTeamName(teamName)).length;
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
      debug: {
        mode: 'mock',
      },
    };
  }

  const standingsMap = await fetchLeagueStandingsMap();
  const liveFixtures = await fetchLiveFixtures().catch(() => [] as FootballFixture[]);
  const liveInjuries = await fetchLiveInjuriesByFixtureIds(
    liveFixtures.map((f) => f.fixture.id)
  ).catch(() => [] as FootballInjury[]);
  const liveOdds = await fetchLiveOdds();

  const oddsMap = new Map(
    liveOdds.map((e) => [`${normalizeTeamName(e.home_team)}__${normalizeTeamName(e.away_team)}`, e])
  );

  const injuryMap = new Map<number, FootballInjury[]>();
  for (const injury of liveInjuries) {
    const fixtureId = injury.fixture?.id;
    if (!fixtureId) continue;
    injuryMap.set(fixtureId, [...(injuryMap.get(fixtureId) ?? []), injury]);
  }

  const mappedFixtures: Array<
    MatchFixture & {
      homeContext?: TeamContext;
      awayContext?: TeamContext;
    }
  > = [];
  const mappedOdds: OddsLine[] = [];
  const unmatchedFixtures: Array<{ home: string; away: string }> = [];
  const skippedNoH2H: Array<{ home: string; away: string; bookmaker?: string }> = [];

  if (liveFixtures.length > 0) {
    for (const fixture of liveFixtures) {
      const homeTeam = normalizeTeamName(fixture.teams.home.name);
      const awayTeam = normalizeTeamName(fixture.teams.away.name);
      const event = oddsMap.get(`${homeTeam}__${awayTeam}`);

      if (!event) {
        unmatchedFixtures.push({ home: homeTeam, away: awayTeam });
        continue;
      }

      const bookmaker = event.bookmakers?.[0];
      const h2h = parseMoneyline(bookmaker);
      const totals = parseTotals(bookmaker);
      const injuries = injuryMap.get(fixture.fixture.id) ?? [];

      const home = h2h.find((o) => normalizeTeamName(o.name) === homeTeam)?.price;
      const away = h2h.find((o) => normalizeTeamName(o.name) === awayTeam)?.price;
      const draw = h2h.find((o) => o.name.toLowerCase() === 'draw')?.price;

      if (!home || !away || !draw) {
        skippedNoH2H.push({ home: homeTeam, away: awayTeam, bookmaker: bookmaker?.title });
        continue;
      }

      mappedFixtures.push({
        id: String(fixture.fixture.id),
        round: extractRoundNumber(fixture.league?.round) || round || 34,
        kickoff: fixture.fixture.date,
        homeTeam,
        awayTeam,
        daysRestHome: 6,
        daysRestAway: 6,
        injuriesHome: countTeamInjuries(injuries, homeTeam),
        injuriesAway: countTeamInjuries(injuries, awayTeam),
        homeContext: standingsMap.get(homeTeam),
        awayContext: standingsMap.get(awayTeam),
      });

      mappedOdds.push({
        fixtureId: String(fixture.fixture.id),
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
  } else {
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
      liveFixturesCount: liveFixtures.length,
      liveOddsCount: liveOdds.length,
      liveInjuriesCount: liveInjuries.length,
      mappedFixturesCount: mappedFixtures.length,
      mappedOddsCount: mappedOdds.length,
      standingsCount: standingsMap.size,
      standingsTeamsSample: Array.from(standingsMap.keys()).slice(0, 10),
      firstFixture: fixtureCards[0]
        ? {
            homeTeam: fixtureCards[0].homeTeam,
            awayTeam: fixtureCards[0].awayTeam,
            homeContext: fixtureCards[0].homeContext ?? null,
            awayContext: fixtureCards[0].awayContext ?? null,
          }
        : null,
      unmatchedFixtures: unmatchedFixtures.slice(0, 10),
      skippedNoH2H: skippedNoH2H.slice(0, 10),
    },
  };
}
