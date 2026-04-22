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

function buildReasons(fixture: FixtureCard, rec?: Recommendation) {
  const reasons: string[] = [];
  if (!rec) return reasons;

  if (rec.bookmakerOdds > rec.fairOdds) {
    reasons.push(
      `Markedet tilbyr ${rec.bookmakerOdds} i odds, mens modellen estimerer fair odds til ${rec.fairOdds}. Det betyr at utfallet prises litt høyere enn modellen mener er riktig.`
    );
  }

  if (rec.edge >= 0.03) {
    reasons.push(
      `Edge på ${pct(rec.edge)} er et tydelig signal om at modellens sannsynlighet ligger over markedets implisitte vurdering.`
    );
  } else if (rec.edge > 0) {
    reasons.push(
      `Det finnes fortsatt en positiv edge på ${pct(rec.edge)}, men dette er et mer moderat verdi-signal enn et aggressivt spill.`
    );
  }

  const restDiff = (fixture.daysRestHome ?? 0) - (fixture.daysRestAway ?? 0);
  if (rec.market === 'home' && restDiff > 0) {
    reasons.push(
      `${fixture.homeTeam} ser ut til å komme inn med litt bedre restitusjonsgrunnlag enn bortelaget, noe som kan styrke hjemmecaset.`
    );
  }
  if (rec.market === 'away' && restDiff < 0) {
    reasons.push(
      `${fixture.awayTeam} taper ikke restitusjonsbildet tydelig mot hjemmelaget, og bortesiden fremstår derfor mer spillbar enn oddsen antyder.`
    );
  }

  const injuryDiff = (fixture.injuriesAway ?? 0) - (fixture.injuriesHome ?? 0);
  if (rec.market === 'home' && injuryDiff > 0) {
    reasons.push(
      `Skadebildet ser marginalt gunstigere ut for ${fixture.homeTeam}, noe som støtter hjemmelagets side av modellen.`
    );
  }
  if (rec.market === 'away' && injuryDiff < 0) {
    reasons.push(
      `${fixture.awayTeam} ser ikke mer svekket ut enn hjemmelaget, noe som holder borte-caset intakt.`
    );
  }

  if (rec.market === 'home') {
    reasons.push(
      `${fixture.homeTeam} får i tillegg støtte av hjemmebane, kampmiljø og publikum, men modellen er fortsatt forankret mot markedsoddsen.`
    );
  }

  if (rec.market === 'away') {
    reasons.push(
      `${fixture.awayTeam} vurderes som sterk nok til å kompensere for bortebanen, og det er nettopp derfor modellen fortsatt finner verdi her.`
    );
  }

  if (rec.market === 'draw') {
    reasons.push(
      `Kampen fremstår jevn i modellens sannsynlighetsbilde, og uavgjort kan derfor være svakt underpriset.`
    );
  }

  if (rec.market === 'over2_5') {
    reasons.push(
      `Det samlede kampbildet peker mot flere sjanser enn markedet fullt ut priser inn, noe som løfter over-markedet.`
    );
  }

  if (rec.market === 'under2_5') {
    reasons.push(
      `Modellen forventer en strammere kamp enn oddsbildet antyder, og under-linjen blir derfor mer interessant.`
    );
  }

  if (rec.market === 'btts_yes') {
    reasons.push(
      `Begge lag vurderes å ha nok offensiv kapasitet til å true i samme kamp, noe som styrker BTTS ja.`
    );
  }

  if (rec.market === 'btts_no') {
    reasons.push(
      `Minst ett av lagene kan få problemer med å score i dette kampbildet, ifølge modellens vurdering.`
    );
  }

  if (reasons.length < 4) {
    reasons.push(
      `Confidence på ${rec.confidence.toFixed(
        0
      )}/100 tilsier et brukbart signal, men ikke nødvendigvis et ekstremt “high conviction”-scenario.`
    );
  }

  return reasons.slice(0, 5);
}

function buildRisks(fixture: FixtureCard, rec?: Recommendation) {
  const risks: string[] = [];
  if (!rec) return risks;

  if (rec.confidence < 55) {
    risks.push(
      `Confidence er ikke skyhøy, så dette bør tolkes som et strukturert verdi-spill heller enn et opplagt spill.`
    );
  }

  if (rec.edge < 0.03) {
    risks.push(
      `Edge er forholdsvis liten, og mindre markedsbevegelser kan raskt redusere verdien.`
    );
  }

  if (rec.market === 'home') {
    risks.push(
      `Hvis ${fixture.awayTeam} scorer først eller kontrollerer tempoet, kan hjemmecaset svekkes raskt.`
    );
  }

  if (rec.market === 'away') {
    risks.push(
      `Bortebane trekker naturlig litt ned, og spillet tåler derfor mindre feilmargin hvis ${fixture.homeTeam} får tidlig momentum.`
    );
  }

  if (rec.market === 'draw') {
    risks.push(
      `Uavgjort har høy kampvarians, siden ett enkelt mål kan endre sannsynlighetsbildet mye.`
    );
  }

  risks.push(
    `Formspillere, dommerprofil og full kampkontekst er ikke fullt modellert ennå, så analysen er fortsatt delvis systemdrevet.`
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
      `Hjemmebanen gir normalt et lite løft, særlig i jevnere oppgjør der marginene er små.`
    );
    lines.push(
      `Publikum, kjente omgivelser og mindre reisebelastning er faktorer hjemmejusteringen forsøker å fange opp.`
    );
  } else {
    lines.push(
      `Bortebane trekker litt ned, men sterke bortelag kan fortsatt være undervurdert når markedet priser for defensivt.`
    );
    lines.push(
      `Hvis laget holder sitt vanlige nivå også på reise, kan bortesiden bli mer interessant enn førsteinntrykket tilsier.`
    );
  }

  return lines;
}

function toneClass(kind: 'default' | 'green' | 'amber' | 'sky' = 'default') {
  if (kind === 'green') return 'stat-box-value green';
  if (kind === 'amber') return 'stat-box-value amber';
  if (kind === 'sky') return 'stat-box-value';
  return 'stat-box-value';
}

function meterWidth(value: number, max: number) {
  return `${Math.min((value / max) * 100, 100)}%`;
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
  const reasons = buildReasons(fixture, topRecommendation);
  const risks = buildRisks(fixture, topRecommendation);
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

  const verdictText = (() => {
    if (!topRecommendation) {
      return 'Modellen har foreløpig ikke funnet et tydelig verdi-spill i denne kampen.';
    }

    if (topRecommendation.market === 'home') {
      return `Modellen heller mot ${fixture.homeTeam} fordi hjemmelaget kombinerer hjemmefordel med en pris i markedet som fortsatt ser spillbar ut.`;
    }

    if (topRecommendation.market === 'away') {
      return `Modellen heller mot ${fixture.awayTeam} fordi bortelaget vurderes sterkere enn det markedet fullt ut ser ut til å prise inn.`;
    }

    if (topRecommendation.market === 'draw') {
      return `Modellen leser oppgjøret som forholdsvis jevnt og mener at sannsynligheten for poengdeling kan være svakt underpriset.`;
    }

    if (topRecommendation.market === 'over2_5') {
      return `Modellen forventer et kampbilde med nok sjanser og åpenhet til at over-markedet blir interessant.`;
    }

    if (topRecommendation.market === 'under2_5') {
      return `Modellen forventer en strammere kamp enn oddsbildet indikerer, og under-linjen fremstår derfor bedre priset.`;
    }

    if (topRecommendation.market === 'btts_yes') {
      return `Begge lag vurderes å ha realistiske muligheter til å score i dette oppgjøret.`;
    }

    if (topRecommendation.market === 'btts_no') {
      return `Minst ett av lagene kan få problemer med å score i dette kampbildet, ifølge modellen.`;
    }

    return 'Modellen har vurdert flere markeder i denne kampen.';
  })();

  return (
    <section className="detail-card">
      <div className="preview-badge">Match Preview</div>
      <h2 className="detail-title">
        {fixture.homeTeam} vs {fixture.awayTeam}
      </h2>

      <div className="detail-meta">
        <span>Kampstart: {formatDate(fixture.kickoff)}</span>
        <span>•</span>
        <span>Bookmaker: {fixture.latestOdds?.bookmaker ?? 'Ukjent'}</span>
        <span>•</span>
        <span>Runde: {fixture.round}</span>
      </div>

      <hr className="detail-divider" />

      <div className="detail-stats">
        <div className="stat-box">
          <div className="stat-box-label">Toppspill</div>
          <div className={toneClass()}>{formatMarket(topRecommendation?.market)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">EV</div>
          <div className={toneClass('green')}>{pct(topRecommendation?.expectedValue)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Edge</div>
          <div className={toneClass('amber')}>{pct(topRecommendation?.edge)}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-label">Confidence</div>
          <div className={toneClass('sky')}>
            {topRecommendation ? `${topRecommendation.confidence.toFixed(0)}/100` : '–'}
          </div>
        </div>
      </div>

      <div className="info-panel">
        <h3>Modellens hovedvurdering</h3>
        <p>{verdictText}</p>
        {topRecommendation?.note ? <p>{topRecommendation.note}</p> : null}
      </div>

      <div className="two-col-grid">
        <div className="info-panel">
          <h3>Hvorfor modellen liker dette spillet</h3>
          <div className="reason-list">
            {reasons.map((reason, idx) => (
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
                    width: meterWidth(topRecommendation?.expectedValue ?? 0, 0.2),
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
                    width: meterWidth(topRecommendation?.edge ?? 0, 0.15),
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
          {homeSummary.map((line, idx) => (
            <div key={idx} className="team-line">
              {line}
            </div>
          ))}
        </div>

        <div className="team-box">
          <h3>{fixture.awayTeam}</h3>
          {awaySummary.map((line, idx) => (
            <div key={idx} className="team-line">
              {line}
            </div>
          ))}
        </div>
      </div>

      <div className="info-panel">
        <h3>Oddsoversikt</h3>

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
                  <div className="metric-pill-label">Bookmakerodds</div>
                  <div className="metric-pill-value">{rec.bookmakerOdds}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="warning-box">
        <strong>Neste steg:</strong> Hvis du vil at analysen skal omtale konkrete ting som formspillere, siste fem kamper,
        dommerprofil, hjemmestatistikk og lignende på en troverdig måte, må vi koble på flere datakilder i modellen.
      </div>
    </section>
  );
}
