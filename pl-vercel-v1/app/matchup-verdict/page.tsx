'use client';

import { useEffect, useMemo, useState } from 'react';

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
  teamName: string;
  rank?: number;
  points?: number;
  form?: string;
  formScore?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  played?: number;
  homePlayed?: number;
  homeWins?: number;
  homeDraws?: number;
  homeLosses?: number;
  awayPlayed?: number;
  awayWins?: number;
  awayDraws?: number;
  awayLosses?: number;
};

type FixtureCard = {
  id: string;
  round: number;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  latestOdds?: {
    bookmaker?: string;
    home?: number;
    draw?: number;
    away?: number;
    over2_5?: number;
    under2_5?: number;
    btts_yes?: number;
    btts_no?: number;
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
};

function pct(v?: number) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '–';
  return `${(v * 100).toFixed(1)}%`;
}

function num(v?: number, digits = 2) {
  if (typeof v !== 'number' || Number.isNaN(v)) return '–';
  return v.toFixed(digits);
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

function computeTeamStrength(ctx?: TeamContext, side?: 'home' | 'away') {
  if (!ctx) return 50;
  const pointsBase = typeof ctx.points === 'number' ? Math.min(ctx.points / 0.9, 100) : 50;
  const formBase = typeof ctx.formScore === 'number' ? (ctx.formScore / 15) * 100 : 50;
  const goalDiff = typeof ctx.goalsFor === 'number' && typeof ctx.goalsAgainst === 'number'
    ? Math.max(0, Math.min(100, 50 + (ctx.goalsFor - ctx.goalsAgainst) * 2))
    : 50;
  const sideWins = side === 'home' ? ctx.homeWins : ctx.awayWins;
  const sidePlayed = side === 'home' ? ctx.homePlayed : ctx.awayPlayed;
  const sideBase = typeof sideWins === 'number' && typeof sidePlayed === 'number' && sidePlayed > 0
    ? (sideWins / sidePlayed) * 100
    : 50;
  return Math.round(pointsBase * 0.35 + formBase * 0.3 + goalDiff * 0.2 + sideBase * 0.15);
}

function pointsPerGame(ctx?: TeamContext) {
  if (!ctx?.played || typeof ctx.points !== 'number') return undefined;
  return ctx.points / ctx.played;
}

function sidePointsPerGame(ctx: TeamContext | undefined, side: 'home' | 'away') {
  if (!ctx) return undefined;
  if (side === 'home') {
    if (!ctx.homePlayed) return undefined;
    return ((ctx.homeWins ?? 0) * 3 + (ctx.homeDraws ?? 0)) / ctx.homePlayed;
  }
  if (!ctx.awayPlayed) return undefined;
  return ((ctx.awayWins ?? 0) * 3 + (ctx.awayDraws ?? 0)) / ctx.awayPlayed;
}

function goalsPerGame(ctx?: TeamContext) {
  if (!ctx?.played || typeof ctx.goalsFor !== 'number') return undefined;
  return ctx.goalsFor / ctx.played;
}

function goalsAgainstPerGame(ctx?: TeamContext) {
  if (!ctx?.played || typeof ctx.goalsAgainst !== 'number') return undefined;
  return ctx.goalsAgainst / ctx.played;
}

function verdictText(fixture: FixtureCard) {
  const rec = fixture.topRecommendation;
  const homeStrength = computeTeamStrength(fixture.homeContext, 'home');
  const awayStrength = computeTeamStrength(fixture.awayContext, 'away');
  const diff = homeStrength - awayStrength;
  const market = formatMarket(rec?.market);

  if (!rec) return 'Ingen klar verdi-kandidat akkurat nå. Modellen bør vente eller kreve bedre pris.';
  if (rec.expectedValue >= 0.08 && rec.confidence >= 60) return `Sterk lean mot ${market}. EV og confidence er høye nok til at kampen bør følges tett.`;
  if (Math.abs(diff) >= 10 && rec.expectedValue > 0.03) return `Grunnprofilen peker tydelig én vei, og markedet gir verdi på ${market}.`;
  if (rec.expectedValue > 0.02) return `Moderat lean mot ${market}. Caset finnes, men bør tolkes med disiplin.`;
  return `Svak lean mot ${market}. Krever bedre odds eller mer lag-/spillerdata før den vurderes tungt.`;
}

function teamRead(fixture: FixtureCard) {
  const home = fixture.homeContext;
  const away = fixture.awayContext;
  const homePpg = pointsPerGame(home);
  const awayPpg = pointsPerGame(away);
  const homeHomePpg = sidePointsPerGame(home, 'home');
  const awayAwayPpg = sidePointsPerGame(away, 'away');
  const homeGoals = goalsPerGame(home);
  const awayGoals = goalsPerGame(away);
  const homeAgainst = goalsAgainstPerGame(home);
  const awayAgainst = goalsAgainstPerGame(away);

  const lines: string[] = [];
  if (home?.rank && away?.rank) lines.push(`Tabell: ${fixture.homeTeam} #${home.rank} mot ${fixture.awayTeam} #${away.rank}.`);
  if (homePpg !== undefined && awayPpg !== undefined) lines.push(`Poengsnitt: ${fixture.homeTeam} ${num(homePpg)} p/kamp, ${fixture.awayTeam} ${num(awayPpg)} p/kamp.`);
  if (homeHomePpg !== undefined && awayAwayPpg !== undefined) lines.push(`Hjemme/borte: ${fixture.homeTeam} ${num(homeHomePpg)} hjemme, ${fixture.awayTeam} ${num(awayAwayPpg)} borte.`);
  if (homeGoals !== undefined && awayGoals !== undefined) lines.push(`Angrep: ${fixture.homeTeam} ${num(homeGoals)} mål/kamp, ${fixture.awayTeam} ${num(awayGoals)} mål/kamp.`);
  if (homeAgainst !== undefined && awayAgainst !== undefined) lines.push(`Defensivt: ${fixture.homeTeam} slipper inn ${num(homeAgainst)} per kamp, ${fixture.awayTeam} slipper inn ${num(awayAgainst)}.`);
  if (home?.form || away?.form) lines.push(`Form: ${fixture.homeTeam} ${home?.form ?? '–'} mot ${fixture.awayTeam} ${away?.form ?? '–'}.`);
  return lines.length ? lines : ['Mangler nok live lagkontekst til full laganalyse.'];
}

function tacticalRead(fixture: FixtureCard) {
  const homeGoals = goalsPerGame(fixture.homeContext) ?? 1.3;
  const awayGoals = goalsPerGame(fixture.awayContext) ?? 1.3;
  const homeAgainst = goalsAgainstPerGame(fixture.homeContext) ?? 1.3;
  const awayAgainst = goalsAgainstPerGame(fixture.awayContext) ?? 1.3;
  const totalAttack = homeGoals + awayGoals;
  const totalDefRisk = homeAgainst + awayAgainst;
  const rec = fixture.topRecommendation;

  const lines: string[] = [];
  if (totalAttack >= 3.2 || totalDefRisk >= 3.0) lines.push('Målprofilen peker mot høyere tempo eller defensive åpninger. Totals-markeder bør følges tett.');
  else if (totalAttack <= 2.3 && totalDefRisk <= 2.5) lines.push('Målprofilen peker mot strammere kampbilde. Under-markeder kan være mer relevante hvis prisen er riktig.');
  else lines.push('Kampbildet ser moderat ut. Pris og lagnyheter blir viktigere enn ren målprofil.');

  if (rec?.market === 'home') lines.push(`${fixture.homeTeam} caset tåler dårlig tidlig baklengs eller svakt laguttak offensivt.`);
  if (rec?.market === 'away') lines.push(`${fixture.awayTeam} caset avhenger av at bortelaget tåler første kampfase og ikke presses for lavt.`);
  if (rec?.market === 'over2_5' || rec?.market === 'btts_yes') lines.push('Målcaset blir sterkere med normal offensiv ellever, men svakere ved fravær på spiss/skaperleddet.');
  if (rec?.market === 'under2_5' || rec?.market === 'btts_no') lines.push('Under-caset blir svakere hvis viktige forsvarsspillere mangler eller lagene roterer defensivt.');
  return lines;
}

function dataSourceLabel(source?: string) {
  if (source === 'live') return 'Live';
  if (source === 'partial-live') return 'Partial live';
  if (source === 'mock') return 'Mock';
  return source ?? 'Ukjent';
}

export default function MatchupVerdictPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/fixtures', { cache: 'no-store' });
        const json = await res.json();
        if (!mounted) return;
        setData({
          round: json.round ?? 0,
          fixtures: json.fixtures ?? [],
          recommendations: json.recommendations ?? [],
          source: json.source ?? 'unknown',
          generatedAt: json.generatedAt ?? new Date().toISOString(),
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const fixtureSummaries = useMemo(() => {
    return (data?.fixtures ?? []).map((fixture) => {
      const recs = (data?.recommendations ?? []).filter((rec) => String(rec.fixtureId) === String(fixture.id));
      const best = recs[0] ?? fixture.topRecommendation;
      return { ...fixture, topRecommendation: best, recommendations: recs };
    });
  }, [data]);

  if (loading) {
    return (
      <main className="dashboard-shell">
        <section className="hero-card"><h1 className="hero-title">Laster matchup verdict...</h1></section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">Matchup verdict</h1>
            <p className="hero-subtitle">
              Samlet kampanalyse for alle kampene i runden, uten at du må klikke deg inn på én og én kamp i dashboardet.
            </p>
          </div>
          <div className="updated-at">{data?.generatedAt ? new Date(data.generatedAt).toLocaleString('no-NO') : '–'}</div>
        </div>

        <div className="summary-grid" style={{ marginTop: 20 }}>
          <div className="summary-card"><div className="summary-label">Runde</div><div className="summary-value">{data?.round ?? '–'}</div></div>
          <div className="summary-card"><div className="summary-label">Kamper</div><div className="summary-value">{fixtureSummaries.length}</div></div>
          <div className="summary-card"><div className="summary-label">Datakilde</div><div className="summary-value" style={{ fontSize: 22 }}>{dataSourceLabel(data?.source)}</div></div>
          <div className="summary-card"><div className="summary-label">Anbefalinger</div><div className="summary-value green">{data?.recommendations?.length ?? 0}</div></div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          {fixtureSummaries.map((fixture, index) => {
            const rec = fixture.topRecommendation;
            const homeStrength = computeTeamStrength(fixture.homeContext, 'home');
            const awayStrength = computeTeamStrength(fixture.awayContext, 'away');
            return (
              <section key={fixture.id} className="list-card">
                <div className="list-card-header">
                  <div>
                    <h2 className="section-title" style={{ marginBottom: 0 }}>{fixture.homeTeam} vs {fixture.awayTeam}</h2>
                    <p className="section-subtitle">{formatDate(fixture.kickoff)} · Kamp #{index + 1}</p>
                  </div>
                  <div className="badge-soft">{formatMarket(rec?.market)}</div>
                </div>

                <div className="info-panel" style={{ marginTop: 0 }}>
                  <h3>Verdict</h3>
                  <p>{verdictText(fixture)}</p>
                </div>

                <div className="summary-grid" style={{ marginTop: 14 }}>
                  <div className="summary-card"><div className="summary-label">Team edge</div><div className="summary-value" style={{ fontSize: 22 }}>{homeStrength} - {awayStrength}</div></div>
                  <div className="summary-card"><div className="summary-label">Beste marked</div><div className="summary-value" style={{ fontSize: 20 }}>{formatMarket(rec?.market)}</div></div>
                  <div className="summary-card"><div className="summary-label">EV</div><div className="summary-value green">{pct(rec?.expectedValue)}</div></div>
                  <div className="summary-card"><div className="summary-label">Confidence</div><div className="summary-value">{rec ? `${rec.confidence.toFixed(0)}/100` : '–'}</div></div>
                </div>

                <div className="two-col-grid">
                  <div className="info-panel">
                    <h3>Laganalyse</h3>
                    <div className="reason-list">
                      {teamRead(fixture).map((line, idx) => (
                        <div key={line} className="reason-card"><span className="reason-number">{idx + 1}</span><div>{line}</div></div>
                      ))}
                    </div>
                  </div>
                  <div className="info-panel">
                    <h3>Taktisk lesning</h3>
                    <div className="reason-list">
                      {tacticalRead(fixture).map((line, idx) => (
                        <div key={line} className="reason-card"><span className="reason-number">{idx + 1}</span><div>{line}</div></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="info-panel">
                  <h3>Spillerdata</h3>
                  <p>
                    Spillerdata, skader og forventede lagoppstillinger er ikke koblet inn ennå. Dette er derfor en eksplisitt risikofaktor i vurderingen, ikke skjult informasjon.
                  </p>
                </div>

                <div className="app-nav-links" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
                  <a href={`/#${fixture.id}`} className="app-nav-link">Åpne i dashboard</a>
                  <a href="/test-lab" className="app-nav-link">Test lab</a>
                </div>
              </section>
            );
          })}
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Hva er dette?</h2>
            <p className="section-subtitle">
              Denne siden samler analysene for alle kampene. Den er laget for rask lesing før runden, slik at dashboardet kan brukes mer til detaljer og filtrering.
            </p>
          </section>

          <section className="detail-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">Neste forbedring</h2>
            <p className="section-subtitle">
              Neste nivå er ekte spillerdata: skader, suspensjoner, forventet ellever, bekreftet ellever og player availability risk.
            </p>
          </section>

          <section className="warning-box">
            Matchup verdict er analyse, ikke fasit. Bruk den sammen med odds, datakvalitet, trackerhistorikk og bankroll-regler.
          </section>
        </aside>
      </section>
    </main>
  );
}
