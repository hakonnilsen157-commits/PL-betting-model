# Premier League Betting Model - Vercel V2

Dette er en Vercel-klar Next.js-app for en Premier League bettingmodell.

## V2 nå
- dashboard i Next.js
- topp 10 spill per runde/uke
- mock fallback hvis API-nøkler mangler
- live-modus for fixtures + odds + injuries
- API-ruter for fixtures, recommendations, cron refresh og live status

## Live datakilder
- The Odds API for EPL odds (`soccer_epl`) og markeder som `h2h`, `totals` og `btts`
- API-FOOTBALL for Premier League fixtures og injuries

## Viktige env vars
- `DATA_MODE=live`
- `ODDS_API_KEY=...`
- `API_FOOTBALL_KEY=...`
- `API_FOOTBALL_LEAGUE_ID=39`
- `API_FOOTBALL_SEASON=2026`
- `ODDS_SPORT_KEY=soccer_epl`
- `ODDS_REGIONS=uk,eu`
- `CRON_SECRET=...`

## Endepunkter
- `/api/fixtures`
- `/api/recommendations`
- `/api/cron/refresh`
- `/api/live-status`

## Neste steg
- lagre odds-snapshots i database
- closing line / CLV-logg
- expected lineups
- team ratings fra live data i stedet for statisk fallback
