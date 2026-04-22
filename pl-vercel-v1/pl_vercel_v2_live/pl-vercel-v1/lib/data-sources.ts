export async function fetchOddsForRound(round: number) {
  if ((process.env.DATA_MODE ?? 'mock') !== 'live') {
    return { source: 'mock', round, items: [] };
  }

  if (!process.env.ODDS_API_KEY) {
    throw new Error('Missing ODDS_API_KEY');
  }

  return {
    source: 'the-odds-api',
    round,
    items: [],
    note: 'Wire this to The Odds API historical or upcoming odds endpoints in V2.',
  };
}

export async function fetchFixturesAndInjuries(round: number) {
  if ((process.env.DATA_MODE ?? 'mock') !== 'live') {
    return { source: 'mock', round, fixtures: [], injuries: [] };
  }

  if (!process.env.API_FOOTBALL_KEY) {
    throw new Error('Missing API_FOOTBALL_KEY');
  }

  return {
    source: 'api-football',
    round,
    fixtures: [],
    injuries: [],
    note: 'Wire this to fixtures, injuries, lineups and team stats endpoints in V2.',
  };
}
