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

function safeNum(n?: number) {
  return typeof n === 'number' && !Number.isNaN(n) ? n : 0;
}

function teamLeanText(
  fixture: FixtureCard,
  rec?: Recommendation
) {
  if (!rec) {
    return `Modellen har foreløpig ikke funnet et tydelig verdi-spill i oppgjøret mellom ${fixture.homeTeam} og ${fixture.awayTeam}.`;
  }

  if (rec.market === 'home') {
    return `${fixture.homeTeam} vurderes som den mest interessante siden i dette oppgjøret. Modellen mener at hjemmelaget prises litt for høyt av markedet, samtidig som hjemmefordelen fortsatt gir et viktig løft i et jevnt kampbilde.`;
  }

  if (rec.market === 'away') {
    return `${fixture.awayTeam} vurderes som den mest interessante siden i dette oppgjøret. Modellen mener at bortelaget har bedre muligheter enn oddsen fullt ut gjenspeiler, og at markedet kan være litt for konservativt på bortesiden.`;
  }

  if (rec.market === 'draw') {
    return `Modellen leser dette som en forholdsvis jevn kamp der sannsynligheten for uavgjort kan være litt høyere enn markedet tilsier.`;
  }

  if (rec.market === 'over2_5') {
    return `Modellen forventer et mer åpent kampbilde enn markedet fullt ut priser inn, og det gjør over-spillet interessant.`;
  }

  if (rec.market === 'under2_5') {
    return `Modellen forventer en strammere og mer kontrollert kamp enn oddsbildet tilsier, noe som gjør under-spillet interessant.`;
  }

  if (rec.market === 'btts_yes') {
    return `Begge lag vurderes å ha nok offensivt potensial til at begge kan komme på scoringslisten.`;
  }

  if (rec.market === 'btts_no') {
    return `Minst ett av lagene kan få problemer med å score i dette oppgjøret, ifølge modellens sannsynlighetsbilde.`;
  }

  return `Modellen har identifisert ${formatMarket(rec.market)} som det mest interessante markedet i denne kampen.`;
}

function buildWhyThisPick(fixture: FixtureCard, rec?: Recommendation) {
  const lines: string[] = [];
  if (!rec) return lines;

  const homeRest = safeNum(fixture.daysRestHome);
  const awayRest = safeNum(fixture.daysRestAway);
  const homeInj = safeNum(fixture.injuriesHome);
  const awayInj = safeNum(fixture.injuriesAway);

  if (rec.bookmakerOdds > rec.fairOdds) {
    lines.push(
      `Markedet tilbyr ${rec.bookmakerOdds} i odds, mens modellen estimerer fair odds til ${rec.fairOdds}. Det er selve kjernen i hvorfor dette blir vurdert som et verdi-spill.`
    );
  }

  if (rec.edge >= 0.04) {
    lines.push(
      `Edge på ${pct(rec.edge)} er relativt sterk. Det betyr at modellens sannsynlighet ligger tydelig over bookmakerens implisitte sannsynlighet.`
    );
  } else if (rec.edge > 0) {
    lines.push(
      `Edge på ${pct(rec.edge)} er positiv, men moderat. Dette er mer et kontrollert verdi-signal enn et ekstremt spill.`
    );
  }

  if (rec.market === 'home') {
    lines.push(
      `${fixture.homeTeam} får støtte av hjemmebane, publikum og kampmiljø. I kamper der prisbildet allerede er ganske jevnt, kan det være nok til å vippe caset i hjemmelagets favør.`
    );

    if (homeRest > awayRest) {
      lines.push(
        `${fixture.homeTeam} ser også ut til å komme inn med litt bedre hvile enn motstanderen, noe som kan bidra positivt i kampbildet.`
      );
    }

    if (awayInj > homeInj) {
      lines.push(
        `${fixture.awayTeam} ser i tillegg litt mer svekket ut på skadesiden enn hjemmelaget, noe som styrker caset ytterligere.`
      );
    }
  }

  if (rec.market === 'away') {
    lines.push(
      `${fixture.awayTeam} vurderes som mer konkurransedyktige enn markedet tilsier, og modellen mener at bortebanefaktoren kan være litt overpriset i oddsen.`
    );

    if (awayRest >= homeRest) {
      lines.push(
        `${fixture.awayTeam} taper heller ikke restitusjonsbildet tydelig mot hjemmelaget, noe som holder bortecaset levende.`
      );
    }

    if (homeInj > awayInj) {
      lines.push(
        `${fixture.homeTeam} ser ikke friskere ut enn bortelaget, og det svekker hjemmecaset sammenlignet med markedsbildet.`
      );
    }
  }

  if (rec.market === 'draw') {
    lines.push(
      `Kampen fremstår som relativt balansert i modellens sannsynlighetsbilde, og uavgjort blir derfor interessant når oddsen er høy nok.`
    );
  }

  if (rec.market === 'over2_5') {
    lines.push(
      `Totalspillet peker mot en kamp med mer åpenhet og flere farlige angrep enn markedet fullt ut priser inn.`
    );
  }

  if (rec.market === 'under2_5') {
    lines.push(
      `Modellen forventer en mer kontrollert rytme og færre store sjanser enn det oddsmarkedet antyder.`
    );
  }

  if (rec.market === 'btts_yes') {
    lines.push(
      `Begge lag vurderes å ha nok offensiv kapasitet til å skape scoringsmuligheter i samme kamp.`
    );
  }

  if (rec.market === 'btts_no') {
    lines.push(
      `Modellen ser en reell sjanse for at minst ett lag ikke får kampen dit de ønsker offensivt.`
    );
  }

  lines.push(
    `Confidence på ${rec.confidence.toFixed(
      0
    )}/100 sier at dette er et spill med brukbar støtte i modellen, men fortsatt ikke et blindt “må-spilles”-spill.`
  );

  return lines.slice(0, 5);
}

function buildRiskSection(fixture: FixtureCard, rec?: Recommendation) {
  const risks: string[] = [];
  if (!rec) return risks;

  if (rec.confidence < 55) {
    risks.push(
      `Confidence er ikke skyhøy, så caset bør sees på som et strukturert verdi-spill heller enn et ekstremt sterkt signal.`
    );
  }

  if (rec.edge < 0.03) {
    risks.push(
      `Edge er forholdsvis begrenset, og mindre markedsbevegelser kan redusere verdien raskt.`
    );
  }

  if (rec.market === 'home') {
    risks.push(
      `Hvis ${fixture.awayTeam} scorer først eller kontrollerer tempoet, kan hjemmecaset svekkes raskt.`
    );
  }

  if (rec.market === 'away') {
    risks.push(
      `Bortebane trekker naturlig litt ned, så spillet tåler mindre feilmargin dersom ${fixture.homeTeam} får tidlig momentum.`
    );
  }

  if (rec.market === 'draw') {
    risks.push(
      `Uavgjort har høy kampvarians. Ett tidlig mål kan endre hele sannsynlighetsbildet.`
    );
  }

  risks.push(
    `Konkrete ting som dommerprofil, full spillerform og siste fem kamper er ennå ikke fullt koblet inn i modellen.`
  );

  return risks.slice(0, 4);
}

function buildTeamAngles(
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
      `Hjemmebanen gir normalt et lite løft, særlig i jevnere kamper der marginene er små.`
    );
    lines.push(
      `Publikum, kjente omgivelser og mindre reisebelastning er alle forhold som trekker svakt i hjemmelagets favør.`
    );
  } else {
    lines.push(
      `Bortebane trekker litt ned, men sterke bortelag kan fortsatt være undervurdert hvis markedet blir for forsiktig.`
    );
    lines.push(
      `Hvis laget holder sitt vanlige nivå på reise, kan bortesiden være mer interessant enn førsteinntrykket tilsier.`
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
  const risks = buildRiskSection(fixture, topRecommendation);
  const homeAngles = buildTeamAngles(
    fixture.homeTeam,
    'home',
    fixture.daysRestHome,
    fixture.injuriesHome
  );
  const awayAngles = buildTeamAngles(
    fixture.awayTeam,
    'away',
    fixture.daysRestAway,
    fixture.injuriesAway
  );

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
          <div className="stat-box-value">
            {topRecommendation ? `${topRecommendation.confidence.toFixed(0)}/100` : '–'}
          </div>
        </div>
      </div>

      <div className="info-panel">
        <h3>Modellens hovedvurdering</h3>
        <p>{teamLeanText(fixture, topRecommendation)}</p>
        {topRecommendation?.note ? <p>{topRecommendation.note}</p> : null}
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
        <strong>Neste steg:</strong> For å få mer presis preview om ting som konkret spillerform, tabellplassering,
        dommerprofil og siste fem kamper, må vi koble på flere datakilder i modellen.
      </div>
    </section>
  );
}
