// Union of both classifier and auditor taxonomies so "return same category" responses are accepted
export type AuditCategory =
  | 'AI Engineer'
  | 'ML/Research'
  | 'Security Engineer'
  | 'Frontend Engineer'
  | 'Backend Engineer'
  | 'Infrastructure Engineer'
  | 'Data Engineer'
  | 'Mobile Engineer'
  | 'Hardware Engineer'
  | 'Forward Deployed Engineer'
  | 'GTM Engineer'
  | 'QA/Test Engineer'
  | 'MTS'
  | 'Software Engineer'
  | 'New Grad/Junior'
  | 'Other';

export interface ClassifiedRoleForAudit {
  raw_role_id: string;
  original_category: string;
  original_confidence: number;
  title: string;
  department: string | null;
}

export interface AuditResult {
  category: AuditCategory;
  confidence: number;
  reasoning: string;
}

export interface AuditRow {
  role_id: string;
  original_category: string;
  original_confidence: number;
  audit_category: string;
  audit_confidence: number;
  agreed: boolean;
  title: string;
  department: string | null;
  audited_at: string;
}
