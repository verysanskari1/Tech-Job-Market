import type { FetchedRole } from '../types.js';

// Meta careers is a Facebook GraphQL endpoint. The careers page hits
// `CareersJobSearchResultsDataQuery` with a persisted `doc_id` and
// returns the full job list in one response (no pagination — set
// `results_per_page: null`).
//
// The tricky part: Meta requires an `lsd` CSRF token, extracted from
// the initial page HTML.
//
// The doc_id below was captured from a live request. If Meta rotates
// it, the scraper will start failing with a "Query not found" error
// and we'll need to refresh it.
const GRAPHQL_URL = 'https://www.metacareers.com/graphql';
const PAGE_URL = 'https://www.metacareers.com/jobs/';
const DOC_ID = '29615178951461218';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

async function getLsdToken(): Promise<string> {
  // Meta embeds the CSRF token in a script tag like:  "LSD",[],{"token":"AdT..."}
  const res = await fetch(PAGE_URL, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });
  if (!res.ok) throw new Error(`Meta page: HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/"LSD",\[\],\{"token":"([^"]+)"\}/);
  if (!m) throw new Error('Meta: could not extract LSD token from page HTML');
  return m[1];
}

export async function fetchMeta(): Promise<FetchedRole[]> {
  const lsd = await getLsdToken();

  const variables = {
    search_input: {
      q: null,
      divisions: [], offices: [], roles: [], leadership_levels: [],
      saved_jobs: [], saved_searches: [], sub_teams: [], teams: [],
      is_leadership: false,
      is_remote_only: false,
      sort_by_new: false,
      results_per_page: null,
    },
  };

  const body = new URLSearchParams({
    lsd,
    fb_api_caller_class: 'RelayModern',
    fb_api_req_friendly_name: 'CareersJobSearchResultsDataQuery',
    server_timestamps: 'true',
    variables: JSON.stringify(variables),
    doc_id: DOC_ID,
  });

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-FB-LSD': lsd,
      'X-FB-Friendly-Name': 'CareersJobSearchResultsDataQuery',
      Accept: '*/*',
      Origin: 'https://www.metacareers.com',
      Referer: 'https://www.metacareers.com/jobs/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Meta: HTTP ${res.status}`);

  const data = await res.json() as {
    data?: {
      job_search_with_featured_jobs?: {
        all_jobs?: Job[];
        featured_jobs?: Job[];
      };
    };
  };

  const allJobs = data.data?.job_search_with_featured_jobs?.all_jobs ?? [];
  const featured = data.data?.job_search_with_featured_jobs?.featured_jobs ?? [];

  // Merge — dedupe happens upstream in main.ts.
  return [...allJobs, ...featured].map(j => ({
    ats_role_id:  String(j.id ?? ''),
    title_raw:    String(j.title ?? ''),
    department_raw: Array.isArray(j.teams) ? j.teams.join(' / ') : (j.teams ?? null),
    location:     Array.isArray(j.locations) ? j.locations.join(' / ') : (j.locations ?? null),
    posted_at:    null, // Not exposed in this query
  }));
}
