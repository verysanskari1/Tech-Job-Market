import { createClient } from '@supabase/supabase-js';
import { countGreenhouse, countLever, countAshby } from './fetchers.js';

// Load env — dotenv not required, just export vars before running
const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const VERBOSE = process.env.VERBOSE === '1';

// Thresholds: BOTH must be exceeded to flag a warning
const GAP_ABS_THRESHOLD = 10;   // absolute role count difference
const GAP_PCT_THRESHOLD = 0.15; // 15 %

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Company {
  id: string;
  name: string;
  ats: string;
  ats_handle: string;
}

interface Result {
  company: string;
  ats: string;
  live: number | null;
  db: number;
  gap: number | null;
  gapPct: number | null;
  status: 'ok' | 'warn' | 'error' | 'skip';
  note: string;
}

async function getLiveCount(company: Company): Promise<number> {
  if (company.ats === 'greenhouse') return countGreenhouse(company.ats_handle);
  if (company.ats === 'lever')      return countLever(company.ats_handle);
  if (company.ats === 'ashby')      return countAshby(company.ats_handle);
  throw new Error(`unknown ATS "${company.ats}"`);
}

async function getDbCount(companyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('raw_roles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .is('removed_at', null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function main() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, ats, ats_handle')
    .order('name');

  if (error) {
    console.error('Failed to load companies:', error.message);
    process.exit(1);
  }

  const results: Result[] = [];

  for (const company of companies as Company[]) {
    // Custom ATS — no public API to check against
    if (company.ats === 'custom') {
      const db = await getDbCount(company.id).catch(() => 0);
      results.push({ company: company.name, ats: company.ats, live: null, db, gap: null, gapPct: null, status: 'skip', note: 'no public API' });
      continue;
    }

    let live: number;
    try {
      live = await getLiveCount(company);
    } catch (err) {
      const db = await getDbCount(company.id).catch(() => 0);
      results.push({ company: company.name, ats: company.ats, live: null, db, gap: null, gapPct: null, status: 'error', note: (err as Error).message });
      continue;
    }

    const db = await getDbCount(company.id);
    const gap = live - db;
    const gapPct = live > 0 ? Math.abs(gap) / live : 0;

    let status: Result['status'] = 'ok';
    let note = '';

    if (Math.abs(gap) > GAP_ABS_THRESHOLD && gapPct > GAP_PCT_THRESHOLD) {
      status = 'warn';
      note = gap > 0
        ? `ATS has +${gap} roles vs DB`
        : `DB has +${Math.abs(gap)} roles vs ATS (stale removals?)`;
    }

    results.push({ company: company.name, ats: company.ats, live, db, gap, gapPct, status, note });

    // Small delay to avoid rate-limiting free-tier ATS APIs
    await new Promise(r => setTimeout(r, 300));
  }

  printReport(results);

  const hasProblems = results.some(r => r.status === 'warn' || r.status === 'error');
  process.exit(hasProblems ? 1 : 0);
}

function printReport(results: Result[]) {
  const COL = { company: 24, ats: 12, live: 6, db: 6, gap: 6, gapPct: 6 };

  const header = [
    ' Company'.padEnd(COL.company),
    'ATS'.padEnd(COL.ats),
    'Live'.padStart(COL.live),
    'DB'.padStart(COL.db),
    'Gap'.padStart(COL.gap),
    'Gap%'.padStart(COL.gapPct),
    'Status',
  ].join('  ');

  const sep = '─'.repeat(header.length);
  console.log('\n' + sep);
  console.log(' SCRAPER HEALTH CHECK');
  console.log(sep);
  console.log(header);
  console.log(sep);

  for (const r of results) {
    if (!VERBOSE && r.status === 'ok') continue;

    const icon = r.status === 'ok' ? '✓' : r.status === 'warn' ? '⚠' : r.status === 'error' ? '✗' : '–';
    const liveStr = r.live !== null ? String(r.live) : '?';
    const gapStr  = r.gap  !== null ? (r.gap > 0 ? `+${r.gap}` : String(r.gap)) : '?';
    const pctStr  = r.gapPct !== null ? `${Math.round(r.gapPct * 100)}%` : '?';

    const row = [
      ` ${icon}  ${r.company}`.padEnd(COL.company + 2),
      r.ats.padEnd(COL.ats),
      liveStr.padStart(COL.live),
      String(r.db).padStart(COL.db),
      gapStr.padStart(COL.gap),
      pctStr.padStart(COL.gapPct),
      r.note,
    ].join('  ');

    console.log(row);
  }

  console.log(sep);

  const ok    = results.filter(r => r.status === 'ok').length;
  const warn  = results.filter(r => r.status === 'warn').length;
  const err   = results.filter(r => r.status === 'error').length;
  const skip  = results.filter(r => r.status === 'skip').length;

  console.log(` ✓ OK: ${ok}   ⚠ Warnings: ${warn}   ✗ Errors: ${err}   – Skipped: ${skip}`);
  console.log(sep + '\n');
}

main();
