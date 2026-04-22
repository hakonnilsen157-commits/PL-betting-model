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
};

type DashboardResponse = {
  round: number;
  fixtures: FixtureCard[];
  recommendations: Recommendation[];
  source: string;
  generatedAt: string;
  debug?: Record<string, unknown>;
};

function pct(v?: number) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '–';
  return `${(v * 100).toFixed(1)}%`;
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
        const [fixturesRes, recsRes] = await Promise.all([
          fetch('/api/fixtures', { cache: 'no-store' }),
          fetch('/api/recommendations', { cache: 'no-store' }),
        ]);

        const fixturesJson = await fixturesRes.json();
        const recsJson = await recsRes.json();

        if (!mounted) return;

        setData({
          round: fixturesJson.round ?? recsJson.round ?? 0,
          fixtures: fixturesJson.fixtures ?? [],
          recommendations: recsJson.recommendations ?? fixturesJson.recommendations ?? [],
          source: fixturesJson.source ?? recsJson.source ?? 'unknown',
          generatedAt: fixturesJson.generatedAt ?? recsJson.generatedAt ?? new Date().toISOString(),
          debug: fixturesJson.debug ?? recsJson.debug,
        });
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
    if (selectedFixtureId) {
      return data.fixtures.find((f) => String(f.id) === String(selectedFixtureId)) ?? null;
    }
    return data.fixtures[0] ?? null;
  }, [data, selectedFixtureId]);

  const selectedRecommendations = useMemo(() => {
    if (!data?.recommendations?.length || !selectedFixture) return [];
    return data.recommendations.filter((r) => String(r.fixtureId) === String(selectedFixture.id));
  }, [data, selectedFixture]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            Laster dashboard...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                Premier League Betting Model
              </div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="mt-2 text-sm text-slate-400">
                Live data, anbefalte spill og kampanalyse på ett sted.
              </p>
            </div>

            <div className="text-sm text-slate-400">
              Oppdatert: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString('no-NO') : '–'}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-slate-800/70 p-4">
              <div className="text-xs text-slate-400">Runde</div>
              <div className="mt-1 text-2xl font-bold">{data?.round ?? '–'}</div>
            </div>
            <div className="rounded-xl bg-slate-800/70 p-4">
              <div className="text-xs text-slate-400">Data mode</div>
              <div className="mt-1 text-2xl font-bold">{data?.source ?? '–'}</div>
            </div>
            <div className="rounded-xl bg-slate-800/70 p-4">
              <div className="text-xs text-slate-400">Anbefalte spill</div>
              <div className="mt-1 text-2xl font-bold">{filteredRecommendations.length}</div>
            </div>
            <div className="rounded-xl bg-slate-800/70 p-4">
              <div className="text-xs text-slate-400">Kamper</div>
              <div className="mt-1 text-2xl font-bold">{data?.fixtures?.length ?? 0}</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-xl font-semibold">Filtre</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">Marked</label>
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
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
              <label className="mb-2 block text-sm text-slate-400">
                Minimum EV: {pct(minEV)}
              </label>
              <input
                type="range"
                min={0}
                max={0.2}
                step={0.005}
                value={minEV}
                onChange={(e) => setMinEV(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="mb-4 text-xl font-semibold">Topp anbefalinger</h2>

              <div className="space-y-3">
                {filteredRecommendations.length === 0 ? (
                  <div className="rounded-xl bg-slate-800/50 p-4 text-slate-400">
                    Ingen spill oppfyller filtrene akkurat nå.
                  </div>
                ) : (
                  filteredRecommendations.map((rec) => (
                    <button
                      key={`${rec.fixtureId}-${rec.market}`}
                      onClick={() => setSelectedFixtureId(String(rec.fixtureId))}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left transition hover:border-slate-600 hover:bg-slate-900"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <div className="font-semibold text-white">{rec.match}</div>
                        <div className="text-sm text-emerald-300">EV {pct(rec.expectedValue)}</div>
                      </div>

                      <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-5">
                        <div>
                          <div className="text-slate-400">Spill</div>
                          <div>{formatMarket(rec.market)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Odds</div>
                          <div>{rec.bookmakerOdds}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Fair</div>
                          <div>{rec.fairOdds}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Edge</div>
                          <div>{pct(rec.edge)}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Confidence</div>
                          <div>{rec.confidence.toFixed(0)}/100</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <h2 className="mb-4 text-xl font-semibold">Kamper</h2>

              <div className="space-y-3">
                {(data?.fixtures ?? []).map((fixture) => (
                  <button
                    key={fixture.id}
                    onClick={() => setSelectedFixtureId(String(fixture.id))}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      String(selectedFixture?.id) === String(fixture.id)
                        ? 'border-emerald-500 bg-slate-950/80'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                      <div className="font-semibold text-white">
                        {fixture.homeTeam} vs {fixture.awayTeam}
                      </div>
                      <div className="text-sm text-slate-400">{formatDate(fixture.kickoff)}</div>
                    </div>

                    <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-4">
                      <div>
                        <div className="text-slate-400">Toppspill</div>
                        <div>{formatMarket(fixture.topRecommendation?.market)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">EV</div>
                        <div>{pct(fixture.topRecommendation?.expectedValue)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Edge</div>
                        <div>{pct(fixture.topRecommendation?.edge)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Bookmaker</div>
                        <div>{fixture.latestOdds?.bookmaker ?? '–'}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <MatchDetailPanel
              fixture={selectedFixture}
              recommendations={selectedRecommendations}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
