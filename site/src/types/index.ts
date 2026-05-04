export interface IndexValue {
  index_id: string;
  name: string;
  value: number;
  change_pct: number | null;
  captured_at: string;
  sparkline: number[];
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CompanySnapshot {
  company_id: string;
  name: string;
  total_open: number;
  by_category: Record<string, number>;
  indexes: string[];
  ats: string;
  ats_handle: string;
}
