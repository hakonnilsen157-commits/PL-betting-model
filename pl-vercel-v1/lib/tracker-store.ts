export type TrackerSavedPick = {
  fixtureId: string;
  match: string;
  market: string;
  odds: number;
  confidence: number;
  expectedValue: number;
  kickoff: string;
  savedAt: string;
  snapshotId: string;
};

export type TrackerSettledPick = TrackerSavedPick & {
  status: 'settled';
  homeGoals: number;
  awayGoals: number;
  won: boolean;
  profit: number;
  settledAt: string;
};

type TrackerStore = {
  open: TrackerSavedPick[];
  settled: TrackerSettledPick[];
  updatedAt?: string;
};

const globalStore = globalThis as typeof globalThis & {
  __plTrackerStore?: TrackerStore;
};

function getStore() {
  if (!globalStore.__plTrackerStore) {
    globalStore.__plTrackerStore = {
      open: [],
      settled: [],
      updatedAt: new Date().toISOString(),
    };
  }

  return globalStore.__plTrackerStore;
}

function keyOf(row: { fixtureId: string; market: string }) {
  return `${row.fixtureId}__${row.market}`;
}

export function dedupeOpenRows(rows: TrackerSavedPick[]) {
  const map = new Map<string, TrackerSavedPick>();
  for (const row of rows) {
    const key = keyOf(row);
    const existing = map.get(key);
    if (!existing || new Date(row.savedAt).getTime() > new Date(existing.savedAt).getTime()) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

export function dedupeSettledRows(rows: TrackerSettledPick[]) {
  const map = new Map<string, TrackerSettledPick>();
  for (const row of rows) {
    const key = keyOf(row);
    const existing = map.get(key);
    if (!existing || new Date(row.settledAt).getTime() > new Date(existing.settledAt).getTime()) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
}

export function removeSettledFromOpen(open: TrackerSavedPick[], settled: TrackerSettledPick[]) {
  const settledKeys = new Set(settled.map((row) => keyOf(row)));
  return open.filter((row) => !settledKeys.has(keyOf(row)));
}

export function getTrackerStore() {
  const store = getStore();
  return {
    open: store.open,
    settled: store.settled,
    updatedAt: store.updatedAt,
  };
}

export function mergeTrackerOpenRows(rows: TrackerSavedPick[]) {
  const store = getStore();
  store.open = dedupeOpenRows([...store.open, ...rows]);
  store.updatedAt = new Date().toISOString();
  return getTrackerStore();
}

export function mergeTrackerSettledRows(rows: TrackerSettledPick[]) {
  const store = getStore();
  store.settled = dedupeSettledRows([...store.settled, ...rows]);
  store.open = removeSettledFromOpen(store.open, rows);
  store.updatedAt = new Date().toISOString();
  return getTrackerStore();
}

export function replaceTrackerStore(next: Partial<TrackerStore>) {
  const store = getStore();
  store.open = dedupeOpenRows(next.open ?? store.open);
  store.settled = dedupeSettledRows(next.settled ?? store.settled);
  store.updatedAt = new Date().toISOString();
  return getTrackerStore();
}

export function clearTrackerStore(kind: 'open' | 'settled' | 'all') {
  const store = getStore();
  if (kind === 'open' || kind === 'all') store.open = [];
  if (kind === 'settled' || kind === 'all') store.settled = [];
  store.updatedAt = new Date().toISOString();
  return getTrackerStore();
}
