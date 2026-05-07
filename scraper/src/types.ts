export interface Company {
  id: string;
  name: string;
  ats: 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'custom';
  ats_handle: string;
}

export interface FetchedRole {
  ats_role_id: string;
  title_raw: string;
  department_raw: string | null;
  location: string | null;
  posted_at: string | null;
}

export interface RawRoleRow {
  company_id: string;
  ats_role_id: string;
  title_raw: string;
  department_raw: string | null;
  location: string | null;
  posted_at: string | null;
  captured_at: string;
  removed_at: null;
}
