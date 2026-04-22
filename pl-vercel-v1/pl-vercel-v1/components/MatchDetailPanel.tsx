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

function formatMarket(market: string) {
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

function StatHelp({
  label,
  explanation,
}: {
  label: string;
  explanation: string;
}) {
  return (
    <span
      title={explanation}
      className="inline-flex cursor-help items-center gap-1 border-b border-dotted border-slate-400 text-slate-200"
    >
      {label}
      <span className="rounded-full bg-slate-700 px-1.5 text-[10px] text-slate-300">i</span>
    </span>
  );
}

export default function MatchDetailPanel({
  fixture,
  recommendations,
  onClose,
}: {
  fixture: FixtureCard | null;
  recommendations: Recommendation[];
  onClose?: () => void;
}) {
  if (!fixture) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-300">
        <h3 className="mb-2 text-lg font-semibold text-white">Kampdetaljer</h3>
        <p>Trykk på en kamp for å se analyse, odds og anbefalte spill.</p>
      </div>
    );
  }

  const matchRecs = recommendations
    .filter((r) => String(r.fixtureId) === String(fixture.id))
    .sort((a, b) => b.expectedValue - a.expectedValue || b.edge - a.edge);

  const top = matchRecs[0];

  const strengthText = (() => {
    if (!top) return 'Modellen har foreløpig ikke funnet et tydelig verdi-spill i denne kampen.';
    if (top.market === 'home') return `${fixture.homeTeam} vurderes som den sterkeste siden i denne kampen.`;
    if (top.market === 'away') return `${fixture.awayTeam} vurderes som den sterkeste siden i denne kampen.`;
    if (top.market === 'draw') return 'Modellen forventer en relativt jevn kamp med brukbar sannsynlighet for uavgjort.';
    if (top.market === 'over2_5') return 'Modellen ser signaler om en mer åpen kamp med sjanser og mål begge veier.';
    if (top.market === 'under2_5') return 'Modellen forventer en mer kontrollert og målfattig kamp.';
    if (top.market === 'btts_yes') return 'Modellen forventer at begge lag har gode muligheter til å score.';
    if (top.market === 'btts_no') return 'Modellen forventer at minst ett av lagene kan bli holdt til null mål.';
    return 'Modellen har vurdert flere markeder i denne kampen.';
  })();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-slate-100">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">Kampdetalj</div>
          <h3 className="text-2xl font-bold">
            {fixture.homeTeam} vs {fixture.awayTeam}
          </h3>
          <div className="mt-2 text-sm text-slate-400">
            Kampstart: {formatDate(fixture.kickoff)}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Bookmaker: {fixture.latestOdds?.bookmaker ?? 'Ukjent'}
          </div>
        </div>

        {onClose ? (
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Lukk
          </button>
        ) : null}
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-slate-800/70 p-4">
          <div className="mb-1 text-xs text-slate-400">Toppspill</div>
          <div className="font-semibold text-white">{top ? formatMarket(top.market) : 'Ingen tydelig kandidat'}</div>
        </div>
        <div className="rounded-xl bg-slate-800/70 p-4">
          <div className="mb-1 text-xs text-slate-400">
            <StatHelp
              label="EV"
              explanation="EV betyr forventet verdi. Positiv EV betyr at modellen mener oddsen er bedre enn den burde være."
            />
          </div>
          <div className="font-semibold text-white">{top ? pct(top.expectedValue) : '–'}</div>
        </div>
        <div className="rounded-xl bg-slate-800/70 p-4">
          <div className="mb-1 text-xs text-slate-400">
            <StatHelp
              label="Edge"
              explanation="Edge er forskjellen mellom modellens sannsynlighet og bookmakerens implisitte sannsynlighet."
            />
          </div>
          <div className="font-semibold text-white">{top ? pct(top.edge) : '–'}</div>
        </div>
        <div className="rounded-xl bg-slate-800/70 p-4">
          <div className="mb-1 text-xs text-slate-400">
            <StatHelp
              label="Confidence"
              explanation="Confidence er modellens tillit til anbefalingen, basert på signalstyrke og datakvalitet."
            />
          </div>
          <div className="font-semibold text-white">{top ? `${top.confidence.toFixed(0)}/100` : '–'}</div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h4 className="mb-2 text-base font-semibold text-white">Kort analyse</h4>
        <p className="text-sm leading-6 text-slate-300">{strengthText}</p>
        {top ? <p className="mt-3 text-sm text-slate-400">{top.note}</p> : null}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h4 className="mb-3 font-semibold text-white">{fixture.homeTeam}</h4>
          <div className="space-y-2 text-sm text-slate-300">
            <div>Hviledager: {fixture.daysRestHome ?? '–'}</div>
            <div>Skader: {fixture.injuriesHome ?? 0}</div>
            <div>Hjemmefordel: Modellen gir automatisk et lite pluss til hjemmelaget.</div>
            <div>Markedsvurdering: Brukes som anker slik at modellen ikke går for langt fra oddsen.</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h4 className="mb-3 font-semibold text-white">{fixture.awayTeam}</h4>
          <div className="space-y-2 text-sm text-slate-300">
            <div>Hviledager: {fixture.daysRestAway ?? '–'}</div>
            <div>Skader: {fixture.injuriesAway ?? 0}</div>
            <div>Bortejustering: Modellen justerer litt ned for bortebane.</div>
            <div>Markedsvurdering: Brukes som anker også for bortelaget.</div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h4 className="mb-3 font-semibold text-white">Oddsoversikt</h4>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg bg-slate-800/70 p-3">
            <div className="text-slate-400">H / U / B</div>
            <div className="mt-2 text-slate-100">
              H: {fixture.latestOdds?.home ?? '–'} <br />
              U: {fixture.latestOdds?.draw ?? '–'} <br />
              B: {fixture.latestOdds?.away ?? '–'}
            </div>
          </div>
          <div className="rounded-lg bg-slate-800/70 p-3">
            <div className="text-slate-400">Over / Under 2.5</div>
            <div className="mt-2 text-slate-100">
              Over: {fixture.latestOdds?.over2_5 ?? '–'} <br />
              Under: {fixture.latestOdds?.under2_5 ?? '–'}
            </div>
          </div>
          <div className="rounded-lg bg-slate-800/70 p-3">
            <div className="text-slate-400">BTTS</div>
            <div className="mt-2 text-slate-100">
              Ja: {fixture.latestOdds?.btts_yes ?? '–'} <br />
              Nei: {fixture.latestOdds?.btts_no ?? '–'}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h4 className="mb-3 font-semibold text-white">Modellens spillvurderinger</h4>
        {matchRecs.length === 0 ? (
          <p className="text-sm text-slate-400">Ingen spill ble kvalifisert i denne kampen med dagens filter.</p>
        ) : (
          <div className="space-y-3">
            {matchRecs.map((rec) => (
              <div
                key={`${rec.fixtureId}-${rec.market}`}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold text-white">{formatMarket(rec.market)}</div>
                  <div className="text-sm text-emerald-300">EV {pct(rec.expectedValue)}</div>
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-5">
                  <div>
                    <div className="text-slate-400">
                      <StatHelp
                        label="Modell"
                        explanation="Modellens vurderte sannsynlighet for at spillet skal gå inn."
                      />
                    </div>
                    <div className="mt-1 text-slate-100">{pct(rec.modelProbability)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">
                      <StatHelp
                        label="Marked"
                        explanation="Bookmakerens implisitte sannsynlighet basert på oddsen."
                      />
                    </div>
                    <div className="mt-1 text-slate-100">{pct(rec.impliedProbability)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">
                      <StatHelp
                        label="Fair odds"
                        explanation="Den oddsen modellen mener er mest korrekt."
                      />
                    </div>
                    <div className="mt-1 text-slate-100">{rec.fairOdds}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Bookmaker</div>
                    <div className="mt-1 text-slate-100">{rec.bookmakerOdds}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Confidence</div>
                    <div className="mt-1 text-slate-100">{rec.confidence.toFixed(0)}/100</div>
                  </div>
                </div>

                <div className="mt-3 text-sm text-slate-400">{rec.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
