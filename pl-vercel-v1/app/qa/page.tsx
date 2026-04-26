const qaChecks = [
  {
    title: 'Release notes fungerer',
    description: 'Release notes skal vise V2.20-høydepunkter, testrekkefølge og manuelle GitHub-oppgaver.',
  },
  {
    title: 'Deploy checklist fungerer',
    description: 'Deploy checklist skal vise steg for test etter Vercel deploy, feilsøking og snarveier til testsider.',
  },
  {
    title: 'Upstash setup fungerer',
    description: 'Upstash setup skal vise Redis-steg, environment variables, verifisering og vanlige feil.',
  },
  {
    title: 'Persistent test fungerer',
    description: 'Persistent test skal vise redeploy-test, pass criteria, fail criteria og snarveier til storage-sider.',
  },
  {
    title: 'Quick test fungerer',
    description: 'Quick test skal vise kort testrekkefølge, forventet resultat og GitHub issue #2-informasjon.',
  },
  {
    title: 'Test lab fungerer',
    description: 'Test lab skal vise API probes og knapper for snapshot, seed demo, auto-settle, reset og export.',
  },
  {
    title: 'Dashboard laster',
    description: 'Forsiden skal laste uten feilmelding og vise kamper, anbefalinger og filtre.',
  },
  {
    title: 'Filtre fungerer',
    description: 'Marked-filter og minimum EV-slider skal endre listen med anbefalinger.',
  },
  {
    title: 'Kampvalg fungerer',
    description: 'Når du klikker på en kamp eller anbefaling, skal detaljpanelet oppdatere seg.',
  },
  {
    title: 'V2 Tracker laster',
    description: 'Tracker-siden skal vise server snapshot, pending, settled, handlinger og eksport uten krasj.',
  },
  {
    title: 'Server snapshot fungerer',
    description: 'Trykk Save server snapshot i V2 Tracker eller Test lab og sjekk at pending øker eller oppdateres uten duplikatkaos.',
  },
  {
    title: 'Stats fungerer',
    description: 'Stats-siden skal hente tracker stats, kunne seede demo-data, auto-settle, resette og eksportere CSV/JSON.',
  },
  {
    title: 'Quality fungerer',
    description: 'Quality-siden skal hente quality score, issue counts og svakeste tracker-rader fra /api/tracker/quality.',
  },
  {
    title: 'Insights fungerer',
    description: 'Insights-siden skal vise anbefalte neste tiltak, market insights, storage mode og tracker summary.',
  },
  {
    title: 'Diagnostics fungerer',
    description: 'Diagnostics-siden skal vise readiness score, checks, issues, storage mode og quality score.',
  },
  {
    title: 'Status-siden svarer',
    description: 'Status-siden skal hente health, live-status, storage-status, tracker snapshot, stats, quality, insights, diagnostics og endpoint probes uten feil.',
  },
  {
    title: 'Mobilvisning fungerer',
    description: 'Navigasjon, kort og dashboard skal være brukbart på mobilskjerm.',
  },
];

const deployChecks = [
  'Sjekk at nyeste deployment i Vercel står som Ready.',
  'Kontroller at commit-hashen i Vercel matcher siste commit i GitHub.',
  'Åpne Release notes for kort oversikt over siste endringer.',
  'Åpne Deploy checklist etter deploy.',
  'Åpne Upstash setup hvis du skal teste persistent historikk.',
  'Åpne Persistent test etter Upstash-oppsett og redeploy.',
  'Åpne Quick test og følg testrekkefølgen.',
  'Åpne Test lab i inkognito eller ny fane etter deploy.',
  'Trykk Oppdater alt i Test lab og sjekk at API probes er OK.',
  'Test Dashboard, Test lab, V2 Tracker, Stats, Quality, Insights, Diagnostics, Status og Changelog etter større endringer.',
  'Hvis build feiler, les nederste del av Vercel build logs først.',
];

const apiChecks = [
  '/api/health skal returnere ok: true.',
  '/api/fixtures skal returnere dashboard-data eller fallback-data.',
  '/api/tracker/storage-status skal returnere storageMode, redis og summary.',
  '/api/tracker/diagnostics skal returnere readinessScore, readinessChecks og issues.',
  '/api/tracker/snapshot skal returnere rows, source og generatedAt.',
  'POST /api/tracker/snapshot skal lagre snapshot-rader til tracker-store.',
  '/api/tracker/history skal vise open og settled trackerhistorikk.',
  '/api/tracker/stats skal returnere summary, marketStats og profitTrend.',
  '/api/tracker/quality skal returnere avgScore, issueCounts og rows.',
  '/api/tracker/insights skal returnere summary, marketInsights og recommendations.',
  '/api/tracker/export skal returnere tracker-store som JSON.',
  '/api/tracker/export?format=csv skal laste ned CSV.',
];

const releaseFlowChecks = [
  'Åpne /release-notes.',
  'Sjekk at V2.20-høydepunkter vises.',
  'Sjekk at testrekkefølgen peker videre til Deploy checklist, Quick test, Test lab, Upstash setup og Persistent test.',
  'Sjekk at issue #2 og issue #3 forklares som manuelle oppgaver.',
];

const deployFlowChecks = [
  'Åpne /deploy-checklist.',
  'Sjekk at siden forklarer deploy-test og feilsøking.',
  'Klikk videre til Quick test.',
  'Klikk videre til Test lab.',
  'Bruk Status eller Diagnostics hvis noe feiler.',
  'Oppdater GitHub issue #2 etter manuell test.',
];

const issueFlowChecks = [
  'Issue #2 brukes til V2.20 deploy-testen.',
  'Issue #3 brukes til V2.21 Upstash-oppsett i Vercel.',
  'Issue #3 skal ikke lukkes før storageMode er upstash-redis og persistent test er bestått.',
];

const upstashFlowChecks = [
  'Åpne /upstash-setup.',
  'Sjekk at variablene UPSTASH_REDIS_REST_URL og UPSTASH_REDIS_REST_TOKEN vises.',
  'Legg variablene inn i Vercel og redeploy.',
  'Åpne Status og sjekk storageMode upstash-redis.',
  'Åpne Diagnostics og sjekk persistent storage-check.',
  'Lagre snapshot, redeploy og bekreft at historikken fortsatt finnes.',
];

const persistentFlowChecks = [
  'Åpne /persistent-test.',
  'Lagre snapshot eller seed demo-data i Test lab.',
  'Noter open rows og settled rows før redeploy.',
  'Redeploy appen i Vercel.',
  'Åpne Test lab, Status eller Diagnostics etter redeploy.',
  'Bekreft at historikken fortsatt finnes og at storageMode er upstash-redis.',
];

const testLabFlowChecks = [
  'Åpne /test-lab.',
  'Trykk Oppdater alt og sjekk API probes.',
  'Trykk Save snapshot og sjekk action log.',
  'Trykk Seed demo for å fylle testdata.',
  'Trykk Auto-settle for å teste settlementflyt.',
  'Åpne CSV eller JSON export fra Test lab.',
  'Bruk Reset store hvis du vil nullstille etter test.',
];

const trackerFlowChecks = [
  'Åpne V2 Tracker og sjekk at Server snapshot har rader.',
  'Trykk Save server snapshot.',
  'Sjekk at Pending viser de lagrede radene.',
  'Åpne Stats og sjekk at Pending Count er oppdatert.',
  'Åpne Quality og sjekk at radene får quality score.',
  'Åpne Insights og sjekk at recommendations og market insights oppdateres.',
  'Åpne Diagnostics og sjekk at readiness score og checks oppdateres.',
  'Trykk CSV export og bekreft at filen inneholder pending-radene.',
  'Trykk Reset store når testen er ferdig hvis du vil nullstille historikken.',
];

const redisFlowChecks = [
  'Åpne /api/tracker/storage-status og sjekk storageMode.',
  'Hvis Upstash ikke er satt: storageMode skal være server-memory og Redis skal vise Ikke satt.',
  'Hvis Upstash er satt: storageMode skal være upstash-redis og Redis ping skal være OK.',
  'Lagre et server snapshot i Test lab eller V2 Tracker.',
  'Redeploy appen i Vercel.',
  'Åpne Status og sjekk at trackerhistorikken fortsatt finnes etter deploy.',
  'Åpne Diagnostics og sjekk at Persistent storage-check er OK når Upstash er satt.',
];

const bugTemplate = [
  'Hvilken side feilet?',
  'Hva trykket du på rett før feilen?',
  'Var det på mobil eller desktop?',
  'Kom feilen i appen eller i Vercel build logs?',
  'Kopier feilmeldingen eller ta skjermbilde.',
];

export default function QAPage() {
  return (
    <main className="dashboard-shell">
      <section className="hero-card">
        <div className="hero-topline">
          <div>
            <div className="eyebrow">Premier League Betting Model</div>
            <h1 className="hero-title">QA checklist</h1>
            <p className="hero-subtitle">
              En testside for å sjekke at appen fungerer etter deploy. Bruk denne når vi gjør større endringer eller når Vercel har bygget en ny versjon.
            </p>
          </div>
          <div className="updated-at">Testing</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="left-column">
          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>App-sjekker</h2>
                <p className="section-subtitle">Funksjoner som bør testes etter deploy.</p>
              </div>
              <div className="badge-soft">QA</div>
            </div>

            <div className="metrics-grid" style={{ marginTop: 14 }}>
              {qaChecks.map((check) => (
                <div key={check.title} className="metric-pill" style={{ textAlign: 'left' }}>
                  <div className="metric-pill-label">Sjekk</div>
                  <div className="metric-pill-value">{check.title}</div>
                  <p className="section-subtitle" style={{ marginTop: 8 }}>{check.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Release flow</h2>
                <p className="section-subtitle">Kort startpunkt for V2.20-testen.</p>
              </div>
              <div className="badge-soft">Release</div>
            </div>

            <div className="reason-list">
              {releaseFlowChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>GitHub issue flow</h2>
                <p className="section-subtitle">Hvordan issue #2 og #3 bør brukes videre.</p>
              </div>
              <div className="badge-soft">Issues</div>
            </div>

            <div className="reason-list">
              {issueFlowChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Deploy flow</h2>
                <p className="section-subtitle">Rask testrekkefølge etter Vercel deploy.</p>
              </div>
              <div className="badge-soft">Deploy</div>
            </div>

            <div className="reason-list">
              {deployFlowChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Upstash flow</h2>
                <p className="section-subtitle">Test av persistent Redis-lagring.</p>
              </div>
              <div className="badge-soft">Redis</div>
            </div>

            <div className="reason-list">
              {upstashFlowChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Persistent test flow</h2>
                <p className="section-subtitle">Sjekk at trackerhistorikk overlever redeploy.</p>
              </div>
              <div className="badge-soft">Persist</div>
            </div>

            <div className="reason-list">
              {persistentFlowChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Test lab flow</h2>
                <p className="section-subtitle">Raskeste måte å teste V2 i dag.</p>
              </div>
              <div className="badge-soft">Test lab</div>
            </div>

            <div className="reason-list">
              {testLabFlowChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Tracker flow</h2>
                <p className="section-subtitle">Praktisk test av server-snapshot → tracker-store → stats/quality/insights/diagnostics/export.</p>
              </div>
              <div className="badge-soft">V2</div>
            </div>

            <div className="reason-list">
              {trackerFlowChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Redis / persistent store</h2>
                <p className="section-subtitle">Test for å se om trackerhistorikken overlever deploys.</p>
              </div>
              <div className="badge-soft">Storage</div>
            </div>

            <div className="reason-list">
              {redisFlowChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>API-sjekker</h2>
                <p className="section-subtitle">Ruter som bør testes når tracker, stats, quality, insights eller diagnostics endres.</p>
              </div>
              <div className="badge-soft">API</div>
            </div>

            <div className="reason-list">
              {apiChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="list-card">
            <div className="list-card-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Deploy-sjekker</h2>
                <p className="section-subtitle">Hva som bør sjekkes i Vercel og GitHub.</p>
              </div>
              <div className="badge-soft">Vercel</div>
            </div>

            <div className="reason-list">
              {deployChecks.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="right-column">
          <section className="detail-card">
            <h2 className="section-title">Bug report-mal</h2>
            <p className="section-subtitle">Når noe feiler, er dette nok informasjon til å finne årsaken raskere.</p>
            <div className="reason-list" style={{ marginTop: 16 }}>
              {bugTemplate.map((item, index) => (
                <div key={item} className="reason-card">
                  <span className="reason-number">{index + 1}</span>
                  <div className="metric-pill-value">{item}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="warning-box">
            Den raskeste måten å fikse feil på er å sende hele Vercel-loggen fra nederste feilmelding og opp til første relevante filnavn.
          </section>
        </aside>
      </section>
    </main>
  );
}
