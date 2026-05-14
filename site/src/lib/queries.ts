import { supabase } from './supabase';
import { slugify } from './slug';
import { bestCareersUrl } from './careers';
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
// are display-only overrides for chips & headers. Composite maps to All tech
// because some companies still carry the legacy 'Composite' tag in their
// indexes[] array even though the index itself was dropped from the toggle.
export const INDEX_DISPLAY_NAMES: Record<string, string> = {
  'Total':          'All tech',
  'Composite':      'All tech',
  'AI 50':          'AI-first',
  'Early but Hot':  'Hot startups',
  'Public Tech':    'Public',
  'India-HQ':       'India',
};

// Noun phrase used in the hero label after "Open tech roles across X ___".
// Rendered as a pill — only this part changes per index.
export const INDEX_NOUN_PHRASES: Record<string, string> = {
  'Total':          'companies',
  'AI 50':          'AI-first companies',
  'Early but Hot':  'hot startups',
  'Public Tech':    'public companies',
  'India-HQ':       'India-headquartered companies',
};

// Punchy one-liners shown under each chip on hover and below the active one.
// Keys must match the index names in the `indexes` table.
export const INDEX_DESCRIPTIONS: Record<string, string> = {
  'Total':          'Every company we track, rolled up into one number.',
  'AI 50':          'The fifty labs and startups pushing AI from papers to products.',
  'Early but Hot':  'Hyper-growth, pre-IPO.',
  'Public Tech':    'Mature, publicly-traded software companies.',
  'India-HQ':       'Companies headquartered in India.',
};

// 'Composite' deliberately omitted — it duplicates the "All tech" total.
export const INDEX_ORDER = ['AI 50', 'Early but Hot', 'Public Tech', 'India-HQ'];

// P(doom): how doomed are we? Anchored to the 30-day slope so the value
// always moves with the data:
//   P(doom) = clamp(0, 1, 0.5 - Δ30d / 30)
// → +15% / 30 days → 0.00 (no doom, growth)
// → flat                  → 0.50 (neutral)
// → -15% / 30 days → 1.00 (maximum doom)
// Fallback when <30 days of history exist: peak-distance.
function pDoom(points: TimeSeriesPoint[]): number {
  if (points.length === 0) return 0;
  const latest = points[points.length - 1].total;

  // Need at least ~2 weeks of data for a meaningful slope.
  if (points.length >= 14) {
    const lookback = Math.min(30, points.length - 1);
    const baseline = points[points.length - 1 - lookback].total;
    if (baseline > 0) {
      const deltaPct = ((latest - baseline) / baseline) * 100; // % change over lookback days
      return Math.max(0, Math.min(1, 0.5 - deltaPct / 30));
    }
  }

  // Fallback: distance from recent peak.
  let peak = 0;
  for (const p of points) if (p.total > peak) peak = p.total;
  if (peak <= 0) return 0;
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

// 7-day movers. For each company, compares today's open-role count to the
// snapshot ~7 days ago and returns only those with non-zero movement. If
// fewer than 2 days of snapshots exist (so no comparison is possible), we
// return an empty list — the ticker tape will hide itself rather than show
// a row of flat tickers.
export async function getMovers(limit = 60, lookbackDays = 7): Promise<Mover[]> {
  // Pull the entire snapshot window we need in two queries: latest day's
  // totals (with company names) and the prior window of totals.
  const date = await getLatestSnapshotDate();
  if (!date) return [];

  const lookbackDate = new Date(new Date(date).getTime() - lookbackDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [{ data: latestRows }, { data: priorRows }] = await Promise.all([
    supabase.from('snapshots_daily')
      .select('company_id, total_open, companies(name)')
      .eq('captured_at', date)
      .range(0, 999),
    // Take the snapshot closest to (but not after) lookbackDate. Most days
    // have a snapshot; the .gte().order() pattern picks the nearest later one.
    supabase.from('snapshots_daily')
      .select('company_id, total_open, captured_at')
      .gte('captured_at', lookbackDate)
      .lte('captured_at', date)
      .order('captured_at', { ascending: true })
      .range(0, 49999),
  ]);

  // For each company, find the earliest snapshot in the lookback window.
  // That's our baseline. If a company has no snapshot in the window, skip it.
  const baselineByCompany = new Map<string, number>();
  for (const row of priorRows ?? []) {
    const id = row.company_id as string;
    if (!baselineByCompany.has(id)) {
      baselineByCompany.set(id, row.total_open as number);
    }
  }

  const movers: Mover[] = [];
  for (const row of latestRows ?? []) {
    const id = row.company_id as string;
    const baseline = baselineByCompany.get(id);
    if (baseline === undefined) continue;            // no comparison point
    const delta = (row.total_open as number) - baseline;
    if (delta === 0) continue;                       // movers-only
    movers.push({
      company_id: id,
      name: (row.companies as unknown as { name: string } | null)?.name ?? '—',
      total_open: row.total_open as number,
      delta,
    });
  }

  return movers
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

export async function getTopCompanies(limit = 20, trendDays = 30): Promise<CompanySnapshot[]> {
  const date = await getLatestSnapshotDate();
  if (!date) return [];

  // 1. Top N companies at the latest date
  const { data: latest, error } = await supabase
    .from('snapshots_daily')
    .select('company_id, total_open, by_category, companies(name, careers_url, ats, ats_handle)')
    .eq('captured_at', date)
    .order('total_open', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows = latest ?? [];
  const ids = rows.map(r => r.company_id as string);
  if (ids.length === 0) return [];

  // 2. Fetch their trend window in one shot
  const since = new Date(Date.now() - trendDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: trendRows, error: trendErr } = await supabase
    .from('snapshots_daily')
    .select('company_id, captured_at, total_open')
    .in('company_id', ids)
    .gte('captured_at', since)
    .order('captured_at', { ascending: true })
    .range(0, 49999);
  if (trendErr) throw trendErr;

  const trendByCompany = new Map<string, TimeSeriesPoint[]>();
  for (const row of trendRows ?? []) {
    const id = row.company_id as string;
    const arr = trendByCompany.get(id) ?? [];
    arr.push({ date: row.captured_at as string, total: Number(row.total_open) || 0 });
    trendByCompany.set(id, arr);
  }

  return rows.map(row => {
    const company = row.companies as unknown as {
      name: string;
      careers_url: string | null;
      ats: string | null;
      ats_handle: string | null;
    } | null;
    const companyId = row.company_id as string;
    const name = company?.name ?? '—';
    return {
      company_id: companyId,
      name,
      careers_url: bestCareersUrl({
        careersUrl: company?.careers_url ?? null,
        ats: company?.ats ?? null,
        atsHandle: company?.ats_handle ?? null,
        name,
      }),
      total_open: row.total_open as number,
      by_category: row.by_category as Record<string, number>,
      trend: trendByCompany.get(companyId) ?? [],
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
  ats: string | null;
  ats_handle: string | null;
  indexes: string[] | null;
}

// One trip: pull every snapshot in the window + each company's index memberships,
// then aggregate in JS. Cheap because we have ~80 companies × ~90 days = 7.2k rows.
export async function getAllIndexSeries(days = 365): Promise<IndexSeries[]> {
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
        .select('id, name, careers_url, ats, ats_handle, indexes')
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
        name: member.name,
        careers_url: bestCareersUrl({
          careersUrl: member.careers_url,
          ats: member.ats,
          atsHandle: member.ats_handle,
          name: member.name,
        }),
        total,
      });
    }

    for (const idx of member.indexes ?? []) {
      ensureIndex(idx);
      const dates = byIndexDate.get(idx)!;
      dates.set(row.captured_at, (dates.get(row.captured_at) ?? 0) + total);
      if (row.captured_at === latestDate) {
        byIndexCompanyLatest.get(idx)!.set(member.id, {
          name: member.name,
        careers_url: bestCareersUrl({
          careersUrl: member.careers_url,
          ats: member.ats,
          atsHandle: member.ats_handle,
          name: member.name,
        }),
        total,
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
    const noun_phrase = INDEX_NOUN_PHRASES[name] ?? 'companies';
    const p_doom = pDoom(points);

    series.push({
      name, display_name, noun_phrase, description, companies, points, latest, delta_30d_pct, p_doom,
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
    .select('id, name, careers_url, ats, ats_handle, region, last_funding_stage, employee_count, indexes')
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

  const name = match.name as string;
  return {
    id: match.id as string,
    name,
    slug: slugify(name),
    careers_url: bestCareersUrl({
      careersUrl: (match.careers_url as string | null) ?? null,
      ats: (match.ats as string | null) ?? null,
      atsHandle: (match.ats_handle as string | null) ?? null,
      name,
    }),
    region: (match.region as string | null) ?? null,
    last_funding_stage: (match.last_funding_stage as string | null) ?? null,
    employee_count: (match.employee_count as number | null) ?? null,
    total_open,
    by_category,
    by_seniority,
    indexes: (match.indexes as string[] | null) ?? [],
  };
}

// Time series for a single role category, summed daily across all companies.
// Used by /role/[slug] to render a 7D/1M/YTD trend chart.
export async function getRoleTimeSeries(category: string, days = 365): Promise<TimeSeriesPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from('snapshots_daily')
    .select('captured_at, by_category')
    .gte('captured_at', since)
    .order('captured_at', { ascending: true })
    .range(0, 49999);
  if (error) throw error;

  const byDate = new Map<string, number>();
  for (const row of data ?? []) {
    const byCat = (row.by_category as Record<string, number>) ?? {};
    const count = byCat[category] ?? 0;
    if (!count) continue;
    const d = row.captured_at as string;
    byDate.set(d, (byDate.get(d) ?? 0) + count);
  }

  return Array.from(byDate.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Time series for a single company's open-role count.
export async function getCompanyTimeSeries(companyId: string, days = 365): Promise<TimeSeriesPoint[]> {
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

// Aggregate by_category across all companies. Returns every category with
// its current total, a preview of the top 5 companies hiring, and a 7-day
// trend (daily sum across companies) for the role's sparkline.
export async function getTopRoles(trendDays = 7): Promise<RoleCategorySummary[]> {
  const date = await getLatestSnapshotDate();
  if (!date) return [];

  // Pull two windows in parallel: today's snapshot (with company join for the
  // top-companies preview) and the trend window (no join needed — much
  // smaller payload).
  const since = new Date(new Date(date).getTime() - trendDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [{ data: today, error: todayErr }, { data: window, error: windowErr }] = await Promise.all([
    supabase
      .from('snapshots_daily')
      .select('by_category, companies(name, careers_url, ats, ats_handle)')
      .eq('captured_at', date)
      .range(0, 999),
    supabase
      .from('snapshots_daily')
      .select('captured_at, by_category')
      .gte('captured_at', since)
      .lte('captured_at', date)
      .range(0, 49999),
  ]);
  if (todayErr) throw todayErr;
  if (windowErr) throw windowErr;

  // ── Latest day: totals + top companies per category ──
  const totals = new Map<string, number>();
  const perCompany = new Map<
    string,
    { name: string; careers_url: string | null; count: number }[]
  >();

  for (const row of today ?? []) {
    const company = row.companies as unknown as {
      name: string;
      careers_url: string | null;
      ats: string | null;
      ats_handle: string | null;
    } | null;
    if (!company) continue;
    const careersUrl = bestCareersUrl({
      careersUrl: company.careers_url,
      ats: company.ats,
      atsHandle: company.ats_handle,
      name: company.name,
    });
    const byCat = (row.by_category as Record<string, number>) ?? {};
    for (const [cat, count] of Object.entries(byCat)) {
      if (cat === 'Other') continue;
      if (!count) continue;
      totals.set(cat, (totals.get(cat) ?? 0) + count);
      const list = perCompany.get(cat) ?? [];
      list.push({ name: company.name, careers_url: careersUrl, count });
      perCompany.set(cat, list);
    }
  }

  // ── Trend window: daily total per category, summed across companies ──
  // category -> (date -> total)
  const trendBy = new Map<string, Map<string, number>>();
  for (const row of window ?? []) {
    const d = row.captured_at as string;
    const byCat = (row.by_category as Record<string, number>) ?? {};
    for (const [cat, count] of Object.entries(byCat)) {
      if (cat === 'Other') continue;
      if (!count) continue;
      const dates = trendBy.get(cat) ?? new Map<string, number>();
      dates.set(d, (dates.get(d) ?? 0) + count);
      trendBy.set(cat, dates);
    }
  }

  return Array.from(totals.entries())
    .map(([category, total]) => {
      const companies = (perCompany.get(category) ?? []).sort((a, b) => b.count - a.count);
      const trendDates = trendBy.get(category) ?? new Map<string, number>();
      const trend: TimeSeriesPoint[] = Array.from(trendDates.entries())
        .map(([d, t]) => ({ date: d, total: t }))
        .sort((a, b) => a.date.localeCompare(b.date));
      return {
        category,
        slug: slugify(category),
        total,
        company_count: companies.length,
        top_companies: companies.slice(0, 5),
        trend,
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
    .select('company_id, by_category, companies(name, careers_url, ats, ats_handle)')
    .eq('captured_at', date)
    .range(0, 999);
  if (error) throw error;

  const companies = (data ?? [])
    .map(row => {
      const company = row.companies as unknown as {
        name: string;
        careers_url: string | null;
        ats: string | null;
        ats_handle: string | null;
      } | null;
      const byCat = (row.by_category as Record<string, number>) ?? {};
      const count = byCat[match.category] ?? 0;
      if (!company || !count) return null;
      return {
        id: row.company_id as string,
        name: company.name,
        careers_url: bestCareersUrl({
          careersUrl: company.careers_url,
          ats: company.ats,
          atsHandle: company.ats_handle,
          name: company.name,
        }),
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
