import { Actor, log } from 'apify';
import { createClient } from '@supabase/supabase-js';
import { classifyRole, MODEL } from './classify.js';
import { cacheKey, getCached, setCached } from './cache.js';
import type {
  UnclassifiedRole,
  ClassifiedRoleRow,
  Classification,
  LowConfidenceRecord,
  Seniority,
} from './types.js';

await Actor.init();

// ------------------------------------------------------------------
// Config
// ------------------------------------------------------------------
const input = await Actor.getInput<{
  supabaseUrl?: string;
  supabaseKey?: string;
  batchSize?: number;
  concurrency?: number;
}>();

const supabaseUrl = input?.supabaseUrl ?? process.env.SUPABASE_URL ?? '';
const supabaseKey = input?.supabaseKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const BATCH_SIZE = input?.batchSize ?? 200;
const CONCURRENCY = input?.concurrency ?? 3;
const LOW_CONFIDENCE_THRESHOLD = 0.70;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch all rows from a table, paginating past Supabase's 1000-row default limit.
async function fetchAllRows<T>(
  queryFn: () => { range: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }> },
  pageSize = 1000,
): Promise<T[]> {
  const results: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await queryFn().range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return results;
}

// ------------------------------------------------------------------
// Load unclassified raw_roles
// Two-query approach: fetch open roles, fetch classified IDs, diff in JS.
// ------------------------------------------------------------------
log.info('Fetching all open raw_roles...');
const openRoles = await fetchAllRows<{ id: string; title_raw: string; department_raw: string | null }>(
  () => supabase.from('raw_roles').select('id, title_raw, department_raw').is('removed_at', null),
);
log.info(`Fetched ${openRoles.length} open raw_roles`);

log.info('Fetching already-classified role IDs...');
const classifiedRows = await fetchAllRows<{ raw_role_id: string }>(
  () => supabase.from('classified_roles').select('raw_role_id'),
);

const classifiedSet = new Set(classifiedRows.map(r => r.raw_role_id));

const unclassified: UnclassifiedRole[] = openRoles
  .filter(r => !classifiedSet.has(r.id))
  .map(r => ({
    id: r.id,
    title_raw: r.title_raw,
    department_raw: r.department_raw,
  }));

log.info(`${unclassified.length} roles to classify (${classifiedSet.size} already done)`);

if (unclassified.length === 0) {
  log.info('Nothing to classify — all roles are up to date.');
  await Actor.exit();
}

// ------------------------------------------------------------------
// Per-role processor: check cache, then call Claude
// ------------------------------------------------------------------
async function processRole(role: UnclassifiedRole): Promise<ClassifiedRoleRow | null> {
  const key = cacheKey(role.title_raw, role.department_raw);

  let result: Classification;
  let fromCache = false;

  const hit = await getCached(key);
  if (hit) {
    result = hit;
    fromCache = true;
  } else {
    try {
      result = await classifyRole(role.title_raw, role.department_raw);
      await setCached(key, result);
    } catch (err) {
      log.error(`Classify failed for "${role.title_raw}": ${(err as Error).message}`);
      return null;
    }
  }

  // Guard against unexpected seniority values before DB insert
  const validSeniorities: Seniority[] = ['Junior', 'Mid', 'Senior', 'Staff+'];
  const seniority: Seniority = validSeniorities.includes(result.seniority)
    ? result.seniority
    : 'Mid';

  return {
    raw_role_id: role.id,
    category: result.category,
    seniority,
    confidence: result.confidence,
    model_version: MODEL,
    cached: fromCache,
  };
}

// ------------------------------------------------------------------
// Batch + concurrency loop
// ------------------------------------------------------------------
let freshCount = 0;
let cacheCount = 0;
let errorCount = 0;
const lowConfidenceLog: LowConfidenceRecord[] = [];

for (let i = 0; i < unclassified.length; i += BATCH_SIZE) {
  const batch = unclassified.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(unclassified.length / BATCH_SIZE);
  log.info(`Batch ${batchNum}/${totalBatches}: processing ${batch.length} roles`);

  // Process with bounded concurrency
  const rows: ClassifiedRoleRow[] = [];
  for (let j = 0; j < batch.length; j += CONCURRENCY) {
    const chunk = batch.slice(j, j + CONCURRENCY);
    const results = await Promise.all(chunk.map(processRole));
    for (const r of results) {
      if (r) rows.push(r);
      else errorCount++;
    }
  }

  if (rows.length === 0) continue;

  const { error: upsertError } = await supabase
    .from('classified_roles')
    .upsert(rows, { onConflict: 'raw_role_id' });

  if (upsertError) {
    log.error(`Upsert failed for batch ${batchNum}: ${upsertError.message}`);
    errorCount += rows.length;
    continue;
  }

  for (const row of rows) {
    if (row.cached) cacheCount++;
    else freshCount++;

    if (row.confidence < LOW_CONFIDENCE_THRESHOLD) {
      const role = batch.find(r => r.id === row.raw_role_id)!;
      lowConfidenceLog.push({
        raw_role_id: row.raw_role_id,
        title_raw: role.title_raw,
        department_raw: role.department_raw,
        category: row.category,
        seniority: row.seniority,
        confidence: row.confidence,
      });
    }
  }

  log.info(`  → wrote ${rows.length} (${rows.filter(r => r.cached).length} from cache)`);
}

// ------------------------------------------------------------------
// Push low-confidence rows to Apify Dataset for review
// ------------------------------------------------------------------
if (lowConfidenceLog.length > 0) {
  log.warning(
    `${lowConfidenceLog.length} low-confidence classifications (< ${LOW_CONFIDENCE_THRESHOLD}) — pushing to dataset`,
  );
  const dataset = await Actor.openDataset('low-confidence-classifications');
  await dataset.pushData(lowConfidenceLog);
}

// ------------------------------------------------------------------
// Summary
// ------------------------------------------------------------------
log.info('--- Classification summary ---');
log.info(`  Freshly classified: ${freshCount}`);
log.info(`  Served from cache:  ${cacheCount}`);
log.info(`  Errors:             ${errorCount}`);
log.info(`  Low confidence:     ${lowConfidenceLog.length}`);
log.info('------------------------------');

await Actor.exit();
