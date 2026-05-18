export interface Company {
  id: string;
  name: string;
}

export type NewsCategory = 'layoff' | 'funding' | 'product' | 'other';

// Raw item from a source, before classification.
export interface RawNewsItem {
  source: string;       // 'TechCrunch' | 'Layoffs.fyi'
  title: string;
  url: string;
  published_at: string; // ISO
  company_hint: string; // free-text company guess from the source
}

// Final row written to company_news.
export interface NewsRow {
  company_id: string | null;
  source: string;
  category: NewsCategory;
  title: string;
  url: string;
  published_at: string;
}
