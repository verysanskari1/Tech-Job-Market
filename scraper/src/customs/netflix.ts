import type { FetchedRole } from '../types.js';

// Netflix careers is on Eightfold (identifiable by the x-ef-* response
// headers and the /api/apply/v2/ path shape). The standard Eightfold
// listings endpoint paginates via `start` and `num`.
//
// Job object fields verified from one /insights response:
//   id, name, department, location, locations[], t_create, t_update,
//   ats_job_id, display_job_id, business_unit
const PAGE_SIZE = 10;
const MAX_PAGES = 300;
const BASE = 'https://explore.jobs.netflix.net/api/apply/v2/jobs';
const DOMAIN = 'netflix.com';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

function toIso(epochSec: unknown): string | null {
  if (typeof epochSec !== 'number' || !isFinite(epochSec)) return null;
  return new Date(epochSec * 1000).toISOString();
}

export async function fetchNetflix(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${BASE}?domain=${DOMAIN}&start=${page * PAGE_SIZE}&num=${PAGE_SIZE}&sort_by=new`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'tech-job-market-scraper/1.0',
      },
    });
    if (!res.ok) throw new Error(`Netflix: HTTP ${res.status} on page ${page}`);

    const data = await res.json() as { positions?: Job[]; count?: number };
    const jobs = data.positions ?? [];
    if (jobs.length === 0) break;

    for (const j of jobs) {
      roles.push({
        ats_role_id:  String(j.display_job_id ?? j.ats_job_id ?? j.id ?? ''),
        title_raw:    String(j.name ?? j.posting_name ?? ''),
        department_raw: j.department ?? j.business_unit ?? null,
        location:     Array.isArray(j.locations) && j.locations.length > 0
                        ? j.locations.join(' / ')
                        : j.location ?? null,
        posted_at:    toIso(j.t_create),
      });
    }

    if (jobs.length < PAGE_SIZE) break;
  }

  return roles;
}
