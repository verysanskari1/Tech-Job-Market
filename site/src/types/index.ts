export interface IndexValue {
  index_id: string;
  name: string;
  value: number;
  change_pct: number | null;
  captured_at: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CompanySnapshot {
  company_id: string;
  name: string;
  careers_url: string | null;
  total_open: number;
  by_category: Record<string, number>;
  trend: TimeSeriesPoint[]; // last ~30 days for the inline sparkline
}

export interface Mover {
  company_id: string;
  name: string;
  total_open: number;
  delta: number;
}

export interface TimeSeriesPoint {
  date: string;        // YYYY-MM-DD
  total: number;
}

export interface IndexConstituent {
  id: string;
  name: string;
  careers_url: string | null;
  total_open: number;
}

export interface IndexSeries {
  name: string;          // 'Total' for the all-up series, otherwise index name
  display_name: string;  // Short, human label for chips/UI (e.g. 'AI' instead of 'AI 50')
  description: string;
  companies: IndexConstituent[];
  points: TimeSeriesPoint[];
  latest: number;
  delta_30d_pct: number | null;
  p_doom: number;        // 0..1 — 1 - latest / max(points within window)
}

export interface RoleCategorySummary {
  category: string;
  slug: string;
  total: number;
  company_count: number;
  top_companies: { name: string; careers_url: string | null; count: number }[];
}

export interface RoleCategoryDetail {
  category: string;
  slug: string;
  total: number;
  companies: { id: string; name: string; careers_url: string | null; count: number }[];
}

export interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  careers_url: string | null;
  region: string | null;
  last_funding_stage: string | null;
  employee_count: number | null;
  total_open: number;
  by_category: Record<string, number>;
  by_seniority: Record<string, number>;
  indexes: string[];
}

