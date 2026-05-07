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
  total_open: number;
  by_category: Record<string, number>;
}

export interface Mover {
  company_id: string;
  name: string;
  total_open: number;
  delta: number;
}

export interface GainersLosers {
  gainers: Mover[];
  losers: Mover[];
  hasData: boolean;
}

export interface CategoryMover {
  category: string;
  delta: number;
  total: number;
}
