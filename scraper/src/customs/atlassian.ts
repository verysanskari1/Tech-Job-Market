import type { FetchedRole } from '../types.js';

// Atlassian publishes their full job listings here as a flat JSON array.
// Each entry has id, title, locations[], category, and portalJobPost
// metadata (including updatedDate). Powered by iCIMS portals on the
// backend (portalId 242 = APAC, etc.) but the endpoint aggregates.
const ENDPOINT = 'https://www.atlassian.com/endpoint/careers/listings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

export async function fetchAtlassian(): Promise<FetchedRole[]> {
  const res = await fetch(ENDPOINT, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'tech-job-market-scraper/1.0',
    },
  });
  if (!res.ok) throw new Error(`Atlassian: HTTP ${res.status}`);

  const jobs = await res.json() as Job[];
  if (!Array.isArray(jobs)) throw new Error('Atlassian: expected array response');

  return jobs.map(j => ({
    ats_role_id:  String(j.id ?? ''),
    title_raw:    String(j.title ?? ''),
    department_raw: j.category ?? null,
    location:     Array.isArray(j.locations) && j.locations.length > 0
                    ? j.locations.join(' / ')
                    : null,
    posted_at:    j.portalJobPost?.updatedDate ?? null,
  }));
}
