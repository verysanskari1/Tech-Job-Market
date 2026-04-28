import { Actor } from 'apify';
import { createHash } from 'crypto';
import type { Classification } from './types.js';

const STORE_NAME = 'classification-cache';

let store: Awaited<ReturnType<typeof Actor.openKeyValueStore>> | null = null;

async function getStore() {
  if (!store) store = await Actor.openKeyValueStore(STORE_NAME);
  return store;
}

export function cacheKey(titleRaw: string, departmentRaw: string | null): string {
  return createHash('md5').update(`${titleRaw}|${departmentRaw ?? ''}`).digest('hex');
}

export async function getCached(key: string): Promise<Classification | null> {
  const s = await getStore();
  const val = await s.getValue<Classification>(key);
  return val ?? null;
}

export async function setCached(key: string, classification: Classification): Promise<void> {
  const s = await getStore();
  await s.setValue(key, classification);
}
