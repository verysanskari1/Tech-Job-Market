import type { FetchedRole } from '../types.js';

// Apple's careers site posts to this JSON endpoint internally. Pagination
// is 1-indexed via `page`. Set `sort: 'newest'` and `locale: 'en-us'` to
// match what the site sends.
//
// NOTE: Apple sometimes rate-limits. The scraper main.ts can route this
// through the residential proxy if needed (see Ashby for the pattern).
const PAGE_SIZE = 20;
const MAX_PAGES = 300;
const ENDPOINT = 'https://jobs.apple.com/api/role/search';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

export async function fetchApple(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; tech-job-market-scraper/1.0)',
      },
      body: JSON.stringify({
        query: '',
        filters: {},
        page,
        locale: 'en-us',
        sort: 'newest',
      }),
    });
    if (!res.ok) throw new Error(`Apple: HTTP ${res.status} on page ${page}`);

    const data = await res.json() as {
      searchResults?: Job[];
      totalRecords?: number;
    };
    const jobs = data.searchResults ?? [];
    if (jobs.length === 0) break;

    for (const j of jobs) {
      roles.push({
        ats_role_id:  String(j.positionId ?? j.id ?? j.req_id ?? ''),
        title_raw:    String(j.postingTitle ?? j.title ?? ''),
        department_raw: j.team?.teamName ?? j.team ?? null,
        location:     Array.isArray(j.locations)
                        ? j.locations.map((l: { name?: string }) => l.name).filter(Boolean).join(' / ')
                        : null,
        posted_at:    j.postingPostDate ?? j.postedDate ?? null,
      });
    }

    if (jobs.length < PAGE_SIZE) break;
  }

  return roles;
}
