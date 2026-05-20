import type { FetchedRole } from '../types.js';
import { fetchWithRetry } from './_util.js';

// Microsoft's careers site queries this public JSON endpoint internally.
// 20 jobs per page, paginated via `pg`. Returns ~1500+ jobs total.
//
// Verified URL pattern (live as of 2025): the page at careers.microsoft.com
// hits this for every search; same payload shape we read here.
const PAGE_SIZE = 20;
const MAX_PAGES = 200;
const ENDPOINT = 'https://gcsservices.careers.microsoft.com/search/api/v1/search';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

export async function fetchMicrosoft(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${ENDPOINT}?q=&l=en_us&pg=${page}&pgSz=${PAGE_SIZE}&o=Recent&flt=true`;
    const res = await fetchWithRetry(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'tech-job-market-scraper/1.0',
      },
    });
    if (!res.ok) throw new Error(`Microsoft: HTTP ${res.status} on page ${page}`);

    const data = await res.json() as {
      operationResult?: { result?: { jobs?: Job[]; totalJobs?: number } };
    };
    const jobs = data.operationResult?.result?.jobs ?? [];
    if (jobs.length === 0) break;

    for (const j of jobs) {
      roles.push({
        ats_role_id:  String(j.jobId ?? j.id ?? ''),
        title_raw:    String(j.title ?? ''),
        department_raw: j.category ?? null,
        location:     Array.isArray(j.properties?.locations)
                        ? j.properties.locations.join(' / ')
                        : j.properties?.primaryLocation ?? null,
        posted_at:    j.postingDate ?? j.postedDate ?? null,
      });
    }

    if (jobs.length < PAGE_SIZE) break;
  }

  return roles;
}
