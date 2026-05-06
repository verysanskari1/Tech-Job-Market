import { supabase } from './supabase';
import type { CategoryCount, CompanySnapshot, IndexValue } from '@/types';

export async function getLatestIndexValues(): Promise<IndexValue[]> {
  const { data, error } = await supabase
    .from('index_values_daily')
    .select('captured_at, index_id, value, change_pct, total_open, indexes(name)')
    .order('captured_at', { ascending: false })
    .limit(200);

  if (error) { console.error('getLatestIndexValues:', error.message); return []; }

  const sparklineMap: Record<string, number[]> = {};
  const totalSparklineMap: Record<string, number[]> = {};
  const latestMap: Record<string, typeof data[0]> = {};

  for (const row of data ?? []) {
    if (!latestMap[row.index_id]) latestMap[row.index_id] = row;
    if (!sparklineMap[row.index_id]) sparklineMap[row.index_id] = [];
    if (!totalSparklineMap[row.index_id]) totalSparklineMap[row.index_id] = [];
    sparklineMap[row.index_id].unshift(Number(row.value));
    if (row.total_open != null) totalSparklineMap[row.index_id].unshift(Number(row.total_open));
  }

  return Object.values(latestMap).map(row => ({
    index_id: row.index_id,
    name: (row.indexes as unknown as { name: string } | null)?.name ?? row.index_id,
    value: Number(row.value),
    change_pct: row.change_pct != null ? Number(row.change_pct) : null,
    captured_at: row.captured_at,
    sparkline: sparklineMap[row.index_id] ?? [],
    total_open: row.total_open != null ? Number(row.total_open) : 0,
    total_sparkline: totalSparklineMap[row.index_id] ?? [],
  }));
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

export async function getTopCompanies(limit = 500): Promise<CompanySnapshot[]> {
  const date = await getLatestSnapshotDate();
  if (!date) return [];

  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('company_id, total_open, by_category, companies(name, indexes, ats, ats_handle)')
    .eq('captured_at', date)
    .order('total_open', { ascending: false })
    .limit(limit);

  if (error) { console.error('getTopCompanies:', error.message); return []; }

  return (data ?? []).map(row => {
    const co = row.companies as unknown as { name: string; indexes: string[]; ats: string; ats_handle: string } | null;
    return {
      company_id: row.company_id as string,
      name: co?.name ?? '—',
      total_open: row.total_open as number,
      by_category: row.by_category as Record<string, number>,
      indexes: co?.indexes ?? [],
      ats: co?.ats ?? '',
      ats_handle: co?.ats_handle ?? '',
    };
  });
}

// getCategoryBreakdown is no longer used directly — computed client-side from companies
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
