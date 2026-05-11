export interface Company {
  id: string;
  name: string;
  indexes: string[] | null;
}

export interface Index {
  id: string;
  name: string;
  base_value: number;
  base_date: string;
  constituents: string[] | null;
}

export interface CategoryCounts {
  [category: string]: number;
}

export interface SeniorityCounts {
  [seniority: string]: number;
}

export interface CompanySnapshot {
  company_id: string;
  total_open: number;
  by_category: CategoryCounts;
  by_seniority: SeniorityCounts;
}
