import { supabase } from './supabase';
import type { CategoryCount, CategoryMover, CompanySnapshot, GainersLosers, IndexValue, Mover } from '@/types';

export async function getLatestIndexValues(): Promise<IndexValue[]> {
  const { data, error } = await supabase
    .from('index_values_daily')
    .select('captured_at, index_id, value, change_pct, indexes(name)')
    .order('captured_at', { ascending: false })
    .limit(50);

  if (error) throw error;

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

  if (error) throw error;

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

export async function getMovers(minDelta = 3): Promise<Mover[]> {
  // Get the two most recent snapshot dates
  const { data: dates, error: datesError } = await supabase
    .from('snapshots_daily')
    .select('captured_at')
    .order('captured_at', { ascending: false })
    .limit(2);

  if (datesError || !dates || dates.length < 2) return [];

  const [today, yesterday] = [dates[0].captured_at as string, dates[1].captured_at as string];

  const [{ data: todayRows }, { data: yesterdayRows }] = await Promise.all([
    supabase.from('snapshots_daily').select('company_id, total_open, companies(name)').eq('captured_at', today),
    supabase.from('snapshots_daily').select('company_id, total_open').eq('captured_at', yesterday),
  ]);

  const prevMap = new Map<string, number>();
  for (const row of yesterdayRows ?? []) {
    prevMap.set(row.company_id as string, row.total_open as number);
  }

  const movers: Mover[] = [];
  for (const row of todayRows ?? []) {
    const prev = prevMap.get(row.company_id as string) ?? 0;
    const delta = (row.total_open as number) - prev;
    if (Math.abs(delta) >= minDelta) {
      movers.push({
        company_id: row.company_id as string,
        name: (row.companies as { name: string } | null)?.name ?? '—',
        total_open: row.total_open as number,
        delta,
      });
    }
  }

  return movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export async function getGainersLosers(topN = 5): Promise<GainersLosers> {
  // Get today + a date from ~7 days ago (use the oldest of the last 8 snapshots)
  const { data: dates, error: datesError } = await supabase
    .from('snapshots_daily')
    .select('captured_at')
    .order('captured_at', { ascending: false })
    .limit(8);

  if (datesError || !dates || dates.length < 2) return { gainers: [], losers: [], hasData: false };

  const today = dates[0].captured_at as string;
  const baseline = dates[dates.length - 1].captured_at as string;
  const hasFullWeek = dates.length >= 7;

  const [{ data: todayRows }, { data: baselineRows }] = await Promise.all([
    supabase.from('snapshots_daily').select('company_id, total_open, companies(name)').eq('captured_at', today),
    supabase.from('snapshots_daily').select('company_id, total_open').eq('captured_at', baseline),
  ]);

  const prevMap = new Map<string, number>();
  for (const row of baselineRows ?? []) {
    prevMap.set(row.company_id as string, row.total_open as number);
  }

  const movers: Mover[] = [];
  for (const row of todayRows ?? []) {
    const prev = prevMap.get(row.company_id as string) ?? 0;
    const delta = (row.total_open as number) - prev;
    if (delta === 0) continue;
    movers.push({
      company_id: row.company_id as string,
      name: (row.companies as { name: string } | null)?.name ?? '—',
      total_open: row.total_open as number,
      delta,
    });
  }

  movers.sort((a, b) => b.delta - a.delta);
  return {
    gainers: movers.slice(0, topN),
    losers: movers.slice(-topN).reverse(),
    hasData: hasFullWeek,
  };
}

export async function getCategoryMovers(): Promise<CategoryMover[]> {
  const { data: dates, error: datesError } = await supabase
    .from('snapshots_daily')
    .select('captured_at')
    .order('captured_at', { ascending: false })
    .limit(8);

  if (datesError || !dates || dates.length < 2) return [];

  const today = dates[0].captured_at as string;
  const baseline = dates[dates.length - 1].captured_at as string;

  const [{ data: todayRows }, { data: baselineRows }] = await Promise.all([
    supabase.from('snapshots_daily').select('by_category').eq('captured_at', today),
    supabase.from('snapshots_daily').select('by_category').eq('captured_at', baseline),
  ]);

  function sumCategories(rows: Array<{ by_category: unknown }>): Record<string, number> {
    const totals: Record<string, number> = {};
    for (const row of rows) {
      for (const [cat, count] of Object.entries(row.by_category as Record<string, number>)) {
        if (cat === 'Other') continue;
        totals[cat] = (totals[cat] ?? 0) + count;
      }
    }
    return totals;
  }

  const todayTotals = sumCategories(todayRows ?? []);
  const baselineTotals = sumCategories(baselineRows ?? []);

  return Object.entries(todayTotals)
    .map(([category, total]) => ({
      category,
      total,
      delta: total - (baselineTotals[category] ?? 0),
    }))
    .filter(c => c.delta !== 0)
    .sort((a, b) => b.delta - a.delta);
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

  if (error) throw error;

  return (data ?? []).map(row => ({
    company_id: row.company_id as string,
    name: (row.companies as { name: string } | null)?.name ?? '—',
    total_open: row.total_open as number,
    by_category: row.by_category as Record<string, number>,
  }));
}
