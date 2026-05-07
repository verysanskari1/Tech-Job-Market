import { createClient } from '@supabase/supabase-js';
import { countGreenhouse, countLever, countAshby, countWorkday } from './fetchers.js';

// ------------------------------------------------------------------
// Config
// ------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const GAP_ABS     = Number(process.env.GAP_THRESHOLD_ABS ?? 10);
const GAP_PCT     = Number(process.env.GAP_THRESHOLD_PCT ?? 15);
const VERBOSE     = process.env.VERBOSE === 'true';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Company {
  id: string;
  name: string;
  ats: string;
  ats_handle: string;
}

type CheckStatus = 'ok' | 'warning' | 'error' | 'skipped';

interface CheckResult {
  name: string;
  ats: string;
  liveCount: number | null;
  dbCount: number;
  gap: number | null;
  gapPct: number | null;
  status: CheckStatus;
  note: string;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function pct(gap: number, db: number): number {
  if (db === 0) return gap > 0 ? 100 : 0;
  return Math.round(Math.abs(gap) / db * 100);
}

function statusIcon(s: CheckStatus): string {
  return { ok: '✓', warning: '⚠', error: '✗', skipped: '–' }[s];
}

function pad(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
console.log('Loading companies from Supabase...');
const { data: companies, error: companiesError } = await supabase
  .from('companies')
  .select('id, name, ats, ats_handle')
  .order('name');

if (companiesError) {
  console.error('Failed to load companies:', companiesError.message);
  process.exit(1);
}

// Fetch DB open-role counts for all companies in one query
const { data: dbCounts, error: dbError } = await supabase
  .from('raw_roles')
  .select('company_id')
  .is('removed_at', null);

if (dbError) {
  console.error('Failed to load raw_roles:', dbError.message);
  process.exit(1);
}

const dbCountMap = new Map<string, number>();
for (const row of dbCounts ?? []) {
  const id = row.company_id as string;
  dbCountMap.set(id, (dbCountMap.get(id) ?? 0) + 1);
}

console.log(`Checking ${(companies as Company[]).length} companies against live ATS...\n`);

const results: CheckResult[] = [];

for (const company of companies as Company[]) {
  const dbCount = dbCountMap.get(company.id) ?? 0;

  if (company.ats === 'custom' || !company.ats_handle) {
    results.push({ name: company.name, ats: company.ats, liveCount: null, dbCount, gap: null, gapPct: null, status: 'skipped', note: 'custom ATS — no scraper yet' });
    continue;
  }

  let liveCount: number | null = null;
  let note = '';

  try {
    if      (company.ats === 'greenhouse') liveCount = await countGreenhouse(company.ats_handle);
    else if (company.ats === 'lever')      liveCount = await countLever(company.ats_handle);
    else if (company.ats === 'ashby')      liveCount = await countAshby(company.ats_handle);
    else if (company.ats === 'workday')    liveCount = await countWorkday(company.ats_handle);
    else {
      results.push({ name: company.name, ats: company.ats, liveCount: null, dbCount, gap: null, gapPct: null, status: 'skipped', note: `unknown ATS "${company.ats}"` });
      continue;
    }
  } catch (err) {
    note = (err as Error).message;
    results.push({ name: company.name, ats: company.ats, liveCount: null, dbCount, gap: null, gapPct: null, status: 'error', note });
    if (VERBOSE) console.error(`  [${company.name}] fetch error: ${note}`);
    continue;
  }

  const gap     = liveCount - dbCount;
  const gapPct  = pct(gap, dbCount);

  let status: CheckStatus = 'ok';
  if (Math.abs(gap) >= GAP_ABS && gapPct >= GAP_PCT) {
    status = 'warning';
    note   = `ATS has ${gap > 0 ? '+' : ''}${gap} roles vs DB`;
  }

  if (VERBOSE || status !== 'ok') {
    const icon = statusIcon(status);
    console.log(`  ${icon}  ${pad(company.name, 22)} live=${String(liveCount).padStart(4)}  db=${String(dbCount).padStart(4)}  gap=${String(gap).padStart(5)}  (${gapPct}%)`);
  }

  results.push({ name: company.name, ats: company.ats, liveCount, dbCount, gap, gapPct, status, note });

  // Polite delay between ATS calls
  await new Promise(r => setTimeout(r, 400));
}

// ------------------------------------------------------------------
// Summary table
// ------------------------------------------------------------------
const warnings = results.filter(r => r.status === 'warning');
const errors   = results.filter(r => r.status === 'error');
const skipped  = results.filter(r => r.status === 'skipped');
const ok       = results.filter(r => r.status === 'ok');

console.log('\n' + '─'.repeat(70));
console.log(` SCRAPER HEALTH CHECK`);
console.log('─'.repeat(70));
console.log(` ${pad('Company', 24)} ${pad('ATS', 10)} ${'Live'.padStart(5)} ${'DB'.padStart(5)} ${'Gap'.padStart(6)} ${'Gap%'.padStart(5)}  Status`);
console.log('─'.repeat(70));

// Print warnings + errors first, then ok if verbose
const toDisplay = VERBOSE
  ? results
  : [...warnings, ...errors];

for (const r of toDisplay) {
  const live    = r.liveCount != null ? String(r.liveCount).padStart(5) : '    ?';
  const db      = String(r.dbCount).padStart(5);
  const gap     = r.gap != null ? (r.gap >= 0 ? '+' : '') + String(r.gap).padStart(5) : '     ?';
  const gapPct  = r.gapPct != null ? `${r.gapPct}%`.padStart(5) : '    ?';
  const icon    = statusIcon(r.status);
  console.log(` ${icon}  ${pad(r.name, 22)} ${pad(r.ats, 10)} ${live} ${db} ${gap} ${gapPct}  ${r.note}`);
}

console.log('─'.repeat(70));
console.log(` ✓ OK: ${ok.length}   ⚠ Warnings: ${warnings.length}   ✗ Errors: ${errors.length}   – Skipped: ${skipped.length}`);
console.log('─'.repeat(70));

if (warnings.length > 0) {
  console.log('\n⚠  Companies with significant gaps (investigate these):');
  for (const r of warnings) {
    console.log(`   ${r.name}: live=${r.liveCount}  db=${r.dbCount}  gap=${r.gap}  (${r.gapPct}%)`);
    console.log(`   → Check handle "${r.ats_handle ?? r.ats}" and re-run scraper manually`);
  }
}

if (errors.length > 0) {
  console.log('\n✗  Companies where ATS fetch failed (likely bad handle or API down):');
  for (const r of errors) {
    console.log(`   ${r.name} (${r.ats}): ${r.note}`);
  }
}

if (warnings.length === 0 && errors.length === 0) {
  console.log('\n✓  All scraped companies are within tolerance. Scraper looks healthy.');
}

// Exit with non-zero if any warnings or errors — useful for CI
process.exit(warnings.length > 0 || errors.length > 0 ? 1 : 0);
