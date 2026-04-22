# Premier League Betting Model - Vercel V1

Dette er en Vercel-klar prototype for Premier League bettingmodell.

## Hva den gjør
- viser kamper i valgt runde
- beregner fair odds og edge på mock-data
- gir topp 10 anbefalinger per runde
- har API-ruter klare for ekte datakilder senere
- har cron-endepunkt for daglig refresh

## Teknologi
- Next.js App Router
- Vercel Functions via API routes
- Mock-data i V1
- Klar struktur for The Odds API + API-FOOTBALL i V2

## Kjør lokalt
```bash
npm install
npm run dev
```

## Deploy på Vercel
1. Last opp prosjektet til GitHub.
2. Importer repoet i Vercel.
3. Legg inn environment variables fra `.env.example`.
4. Deploy.

## Viktig om cron på Hobby
På Hobby-planen kan cron bare kjøre én gang per dag, og Vercel kan trigge den når som helst innenfor den spesifiserte timen.

## Forslag til V2
- bytte `DATA_MODE=live`
- koble `/api/fixtures` til API-FOOTBALL
- koble odds-snapshots til The Odds API
- lagre snapshots i database
- vise CLV og oddsbevegelse i UI
