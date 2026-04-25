import { NextResponse } from 'next/server';
import { getPersistentTrackerStore, getTrackerStorageMode } from '@/lib/tracker-persistent-store';

function dataQualityScore(row: { dataQuality?: string; source?: string; expectedValue?: number; confidence?: number; odds?: number }) {
  let score = 100;
  if (row.dataQuality === 'red' || row.source === 'seed' || row.source === 'fallback') score -= 35;
  if (row.dataQuality === 'yellow' || row.source === 'partial-live') score -= 15;
  if (typeof row.expectedValue !== 'number') score -= 20;
  if (typeof row.confidence !== 'number') score -= 15;
  if (typeof row.odds !== 'number') score -= 15;
  return Math.max(0, score);
}

function qualityBand(score: number) {
  if (score >= 80) return 'green';
  if (score >= 55) return 'yellow';
  return 'red';
}

export async function GET() {
  try {
    const store = await getPersistentTrackerStore();
    const allRows = [...store.open, ...store.settled];
    const settled = store.settled;
    const scores = allRows.map(dataQualityScore);
    const avgScore = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const profit = settled.reduce((sum, row) => sum + (row.profit ?? 0), 0);
    const wins = settled.filter((row) => row.won).length;
    const roi = settled.length ? profit / settled.length : 0;
    const hitRate = settled.length ? wins / settled.length : 0;
    const storageMode = getTrackerStorageMode();

    const issues: string[] = [];
    if (storageMode !== 'upstash-redis') issues.push('Tracker bruker ikke persistent Redis-lagring ennå.');
    if (settled.length < 25) issues.push('For få settled picks til å vurdere modellen seriøst.');
    if (avgScore < 55 && allRows.length > 0) issues.push('Gjennomsnittlig datakvalitet er lav.');
    if (allRows.length === 0) issues.push('Ingen trackerhistorikk er lagret ennå.');
    if (roi < -0.05 && settled.length >= 10) issues.push('ROI er tydelig negativ på nåværende sample.');

    const readinessChecks = [
      {
        name: 'Persistent storage',
        ok: storageMode === 'upstash-redis',
        detail: storageMode === 'upstash-redis' ? 'Trackerhistorikk er persistent.' : 'Bruker midlertidig server-memory.',
      },
      {
        name: 'Minimum settled sample',
        ok: settled.length >= 25,
        detail: `${settled.length} settled picks lagret.`,
      },
      {
        name: 'Datakvalitet',
        ok: avgScore >= 55 || allRows.length === 0,
        detail: allRows.length ? `Snittscore ${avgScore.toFixed(0)}.` : 'Ingen rader å score ennå.',
      },
      {
        name: 'Tracker rows',
        ok: allRows.length > 0,
        detail: `${allRows.length} totale tracker-rader.`,
      },
      {
        name: 'Export-ready',
        ok: allRows.length > 0,
        detail: allRows.length > 0 ? 'CSV/JSON export har data.' : 'Export vil være tom.',
      },
    ];

    const readinessScore = readinessChecks.length
      ? Math.round((readinessChecks.filter((check) => check.ok).length / readinessChecks.length) * 100)
      : 0;

    return NextResponse.json({
      ok: true,
      storageMode,
      updatedAt: store.updatedAt,
      readinessScore,
      readinessBand: qualityBand(readinessScore),
      summary: {
        openRows: store.open.length,
        settledRows: settled.length,
        totalRows: allRows.length,
        avgQualityScore: Math.round(avgScore),
        profit,
        roi,
        hitRate,
      },
      readinessChecks,
      issues,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown diagnostics error' },
      { status: 500 }
    );
  }
}
