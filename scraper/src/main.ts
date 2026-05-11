import { Actor, log } from 'apify';
import { PostgrestClient } from '@supabase/postgrest-js';
import { fetchGreenhouse, fetchLever, fetchAshby, fetchSmartRecruiters, fetchWorkday } from './fetchers.js';
import type { Company, RawRoleRow } from './types.js';

await Actor.init();

// ------------------------------------------------------------------
// Config — prefer env vars; actor input overrides for local testing
// ------------------------------------------------------------------
const input = await Actor.getInput<{ supabaseUrl?: string; supabaseKey?: string }>();
const supabaseUrl = input?.supabaseUrl ?? process.env.SUPABASE_URL ?? '';
const supabaseKey = input?.supabaseKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = new PostgrestClient(`${supabaseUrl.replace(/\/$/, '')}/rest/v1`, {
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  },
});
const capturedAt = new Date().toISOString();

// Ashby blocks all cloud IPs — route through Apify residential proxy.
const proxyConfiguration = await Actor.createProxyConfiguration({ groups: ['RESIDENTIAL'] })
  .catch(() => null);
const ashbyProxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl() : undefined;
if (!ashbyProxyUrl) log.warning('No proxy available — Ashby companies will fail.');

// ------------------------------------------------------------------
// Load companies
// ------------------------------------------------------------------
const { data: companies, error: companiesError } = await supabase
  .from('companies')
  .select('id, name, ats, ats_handle');

if (companiesError) throw new Error(`Failed to load companies: ${companiesError.message}`);
log.info(`Loaded ${companies.length} companies`);

// ------------------------------------------------------------------
// Per-company scrape
// ------------------------------------------------------------------
const summary: Record<string, { found: number; removed: number }> = {};

for (const company of companies as Company[]) {
  log.info(`[${company.name}] Scraping ${company.ats}/${company.ats_handle}`);

  let fetched;
  try {
    if (company.ats === 'greenhouse')          fetched = await fetchGreenhouse(company.ats_handle);
    else if (company.ats === 'lever')          fetched = await fetchLever(company.ats_handle);
    else if (company.ats === 'ashby')          fetched = await fetchAshby(company.ats_handle, ashbyProxyUrl);
    else if (company.ats === 'smartrecruiters') fetched = await fetchSmartRecruiters(company.ats_handle);
    else if (company.ats === 'workday')        fetched = await fetchWorkday(company.ats_handle, ashbyProxyUrl);
    else { log.warning(`[${company.name}] Unknown ATS "${company.ats}" — skipping`); continue; }
  } catch (err) {
    log.error(`[${company.name}] Fetch failed: ${(err as Error).message}`);
    continue;
  }

  log.info(`[${company.name}] ${fetched.length} open roles found`);

  if (fetched.length === 0) {
    // 0 roles almost certainly means an API or handle issue, not a real zero.
    // Skip the upsert so we don't incorrectly mark every existing role removed.
    log.warning(`[${company.name}] 0 roles returned — skipping upsert. Verify handle.`);
    summary[company.name] = { found: 0, removed: 0 };
    continue;
  }

  // ------------------------------------------------------------------
  // Upsert: insert new roles, update captured_at on existing ones,
  // and clear removed_at if a previously-removed role reappears.
  // ------------------------------------------------------------------
  const rows: RawRoleRow[] = fetched.map(r => ({
    company_id: company.id,
    ats_role_id: r.ats_role_id,
    title_raw: r.title_raw,
    department_raw: r.department_raw,
    location: r.location,
    posted_at: r.posted_at,
    captured_at: capturedAt,
    removed_at: null,
  }));

  const { error: upsertError } = await supabase
    .from('raw_roles')
    .upsert(rows, { onConflict: 'company_id,ats_role_id' });

  if (upsertError) {
    log.error(`[${company.name}] Upsert failed: ${upsertError.message}`);
    continue;
  }

  // ------------------------------------------------------------------
  // Mark removed: roles in DB (removed_at IS NULL) missing from today's fetch
  // ------------------------------------------------------------------
  const currentIds = new Set(fetched.map(r => r.ats_role_id));

  const { data: openRoles, error: openError } = await supabase
    .from('raw_roles')
    .select('id, ats_role_id')
    .eq('company_id', company.id)
    .is('removed_at', null);

  if (openError) {
    log.error(`[${company.name}] Could not fetch open roles for removal check: ${openError.message}`);
    summary[company.name] = { found: fetched.length, removed: 0 };
    continue;
  }

  const toRemove = (openRoles ?? []).filter(r => !currentIds.has(r.ats_role_id));

  if (toRemove.length > 0) {
    const { error: removeError } = await supabase
      .from('raw_roles')
      .update({ removed_at: capturedAt })
      .in('id', toRemove.map(r => r.id));

    if (removeError) {
      log.error(`[${company.name}] Failed to mark ${toRemove.length} roles removed: ${removeError.message}`);
    } else {
      log.info(`[${company.name}] Marked ${toRemove.length} roles as removed`);
    }
  }

  summary[company.name] = { found: fetched.length, removed: toRemove.length };
}

// ------------------------------------------------------------------
// Final summary table for spot-checking
// ------------------------------------------------------------------
log.info('--- Scrape summary ---');
for (const [name, { found, removed }] of Object.entries(summary)) {
  log.info(`  ${name.padEnd(20)} found=${found}  removed=${removed}`);
}
log.info('----------------------');

await Actor.exit();
