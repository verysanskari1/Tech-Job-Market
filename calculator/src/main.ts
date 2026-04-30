import { Actor, log } from 'apify';
import { createClient } from '@supabase/supabase-js';
import type { Company, Index, CompanySnapshot } from './types.js';

await Actor.init();

// ------------------------------------------------------------------
// Config
// ------------------------------------------------------------------
const input = await Actor.getInput<{ supabaseUrl?: string; supabaseKey?: string }>();
const supabaseUrl = input?.supabaseUrl ?? process.env.SUPABASE_URL ?? '';
const supabaseKey = input?.supabaseKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ------------------------------------------------------------------
// Load companies and indexes
// ------------------------------------------------------------------
const { data: companies, error: companiesError } = await supabase
  .from('companies')
  .select('id, name, indexes');

if (companiesError) throw new Error(`Failed to load companies: ${companiesError.message}`);
log.info(`Loaded ${companies.length} companies`);

const { data: indexes, error: indexesError } = await supabase
  .from('indexes')
  .select('id, name, base_value, base_date, constituents');

if (indexesError) throw new Error(`Failed to load indexes: ${indexesError.message}`);
log.info(`Loaded ${indexes.length} indexes`);

// ------------------------------------------------------------------
// Load all open classified roles, paginating past Supabase's 1000-row limit
// ------------------------------------------------------------------
log.info('Loading open classified roles...');

async function fetchAllRows<T>(queryFn: () => any, pageSize = 1000): Promise<T[]> {
  const results: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await queryFn().range(from, from + pageSize - 1);
    if (error) throw new Error((error as { message: string }).message);
    if (!data || (data as T[]).length === 0) break;
    results.push(...(data as T[]));
    if ((data as T[]).length < pageSize) break;
    from += pageSize;
  }
  return results;
}

const roles = await fetchAllRows(
  () => supabase.from('raw_roles').select('company_id, classified_roles!inner(category, seniority)').is('removed_at', null),
);

log.info(`${roles.length} open classified roles loaded`);

// ------------------------------------------------------------------
// Aggregate per-company snapshots in memory
// ------------------------------------------------------------------
const snapshotMap = new Map<string, CompanySnapshot>();

for (const company of companies as Company[]) {
  snapshotMap.set(company.id, {
    company_id: company.id,
    total_open: 0,
    by_category: {},
    by_seniority: {},
  });
}

for (const role of roles) {
  const snap = snapshotMap.get(role.company_id as string);
  if (!snap) continue;

  // classified_roles!inner returns an array (PostgREST join result)
  const cr = Array.isArray(role.classified_roles)
    ? role.classified_roles[0]
    : role.classified_roles;

  if (!cr) continue;

  // Exclude non-engineering roles from index math
  if (cr.category === 'Other') continue;

  snap.total_open++;
  snap.by_category[cr.category] = (snap.by_category[cr.category] ?? 0) + 1;
  snap.by_seniority[cr.seniority] = (snap.by_seniority[cr.seniority] ?? 0) + 1;
}

// ------------------------------------------------------------------
// Upsert snapshots_daily
// ------------------------------------------------------------------
const snapshotRows = Array.from(snapshotMap.values()).map(snap => ({
  captured_at: today,
  company_id: snap.company_id,
  total_open: snap.total_open,
  by_category: snap.by_category,
  by_seniority: snap.by_seniority,
}));

const { error: snapError } = await supabase
  .from('snapshots_daily')
  .upsert(snapshotRows, { onConflict: 'captured_at,company_id' });

if (snapError) throw new Error(`Failed to upsert snapshots: ${snapError.message}`);
log.info(`Upserted ${snapshotRows.length} company snapshots for ${today}`);

// ------------------------------------------------------------------
// Compute index values
// ------------------------------------------------------------------
// Load the base-day total for each index constituent to calculate the
// divisor: index_value = (current_total / base_total) * base_value
// ------------------------------------------------------------------

for (const index of indexes as Index[]) {
  if (!index.constituents || index.constituents.length === 0) {
    log.warning(`Index "${index.name}" has no constituents — skipping`);
    continue;
  }

  // Current total: sum of today's total_open for constituents
  const currentTotal = index.constituents.reduce((sum, cid) => {
    return sum + (snapshotMap.get(cid)?.total_open ?? 0);
  }, 0);

  // Base total: sum of total_open on the base_date for constituents
  const { data: baseRows, error: baseError } = await supabase
    .from('snapshots_daily')
    .select('company_id, total_open')
    .eq('captured_at', index.base_date)
    .in('company_id', index.constituents);

  if (baseError) {
    log.error(`Failed to load base snapshot for index "${index.name}": ${baseError.message}`);
    continue;
  }

  const baseTotal = (baseRows ?? []).reduce((sum, r) => sum + (r.total_open as number), 0);

  let value: number;
  let changePct: number | null = null;

  if (baseTotal === 0) {
    // No base snapshot yet — this is the first run, use base_value directly
    value = index.base_value;
    log.info(`Index "${index.name}": no base snapshot yet, setting value = ${value}`);
  } else {
    value = (currentTotal / baseTotal) * index.base_value;
    value = Math.round(value * 100) / 100;
  }

  // Yesterday's value for change_pct
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const { data: prevRows } = await supabase
    .from('index_values_daily')
    .select('value')
    .eq('index_id', index.id)
    .eq('captured_at', yesterday)
    .maybeSingle();

  if (prevRows?.value) {
    const prev = prevRows.value as number;
    changePct = Math.round(((value - prev) / prev) * 10000) / 100; // 2 decimal places
  }

  // Top movers: companies with biggest absolute change in total_open vs yesterday
  const { data: prevSnaps } = await supabase
    .from('snapshots_daily')
    .select('company_id, total_open')
    .eq('captured_at', yesterday)
    .in('company_id', index.constituents);

  const prevSnapMap = new Map(
    (prevSnaps ?? []).map(r => [r.company_id as string, r.total_open as number]),
  );

  const companyNames = new Map((companies as Company[]).map(c => [c.id, c.name]));

  const movers = index.constituents
    .map(cid => {
      const curr = snapshotMap.get(cid)?.total_open ?? 0;
      const prev = prevSnapMap.get(cid) ?? curr;
      return { name: companyNames.get(cid) ?? cid, delta: curr - prev, current: curr };
    })
    .filter(m => m.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  const { error: ivError } = await supabase
    .from('index_values_daily')
    .upsert(
      {
        captured_at: today,
        index_id: index.id,
        value,
        change_pct: changePct,
        top_movers: movers,
      },
      { onConflict: 'captured_at,index_id' },
    );

  if (ivError) {
    log.error(`Failed to upsert index "${index.name}": ${ivError.message}`);
  } else {
    const changeStr = changePct !== null ? ` (${changePct > 0 ? '+' : ''}${changePct}%)` : '';
    log.info(`Index "${index.name}": ${value}${changeStr}  [${currentTotal} roles across ${index.constituents.length} companies]`);
  }
}

// ------------------------------------------------------------------
// Summary
// ------------------------------------------------------------------
log.info('--- Snapshot summary ---');
for (const snap of snapshotMap.values()) {
  const name = (companies as Company[]).find(c => c.id === snap.company_id)?.name ?? snap.company_id;
  log.info(`  ${name.padEnd(20)} ${snap.total_open} open roles`);
}
log.info('------------------------');

await Actor.exit();
