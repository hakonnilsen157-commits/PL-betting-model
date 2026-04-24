import { NextResponse } from 'next/server';
import { trackerSeedPicks, trackerSeedResults } from '@/lib/mock-data';
import { mergePersistentSettledRows, getTrackerStorageMode } from '@/lib/tracker-persistent-store';
import { TrackerSettledPick } from '@/lib/tracker-store';

const marketLabels: Record<string, string> = {
  home: 'Hjemmeseier',
  draw: 'Uavgjort',
  away: 'Borteseier',
  over2_5: 'Over 2.5',
  under2_5: 'Under 2.5',
  btts_yes: 'Begge lag scorer',
  btts_no: 'Begge lag scorer ikke',
};

function formatMarket(market: string) {
  return marketLabels[market] ?? market;
}

function marketWon(market: string, homeGoals: number, awayGoals: number) {
  switch (market) {
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

function buildSeedRows(): TrackerSettledPick[] {
  return trackerSeedPicks.flatMap((pick) => {
    const result = trackerSeedResults.find((item) => item.fixtureId === pick.fixtureId);
    if (!result) return [];

    const won = marketWon(pick.market, result.homeGoals, result.awayGoals);
    return [{
      fixtureId: pick.fixtureId,
      match: `${pick.homeTeam} vs ${pick.awayTeam}`,
      market: formatMarket(pick.market),
      odds: pick.bookmakerOdds,
      confidence: pick.confidence,
      expectedValue: pick.expectedValue,
      kickoff: pick.kickoff,
      savedAt: pick.kickoff,
      snapshotId: 'seed-demo',
      status: 'settled' as const,
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      won,
      profit: won ? pick.bookmakerOdds - 1 : -1,
      settledAt: pick.kickoff,
    }];
  });
}

export async function POST() {
  const rows = buildSeedRows();
  const store = await mergePersistentSettledRows(rows);

  return NextResponse.json({
    ok: true,
    inserted: rows.length,
    storageMode: getTrackerStorageMode(),
    ...store,
  });
}

export async function GET() {
  const rows = buildSeedRows();
  return NextResponse.json({
    ok: true,
    availableRows: rows.length,
    rows,
  });
}
