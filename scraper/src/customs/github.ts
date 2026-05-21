import type { FetchedRole } from '../types.js';
import { fetchWithRetry } from './_util.js';

// GitHub uses Jibe Apply (jibeapply.com) under github.careers. The site
// front-end queries this JSON endpoint with a fixed `domain` param that
// identifies the GitHub tenant.
//
// Pagination: ?page=N (1-indexed), 10 per page. Use `sortBy=relevance`
// — `posted_date` is not a valid sort key and Jibe silently returns the
// same first page repeatedly when given an invalid sort.
//
// On first call we log the keys of the first job so we can see what
// field names Jibe actually uses and fix the parser if any are wrong.
const PAGE_SIZE = 10;
const MAX_PAGES = 200;
const BASE = 'https://www.github.careers/api/jobs';
const DOMAIN = 'githubinc.jibeapply.com';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

function firstNonEmpty(...values: unknown[]): string {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return '';
}

export async function fetchGitHub(proxyUrl?: string): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];
  const seenIds = new Set<string>();
  let loggedSample = false;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${BASE}?page=${page}&sortBy=relevance&descending=false&internal=false&domain=${DOMAIN}`;
    const res = await fetchWithRetry(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }, 3, proxyUrl);
    if (!res.ok) throw new Error(`GitHub: HTTP ${res.status} on page ${page}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json() as any;
    const jobs: Job[] = data.jobs ?? data.results ?? data.items ?? [];

    if (!loggedSample) {
      loggedSample = true;
      // Print enough about the response to diagnose any future shape
      // change without needing browser-side investigation.
      console.log(`[GitHub debug] top-level keys: ${Object.keys(data ?? {}).join(',')}`);
      console.log(`[GitHub debug] totalCount=${data.totalCount} count=${data.count} jobs.length=${jobs.length}`);
      if (jobs[0]) {
        console.log(`[GitHub debug] first job keys: ${Object.keys(jobs[0]).join(',')}`);
        console.log(`[GitHub debug] first job (truncated): ${JSON.stringify(jobs[0]).slice(0, 800)}`);
      }
    }
    if (jobs.length === 0) break;

    let newOnThisPage = 0;
    for (const j of jobs) {
      // Try every plausible Jibe field name. If all are empty, we'll
      // see it in the debug log and add the real name in the next round.
      const id = firstNonEmpty(
        j.id, j.jobId, j.requisitionId, j.reqId, j.req_id,
        j.displayJobId, j.posting_id, j.postingId, j.jobReqId,
        j.externalId, j.uuid,
      );
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);
      newOnThisPage++;

      const title = firstNonEmpty(j.title, j.jobTitle, j.displayJobTitle, j.name, j.postingTitle);
      const department = firstNonEmpty(
        j.department, j.departmentName, j.category, j.categoryName, j.team, j.function,
      );
      const location = firstNonEmpty(
        j.location, j.locationName, j.primaryLocation, j.city,
        Array.isArray(j.locations)
          ? j.locations.map((l: { name?: string } | string) =>
              typeof l === 'string' ? l : l.name).filter(Boolean).join(' / ')
          : '',
      );
      const postedAt = firstNonEmpty(
        j.postingDate, j.postedDate, j.datePosted, j.publishedDate, j.created, j.createdDate,
      );

      roles.push({
        ats_role_id:  id,
        title_raw:    title,
        department_raw: department || null,
        location:     location || null,
        posted_at:    postedAt || null,
      });
    }

    if (newOnThisPage === 0) break;
    if (jobs.length < PAGE_SIZE) break;
  }

  return roles;
}
