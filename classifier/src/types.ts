export type Category =
  | 'AI Engineer'
  | 'ML/Research'
  | 'Forward Deployed Engineer'
  | 'GTM Engineer'
  | 'Software Engineer'
  | 'New Grad/Junior'
  | 'Other';

export type Seniority = 'Junior' | 'Mid' | 'Senior' | 'Staff+';

export interface Classification {
  category: Category;
  seniority: Seniority;
  confidence: number;
}

export interface UnclassifiedRole {
  id: string;
  title_raw: string;
  department_raw: string | null;
}

export interface ClassifiedRoleRow {
  raw_role_id: string;
  category: Category;
  seniority: Seniority;
  confidence: number;
  model_version: string;
  cached: boolean;
}

export type LowConfidenceRecord = {
  raw_role_id: string;
  title_raw: string;
  department_raw: string | null;
  category: Category;
  seniority: Seniority;
  confidence: number;
};
