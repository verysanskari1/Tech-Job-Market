import { supabase } from './supabase';
import type { CategoryCount, CompanySnapshot, IndexValue } from '@/types';

export async function getLatestIndexValues(): Promise<IndexValue[]> {
  const { data, error } = await supabase
    .from('index_values_daily')
    .select('captured_at, index_id, value, change_pct, indexes(name)')
    .order('captured_at', { ascending: false })
    .limit(50);

  if (error) { console.error('getLatestIndexValues:', error.message); return []; }

  // Keep only the latest row per index
  const seen = new Set<string>();
  const result: IndexValue[] = [];
  for (const row of data ?? []) {
    if (seen.has(row.index_id)) continue;
    seen.add(row.index_id);
    result.push({
      index_id: row.index_id,
      name: (row.indexes as { name: string } | null)?.name ?? row.index_id,
      value: Number(row.value),
      change_pct: row.change_pct != null ? Number(row.change_pct) : null,
      captured_at: row.captured_at,
    });
  }
  return result;
}

async function getLatestSnapshotDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('captured_at')
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data.captured_at as string;
}

export async function getCategoryBreakdown(): Promise<CategoryCount[]> {
  const date = await getLatestSnapshotDate();
  if (!date) return [];

  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('by_category')
    .eq('captured_at', date);

  if (error) { console.error('getCategoryBreakdown:', error.message); return []; }

  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    const byCategory = row.by_category as Record<string, number>;
    for (const [cat, count] of Object.entries(byCategory)) {
      if (cat === 'Other') continue;
      totals[cat] = (totals[cat] ?? 0) + count;
    }
  }

  return Object.entries(totals)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getTopCompanies(limit = 20): Promise<CompanySnapshot[]> {
  const date = await getLatestSnapshotDate();
  if (!date) return [];

  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('company_id, total_open, by_category, companies(name)')
    .eq('captured_at', date)
    .order('total_open', { ascending: false })
    .limit(limit);

  if (error) { console.error('getTopCompanies:', error.message); return []; }

  return (data ?? []).map(row => ({
    company_id: row.company_id as string,
    name: (row.companies as { name: string } | null)?.name ?? '—',
    total_open: row.total_open as number,
    by_category: row.by_category as Record<string, number>,
  }));
}
