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
