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

function StatBox({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'green' | 'amber' | 'sky';
}) {
  const toneClass =
    tone === 'green'
      ? 'text-emerald-300'
      : tone === 'amber'
      ? 'text-amber-300'
      : tone === 'sky'
      ? 'text-sky-300'
      : 'text-white';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
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

function buildReasons(fixture: FixtureCard, rec?: Recommendation) {
  const reasons: string[] = [];
  if (!rec) return reasons;

  if (rec.bookmakerOdds > rec.fairOdds) {
    reasons.push(
      `Bookmakeren tilbyr ${rec.bookmakerOdds} i odds, mens modellen estimerer fair odds til ${rec.fairOdds}. Det tyder på at markedet kan undervurdere dette utfallet.`
    );
  }

  if (rec.edge >= 0.03) {
    reasons.push(
      `Edge på ${pct(rec.edge)} er solid og betyr at modellens sannsynlighet ligger tydelig over markedets implisitte vurdering.`
    );
  } else if (rec.edge > 0) {
    reasons.push(
      `Modellen finner fortsatt en positiv edge på ${pct(rec.edge)}, men dette er et mer moderat verdi-signal.`
    );
  }

  const restDiff = (fixture.daysRestHome ?? 0) - (fixture.daysRestAway ?? 0);
  if (rec.market === 'home' && restDiff > 0) {
    reasons.push(
      `${fixture.homeTeam} ser ut til å komme inn med litt bedre restitusjonsgrunnlag enn bortelaget, noe som kan gi et løft i kampbildet.`
    );
  }
  if (rec.market === 'away' && restDiff < 0) {
    reasons.push(
      `${fixture.awayTeam} har ikke dårligere restitusjonsbilde enn hjemmelaget, og modellen vurderer at kvaliteten er sterk nok til å veie opp bortebanen.`
    );
  }

  const injuryDiff = (fixture.injuriesAway ?? 0) - (fixture.injuriesHome ?? 0);
  if (rec.market === 'home' && injuryDiff > 0) {
    reasons.push(
      `Skadebildet ser marginalt gunstigere ut for ${fixture.homeTeam}, noe som styrker hjemmelagets case.`
    );
  }
  if (rec.market === 'away' && injuryDiff < 0) {
    reasons.push(
      `${fixture.awayTeam} ser ikke ut til å være mer svekket enn hjemmelaget, og modellen justerer derfor ikke bortesiden kraftig ned.`
    );
  }

  if (rec.market === 'home') {
    reasons.push(
      `I tillegg får ${fixture.homeTeam} et naturlig løft av hjemmebane, kampmiljø og støtte fra publikum, samtidig som markedet brukes som anker slik at modellen ikke går for langt.`
    );
  }

  if (rec.market === 'away') {
    reasons.push(
      `${fixture.awayTeam} vurderes av modellen som sterk nok til å kompensere for bortebanen, og prisingen i markedet ser fortsatt spillbar ut.`
    );
  }

  if (rec.market === 'draw') {
    reasons.push(
      `Kampen fremstår jevn, og modellen ser nok balanse i sannsynlighetsbildet til at uavgjort kan være underpriset.`
    );
  }

  if (rec.market === 'over2_5') {
    reasons.push(
      `Markedet for mål peker mot en åpnere kamp, og modellen ser signaler som gjør at over-linjen vurderes som interessant.`
    );
  }

  if (rec.market === 'under2_5') {
    reasons.push(
      `Modellen forventer en strammere kamp enn det oddsbildet fullt ut priser inn, og under-markedet fremstår derfor mer interessant.`
    );
  }

  if (rec.market === 'btts_yes') {
    reasons.push(
      `Begge lag vurderes å ha realistiske angrepsmuligheter, og BTTS-markedet kan derfor være litt for lavt priset av modellen.`
    );
  }

  if (rec.market === 'btts_no') {
    reasons.push(
      `Minst ett av lagene kan få problemer med å score i dette kampbildet, og modellen mener derfor at BTTS-nei har støtte i tallene.`
    );
  }

  if (reasons.length < 4) {
    reasons.push(
      `Confidence på ${rec.confidence.toFixed(
        0
      )}/100 tilsier at dette er et spill med brukbart signal, men ikke nødvendigvis et ekstremt high-conviction spot.`
    );
  }

  return reasons.slice(0, 5);
}

function buildRisks(fixture: FixtureCard, rec?: Recommendation) {
  const risks: string[] = [];
  if (!rec) return risks;

  if (rec.confidence < 55) {
    risks.push(
      `Confidence er ikke skyhøy, så dette er mer et strukturert verdi-spill enn et “må-spilles”-scenario.`
    );
  }

  if (rec.edge < 0.03) {
    risks.push(
      `Edge er relativt begrenset, og små markedsbevegelser kan raskt spise opp verdien.`
    );
  }

  if (rec.market === 'home') {
    risks.push(
      `Hvis ${fixture.awayTeam} kontrollerer tempoet eller scorer først, kan hjemmecaset svekkes betydelig.`
    );
  }

  if (rec.market === 'away') {
    risks.push(
      `Bortebane trekker naturlig litt ned, så kampen tåler mindre feilmargin hvis ${fixture.homeTeam} får tidlig momentum.`
    );
  }

  if (rec.market === 'draw') {
    risks.push(
      `Uavgjort-spill har ofte høy varians fordi ett enkelt mål kan endre hele kampbildet.`
    );
  }

  risks.push(
    `Vi har foreløpig ikke koblet på full form-/dommer-/spillerdata i analysen, så enkelte kvalitative forhold er ikke fullt modellert enda.`
  );

  return risks.slice(0, 4);
}

function buildTeamSummary(
  team: string,
  side: 'home' | 'away',
  restDays?: number,
  injuries?: number
) {
  const lines: string[] = [];

  lines.push(`Hviledager: ${restDays ?? '–'}`);
  lines.push(`Registrerte skader: ${injuries ?? 0}`);

  if (side === 'home') {
    lines.push(
      `Hjemmebanefordelen gir normalt et lite løft, særlig når kampbildet forventes å bli jevnt.`
    );
    lines.push(
      `Publikum, kjente omgivelser og mindre reisebelastning er elementer modellen i praksis forsøker å fange opp gjennom hjemmejusteringen.`
    );
  } else {
    lines.push(
      `Bortebane trekker litt ned, men sterke bortelag kan fortsatt være undervurdert dersom markedet priser dem for defensivt.`
    );
    lines.push(
      `Hvis laget holder sitt normale nivå også på bortebane, kan dette gi verdi når oddsen blir for høy.`
    );
  }

  return lines;
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
  const reasons = buildReasons(fixture, topRecommendation);
  const risks = buildRisks(fixture, topRecommendation);

  const verdictText = (() => {
    if (!topRecommendation) {
      return 'Modellen har foreløpig ikke funnet et tydelig verdi-spill i denne kampen.';
    }

    if (topRecommendation.market === 'home') {
      return `Modellen heller mot ${fixture.homeTeam} fordi hjemmelaget kombinerer hjemmefordel med en markedsprising som fortsatt ser spillbar ut.`;
    }

    if (topRecommendation.market === 'away') {
      return `Modellen heller mot ${fixture.awayTeam} fordi bortelaget vurderes sterkere enn det oddsen fullt ut antyder.`;
    }

    if (topRecommendation.market === 'draw') {
      return `Modellen leser dette som en jevn kamp og mener at sannsynligheten for poengdeling kan være høyere enn markedet priser inn.`;
    }

    if (topRecommendation.market === 'over2_5') {
      return `Modellen forventer et kampbilde som kan gi flere store sjanser enn markedet fullt ut tar høyde for.`;
    }

    if (topRecommendation.market === 'under2_5') {
      return `Modellen forventer et roligere og mer kontrollert kampbilde enn det oddsmarkedet indikerer.`;
    }

    if (topRecommendation.market === 'btts_yes') {
      return `Begge lag vurderes å ha nok offensivt potensial til å true i samme kamp.`;
    }

    if (topRecommendation.market === 'btts_no') {
      return `Minst ett lag kan få problemer med å score i dette oppgjøret, ifølge modellens vurdering.`;
    }

    return 'Modellen har vurdert flere markeder i denne kampen.';
  })();

  const homeSummary = buildTeamSummary(
    fixture.homeTeam,
    'home',
    fixture.daysRestHome,
    fixture.injuriesHome
  );

  const awaySummary = buildTeamSummary(
    fixture.awayTeam,
    'away',
    fixture.daysRestAway,
    fixture.injuriesAway
  );

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
      <div className="border-b border-slate-800 pb-6">
        <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Match Preview
        </div>

        <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">
          {fixture.homeTeam} vs {fixture.awayTeam}
        </h2>

        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
          <span>Kampstart: {formatDate(fixture.kickoff)}</span>
          <span>•</span>
          <span>Bookmaker: {fixture.latestOdds?.bookmaker ?? 'Ukjent'}</span>
          <span>•</span>
          <span>Runde: {fixture.round}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Toppspill" value={formatMarket(topRecommendation?.market)} />
        <StatBox label="EV" value={pct(topRecommendation?.expectedValue)} tone="green" />
        <StatBox label="Edge" value={pct(topRecommendation?.edge)} tone="amber" />
        <StatBox
          label="Confidence"
          value={topRecommendation ? `${topRecommendation.confidence.toFixed(0)}/100` : '–'}
          tone="sky"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <h3 className="text-lg font-semibold text-white">Modellens hovedvurdering</h3>
        <p className="mt-3 text-sm leading-7 text-slate-300">{verdictText}</p>
        {topRecommendation?.note ? (
          <p className="mt-3 text-sm leading-7 text-slate-400">{topRecommendation.note}</p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr,0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="text-lg font-semibold text-white">Hvorfor modellen liker dette spillet</h3>

          <div className="mt-4 space-y-3">
            {reasons.length === 0 ? (
              <div className="text-sm text-slate-400">Ingen tydelige nøkkelgrunner tilgjengelig.</div>
            ) : (
              reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                      {idx + 1}
                    </div>
                    <p className="text-sm leading-7 text-slate-300">{reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="text-lg font-semibold text-white">Signalstyrke</h3>

          <div className="mt-4 space-y-5">
            <Meter label="EV" value={topRecommendation?.expectedValue} max={0.2} color="emerald" />
            <Meter label="Edge" value={topRecommendation?.edge} max={0.15} color="amber" />
            <Meter
              label="Confidence"
              value={topRecommendation ? topRecommendation.confidence / 100 : 0}
              max={1}
              color="sky"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <h4 className="text-sm font-semibold text-white">Risiko / forbehold</h4>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
              {risks.map((risk, idx) => (
                <li key={idx}>• {risk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="text-lg font-semibold text-white">{fixture.homeTeam}</h3>
          <div className="mt-4 space-y-3">
            {homeSummary.map((line, idx) => (
              <div key={idx} className="rounded-2xl bg-slate-900/80 p-4 text-sm leading-6 text-slate-300">
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <h3 className="text-lg font-semibold text-white">{fixture.awayTeam}</h3>
          <div className="mt-4 space-y-3">
            {awaySummary.map((line, idx) => (
              <div key={idx} className="rounded-2xl bg-slate-900/80 p-4 text-sm leading-6 text-slate-300">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <h3 className="text-lg font-semibold text-white">Oddsoversikt</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-900/80 p-4">
            <div className="text-sm text-slate-400">1X2</div>
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
            text="Modellens beregnede ‘rette odds’ basert på sannsynligheten modellen kommer frem til."
          />
          <ExplanationCard
            title="Edge"
            text="Forskjellen mellom modellens vurderte sannsynlighet og bookmakerens implisitte sannsynlighet."
          />
          <ExplanationCard
            title="Confidence"
            text="En samlet tillitsindikator basert på signalstyrke, prising og hvor tydelig modellen mener caset er."
          />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
        <h3 className="text-lg font-semibold text-white">Alternative spill i kampen</h3>

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
                  <StatBox label="Modellsannsynlighet" value={pct(rec.modelProbability)} />
                  <StatBox label="Markedssannsynlighet" value={pct(rec.impliedProbability)} />
                  <StatBox label="Fair odds" value={String(rec.fairOdds)} />
                  <StatBox label="Bookmakerodds" value={String(rec.bookmakerOdds)} />
                  <StatBox label="Confidence" value={`${rec.confidence.toFixed(0)}/100`} tone="sky" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
        <strong>Neste steg:</strong> Hvis du vil at analysen skal omtale konkrete ting som formspillere, siste fem kamper,
        dommerprofil, hjemmestatistikk og lignende på en troverdig måte, må vi koble på flere datakilder i modellen.
      </div>
    </div>
  );
}
