import { supabase } from './supabase';
import { slugify } from './slug';
import type {
  CategoryCount,
  CompanyDetail,
  CompanySnapshot,
  IndexConstituent,
  IndexSeries,
  IndexValue,
  Mover,
  RoleCategoryDetail,
  RoleCategorySummary,
  TimeSeriesPoint,
} from '@/types';

// Short UI labels. DB keeps the verbose names ("AI 50", "India-HQ") — these
// are display-only overrides for chips & headers.
export const INDEX_DISPLAY_NAMES: Record<string, string> = {
  'Total':          'All tech',
  'AI 50':          'AI',
  'Early but Hot':  'Hot startups',
  'Public Tech':    'Public',
  'India-HQ':       'India',
};

// Punchy one-liners shown under each chip on hover and below the active one.
// Keys must match the index names in the `indexes` table.
export const INDEX_DESCRIPTIONS: Record<string, string> = {
  'Total':          'Every company we track, rolled up into one number.',
  'AI 50':          'The fifty labs and startups pushing AI from papers to products.',
  'Early but Hot':  'Hyper-growth startups still small enough to feel it.',
  'Public Tech':    'Mature, publicly-traded software companies.',
  'India-HQ':       'Companies headquartered in India.',
};

// 'Composite' deliberately omitted — it duplicates the "All tech" total.
export const INDEX_ORDER = ['AI 50', 'Early but Hot', 'Public Tech', 'India-HQ'];

// P(doom): how far the current number sits below the recent peak.
// 0 = at the peak (no doom), 1 = at zero (fully doomed). Always in [0, 1].
function pDoom(points: TimeSeriesPoint[]): number {
  if (points.length === 0) return 0;
  let peak = 0;
  for (const p of points) if (p.total > peak) peak = p.total;
  if (peak <= 0) return 0;
  const latest = points[points.length - 1].total;
  return Math.max(0, Math.min(1, 1 - latest / peak));
}

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
      name: (row.indexes as unknown as { name: string } | null)?.name ?? row.index_id,
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
        name: (row.companies as unknown as { name: string } | null)?.name ?? '—',
        total_open: row.total_open as number,
        delta,
      });
    }
  }

  return movers.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export async function getTopCompanies(limit = 20): Promise<CompanySnapshot[]> {
  const date = await getLatestSnapshotDate();
  if (!date) return [];

  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('company_id, total_open, by_category, companies(name, careers_url)')
    .eq('captured_at', date)
    .order('total_open', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map(row => {
    const company = row.companies as unknown as { name: string; careers_url: string | null } | null;
    return {
      company_id: row.company_id as string,
      name: company?.name ?? '—',
      careers_url: company?.careers_url ?? null,
      total_open: row.total_open as number,
      by_category: row.by_category as Record<string, number>,
    };
  });
}

// ----------------------------------------------------------------------------
// Doomberg hero: total roles + per-index time-series
// ----------------------------------------------------------------------------

interface CompanyMembership {
  id: string;
  name: string;
  careers_url: string | null;
  indexes: string[] | null;
}

// One trip: pull every snapshot in the window + each company's index memberships,
// then aggregate in JS. Cheap because we have ~80 companies × ~90 days = 7.2k rows.
export async function getAllIndexSeries(days = 90): Promise<IndexSeries[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [{ data: snapshots, error: snapErr }, { data: companies, error: compErr }] =
    await Promise.all([
      supabase
        .from('snapshots_daily')
        .select('captured_at, company_id, total_open')
        .gte('captured_at', since)
        .range(0, 49999),
      supabase
        .from('companies')
        .select('id, name, careers_url, indexes')
        .range(0, 999),
    ]);

  if (snapErr) throw snapErr;
  if (compErr) throw compErr;

  const memberships = new Map<string, CompanyMembership>();
  for (const c of (companies ?? []) as CompanyMembership[]) {
    memberships.set(c.id, c);
  }

  // For each (index, date) accumulate total_open, and remember which companies
  // contributed (used to power the "companies in this index" drill-in).
  const byIndexDate = new Map<string, Map<string, number>>(); // index -> (date -> total)
  const byIndexCompanyLatest = new Map<
    string,
    Map<string, { name: string; careers_url: string | null; total: number }>
  >();

  const ensureIndex = (name: string) => {
    if (!byIndexDate.has(name)) byIndexDate.set(name, new Map());
    if (!byIndexCompanyLatest.has(name)) byIndexCompanyLatest.set(name, new Map());
  };

  // Find the latest date so we know which snapshots count toward "companies in this index"
  let latestDate = '';
  for (const row of (snapshots ?? []) as Array<{ captured_at: string }>) {
    if (row.captured_at > latestDate) latestDate = row.captured_at;
  }

  for (const row of (snapshots ?? []) as Array<{
    captured_at: string;
    company_id: string;
    total_open: number;
  }>) {
    const member = memberships.get(row.company_id);
    if (!member) continue;
    const total = Number(row.total_open) || 0;

    // "Total" series: every company
    ensureIndex('Total');
    const totalDates = byIndexDate.get('Total')!;
    totalDates.set(row.captured_at, (totalDates.get(row.captured_at) ?? 0) + total);
    if (row.captured_at === latestDate) {
      byIndexCompanyLatest.get('Total')!.set(member.id, {
        name: member.name, careers_url: member.careers_url, total,
      });
    }

    for (const idx of member.indexes ?? []) {
      ensureIndex(idx);
      const dates = byIndexDate.get(idx)!;
      dates.set(row.captured_at, (dates.get(row.captured_at) ?? 0) + total);
      if (row.captured_at === latestDate) {
        byIndexCompanyLatest.get(idx)!.set(member.id, {
          name: member.name, careers_url: member.careers_url, total,
        });
      }
    }
  }

  // Build the IndexSeries[] payload in the user-facing order, with "Total" first.
  const ordered = ['Total', ...INDEX_ORDER];
  const series: IndexSeries[] = [];

  for (const name of ordered) {
    const dates = byIndexDate.get(name);
    if (!dates || dates.size === 0) continue;

    const points: TimeSeriesPoint[] = Array.from(dates.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const latest = points[points.length - 1].total;
    const monthAgoIdx = Math.max(0, points.length - 31);
    const monthAgo = points[monthAgoIdx].total;
    const delta_30d_pct = monthAgo > 0 ? ((latest - monthAgo) / monthAgo) * 100 : null;

    const constituentEntries = Array.from(byIndexCompanyLatest.get(name)?.entries() ?? []);
    const companies: IndexConstituent[] = constituentEntries
      .map(([id, c]) => ({ id, name: c.name, careers_url: c.careers_url, total_open: c.total }))
      .sort((a, b) => b.total_open - a.total_open);

    const description = INDEX_DESCRIPTIONS[name] ?? '';
    const display_name = INDEX_DISPLAY_NAMES[name] ?? name;
    const p_doom = pDoom(points);

    series.push({
      name, display_name, description, companies, points, latest, delta_30d_pct, p_doom,
    });
  }

  return series;
}

// ----------------------------------------------------------------------------
// Company drill-in (/company/[slug])
// ----------------------------------------------------------------------------

export async function getCompanyBySlug(slug: string): Promise<CompanyDetail | null> {
  // No slug column — fetch all and match in JS. ~80 rows, trivially fast.
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, careers_url, region, last_funding_stage, employee_count, indexes')
    .range(0, 999);
  if (error) throw error;

  const match = (companies ?? []).find(c => slugify(c.name as string) === slug);
  if (!match) return null;

  const date = await getLatestSnapshotDate();
  let total_open = 0;
  let by_category: Record<string, number> = {};
  let by_seniority: Record<string, number> = {};

  if (date) {
    const { data: snap } = await supabase
      .from('snapshots_daily')
      .select('total_open, by_category, by_seniority')
      .eq('captured_at', date)
      .eq('company_id', match.id)
      .maybeSingle();
    if (snap) {
      total_open = (snap.total_open as number) ?? 0;
      by_category = (snap.by_category as Record<string, number>) ?? {};
      by_seniority = (snap.by_seniority as Record<string, number>) ?? {};
    }
  }

  return {
    id: match.id as string,
    name: match.name as string,
    slug: slugify(match.name as string),
    careers_url: (match.careers_url as string | null) ?? null,
    region: (match.region as string | null) ?? null,
    last_funding_stage: (match.last_funding_stage as string | null) ?? null,
    employee_count: (match.employee_count as number | null) ?? null,
    total_open,
    by_category,
    by_seniority,
    indexes: (match.indexes as string[] | null) ?? [],
  };
}

// 90-day time series for a single company's open-role count.
export async function getCompanyTimeSeries(companyId: string, days = 90): Promise<TimeSeriesPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('captured_at, total_open')
    .eq('company_id', companyId)
    .gte('captured_at', since)
    .order('captured_at', { ascending: true })
    .range(0, 999);
  if (error) throw error;

  return (data ?? []).map(row => ({
    date: row.captured_at as string,
    total: Number(row.total_open) || 0,
  }));
}


// ----------------------------------------------------------------------------
// Role categories — homepage "Top Roles" section + /role/[slug] page
// ----------------------------------------------------------------------------

// Aggregate the latest day's by_category jsonb across all companies. Returns
// every category with its total and a preview of the top 5 companies hiring.
export async function getTopRoles(): Promise<RoleCategorySummary[]> {
  const date = await getLatestSnapshotDate();
  if (!date) return [];

  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('by_category, companies(name, careers_url)')
    .eq('captured_at', date)
    .range(0, 999);
  if (error) throw error;

  // category -> total, and category -> per-company breakdown
  const totals = new Map<string, number>();
  const perCompany = new Map<
    string,
    { name: string; careers_url: string | null; count: number }[]
  >();

  for (const row of data ?? []) {
    const company = row.companies as unknown as { name: string; careers_url: string | null } | null;
    if (!company) continue;
    const byCat = (row.by_category as Record<string, number>) ?? {};
    for (const [cat, count] of Object.entries(byCat)) {
      if (cat === 'Other') continue;          // taxonomy bucket — skip
      if (!count) continue;
      totals.set(cat, (totals.get(cat) ?? 0) + count);
      const list = perCompany.get(cat) ?? [];
      list.push({ name: company.name, careers_url: company.careers_url, count });
      perCompany.set(cat, list);
    }
  }

  return Array.from(totals.entries())
    .map(([category, total]) => {
      const companies = (perCompany.get(category) ?? []).sort((a, b) => b.count - a.count);
      return {
        category,
        slug: slugify(category),
        total,
        company_count: companies.length,
        top_companies: companies.slice(0, 5),
      } satisfies RoleCategorySummary;
    })
    .sort((a, b) => b.total - a.total);
}

// Full list of companies hiring for a role category (powers /role/[slug]).
export async function getRoleBySlug(slug: string): Promise<RoleCategoryDetail | null> {
  const summaries = await getTopRoles();
  const match = summaries.find(s => s.slug === slug);
  if (!match) return null;

  const date = await getLatestSnapshotDate();
  if (!date) return { ...match, companies: [] };

  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('company_id, by_category, companies(name, careers_url)')
    .eq('captured_at', date)
    .range(0, 999);
  if (error) throw error;

  const companies = (data ?? [])
    .map(row => {
      const company = row.companies as unknown as { name: string; careers_url: string | null } | null;
      const byCat = (row.by_category as Record<string, number>) ?? {};
      const count = byCat[match.category] ?? 0;
      if (!company || !count) return null;
      return {
        id: row.company_id as string,
        name: company.name,
        careers_url: company.careers_url,
        count,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.count - a.count);

  return {
    category: match.category,
    slug: match.slug,
    total: match.total,
    companies,
  };
}
