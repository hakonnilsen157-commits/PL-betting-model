import { fixtures, latestOdds, teams } from '@/lib/mock-data';
import { MatchFixture, MatchMarket, OddsLine, Recommendation, TeamProfile } from '@/lib/types';

type TeamLookup = {
  profile: TeamProfile;
  isFallback: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function fallbackTeam(name: string): TeamProfile {
  return {
    name,
    power: 75,
    homeAdvantage: 2,
    awayAdjustment: -1,
    form: 0,
    xgFor: 1.35,
    xgAgainst: 1.35,
    pressing: 50,
    buildUp: 50,
    transition: 50,
    setPieces: 50,
    crossing: 50,
    aerialDefense: 50,
  };
}

function getTeamLookup(name: string): TeamLookup {
  const found = teams.find((t) => t.name === name);
  if (found) {
    return { profile: found, isFallback: false };
  }
  return { profile: fallbackTeam(name), isFallback: true };
}

function getOdds(fixtureId: string, oddsInput?: OddsLine[]): OddsLine {
  const source = oddsInput ?? latestOdds;
  const line = source.find((o) => o.fixtureId === fixtureId);
  if (!line) throw new Error(`Odds not found: ${fixtureId}`);
  return line;
}

function normalizeProbabilities(values: number[]): number[] {
  const safe = values.map((v) => Math.max(v, 0.0001));
  const sum = safe.reduce((a, b) => a + b, 0);
  return safe.map((v) => v / sum);
}

function marketProbability(odds: number): number {
  return odds > 0 ? 1 / odds : 0;
}

function marketTriplet(line: OddsLine) {
  const [home, draw, away] = normalizeProbabilities([
    marketProbability(line.home),
    marketProbability(line.draw),
    marketProbability(line.away),
  ]);
  return { home, draw, away };
}

function marketBinary(oddsA: number, oddsB: number) {
  const [a, b] = normalizeProbabilities([
    marketProbability(oddsA),
    marketProbability(oddsB),
  ]);
  return { a, b };
}

function baseStrength(home: TeamProfile, away: TeamProfile, fixture: MatchFixture): number {
  const ratingGap = (home.power + home.homeAdvantage) - (away.power + away.awayAdjustment);
  const formGap = home.form - away.form;
  const xgGap = (home.xgFor - home.xgAgainst) - (away.xgFor - away.xgAgainst);
  const restGap = fixture.daysRestHome - fixture.daysRestAway;
  const injuryGap = fixture.injuriesAway - fixture.injuriesHome;

  return ratingGap * 0.045 + formGap * 0.08 + xgGap * 0.55 + restGap * 0.04 + injuryGap * 0.07;
}

function styleEdges(home: TeamProfile, away: TeamProfile): number {
  return (
    (home.pressing - away.buildUp) * 0.03 +
    (home.transition - away.transition) * 0.02 +
    (home.setPieces - away.aerialDefense) * 0.025 +
    (home.crossing - away.aerialDefense) * 0.015
  );
}

function blend(modelProb: number, marketProb: number, modelWeight: number) {
  const marketWeight = 1 - modelWeight;
  return modelProb * modelWeight + marketProb * marketWeight;
}

function makeRecommendation(
  fixture: MatchFixture,
  market: MatchMarket,
  probability: number,
  bookmakerOdds: number,
  note: string,
  confidence: number
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

export function scoreFixture(fixture: MatchFixture, oddsInput?: OddsLine[]): Recommendation[] {
  const homeLookup = getTeamLookup(fixture.homeTeam);
  const awayLookup = getTeamLookup(fixture.awayTeam);
  const home = homeLookup.profile;
  const away = awayLookup.profile;
  const line = getOdds(fixture.id, oddsInput);

  const market1x2 = marketTriplet(line);
  const marketTotals = marketBinary(line.over2_5, line.under2_5);
  const marketBtts = marketBinary(line.btts_yes, line.btts_no);

  const totalEdgeSignal = baseStrength(home, away, fixture) + styleEdges(home, away);

  const rawHomeProb = clamp(logistic(totalEdgeSignal / 4.8), 0.20, 0.68);
  const rawAwayProb = clamp(logistic((-totalEdgeSignal - 0.15) / 5.0), 0.12, 0.50);
  const rawDrawProb = clamp(1 - rawHomeProb - rawAwayProb, 0.18, 0.32);

  const [modelHomeProb, modelDrawProb, modelAwayProb] = normalizeProbabilities([
    rawHomeProb,
    rawDrawProb,
    rawAwayProb,
  ]);

  const fallbackCount = Number(homeLookup.isFallback) + Number(awayLookup.isFallback);

  let modelWeight1x2 = 0.55;
  if (fallbackCount === 1) modelWeight1x2 = 0.30;
  if (fallbackCount === 2) modelWeight1x2 = 0.12;

  const homeProb = clamp(blend(modelHomeProb, market1x2.home, modelWeight1x2), 0.12, 0.78);
  const drawProb = clamp(blend(modelDrawProb, market1x2.draw, modelWeight1x2), 0.10, 0.35);
  const awayProb = clamp(blend(modelAwayProb, market1x2.away, modelWeight1x2), 0.08, 0.65);
  const [finalHomeProb, finalDrawProb, finalAwayProb] = normalizeProbabilities([
    homeProb,
    drawProb,
    awayProb,
  ]);

  const totalGoalSignal =
    home.xgFor +
    away.xgFor -
    0.40 * (home.xgAgainst + away.xgAgainst) +
    Math.abs(totalEdgeSignal) * 0.015;

  const modelOverProb = clamp(logistic((totalGoalSignal - 1.9) * 0.75), 0.35, 0.68);
  const modelUnderProb = 1 - modelOverProb;

  const totalsModelWeight = fallbackCount === 0 ? 0.35 : 0.15;
  const overProb = clamp(blend(modelOverProb, marketTotals.a, totalsModelWeight), 0.22, 0.78);
  const underProb = clamp(blend(modelUnderProb, marketTotals.b, totalsModelWeight), 0.22, 0.78);

  const bttsSignal = (home.xgFor + away.xgFor) / 2 - (home.xgAgainst + away.xgAgainst) / 4;
  const modelBttsYesProb = clamp(logistic((bttsSignal - 0.7) * 1.0), 0.35, 0.68);
  const modelBttsNoProb = 1 - modelBttsYesProb;

  const bttsModelWeight = fallbackCount === 0 ? 0.25 : 0.10;
  const bttsYesProb = clamp(blend(modelBttsYesProb, marketBtts.a, bttsModelWeight), 0.22, 0.78);
  const bttsNoProb = clamp(blend(modelBttsNoProb, marketBtts.b, bttsModelWeight), 0.22, 0.78);

  const dataQualityPenalty = fallbackCount * 12;
  const marketDistancePenalty = 40;

  function confidence(prob: number, implied: number, base: number) {
    const edgeAbs = Math.abs(prob - implied);
    const edgeComponent = Math.min(edgeAbs * marketDistancePenalty, 12);
    return clamp(base + edgeComponent - dataQualityPenalty, 38, 88);
  }

  const recs = [
    makeRecommendation(
      fixture,
      'home',
      finalHomeProb,
      line.home,
      fallbackCount > 0
        ? 'Marked forankret vurdering med begrenset lagdata'
        : 'Lagstyrke + hjemmefordel + stilmatch',
      confidence(finalHomeProb, market1x2.home, 63)
    ),
    makeRecommendation(
      fixture,
      'draw',
      finalDrawProb,
      line.draw,
      'Marked forankret vurdering av jevn kamp',
      confidence(finalDrawProb, market1x2.draw, 56)
    ),
    makeRecommendation(
      fixture,
      'away',
      finalAwayProb,
      line.away,
      fallbackCount > 0
        ? 'Marked forankret vurdering med begrenset lagdata'
        : 'Bortelagets omstillingsstyrke og markedsoverpris',
      confidence(finalAwayProb, market1x2.away, 61)
    ),
    makeRecommendation(
      fixture,
      'over2_5',
      overProb,
      line.over2_5,
      'Totals vurdering med markedsforankring',
      confidence(overProb, marketTotals.a, 60)
    ),
    makeRecommendation(
      fixture,
      'under2_5',
      underProb,
      line.under2_5,
      'Totals vurdering med markedsforankring',
      confidence(underProb, marketTotals.b, 60)
    ),
    makeRecommendation(
      fixture,
      'btts_yes',
      bttsYesProb,
      line.btts_yes,
      'BTTS vurdering med markedsforankring',
      confidence(bttsYesProb, marketBtts.a, 58)
    ),
    makeRecommendation(
      fixture,
      'btts_no',
      bttsNoProb,
      line.btts_no,
      'BTTS vurdering med markedsforankring',
      confidence(bttsNoProb, marketBtts.b, 58)
    ),
  ];

  return recs.filter((r) => {
    const fairVsBookGap = Math.abs(r.fairOdds - r.bookmakerOdds) / Math.max(r.bookmakerOdds, 1);
    const edgeAbs = Math.abs(r.edge);

    if (r.modelProbability < 0.08 || r.modelProbability > 0.82) return false;
    if (fairVsBookGap > 0.65) return false;
    if (edgeAbs > 0.14) return false;
    if (r.expectedValue > 0.35) return false;

    return true;
  });
}

export function getRoundRecommendations(round: number): Recommendation[] {
  return fixtures
    .filter((f) => f.round === round)
    .flatMap((f) => scoreFixture(f))
    .filter((r) => r.edge > 0.02 && r.edge < 0.12 && r.expectedValue > 0.015 && r.expectedValue < 0.25)
    .sort((a, b) => b.expectedValue - a.expectedValue || b.edge - a.edge)
    .slice(0, 10);
}

export function getRoundFixtures(round: number) {
  return fixtures.filter((f) => f.round === round).map((fixture) => {
    const recs = scoreFixture(fixture);
    return {
      ...fixture,
      latestOdds: getOdds(fixture.id),
      topRecommendation: [...recs].sort((a, b) => b.expectedValue - a.expectedValue)[0],
    };
  });
}
