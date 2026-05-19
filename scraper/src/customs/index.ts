import type { FetchedRole } from '../types.js';
import { fetchMicrosoft } from './microsoft.js';
import { fetchApple } from './apple.js';
import { fetchGitHub } from './github.js';
import { fetchAtlassian } from './atlassian.js';
import { fetchNetflix } from './netflix.js';

// Registry of custom scrapers, keyed by `ats_handle` for rows with
// `ats = 'custom'`. To add a new company:
//   1. Write scraper/src/customs/{slug}.ts that exports a function
//      returning Promise<FetchedRole[]>.
//   2. Register it here.
//   3. Insert the company row with ats='custom' and ats_handle='{slug}'.
//
// Unknown handles fall through to a clear error so they're easy to spot
// in the scraper log.

type CustomFetcher = () => Promise<FetchedRole[]>;

const REGISTRY: Record<string, CustomFetcher> = {
  microsoft: fetchMicrosoft,
  apple:     fetchApple,
  github:    fetchGitHub,
  atlassian: fetchAtlassian,
  netflix:   fetchNetflix,
};

export async function fetchCustom(handle: string): Promise<FetchedRole[]> {
  const fn = REGISTRY[handle];
  if (!fn) throw new Error(`No custom scraper registered for "${handle}"`);
  return fn();
}

export function hasCustomScraper(handle: string): boolean {
  return handle in REGISTRY;
}
