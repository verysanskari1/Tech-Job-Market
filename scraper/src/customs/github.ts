import type { FetchedRole } from '../types.js';

// GitHub uses Jibe Apply (jibeapply.com) under github.careers. The site
// front-end queries this JSON endpoint with a fixed `domain` param that
// identifies the GitHub tenant.
//
// NOTE: Field names below are best guesses based on common Jibe responses.
// Verify against a live response and adjust if needed.
const PAGE_SIZE = 10;
const MAX_PAGES = 200;
const BASE = 'https://www.github.careers/api/jobs';
const DOMAIN = 'githubinc.jibeapply.com';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

export async function fetchGitHub(): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${BASE}?page=${page}&sortBy=posted_date&descending=true&internal=false&domain=${DOMAIN}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'tech-job-market-scraper/1.0',
      },
    });
    if (!res.ok) throw new Error(`GitHub: HTTP ${res.status} on page ${page}`);

    const data = await res.json() as {
      jobs?: Job[];
      totalCount?: number;
      pageCount?: number;
    };
    const jobs = data.jobs ?? [];
    if (jobs.length === 0) break;

    for (const j of jobs) {
      roles.push({
        ats_role_id:  String(j.id ?? j.jobId ?? j.requisitionId ?? ''),
        title_raw:    String(j.title ?? j.jobTitle ?? ''),
        department_raw: j.department ?? j.category ?? j.team ?? null,
        location:     j.location ?? j.locationName ??
                       (Array.isArray(j.locations)
                          ? j.locations.map((l: { name?: string } | string) =>
                              typeof l === 'string' ? l : l.name).filter(Boolean).join(' / ')
                          : null),
        posted_at:    j.postingDate ?? j.postedDate ?? j.datePosted ?? null,
      });
    }

    if (jobs.length < PAGE_SIZE) break;
  }

  return roles;
}
