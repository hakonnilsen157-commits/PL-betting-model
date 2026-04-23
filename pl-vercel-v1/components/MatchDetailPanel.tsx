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

type TeamContext = {
  teamId?: number;
  teamName: string;
  rank?: number;
  points?: number;
  form?: string;
  description?: string;
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

function describeForm(form?: string) {
  if (!form) return 'ukjent form';
  const wins = [...form].filter((x) => x === 'W').length;
  const losses = [...form].filter((x) => x === 'L').length;

  if (wins >= 3 && losses === 0) return `sterk form (${form})`;
  if (wins >= 3) return `god form (${form})`;
  if (losses >= 3) return `svak form (${form})`;
  return `blandet form (${form})`;
}

function oddsSourceMeta(bookmaker?: string) {
  const label = bookmaker ?? 'Ukjent';
  const usingModelOdds = label.toLowerCase().includes('model') || label.toLowerCase().includes('fallback');
  return {
    usingModelOdds,
    label: usingModelOdds ? 'Modellodds' : label,
  };
}

function buildPreviewText(fixture: FixtureCard, rec?: Recommendation, source?: string) {
  const home = fixture.homeContext;
  const away = fixture.awayContext;
  const parts: string[] = [];

  if (home?.rank && away?.rank) {
    parts.push(
      `${fixture.homeTeam} går inn til kampen som nummer ${home.rank} på tabellen, mens ${fixture.awayTeam} ligger på plass ${away.rank}.`
    );
  }

  if (home?.form || away?.form) {
    parts.push(
      `${fixture.homeTeam} kommer inn i ${describeForm(home?.form)}, mens ${fixture.awayTeam} møter opp med ${describeForm(away?.form)}.`
    );
  }

  if (
    home?.homeWins !== undefined &&
    home?.homeDraws !== undefined &&
    home?.homeLosses !== undefined &&
    away?.awayWins !== undefined &&
    away?.awayDraws !== undefined &&
    away?.awayLosses !== undefined
  ) {
    parts.push(
      `${fixture.homeTeam} har hjemmeprofil ${home.homeWins}-${home.homeDraws}-${home.homeLosses}, mens ${fixture.awayTeam} står med bortestatistikk ${away.awayWins}-${away.awayDraws}-${away.awayLosses}.`
    );
  }

  if (home?.goalsFor !== undefined && away?.goalsFor !== undefined) {
    parts.push(
      `${fixture.homeTeam} har scoret ${home.goalsFor} mål denne sesongen, mens ${fixture.awayTeam} står med ${away.goalsFor}.`
    );
  }

  if (rec?.market === 'home') {
    parts.push(
      `Modellen heller mot hjemmelaget fordi kombinasjonen av hjemmefordel, kampkontekst og pris i markedet fortsatt peker svakt i ${fixture.homeTeam}s favør.`
    );
  } else if (rec?.market === 'away') {
    parts.push(
      `Modellen heller mot bortelaget fordi oddsen fortsatt ser litt høy ut relativt til sannsynligheten modellen gir ${fixture.awayTeam}.`
    );
  } else if (rec?.market === 'draw') {
    parts.push(
      `Sannsynlighetsbildet ser jevnt ut, og derfor fremstår uavgjort mer interessant enn markedet antyder ved første øyekast.`
    );
  } else if (rec?.market === 'over2_5') {
    parts.push(
      `Kampbildet vurderes som åpent nok til at over 2.5 mål kan være litt bedre priset enn markedet tilsier.`
    );
  } else if (rec?.market === 'under2_5') {
    parts.push(
      `Modellen leser dette som en kamp som kan bli strammere enn det oddsbildet antyder.`
    );
  }

  if (source === 'partial-live') {
    parts.push(
      `Lagdataene er live, men oddsdelen er midlertidig erstattet med modellodds fordi bookmaker-feeden ikke er tilgjengelig akkurat nå.`
    );
  }

  if (parts.length === 0) {
    return `Modellen har foreløpig ikke nok signalstyrke til å lage en tydelig preview for denne kampen.`;
  }

  return parts.join(' ');
}

function buildWhyThisPick(fixture: FixtureCard, rec?: Recommendation) {
  const lines: string[] = [];
  const home = fixture.homeContext;
  const away = fixture.awayContext;

  if (!rec) return lines;

  if (rec.bookmakerOdds > rec.fairOdds) {
    lines.push(
      `Markedet tilbyr ${rec.bookmakerOdds} i odds, mens modellen estimerer fair odds til ${rec.fairOdds}. Dette er hovedgrunnen til at spillet fremstår attraktivt.`
    );
  }

  if (rec.edge >= 0.04) {
    lines.push(
      `Edge på ${pct(rec.edge)} er relativt sterk. Modellen mener altså at dette utfallet har høyere sannsynlighet enn bookmakerens odds antyder.`
    );
  } else if (rec.edge > 0) {
    lines.push(
      `Edge på ${pct(rec.edge)} er positiv, men moderat. Dette er mer et kontrollert verdi-signal enn et ekstremt spill.`
    );
  }

  if (home?.form && away?.form) {
    lines.push(
      `${fixture.homeTeam} kommer inn med ${home.form}, mens ${fixture.awayTeam} står med ${away.form}. Den nylige formen brukes som en del av kampkonteksten i vurderingen.`
    );
  }

  if (home?.rank && away?.rank) {
    lines.push(
      `Tabellmessig ligger ${fixture.homeTeam} på plass ${home.rank}, mens ${fixture.awayTeam} ligger på plass ${away.rank}. Det gjør det lettere å tolke om oddsen ser høy eller lav ut.`
    );
  }

  if (rec.market === 'home' && home?.homeWins !== undefined) {
    lines.push(
      `${fixture.homeTeam} sin hjemmeprofil brukes som støttefaktor i vurderingen, særlig når markedet allerede priser kampen forholdsvis jevnt.`
    );
  }

  if (rec.market === 'away' && away?.awayWins !== undefined) {
    lines.push(
      `${fixture.awayTeam} sin bortekapasitet brukes som en viktig kontroll mot at bortesiden ikke undervurderes for mye.`
    );
  }

  lines.push(
    `Confidence på ${rec.confidence.toFixed(
      0
    )}/100 tilsier at dette er et spill med brukbar støtte i modellen, men fortsatt ikke et blindt “må-spilles”-spill.`
  );

  return lines.slice(0, 5);
}

function buildRiskSection(fixture: FixtureCard, rec?: Recommendation, source?: string) {
  const risks: string[] = [];
  if (!rec) return risks;

  if (rec.confidence < 55) {
    risks.push(
      `Confidence er ikke skyhøy, så dette bør tolkes som et strukturert verdi-spill heller enn et ekstremt sterkt signal.`
    );
  }

  if (rec.edge < 0.03) {
    risks.push(
      `Edge er forholdsvis begrenset, og mindre markedsbevegelser kan redusere verdien raskt.`
    );
  }

  if (rec.market === 'home') {
    risks.push(
      `Hvis ${fixture.awayTeam} scorer først eller lykkes med å kontrollere tempoet, kan hjemmecaset svekkes raskt.`
    );
  }

  if (rec.market === 'away') {
    risks.push(
      `Bortebane trekker naturlig litt ned, så spillet tåler mindre feilmargin dersom ${fixture.homeTeam} får tidlig momentum.`
    );
  }

  if (source === 'partial-live') {
    risks.push(
      `Prisbildet bygger akkurat nå på modellodds og ikke direkte bookmaker-feed, så oddsdelen bør tolkes mer forsiktig enn lagdataene.`
    );
  }

  risks.push(
    `Spillerform, dommerprofil og full skadeanalyse er fortsatt ikke komplett modellert, så previewen er ikke fullt ut “redaksjonell” enda.`
  );

  return risks.slice(0, 4);
}

function buildTeamAngles(ctx: TeamContext | undefined, side: 'home' | 'away') {
  const lines: string[] = [];

  if (!ctx) {
    lines.push('Detaljert lagkontekst er ikke tilgjengelig akkurat nå.');
    return lines;
  }

  if (ctx.rank !== undefined && ctx.points !== undefined) {
    lines.push(`Tabellplass: ${ctx.rank} | Poeng: ${ctx.points}`);
  }

  if (ctx.form) {
    lines.push(`Form siste 5: ${ctx.form}`);
  }

  if (ctx.goalsFor !== undefined && ctx.goalsAgainst !== undefined) {
    lines.push(`Målscore: ${ctx.goalsFor} for / ${ctx.goalsAgainst} mot`);
  }

  if (side === 'home') {
    if (ctx.homePlayed !== undefined) {
      lines.push(
        `Hjemme: ${ctx.homeWins ?? 0}-${ctx.homeDraws ?? 0}-${ctx.homeLosses ?? 0} på ${ctx.homePlayed} kamper`
      );
    }
  } else {
    if (ctx.awayPlayed !== undefined) {
      lines.push(
        `Borte: ${ctx.awayWins ?? 0}-${ctx.awayDraws ?? 0}-${ctx.awayLosses ?? 0} på ${ctx.awayPlayed} kamper`
      );
    }
  }

  return lines;
}

export default function MatchDetailPanel({
  fixture,
  recommendations,
  source,
}: {
  fixture: FixtureCard | null;
  recommendations: Recommendation[];
  source?: string;
}) {
  if (!fixture) {
    return (
      <section className="detail-card">
        <div className="preview-badge">Match Preview</div>
        <h2 className="detail-title">Velg en kamp</h2>
        <div className="info-panel">
          <p>Trykk på en kamp til venstre for å se preview, odds og modellens vurderinger.</p>
        </div>
      </section>
    );
  }

  const topRecommendation = recommendations[0] ?? fixture.topRecommendation;
  const why = buildWhyThisPick(fixture, topRecommendation);
  const risks = buildRiskSection(fixture, topRecommendation, source);
  const homeAngles = buildTeamAngles(fixture.homeContext, 'home');
  const awayAngles = buildTeamAngles(fixture.awayContext, 'away');
  const preview = buildPreviewText(fixture, topRecommendation, source);
  const oddsMeta = oddsSourceMeta(fixture.latestOdds?.bookmaker);

  return (
    <section className="detail-card">
      <div className="preview-badge">Match Preview</div>
      <h2 className="detail-title">
        {fixture.homeTeam} vs {fixture.awayTeam}
      </h2>

      <div className="detail-meta">
        <span>Kampstart: {formatDate(fixture.kickoff)}</span>
        <span>•</span>
        <span>Oddsgrunnlag: {oddsMeta.label}</span>
        <span>•</span>
        <span>Runde: {fixture.round}</span>
      </div>

      <hr className="detail-divider" />

      <div className="detail-stats">
        <div className="stat-box">
          <div className="stat-box-label">Toppspill</div>
          <div className="stat-box-value">{formatMarket(topRecommendation?.market)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">EV</div>
          <div className="stat-box-value green">{pct(topRecommendation?.expectedValue)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Edge</div>
          <div className="stat-box-value amber">{pct(topRecommendation?.edge)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Confidence</div>
          <div className="stat-box-value">
            {topRecommendation ? `${topRecommendation.confidence.toFixed(0)}/100` : '–'}
          </div>
        </div>
      </div>

      <div className="info-panel">
        <h3>Status på datagrunnlag</h3>
        <p>
          <strong>Lagdata:</strong> live tabell og form. <strong>Odds:</strong>{' '}
          {oddsMeta.usingModelOdds
            ? 'modellbasert fallback fordi bookmaker-feed er utilgjengelig akkurat nå.'
            : 'live bookmaker-odds.'}
        </p>
      </div>

      <div className="info-panel">
        <h3>Match preview</h3>
        <p>{preview}</p>
      </div>

      <div className="two-col-grid">
        <div className="info-panel">
          <h3>Hvorfor modellen liker dette spillet</h3>
          <div className="reason-list">
            {why.map((reason, idx) => (
              <div key={idx} className="reason-card">
                <div className="reason-number">{idx + 1}</div>
                <div>{reason}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="info-panel">
          <h3>Signalstyrke</h3>

          <div className="meter-wrap">
            <div className="meter-block">
              <div className="meter-head">
                <span>EV</span>
                <span>{pct(topRecommendation?.expectedValue)}</span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill green"
                  style={{
                    width: `${Math.min(((topRecommendation?.expectedValue ?? 0) / 0.2) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="meter-block">
              <div className="meter-head">
                <span>Edge</span>
                <span>{pct(topRecommendation?.edge)}</span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill amber"
                  style={{
                    width: `${Math.min(((topRecommendation?.edge ?? 0) / 0.15) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="meter-block">
              <div className="meter-head">
                <span>Confidence</span>
                <span>{topRecommendation ? `${topRecommendation.confidence.toFixed(0)}%` : '–'}</span>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill blue"
                  style={{
                    width: `${Math.min(topRecommendation?.confidence ?? 0, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="risk-box">
            <h4>Risiko / forbehold</h4>
            <ul>
              {risks.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="team-grid">
        <div className="team-box">
          <h3>{fixture.homeTeam}</h3>
          {homeAngles.map((line, idx) => (
            <div key={idx} className="team-line">
              {line}
            </div>
          ))}
        </div>

        <div className="team-box">
          <h3>{fixture.awayTeam}</h3>
          {awayAngles.map((line, idx) => (
            <div key={idx} className="team-line">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel">
        <h3>Oddsoversikt</h3>

        {oddsMeta.usingModelOdds ? (
          <p className="section-subtitle" style={{ marginBottom: 16 }}>
            Disse tallene er modellodds, ikke direkte bookmaker-odds.
          </p>
        ) : null}

        <div className="odds-grid">
          <div className="odds-card">
            <div className="odds-card-title">1X2</div>
            <div className="odds-row"><span>Hjemme</span><span>{fixture.latestOdds?.home ?? '–'}</span></div>
            <div className="odds-row"><span>Uavgjort</span><span>{fixture.latestOdds?.draw ?? '–'}</span></div>
            <div className="odds-row"><span>Borte</span><span>{fixture.latestOdds?.away ?? '–'}</span></div>
          </div>

          <div className="odds-card">
            <div className="odds-card-title">Over / Under 2.5</div>
            <div className="odds-row"><span>Over 2.5</span><span>{fixture.latestOdds?.over2_5 ?? '–'}</span></div>
            <div className="odds-row"><span>Under 2.5</span><span>{fixture.latestOdds?.under2_5 ?? '–'}</span></div>
          </div>

          <div className="odds-card">
            <div className="odds-card-title">BTTS</div>
            <div className="odds-row"><span>Ja</span><span>{fixture.latestOdds?.btts_yes ?? '–'}</span></div>
            <div className="odds-row"><span>Nei</span><span>{fixture.latestOdds?.btts_no ?? '–'}</span></div>
          </div>
        </div>
      </div>

      <div className="info-panel">
        <h3>Hva betyr tallene?</h3>
        <div className="explainer-grid">
          <div className="explainer-card">
            <h4>EV</h4>
            <p>Expected Value. Positiv EV betyr at modellen mener oddsen er bedre enn den burde være.</p>
          </div>
          <div className="explainer-card">
            <h4>Fair odds</h4>
            <p>Modellens beregnede “rette odds” basert på sannsynligheten modellen kommer frem til.</p>
          </div>
          <div className="explainer-card">
            <h4>Edge</h4>
            <p>Forskjellen mellom modellens vurderte sannsynlighet og bookmakerens implisitte sannsynlighet.</p>
          </div>
          <div className="explainer-card">
            <h4>Confidence</h4>
            <p>En samlet tillitsindikator basert på signalstyrke, prising og hvor tydelig modellen mener caset er.</p>
          </div>
        </div>
      </div>

      <div className="info-panel">
        <h3>Alternative spill i kampen</h3>

        {recommendations.length === 0 ? (
          <div className="empty-box">Ingen kvalifiserte spill i denne kampen akkurat nå.</div>
        ) : (
          recommendations.map((rec) => (
            <div key={`${rec.fixtureId}-${rec.market}`} className="alt-card">
              <div className="alt-topline">
                <div>
                  <h4 className="alt-title">{formatMarket(rec.market)}</h4>
                  <div className="alt-note">{rec.note}</div>
                </div>
                <div className="ev-pill">EV {pct(rec.expectedValue)}</div>
              </div>

              <div className="metrics-grid" style={{ marginTop: 16 }}>
                <div className="metric-pill">
                  <div className="metric-pill-label">Modellsannsynlighet</div>
                  <div className="metric-pill-value">{pct(rec.modelProbability)}</div>
                </div>
                <div className="metric-pill">
                  <div className="metric-pill-label">Markedssannsynlighet</div>
                  <div className="metric-pill-value">{pct(rec.impliedProbability)}</div>
                </div>
                <div className="metric-pill">
                  <div className="metric-pill-label">Fair odds</div>
                  <div className="metric-pill-value">{rec.fairOdds}</div>
                </div>
                <div className="metric-pill">
                  <div className="metric-pill-label">Oddsgrunnlag</div>
                  <div className="metric-pill-value">
                    {oddsMeta.usingModelOdds ? 'Modellodds' : rec.bookmakerOdds}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="warning-box">
        <strong>Neste steg:</strong> Nå har vi ekte tabell- og formkontekst inne. Neste naturlige steg er å koble på konkrete siste kamper, spillere i form og mer detaljert skadebilde.
      </div>
    </section>
  );
}
