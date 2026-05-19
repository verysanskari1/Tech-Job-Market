import type { FetchedRole } from '../types.js';

// Meta exposes a public job search endpoint that returns JSON. The
// metacareers.com SPA hits this on every search/filter. Pagination is
// via `page` (1-indexed). Result count per page is large (~50).
//
// NOTE: This endpoint is best-effort — Meta sometimes routes through
// GraphQL with rotating doc_ids. If this 404s, switch to GraphQL by
// inspecting metacareers.com network tab.
const ENDPOINT = 'https://www.metacareers.com/v3/api/jobs/';
const PAGE_SIZE = 50;
const MAX_PAGES = 200;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

export async function fetchMeta(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${ENDPOINT}?page=${page}&results_per_page=${PAGE_SIZE}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; tech-job-market-scraper/1.0)',
      },
    });
    if (!res.ok) throw new Error(`Meta: HTTP ${res.status} on page ${page}`);

    const data = await res.json() as {
      jobs?: Job[];
      results?: Job[];
      data?: { jobs?: Job[] };
      total?: number;
    };
    const jobs = data.jobs ?? data.results ?? data.data?.jobs ?? [];
    if (jobs.length === 0) break;

    for (const j of jobs) {
      roles.push({
        ats_role_id:  String(j.id ?? j.job_id ?? j.reqId ?? ''),
        title_raw:    String(j.title ?? j.name ?? ''),
        department_raw: j.team?.name ?? j.team ?? j.division ?? null,
        location:     Array.isArray(j.locations)
                        ? j.locations.map((l: { name?: string } | string) =>
                            typeof l === 'string' ? l : l.name).filter(Boolean).join(' / ')
                        : (j.location ?? null),
        posted_at:    j.posted_date ?? j.createdAt ?? null,
      });
    }

    if (jobs.length < PAGE_SIZE) break;
  }

  return roles;
}
