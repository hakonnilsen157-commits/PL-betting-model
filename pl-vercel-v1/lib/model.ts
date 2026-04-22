import { fixtures, latestOdds, teams } from '@/lib/mock-data';
import { MatchFixture, MatchMarket, OddsLine, Recommendation, TeamProfile } from '@/lib/types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function getTeam(name: string): TeamProfile {
  const team = teams.find((t) => t.name === name);
  if (!team) {
    throw new Error(`Team not found: ${name}`);
  }
  return team;
}

function getOdds(fixtureId: string): OddsLine {
  const line = latestOdds.find((o) => o.fixtureId === fixtureId);
  if (!line) {
    throw new Error(`Odds not found: ${fixtureId}`);
  }
  return line;
}

function baseStrength(home: TeamProfile, away: TeamProfile, fixture: MatchFixture): number {
  const ratingGap = (home.power + home.homeAdvantage) - (away.power + away.awayAdjustment);
  const formGap = home.form - away.form;
  const xgGap = (home.xgFor - home.xgAgainst) - (away.xgFor - away.xgAgainst);
  const restGap = fixture.daysRestHome - fixture.daysRestAway;
  const injuryGap = fixture.injuriesAway - fixture.injuriesHome;

  return ratingGap * 0.08 + formGap * 0.12 + xgGap * 0.9 + restGap * 0.08 + injuryGap * 0.12;
}

function styleEdges(home: TeamProfile, away: TeamProfile): number {
  const pressVsBuild = (home.pressing - away.buildUp) * 0.08;
  const transitionEdge = (home.transition - away.transition) * 0.05;
  const setPieceEdge = (home.setPieces - away.aerialDefense) * 0.06;
  const crossingEdge = (home.crossing - away.aerialDefense) * 0.04;

  return pressVsBuild + transitionEdge + setPieceEdge + crossingEdge;
}

function marketProbability(odds: number): number {
  return odds > 0 ? 1 / odds : 0;
}

function makeRecommendation(
  fixture: MatchFixture,
  market: MatchMarket,
  probability: number,
  bookmakerOdds: number,
  note: string,
  confidence: number,
): Recommendation {
  const impliedProbability = marketProbability(bookmakerOdds);
  const fairOdds = probability > 0 ? 1 / probability : 999;
  const edge = probability - impliedProbability;
  const expectedValue = probability * bookmakerOdds - 1;

  return {
    fixtureId: fixture.id,
    match: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
    kickoff: fixture.kickoff,
    market,
    modelProbability: Number(probability.toFixed(4)),
    impliedProbability: Number(impliedProbability.toFixed(4)),
    fairOdds: Number(fairOdds.toFixed(2)),
    bookmakerOdds: Number(bookmakerOdds.toFixed(2)),
    edge: Number(edge.toFixed(4)),
    expectedValue: Number(expectedValue.toFixed(4)),
    confidence: Number(confidence.toFixed(2)),
    note,
  };
}

export function scoreFixture(fixture: MatchFixture): Recommendation[] {
  const home = getTeam(fixture.homeTeam);
  const away = getTeam(fixture.awayTeam);
  const line = getOdds(fixture.id);

  const strength = baseStrength(home, away, fixture);
  const style = styleEdges(home, away);
  const totalEdge = strength + style;

  const homeProb = clamp(logistic(totalEdge / 3), 0.18, 0.78);
  const awayProb = clamp(logistic((-totalEdge - 0.3) / 3.2), 0.08, 0.52);
  const drawProb = clamp(1 - homeProb - awayProb, 0.14, 0.32);

  const totalGoalSignal = home.xgFor + away.xgFor - 0.45 * (home.xgAgainst + away.xgAgainst) + Math.abs(style) * 0.1;
  const overProb = clamp(logistic((totalGoalSignal - 1.75) * 1.1), 0.28, 0.82);
  const underProb = clamp(1 - overProb, 0.18, 0.72);

  const bttsSignal = ((home.xgFor + away.xgFor) / 2) - ((home.xgAgainst + away.xgAgainst) / 3);
  const bttsYesProb = clamp(logistic((bttsSignal - 0.55) * 1.8), 0.25, 0.8);
  const bttsNoProb = clamp(1 - bttsYesProb, 0.2, 0.75);

  return [
    makeRecommendation(fixture, 'home', homeProb, line.home, 'Lagstyrke + hjemmefordel + stilmatch', 72 + Math.abs(totalEdge) * 2.2),
    makeRecommendation(fixture, 'draw', drawProb, line.draw, 'Jevn kamp og moderat målsignal', 55 + drawProb * 60),
    makeRecommendation(fixture, 'away', awayProb, line.away, 'Bortelagets omstillingsstyrke og markedsoverpris', 60 + Math.abs(totalEdge) * 1.8),
    makeRecommendation(fixture, 'over2_5', overProb, line.over2_5, 'Høyt xG-bilde og åpen kampdynamikk', 65 + totalGoalSignal * 8),
    makeRecommendation(fixture, 'under2_5', underProb, line.under2_5, 'Lavere totalsignal og kontrollert kampbilde', 57 + underProb * 40),
    makeRecommendation(fixture, 'btts_yes', bttsYesProb, line.btts_yes, 'Begge lag skaper nok sjanser i modellen', 63 + bttsYesProb * 35),
    makeRecommendation(fixture, 'btts_no', bttsNoProb, line.btts_no, 'Defensiv mismatch / lav scoring for ett lag', 58 + bttsNoProb * 35),
  ];
}

export function getRoundRecommendations(round: number): Recommendation[] {
  const roundFixtures = fixtures.filter((fixture) => fixture.round === round);
  return roundFixtures
    .flatMap(scoreFixture)
    .filter((rec) => rec.edge > 0.025 && rec.expectedValue > 0.03)
    .sort((a, b) => b.expectedValue - a.expectedValue || b.edge - a.edge)
    .slice(0, 10);
}

export function getRoundFixtures(round: number) {
  return fixtures
    .filter((fixture) => fixture.round === round)
    .map((fixture) => {
      const line = getOdds(fixture.id);
      const recs = scoreFixture(fixture);
      const top = [...recs].sort((a, b) => b.expectedValue - a.expectedValue)[0];
      return {
        ...fixture,
        latestOdds: line,
        topRecommendation: top,
      };
    });
}
