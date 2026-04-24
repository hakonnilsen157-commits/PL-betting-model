import {
  clearTrackerStore,
  dedupeOpenRows,
  dedupeSettledRows,
  getTrackerStore,
  mergeTrackerOpenRows,
  mergeTrackerSettledRows,
  removeSettledFromOpen,
  replaceTrackerStore,
  TrackerSavedPick,
  TrackerSettledPick,
} from '@/lib/tracker-store';

type TrackerStorePayload = {
  open: TrackerSavedPick[];
  settled: TrackerSettledPick[];
  updatedAt?: string;
};

const STORE_KEY = 'pl-betting-model:v2-tracker-store';

function hasUpstashConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstashRequest(command: unknown[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Missing Upstash Redis env vars');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upstash request failed ${response.status}: ${text.slice(0, 300)}`);
  }

  const json = await response.json();
  return json.result;
}

function normalizeStore(value: Partial<TrackerStorePayload> | null | undefined): TrackerStorePayload {
  return {
    open: dedupeOpenRows(Array.isArray(value?.open) ? value.open : []),
    settled: dedupeSettledRows(Array.isArray(value?.settled) ? value.settled : []),
    updatedAt: value?.updatedAt ?? new Date().toISOString(),
  };
}

async function readPersistentStore(): Promise<TrackerStorePayload> {
  if (!hasUpstashConfig()) return getTrackerStore();

  const raw = await upstashRequest(['GET', STORE_KEY]);
  if (!raw) return normalizeStore(null);

  try {
    return normalizeStore(typeof raw === 'string' ? JSON.parse(raw) : raw);
  } catch {
    return normalizeStore(null);
  }
}

async function writePersistentStore(store: TrackerStorePayload): Promise<TrackerStorePayload> {
  const normalized = normalizeStore({ ...store, updatedAt: new Date().toISOString() });

  if (!hasUpstashConfig()) {
    return replaceTrackerStore(normalized);
  }

  await upstashRequest(['SET', STORE_KEY, JSON.stringify(normalized)]);
  return normalized;
}

export function getTrackerStorageMode() {
  return hasUpstashConfig() ? 'upstash-redis' : 'server-memory';
}

export async function getPersistentTrackerStore() {
  return readPersistentStore();
}

export async function mergePersistentOpenRows(rows: TrackerSavedPick[]) {
  if (!hasUpstashConfig()) return mergeTrackerOpenRows(rows);

  const current = await readPersistentStore();
  return writePersistentStore({
    ...current,
    open: dedupeOpenRows([...current.open, ...rows]),
  });
}

export async function mergePersistentSettledRows(rows: TrackerSettledPick[]) {
  if (!hasUpstashConfig()) return mergeTrackerSettledRows(rows);

  const current = await readPersistentStore();
  return writePersistentStore({
    ...current,
    settled: dedupeSettledRows([...current.settled, ...rows]),
    open: removeSettledFromOpen(current.open, rows),
  });
}

export async function replacePersistentTrackerStore(next: Partial<TrackerStorePayload>) {
  if (!hasUpstashConfig()) return replaceTrackerStore(next);
  return writePersistentStore({
    open: next.open ?? [],
    settled: next.settled ?? [],
    updatedAt: new Date().toISOString(),
  });
}

export async function clearPersistentTrackerStore(kind: 'open' | 'settled' | 'all') {
  if (!hasUpstashConfig()) return clearTrackerStore(kind);

  const current = await readPersistentStore();
  return writePersistentStore({
    open: kind === 'open' || kind === 'all' ? [] : current.open,
    settled: kind === 'settled' || kind === 'all' ? [] : current.settled,
    updatedAt: new Date().toISOString(),
  });
}
