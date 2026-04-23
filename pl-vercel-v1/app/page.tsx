'use client';

import { useEffect, useMemo, useState } from 'react';
import MatchDetailPanel from '@/components/MatchDetailPanel';

type Recommendation = {
  fixtureId: string;
  match: string;
  kickoff: string;
  market: string;
  modelProbability: number;
  impliedProbability: number;
  fairOdds: number;
  bookmakerOdds: number;
  edge: number;
  expectedValue: number;
  confidence: number;
  note: string;
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

type FixtureCard = {
  id: string;
  round: number;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  daysRestHome?: number;
  daysRestAway?: number;
  injuriesHome?: number;
  injuriesAway?: number;
  latestOdds?: {
    bookmaker?: string;
    home?: number;
    draw?: number;
    away?: number;
    over2_5?: number;
    under2_5?: number;
    btts_yes?: number;
    btts_no?: number;
    capturedAt?: string;
  };
  topRecommendation?: Recommendation;
  homeContext?: TeamContext;
  awayContext?: TeamContext;
};

type DashboardResponse = {
  round: number;
  fixtures: FixtureCard[];
  recommendations: Recommendation[];
  source: string;
  generatedAt: string;
  debug?: {
    oddsAvailable?: boolean;
    usingFallbackOdds?: boolean;
    oddsError?: string | null;
  };
};

function pct(v?: number) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '–';
  return `${(v * 100).toFixed(1)}%`;
}

function formatMarket(market?: string) {
  if (!market) return 'Ingen';
  const map: Record<string, string> = {
    home: 'Hjemmeseier',
    draw: 'Uavgjort',
    away: 'Borteseier',
    over2_5: 'Over 2.5',
    under2_5: 'Under 2.5',
    btts_yes: 'Begge lag scorer',
    btts_no: 'Begge lag scorer ikke',
  };
  return map[market] ?? market;
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

function cardBorderClass(value?: number) {
  if (typeof value !== 'number') return {};
  if (value >= 0.08) return { borderColor: '#b7e4c7' };
  if (value >= 0.04) return { borderColor: '#d6eadf' };
  if (value >= 0.015) return { borderColor: '#f6dfb8' };
  return {};
}

function sourceLabel(source?: string) {
  if (source === 'partial-live') return 'Partial live';
  if (source === 'live') return 'Live';
  if (source === 'mock') return 'Mock';
  return source ?? '–';
}

export default function Page() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState<string>('all');
  const [minEV, setMinEV] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch('/api/fixtures', { cache: 'no-store' });
        const json = await response.json();

        if (!mounted) return;

        const nextData: DashboardResponse = {
          round: json.round ?? 0,
          fixtures: json.fixtures ?? [],
          recommendations: json.recommendations ?? [],
          source: json.source ?? 'unknown',
          generatedAt: json.generatedAt ?? new Date().toISOString(),
          debug: json.debug ?? undefined,
        };

        setData(nextData);

        if (nextData.fixtures.length > 0) {
          setSelectedFixtureId(String(nextData.fixtures[0].id));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRecommendations = useMemo(() => {
    const all = data?.recommendations ?? [];
    return all.filter((rec) => {
      const marketOk = marketFilter === 'all' ? true : rec.market === marketFilter;
      const evOk = rec.expectedValue >= minEV;
      return marketOk && evOk;
    });
  }, [data, marketFilter, minEV]);

  const selectedFixture = useMemo(() => {
    if (!data?.fixtures?.length) return null;
    return data.fixtures.find((f) => String(f.id) === String(selectedFixtureId)) ?? data.fixtures[0];
  }, [data, selectedFixtureId]);

  const selectedRecommendations = useMemo(() => {
    if (!selectedFixture) return [];
    return (data?.recommendations ?? [])
      .filter((r) => String(r.fixtureId) === String(selectedFixture.id))
      .sort((a, b) => b.expectedValue - a.expectedValue || b.edge - a.edge);
  }, [data, selectedFixture]);

  const bestEV = filteredRecommendations.length
    ? Math.max(...filteredRecommendations.map((r) => r.expectedValue))
    : 0;

  if (loading) {
    return (
      <main className="dashboard-shell">
        <section className="hero-card">
          <h1 className="hero-title">Laster dashboard...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Dashboard</h1>
            <p className="hero-subtitle">
              En mer eksklusiv oversikt over odds, verdi-spill og kampanalyse.
            </p>
          </div>

          <div className="updated-at">
            Oppdatert:{' '}
            {data?.generatedAt
              ? new Date(data.generatedAt).toLocaleString('no-NO')
              : '–'}
          </div>
        </div>

        {data?.source === 'partial-live' ? (
          <div className="info-panel" style={{ marginTop: 20 }}>
            <h3>Live-kilde delvis tilgjengelig</h3>
            <p>
              Oddsleverandøren er midlertidig utilgjengelig, så appen viser fortsatt kampkontekst,
              tabell og form, men bruker fallback-odds der det trengs.
            </p>
          </div>
        ) : null}

        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Runde</div>
            <div className="summary-value">{data?.round ?? '–'}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Data mode</div>
            <div className="summary-value">{sourceLabel(data?.source)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Anbefalte spill</div>
            <div className="summary-value">{filteredRecommendations.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Beste EV</div>
            <div className="summary-value green">{pct(bestEV)}</div>
          </div>
        </div>
      </section>

      <section className="filters-card">
        <h2 className="section-title">Filtre</h2>
        <p className="section-subtitle">
          Filtrer anbefalingene på marked og minimum forventet verdi.
        </p>

        <div className="filters-grid">
          <div>
            <label className="field-label">Marked</label>
            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="select-input"
            >
              <option value="all">Alle</option>
              <option value="home">Hjemmeseier</option>
              <option value="draw">Uavgjort</option>
              <option value="away">Borteseier</option>
              <option value="over2_5">Over 2.5</option>
              <option value="under2_5">Under 2.5</option>
              <option value="btts_yes">Begge lag scorer</option>
              <option value="btts_no">Begge lag scorer ikke</option>
            </select>
          </div>

          <div>
            <label className="field-label">Minimum EV: {pct(minEV)}</label>
            <input
              type="range"
              min={0}
              max={0.25}
              step={0.005}
              value={minEV}
              onChange={(e) => setMinEV(Number(e.target.value))}
              className="range-input"
            />
          </div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Topp anbefalinger</h2>
                <p className="section-subtitle">De beste spillene modellen finner akkurat nå.</p>
              </div>
              <div className="badge-soft">{filteredRecommendations.length} spill</div>
            </div>

            <div className="item-list">
              {filteredRecommendations.length === 0 ? (
                <div className="empty-box">Ingen anbefalinger passer filtrene akkurat nå.</div>
              ) : (
                filteredRecommendations.slice(0, 10).map((rec, idx) => (
                  <button
                    key={`${rec.fixtureId}-${rec.market}`}
                    onClick={() => setSelectedFixtureId(String(rec.fixtureId))}
                    className="recommendation-card"
                    style={cardBorderClass(rec.expectedValue)}
                  >
                    <div className="rec-topline">
                      <div>
                        <div className="rec-rank">#{idx + 1}</div>
                        <h3 className="match-name">{rec.match}</h3>
                        <div className="market-name">{formatMarket(rec.market)}</div>
                      </div>
                      <div className="ev-pill">EV {pct(rec.expectedValue)}</div>
                    </div>

                    <div className="metrics-grid">
                      <div className="metric-pill">
                        <div className="metric-pill-label">Odds</div>
                        <div className="metric-pill-value">{rec.bookmakerOdds}</div>
                      </div>
                      <div className="metric-pill">
                        <div className="metric-pill-label">Fair odds</div>
                        <div className="metric-pill-value">{rec.fairOdds}</div>
                      </div>
                      <div className="metric-pill">
                        <div className="metric-pill-label">Edge</div>
                        <div className="metric-pill-value">{pct(rec.edge)}</div>
                      </div>
                      <div className="metric-pill">
                        <div className="metric-pill-label">Confidence</div>
                        <div className="metric-pill-value">{rec.confidence.toFixed(0)}/100</div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Kamper</h2>
                <p className="section-subtitle">Klikk på en kamp for å åpne preview og analyse.</p>
              </div>
              <div className="badge-soft">{data?.fixtures?.length ?? 0} kamper</div>
            </div>

            <div className="item-list">
              {(data?.fixtures ?? []).map((fixture) => {
                const active = String(selectedFixture?.id) === String(fixture.id);

                return (
                  <button
                    key={fixture.id}
                    onClick={() => setSelectedFixtureId(String(fixture.id))}
                    className={`fixture-card ${active ? 'active' : ''}`}
                  >
                    <div className="fixture-topline">
                      <div>
                        <h3 className="match-name">
                          {fixture.homeTeam} vs {fixture.awayTeam}
                        </h3>
                        <div className="fixture-kickoff">{formatDate(fixture.kickoff)}</div>
                      </div>
                      <div className="badge-soft">
                        {formatMarket(fixture.topRecommendation?.market)}
                      </div>
                    </div>

                    <div className="metrics-grid three">
                      <div className="metric-pill">
                        <div className="metric-pill-label">EV</div>
                        <div className="metric-pill-value">
                          {pct(fixture.topRecommendation?.expectedValue)}
                        </div>
                      </div>
                      <div className="metric-pill">
                        <div className="metric-pill-label">Edge</div>
                        <div className="metric-pill-value">
                          {pct(fixture.topRecommendation?.edge)}
                        </div>
                      </div>
                      <div className="metric-pill">
                        <div className="metric-pill-label">Bookmaker</div>
                        <div className="metric-pill-value">
                          {fixture.latestOdds?.bookmaker ?? '–'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <MatchDetailPanel
          fixture={selectedFixture}
          recommendations={selectedRecommendations}
          source={data?.source}
        />
      </section>
    </main>
  );
}
