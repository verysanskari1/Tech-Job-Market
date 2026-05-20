import type { FetchedRole } from '../types.js';
import { fetchWithRetry } from './_util.js';

// Apple's careers site POSTs to this JSON endpoint internally. They
// require an `x-apple-csrf-token` header — bootstrap one by fetching
// the search page first and extracting it from the embedded HTML/JSON.
//
// Response shape (verified): { res: [{ postingTitle, positionID, ... }] }
const SEARCH_PAGE = 'https://jobs.apple.com/en-us/search';
const ENDPOINT = 'https://jobs.apple.com/api/v1/rolesearch';
const PAGE_SIZE = 20;
const MAX_PAGES = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

async function getCsrfToken(): Promise<{ csrf: string; cookie: string }> {
  const res = await fetchWithRetry(SEARCH_PAGE, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });
  if (!res.ok) throw new Error(`Apple search page: HTTP ${res.status}`);
  const html = await res.text();

  // Apple embeds the CSRF token in the page HTML. Try a few known patterns.
  const patterns = [
    /"csrfToken"\s*:\s*"([a-f0-9]{32,})"/i,
    /name="csrf-token"\s+content="([a-f0-9]{32,})"/i,
    /csrf_token['"]?\s*[:=]\s*['"]([a-f0-9]{32,})['"]/i,
  ];
  let csrf: string | null = null;
  for (const p of patterns) {
    const m = html.match(p);
    if (m) { csrf = m[1]; break; }
  }
  if (!csrf) throw new Error('Apple: could not extract csrf token from search page');

  // Apple sets a `jobs` session cookie on this page — pass it through.
  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookie = setCookie
    .split(/,\s*(?=[a-zA-Z0-9_]+=)/)
    .map(c => c.split(';')[0])
    .join('; ');

  return { csrf, cookie };
}

export async function fetchApple(): Promise<FetchedRole[]> {
  const { csrf, cookie } = await getCsrfToken();
  const roles: FetchedRole[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = JSON.stringify({ page, locale: 'en_us' });
    const res = await fetchWithRetry(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        'X-Apple-CSRF-Token': csrf,
        Cookie: cookie,
        Origin: 'https://jobs.apple.com',
        Referer: 'https://jobs.apple.com/en-us/search',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Locale: 'en_US',
        BrowserLocale: 'en-us',
      },
      body,
    });
    if (!res.ok) throw new Error(`Apple: HTTP ${res.status} on page ${page}`);

    const data = await res.json() as { res?: Job[] };
    const jobs = data.res ?? [];
    if (jobs.length === 0) break;

    for (const j of jobs) {
      roles.push({
        ats_role_id:  String(j.positionID ?? j.positionId ?? j.id ?? j.req_id ?? ''),
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
