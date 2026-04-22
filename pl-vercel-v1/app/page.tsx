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

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${highlight ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
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

        const nextData: DashboardResponse = {
          round: fixturesJson.round ?? recsJson.round ?? 0,
          fixtures: fixturesJson.fixtures ?? [],
          recommendations: recsJson.recommendations ?? [],
          source: fixturesJson.source ?? recsJson.source ?? 'unknown',
          generatedAt: fixturesJson.generatedAt ?? recsJson.generatedAt ?? new Date().toISOString(),
          debug: fixturesJson.debug ?? recsJson.debug,
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
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            Laster dashboard...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Premier League Betting Model
              </div>
              <h1 className="text-3xl font-bold md:text-4xl">Dashboard</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Live data, anbefalte spill og kampanalyse på ett sted.
              </p>
            </div>

            <div className="text-sm text-slate-400">
              Oppdatert:{' '}
              {data?.generatedAt
                ? new Date(data.generatedAt).toLocaleString('no-NO')
                : '–'}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Runde" value={data?.round ?? '–'} />
            <SummaryCard label="Data mode" value={data?.source ?? '–'} />
            <SummaryCard label="Anbefalte spill" value={filteredRecommendations.length} />
            <SummaryCard label="Beste EV" value={pct(bestEV)} highlight />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
          <h2 className="text-xl font-semibold">Filtre</h2>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Marked</label>
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
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
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Minimum EV: <span className="text-emerald-400">{pct(minEV)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={0.25}
                step={0.005}
                value={minEV}
                onChange={(e) => setMinEV(Number(e.target.value))}
                className="mt-3 w-full accent-emerald-500"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[420px,minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Topp anbefalinger</h2>
                <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {filteredRecommendations.length} spill
                </div>
              </div>

              <div className="space-y-4">
                {filteredRecommendations.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                    Ingen anbefalinger passer filtrene akkurat nå.
                  </div>
                ) : (
                  filteredRecommendations.slice(0, 10).map((rec, idx) => (
                    <button
                      key={`${rec.fixtureId}-${rec.market}`}
                      onClick={() => setSelectedFixtureId(String(rec.fixtureId))}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-left transition hover:border-slate-600 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-500">#{idx + 1}</div>
                          <div className="mt-1 font-semibold text-white">{rec.match}</div>
                        </div>
                        <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                          EV {pct(rec.expectedValue)}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <div className="text-xs text-slate-500">Spill</div>
                          <div className="mt-1 font-medium text-slate-100">{formatMarket(rec.market)}</div>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <div className="text-xs text-slate-500">Odds / Fair</div>
                          <div className="mt-1 font-medium text-slate-100">
                            {rec.bookmakerOdds} / {rec.fairOdds}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <div className="text-xs text-slate-500">Edge</div>
                          <div className="mt-1 font-medium text-slate-100">{pct(rec.edge)}</div>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <div className="text-xs text-slate-500">Confidence</div>
                          <div className="mt-1 font-medium text-slate-100">{rec.confidence.toFixed(0)}/100</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Kamper</h2>
                <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {data?.fixtures?.length ?? 0} kamper
                </div>
              </div>

              <div className="space-y-4">
                {(data?.fixtures ?? []).map((fixture) => {
                  const active = String(selectedFixture?.id) === String(fixture.id);

                  return (
                    <button
                      key={fixture.id}
                      onClick={() => setSelectedFixtureId(String(fixture.id))}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-emerald-500 bg-slate-950/90'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-600 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">
                            {fixture.homeTeam} vs {fixture.awayTeam}
                          </div>
                          <div className="mt-1 text-sm text-slate-400">{formatDate(fixture.kickoff)}</div>
                        </div>

                        <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                          {formatMarket(fixture.topRecommendation?.market)}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <div className="text-xs text-slate-500">EV</div>
                          <div className="mt-1 font-medium text-slate-100">
                            {pct(fixture.topRecommendation?.expectedValue)}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <div className="text-xs text-slate-500">Edge</div>
                          <div className="mt-1 font-medium text-slate-100">
                            {pct(fixture.topRecommendation?.edge)}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-900/80 p-3">
                          <div className="text-xs text-slate-500">Bookmaker</div>
                          <div className="mt-1 font-medium text-slate-100">
                            {fixture.latestOdds?.bookmaker ?? '–'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="xl:sticky xl:top-8 xl:self-start">
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
