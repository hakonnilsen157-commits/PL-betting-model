export type MatchMarket = 'home' | 'draw' | 'away' | 'over2_5' | 'under2_5' | 'btts_yes' | 'btts_no';

export interface TeamProfile {
  name: string;
  power: number;
  homeAdvantage: number;
  awayAdjustment: number;
  form: number;
  xgFor: number;
  xgAgainst: number;
  pressing: number;
  buildUp: number;
  transition: number;
  setPieces: number;
  crossing: number;
  aerialDefense: number;
}

export interface MatchFixture {
  id: string;
  round: number;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  daysRestHome: number;
  daysRestAway: number;
  injuriesHome: number;
  injuriesAway: number;
}

export interface OddsLine {
  fixtureId: string;
  bookmaker: string;
  home: number;
  draw: number;
  away: number;
  over2_5: number;
  under2_5: number;
  btts_yes: number;
  btts_no: number;
  capturedAt: string;
}

export interface Recommendation {
  fixtureId: string;
  match: string;
  kickoff: string;
  market: MatchMarket;
  modelProbability: number;
  impliedProbability: number;
  fairOdds: number;
  bookmakerOdds: number;
  edge: number;
  expectedValue: number;
  confidence: number;
  note: string;
}
