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
      `${fixture.awayTeam} virker ikke dårligere stilt fysisk enn hjemmelaget, og modellen vurderer derfor at bortesiden er mer spillbar enn markedet antyder.`
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
      `${fixture.awayTeam} ser ikke ut til å være mer svekket enn hjemmelaget, noe som holder borte-caset intakt.`
    );
  }

  if (rec.market === 'home') {
    reasons.push(
      `I tillegg får ${fixture.homeTeam} et naturlig løft av hjemmebane, publikum og kampmiljø, samtidig som modellen fortsatt er markedsforankret.`
    );
  }

  if (rec.market === 'away') {
    reasons.push(
      `${fixture.awayTeam} vurderes som sterk nok til å kompensere for bortebanen, og prisingen i markedet ser fortsatt attraktiv ut.`
    );
  }

  if (rec.market === 'draw') {
    reasons.push(
      `Kampen fremstår jevn, og modellen mener at sannsynligheten for poengdeling kan være høyere enn markedet priser inn.`
    );
  }

  if (rec.market === 'over2_5') {
    reasons.push(
      `Markedet for mål peker mot en mer åpen kamp, og modellen ser nok støtte i tallene til at over-linjen blir interessant.`
    );
  }

  if (rec.market === 'under2_5') {
    reasons.push(
      `Modellen forventer en strammere kamp enn det oddsbildet fullt ut gjenspeiler, og under-markedet fremstår derfor mer interessant.`
    );
  }

  if (rec.market === 'btts_yes') {
    reasons.push(
      `Begge lag vurderes å ha nok offensivt potensial til å true i samme kamp, noe som gjør BTTS ja spillbart.`
    );
  }

  if (rec.market === 'btts_no') {
    reasons.push(
      `Minst ett lag kan få problemer med å score i dette oppgjøret, ifølge modellens sannsynlighetsbilde.`
    );
  }

  if (reasons.length < 4) {
    reasons.push(
      `Confidence på ${rec.confidence.toFixed(
        0
      )}/100 tilsier at dette er et spill med brukbar støtte, men ikke nødvendigvis et ekstremt high-conviction spot.`
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
      `Bortebane trekker naturlig litt ned, så spillet tåler mindre feilmargin dersom ${fixture.homeTeam} får tidlig momentum.`
    );
  }

  if (rec.market === 'draw') {
    risks.push(
      `Uavgjort-spill har høy varians fordi ett enkelt mål kan endre hele kampbildet.`
    );
  }

  risks.push(
    `Vi har foreløpig ikke koblet på full form-, dommer- og spillerdata, så noen kvalitative forhold er ikke fullt modellert enda.`
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
      `Hjemmebanefordelen gir normalt et lite løft, særlig når modellen leser kampen som relativt jevn.`
    );
    lines.push(
      `Publikum, kjente omgivelser og mindre reisebelastning er faktorer som indirekte ligger inne i hjemmejusteringen.`
    );
  } else {
    lines.push(
      `Bortebane trekker litt ned, men sterke bortelag kan fortsatt være undervurdert dersom markedet priser dem for forsiktig.`
    );
    lines.push(
      `Hvis laget holder sitt normale nivå også på reise, kan dette gi verdi når oddsen blir litt for høy.`
    );
  }

  return lines;
}

function metricStyle(label: string) {
  if (label === 'EV') return 'green';
  if (label === 'Edge') return 'amber';
  if (label === 'Confidence') return 'sky';
  return 'default';
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
      return `Modellen heller mot ${fixture.homeTeam} fordi hjemmelaget kombinerer hjemmefordel med en prising som fortsatt ser spillbar ut.`;
    }

    if (topRecommendation.market === 'away') {
      return `Modellen heller mot ${fixture.awayTeam} fordi bortelaget vurderes sterkere enn det markedet fullt ut antyder.`;
    }

    if (topRecommendation.market === 'draw') {
      return `Modellen leser dette som en jevn kamp og mener at sannsynligheten for poengdeling kan være høyere enn markedet priser inn.`;
    }

    if (topRecommendation.market === 'over2_5') {
      return `Modellen forventer et kampbilde som kan gi flere store sjanser enn oddsmarkedet fullt ut tar høyde for.`;
    }

    if (topRecommendation.market === 'under2_5') {
      return `Modellen forventer en strammere og mer kontrollert kamp enn det oddsbildet antyder.`;
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
          <div className="stat-box-value">{topRecommendation ? `${topRecommendation.confidence.toFixed(0)}/100` : '–'}</div>
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
