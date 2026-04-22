# Arkitektur - Premier League Betting Model på Vercel

## V1 nå
- Next.js UI på Vercel
- API routes for anbefalinger, kamper, health og cron refresh
- Modell i `lib/model.ts`
- Mock-data i `lib/mock-data.ts`

## V2 med ekte data
- The Odds API for upcoming/live/historical odds
- API-FOOTBALL for fixtures, injuries, lineups og team stats
- Database (Supabase/Postgres/Neon) for snapshots og historikk
- Daglig cron + manuell refresh-knapp
- Egen tabell for closing line og CLV

## Dataflyt
1. Cron kaller `/api/cron/refresh`
2. Refresh henter odds, fixtures, injuries og lineups
3. Data lagres i database
4. Modell scorer alle kommende kamper
5. App viser topp 10 spill i neste runde
6. Etter kamp lagres closing odds og resultat for evaluering

## Datamodell som bør komme i V2
- teams
- players
- injuries
- fixtures
- odds_snapshots
- market_lines
- model_outputs
- bet_log
