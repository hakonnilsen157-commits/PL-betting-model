import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    dataMode: process.env.DATA_MODE ?? 'mock',
    hasOddsApiKey: Boolean(process.env.ODDS_API_KEY),
    hasApiFootballKey: Boolean(process.env.API_FOOTBALL_KEY),
    oddsSportKey: process.env.ODDS_SPORT_KEY ?? 'soccer_epl',
    oddsRegions: process.env.ODDS_REGIONS ?? 'uk,eu',
    apiFootballLeagueId: process.env.API_FOOTBALL_LEAGUE_ID ?? '39',
    apiFootballSeason: process.env.API_FOOTBALL_SEASON ?? String(new Date().getUTCFullYear()),
  });
}
