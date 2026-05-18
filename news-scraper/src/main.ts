import { Actor, log } from 'apify';
import { PostgrestClient } from '@supabase/postgrest-js';
import { fetchLayoffsFyi } from './sources/layoffs-fyi.js';
import { fetchTechCrunch } from './sources/techcrunch.js';
import { classifyNews, quickCategoryFromSource } from './classifier.js';
import type { Company, NewsRow, RawNewsItem } from './types.js';

await Actor.init();

const input = await Actor.getInput<{
  supabaseUrl?: string;
  supabaseKey?: string;
  techcrunchConcurrency?: number;
}>();
const supabaseUrl = input?.supabaseUrl ?? process.env.SUPABASE_URL ?? '';
const supabaseKey = input?.supabaseKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const TECHCRUNCH_CONCURRENCY = input?.techcrunchConcurrency ?? 4;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required for news classification.');
}

const db = new PostgrestClient(`${supabaseUrl.replace(/\/$/, '')}/rest/v1`, {
  headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
});

// ------------------------------------------------------------------
// Load tracked companies — used to map news items back to company_id
// and to drive the TechCrunch per-company fetcher.
// ------------------------------------------------------------------
const { data: companiesData, error: cErr } = await db
  .from('companies')
  .select('id, name');
if (cErr) throw new Error(`Failed to load companies: ${cErr.message}`);
const companies = (companiesData ?? []) as Company[];
log.info(`Loaded ${companies.length} companies`);

const nameToId = new Map<string, string>();
for (const c of companies) nameToId.set(c.name.toLowerCase(), c.id);

function resolveCompanyId(hint: string): string | null {
  return nameToId.get(hint.toLowerCase()) ?? null;
}

// ------------------------------------------------------------------
// Source: Layoffs.fyi (single CSV fetch, covers all companies)
// ------------------------------------------------------------------
let raw: RawNewsItem[] = [];
try {
  const layoffs = await fetchLayoffsFyi();
  log.info(`Layoffs.fyi: ${layoffs.length} entries`);
  raw.push(...layoffs);
} catch (err) {
  log.error(`Layoffs.fyi fetch failed: ${(err as Error).message}`);
}

// ------------------------------------------------------------------
// Source: TechCrunch per-company tag RSS (parallel, bounded concurrency)
// ------------------------------------------------------------------
async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let idx = 0;
  const runners: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    runners.push((async () => {
      while (idx < items.length) {
        const my = idx++;
        await worker(items[my]);
      }
    })());
  }
  await Promise.all(runners);
}

const tcResults: RawNewsItem[] = [];
await runWithConcurrency(companies, TECHCRUNCH_CONCURRENCY, async company => {
  try {
    const items = await fetchTechCrunch(company.name);
    if (items.length > 0) log.info(`[${company.name}] TechCrunch: ${items.length} items`);
    tcResults.push(...items);
  } catch (err) {
    log.warning(`[${company.name}] TechCrunch fetch failed: ${(err as Error).message}`);
  }
});
log.info(`TechCrunch: ${tcResults.length} total items across all companies`);
raw.push(...tcResults);

// ------------------------------------------------------------------
// Deduplicate by (source, url) before we burn classifier tokens.
// ------------------------------------------------------------------
const seen = new Set<string>();
raw = raw.filter(item => {
  const key = `${item.source}::${item.url}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
log.info(`After dedup: ${raw.length} unique items`);

// ------------------------------------------------------------------
// Skip items that already exist in the DB (matched on source+url).
// Cheaper than re-classifying every day's TechCrunch results.
// ------------------------------------------------------------------
const { data: existing } = await db
  .from('company_news')
  .select('source, url')
  .range(0, 49999);

const known = new Set<string>();
for (const e of (existing ?? []) as { source: string; url: string }[]) {
  known.add(`${e.source}::${e.url}`);
}

const fresh = raw.filter(item => !known.has(`${item.source}::${item.url}`));
log.info(`Fresh items to classify: ${fresh.length}`);

// ------------------------------------------------------------------
// Classify and prepare rows
// ------------------------------------------------------------------
const rows: NewsRow[] = [];
let classifierCalls = 0;
let classifierErrors = 0;

for (const item of fresh) {
  const companyId = resolveCompanyId(item.company_hint);
  const quick = quickCategoryFromSource(item.source);
  let category: NewsRow['category'];
  if (quick) {
    category = quick;
  } else {
    try {
      category = await classifyNews(item.title);
      classifierCalls++;
    } catch (err) {
      log.warning(`Classifier failed for "${item.title}": ${(err as Error).message}`);
      classifierErrors++;
      category = 'other';
    }
  }
  rows.push({
    company_id:   companyId,
    source:       item.source,
    category,
    title:        item.title,
    url:          item.url,
    published_at: item.published_at,
  });
}

log.info(`Classifier: ${classifierCalls} API calls, ${classifierErrors} errors`);

// ------------------------------------------------------------------
// Insert in batches. (source, url) unique constraint handles any races.
// ------------------------------------------------------------------
const BATCH = 500;
let inserted = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await db
    .from('company_news')
    .upsert(batch, { onConflict: 'source,url', ignoreDuplicates: true });
  if (error) {
    log.error(`Insert batch failed: ${error.message}`);
    continue;
  }
  inserted += batch.length;
}
log.info(`Inserted ${inserted} new news rows`);

await Actor.exit();
