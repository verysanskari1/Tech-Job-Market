import { createClient } from '@supabase/supabase-js';
import { fetchGreenhouse, fetchLever, fetchAshby, fetchSmartRecruiters } from './fetchers.js';
import { sendReport } from './email.js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const VERBOSE      = process.env.VERBOSE === '1';

// Count gap: BOTH thresholds must be exceeded to flag a warning
const GAP_ABS_THRESHOLD = 10;
const GAP_PCT_THRESHOLD = 0.15;

// Spot-check: sample this many role IDs from the ATS and verify they're in the DB
const SPOT_SAMPLE_SIZE = 10;

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

export interface Result {
  company: string;
  ats: string;
  live: number | null;
  db: number;
  gap: number | null;
  gapPct: number | null;
  spotChecked: number;
  spotMissing: number;
  status: 'ok' | 'warn' | 'error' | 'skip';
  note: string;
}

async function fetchLive(company: Company): Promise<{ count: number; ids: string[] }> {
  if (company.ats === 'greenhouse')      return fetchGreenhouse(company.ats_handle);
  if (company.ats === 'lever')           return fetchLever(company.ats_handle);
  if (company.ats === 'ashby')           return fetchAshby(company.ats_handle);
  if (company.ats === 'smartrecruiters') return fetchSmartRecruiters(company.ats_handle);
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

// Sample `n` IDs randomly from `ids`, then check how many are in the DB
async function spotCheck(companyId: string, ids: string[], n: number): Promise<{ checked: number; missing: number }> {
  if (ids.length === 0) return { checked: 0, missing: 0 };

  // Random sample without replacement
  const sample = ids.length <= n
    ? ids
    : Array.from({ length: n }, () => ids[Math.floor(Math.random() * ids.length)])
        .filter((v, i, a) => a.indexOf(v) === i);

  const { data, error } = await supabase
    .from('raw_roles')
    .select('ats_role_id')
    .eq('company_id', companyId)
    .in('ats_role_id', sample)
    .is('removed_at', null);

  if (error) throw new Error(error.message);

  const found = new Set((data ?? []).map(r => r.ats_role_id));
  const missing = sample.filter(id => !found.has(id)).length;
  return { checked: sample.length, missing };
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
    if (company.ats === 'custom') {
      const db = await getDbCount(company.id).catch(() => 0);
      results.push({ company: company.name, ats: company.ats, live: null, db, gap: null, gapPct: null, spotChecked: 0, spotMissing: 0, status: 'skip', note: 'no public API' });
      continue;
    }

    let live: { count: number; ids: string[] };
    try {
      live = await fetchLive(company);
    } catch (err) {
      const db = await getDbCount(company.id).catch(() => 0);
      results.push({ company: company.name, ats: company.ats, live: null, db, gap: null, gapPct: null, spotChecked: 0, spotMissing: 0, status: 'error', note: (err as Error).message });
      continue;
    }

    const db = await getDbCount(company.id);
    const gap = live.count - db;
    const gapPct = live.count > 0 ? Math.abs(gap) / live.count : 0;

    const { checked, missing } = await spotCheck(company.id, live.ids, SPOT_SAMPLE_SIZE).catch(() => ({ checked: 0, missing: 0 }));

    const countWarn = Math.abs(gap) > GAP_ABS_THRESHOLD && gapPct > GAP_PCT_THRESHOLD;
    const spotWarn  = missing > 0;

    let status: Result['status'] = 'ok';
    const notes: string[] = [];

    if (countWarn) {
      status = 'warn';
      notes.push(gap > 0 ? `ATS has +${gap} roles vs DB` : `DB has +${Math.abs(gap)} stale roles`);
    }
    if (spotWarn) {
      status = 'warn';
      notes.push(`${missing}/${checked} sampled IDs missing from DB`);
    }

    results.push({
      company: company.name,
      ats: company.ats,
      live: live.count,
      db,
      gap,
      gapPct,
      spotChecked: checked,
      spotMissing: missing,
      status,
      note: notes.join(' | '),
    });

    await new Promise(r => setTimeout(r, 300));
  }

  printReport(results);
  await sendReport(results);

  const hasProblems = results.some(r => r.status === 'warn' || r.status === 'error');
  process.exit(hasProblems ? 1 : 0);
}

function printReport(results: Result[]) {
  const COL = { company: 24, ats: 12, live: 6, db: 6, gap: 6, pct: 6, spot: 14 };

  const header = [
    ' Company'.padEnd(COL.company),
    'ATS'.padEnd(COL.ats),
    'Live'.padStart(COL.live),
    'DB'.padStart(COL.db),
    'Gap'.padStart(COL.gap),
    'Gap%'.padStart(COL.pct),
    'Spot-check'.padEnd(COL.spot),
    'Note',
  ].join('  ');

  const sep = '─'.repeat(header.length);
  console.log('\n' + sep);
  console.log(' SCRAPER HEALTH CHECK');
  console.log(sep);
  console.log(header);
  console.log(sep);

  for (const r of results) {
    if (!VERBOSE && r.status === 'ok') continue;

    const icon    = r.status === 'ok' ? '✓' : r.status === 'warn' ? '⚠' : r.status === 'error' ? '✗' : '–';
    const liveStr = r.live !== null ? String(r.live) : '?';
    const gapStr  = r.gap  !== null ? (r.gap > 0 ? `+${r.gap}` : String(r.gap)) : '?';
    const pctStr  = r.gapPct !== null ? `${Math.round(r.gapPct * 100)}%` : '?';
    const spotStr = r.spotChecked > 0
      ? `${r.spotChecked - r.spotMissing}/${r.spotChecked} found`
      : '—';

    const row = [
      ` ${icon}  ${r.company}`.padEnd(COL.company + 2),
      r.ats.padEnd(COL.ats),
      liveStr.padStart(COL.live),
      String(r.db).padStart(COL.db),
      gapStr.padStart(COL.gap),
      pctStr.padStart(COL.pct),
      spotStr.padEnd(COL.spot),
      r.note,
    ].join('  ');

    console.log(row);
  }

  console.log(sep);

  const ok   = results.filter(r => r.status === 'ok').length;
  const warn = results.filter(r => r.status === 'warn').length;
  const err  = results.filter(r => r.status === 'error').length;
  const skip = results.filter(r => r.status === 'skip').length;

  console.log(` ✓ OK: ${ok}   ⚠ Warnings: ${warn}   ✗ Errors: ${err}   – Skipped: ${skip}`);
  console.log(sep + '\n');
}

main();
