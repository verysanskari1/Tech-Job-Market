export interface AuditSummary {
  latestDate: string;
  totalAudited: number;
  totalDisagreements: number;
  disagreementRate: number;
  avgAuditConfidence: number;
  topDisputedTitles: Array<{
    title: string;
    count: number;
    originalCategory: string;
    auditCategory: string;
  }>;
}

export interface GitHubFileInfo {
  content: string;
  sha: string;
  path: string;
}

export interface PrResult {
  url: string;
  number: number;
  branch: string;
}

export interface ScraperCompanyResult {
  company: string;
  ats: string;
  live: number | null;
  db: number;
  gap: number | null;
  gapPct: number | null;
  status: 'ok' | 'warn' | 'error' | 'skip';
  note: string;
}

export interface ScraperHealthSummary {
  ok: number;
  warnings: number;
  errors: number;
  skipped: number;
  companies: ScraperCompanyResult[];
}
