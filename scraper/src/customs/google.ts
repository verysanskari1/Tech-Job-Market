import type { FetchedRole } from '../types.js';

// Google careers (careers.google.com) is a JS SPA backed by a search API.
// The endpoint takes paginated GET params. ~20 jobs per page.
//
// NOTE: Best-effort. If this 404s or returns empty, verify the actual
// endpoint via DevTools on careers.google.com (Network → Fetch/XHR).
const ENDPOINT = 'https://careers.google.com/api/v3/search/';
const PAGE_SIZE = 20;
const MAX_PAGES = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

export async function fetchGoogle(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${ENDPOINT}?distance=50&hl=en_US&jlo=en_US&q=&page=${page}&page_size=${PAGE_SIZE}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; tech-job-market-scraper/1.0)',
      },
    });
    if (!res.ok) throw new Error(`Google: HTTP ${res.status} on page ${page}`);

    const data = await res.json() as {
      jobs?: Job[];
      results?: Job[];
      count?: number;
    };
    const jobs = data.jobs ?? data.results ?? [];
    if (jobs.length === 0) break;

    for (const j of jobs) {
      roles.push({
        ats_role_id:  String(j.id ?? j.job_id ?? j.req_id ?? ''),
        title_raw:    String(j.title ?? j.summary ?? ''),
        department_raw: j.categories?.[0] ?? j.category ?? j.business_unit ?? null,
        location:     Array.isArray(j.locations)
                        ? j.locations.map((l: { display?: string; city?: string } | string) =>
                            typeof l === 'string' ? l : (l.display ?? l.city)).filter(Boolean).join(' / ')
                        : (j.location ?? null),
        posted_at:    j.publish_date ?? j.created ?? null,
      });
    }

    if (jobs.length < PAGE_SIZE) break;
  }

  return roles;
}
