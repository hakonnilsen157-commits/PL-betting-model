'use client';

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

function pct(v?: number) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '–';
  return `${(v * 100).toFixed(1)}%`;
}

function formatDate(date: string) {
  try {
    return new Date(date).toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

function formatMarket(market?: string) {
  if (!market) return 'Ingen tydelig kandidat';
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

function InfoStat({
  label,
  value,
  tone = 'white',
}: {
  label: string;
  value: string;
  tone?: 'white' | 'emerald' | 'amber' | 'sky';
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-400'
      : tone === 'amber'
      ? 'text-amber-300'
      : tone === 'sky'
      ? 'text-sky-300'
      : 'text-white';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function Meter({
  label,
  value,
  max = 0.2,
  color = 'emerald',
}: {
  label: string;
  value?: number;
  max?: number;
  color?: 'emerald' | 'amber' | 'sky';
}) {
  const safeValue = typeof value === 'number' ? Math.max(0, Math.min(value, max)) : 0;
  const width = `${(safeValue / max) * 100}%`;
  const colorClass =
    color === 'emerald'
      ? 'bg-emerald-400'
      : color === 'amber'
      ? 'bg-amber-400'
      : 'bg-sky-400';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{pct(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width }} />
      </div>
    </div>
  );
}

function ExplanationCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-400">{text}</div>
    </div>
  );
}

export default function MatchDetailPanel({
  fixture,
  recommendations,
}: {
  fixture: FixtureCard | null;
  recommendations: Recommendation[];
}) {
  if (!fixture) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <h3 className="text-xl font-semibold text-white">Kampdetalj</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Velg en kamp til venstre for å se analyse, odds og modellens vurderinger.
        </p>
      </div>
    );
  }

  const topRecommendation = recommendations[0] ?? fixture.topRecommendation;

  const analysisText = (() => {
    if (!topRecommendation) {
      return 'Modellen har foreløpig ikke funnet et tydelig verdi-spill i denne kampen.';
    }

    if (topRecommendation.market === 'home') {
      return `${fixture.homeTeam} vurderes som den sterkeste siden i denne kampen basert på lagstyrke, hjemmefordel og markedsforankring.`;
    }

    if (topRecommendation.market === 'away') {
      return `${fixture.awayTeam} vurderes som den sterkeste siden i denne kampen basert på modellens vurdering av bortelagets kvalitet og prising i markedet.`;
    }

    if (topRecommendation.market === 'draw') {
      return 'Modellen vurderer dette som en jevn kamp der sannsynligheten for uavgjort kan være høyere enn markedet priser inn.';
    }

    if (topRecommendation.market === 'over2_5') {
      return 'Modellen ser signaler om en åpnere kamp med høyere målsannsynlighet enn markedet tilsier.';
    }

    if (topRecommendation.market === 'under2_5') {
      return 'Modellen forventer en mer kontrollert kamp med lavere målsannsynlighet enn markedet tilsier.';
    }

    if (topRecommendation.market === 'btts_yes') {
      return 'Modellen forventer at begge lag har realistiske muligheter til å score.';
    }

    if (topRecommendation.market === 'btts_no') {
      return 'Modellen forventer at minst ett av lagene kan bli holdt til null.';
    }

    return 'Modellen har vurdert flere markeder i denne kampen.';
  })();

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-6">
        <div className="inline-flex w-fit rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
          Kampdetalj
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            {fixture.homeTeam} vs {fixture.awayTeam}
          </h2>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
            <span>Kampstart: {formatDate(fixture.kickoff)}</span>
            <span>•</span>
            <span>Bookmaker: {fixture.latestOdds?.bookmaker ?? 'Ukjent'}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoStat label="Toppspill" value={formatMarket(topRecommendation?.market)} />
        <InfoStat label="EV" value={pct(topRecommendation?.expectedValue)} tone="emerald" />
        <InfoStat label="Edge" value={pct(topRecommendation?.edge)} tone="amber" />
        <InfoStat
          label="Confidence"
          value={topRecommendation ? `${topRecommendation.confidence.toFixed(0)}/100` : '–'}
          tone="sky"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:col-span-2">
          <h3 className="text-lg font-semibold text-white">Kort analyse</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">{analysisText}</p>
          {topRecommendation?.note ? (
            <p className="mt-3 text-sm leading-6 text-slate-400">{topRecommendation.note}</p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
          <h3 className="text-lg font-semibold text-white">Signalstyrke</h3>
          <div className="mt-4 space-y-4">
            <Meter label="EV" value={topRecommendation?.expectedValue} max={0.2} color="emerald" />
            <Meter label="Edge" value={topRecommendation?.edge} max={0.15} color="amber" />
            <Meter
              label="Confidence"
              value={topRecommendation ? topRecommendation.confidence / 100 : 0}
              max={1}
              color="sky"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="text-lg font-semibold text-white">{fixture.homeTeam}</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Hviledager</span>
              <span>{fixture.daysRestHome ?? '–'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Skader</span>
              <span>{fixture.injuriesHome ?? 0}</span>
            </div>
            <div className="pt-2 text-slate-400">
              Modellen gir hjemmelaget et lite løft gjennom hjemmefordel, men dette balanseres mot markedsoddsen.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="text-lg font-semibold text-white">{fixture.awayTeam}</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Hviledager</span>
              <span>{fixture.daysRestAway ?? '–'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Skader</span>
              <span>{fixture.injuriesAway ?? 0}</span>
            </div>
            <div className="pt-2 text-slate-400">
              Bortelaget justeres litt ned for bortebane, men markedsvurderingen holder modellen realistisk.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <h3 className="text-lg font-semibold text-white">Oddsoversikt</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-900/80 p-4">
            <div className="text-sm text-slate-400">H / U / B</div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div className="flex justify-between">
                <span>Hjemme</span>
                <span>{fixture.latestOdds?.home ?? '–'}</span>
              </div>
              <div className="flex justify-between">
                <span>Uavgjort</span>
                <span>{fixture.latestOdds?.draw ?? '–'}</span>
              </div>
              <div className="flex justify-between">
                <span>Borte</span>
                <span>{fixture.latestOdds?.away ?? '–'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/80 p-4">
            <div className="text-sm text-slate-400">Over / Under 2.5</div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div className="flex justify-between">
                <span>Over 2.5</span>
                <span>{fixture.latestOdds?.over2_5 ?? '–'}</span>
              </div>
              <div className="flex justify-between">
                <span>Under 2.5</span>
                <span>{fixture.latestOdds?.under2_5 ?? '–'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/80 p-4">
            <div className="text-sm text-slate-400">BTTS</div>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <div className="flex justify-between">
                <span>Ja</span>
                <span>{fixture.latestOdds?.btts_yes ?? '–'}</span>
              </div>
              <div className="flex justify-between">
                <span>Nei</span>
                <span>{fixture.latestOdds?.btts_no ?? '–'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Hva betyr tallene?</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <ExplanationCard
            title="EV"
            text="Expected Value. Positiv EV betyr at modellen mener oddsen er bedre enn den burde være."
          />
          <ExplanationCard
            title="Fair odds"
            text="Modellens beregnede 'rette' odds basert på sannsynligheten modellen kommer frem til."
          />
          <ExplanationCard
            title="Edge"
            text="Forskjellen mellom modellens vurdering og bookmakerens implisitte sannsynlighet."
          />
          <ExplanationCard
            title="Confidence"
            text="En samlet tillitsindikator basert på signalstyrke, datakvalitet og hvor tydelig verdien er."
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
        <h3 className="text-lg font-semibold text-white">Modellens spillvurderinger</h3>

        {recommendations.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            Ingen kvalifiserte spill i denne kampen akkurat nå.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {recommendations.map((rec) => (
              <div
                key={`${rec.fixtureId}-${rec.market}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">{formatMarket(rec.market)}</div>
                    <div className="mt-1 text-sm text-slate-400">{rec.note}</div>
                  </div>

                  <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                    EV {pct(rec.expectedValue)}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-xs text-slate-500">Modellsannsynlighet</div>
                    <div className="mt-1 font-medium text-white">{pct(rec.modelProbability)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-xs text-slate-500">Markedssannsynlighet</div>
                    <div className="mt-1 font-medium text-white">{pct(rec.impliedProbability)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-xs text-slate-500">Fair odds</div>
                    <div className="mt-1 font-medium text-white">{rec.fairOdds}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-xs text-slate-500">Bookmakerodds</div>
                    <div className="mt-1 font-medium text-white">{rec.bookmakerOdds}</div>
                  </div>
                  <div className="rounded-xl bg-slate-950/80 p-3">
                    <div className="text-xs text-slate-500">Confidence</div>
                    <div className="mt-1 font-medium text-white">{rec.confidence.toFixed(0)}/100</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
