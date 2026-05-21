import type { FetchedRole } from '../types.js';
import { fetchWithRetry } from './_util.js';

// Apple's careers site POSTs to this JSON endpoint. Their previous flow
// required an `x-apple-csrf-token` header pulled from the HTML, but the
// search page is now JS-rendered with no CSRF embedded — so we rely on
// session cookies only. We fetch the page first to pick up the
// `jobs=` and `jssid=` cookies, then send those with the API call.
//
// Response shape: { res: [{ postingTitle, positionID, ... }] }
const SEARCH_PAGE = 'https://jobs.apple.com/en-us/search';
const ENDPOINT = 'https://jobs.apple.com/api/v1/rolesearch';
const PAGE_SIZE = 20;
const MAX_PAGES = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Job = any;

async function bootstrap(proxyUrl?: string): Promise<{ cookie: string; csrf: string | null }> {
  const res = await fetchWithRetry(SEARCH_PAGE, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  }, 3, proxyUrl);
  if (!res.ok) throw new Error(`Apple search page: HTTP ${res.status}`);

  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookie = setCookie
    .split(/,\s*(?=[a-zA-Z0-9_]+=)/)
    .map(c => c.split(';')[0])
    .join('; ');

  // Best-effort CSRF extraction — most Apple deployments embed nothing
  // in the page, but if a token IS present we send it; otherwise omit.
  const html = await res.text();
  const csrfMatch = html.match(/"csrfToken"\s*:\s*"([a-f0-9]{32,})"/i)
    ?? html.match(/csrf[_-]?token['"]?\s*[:=]\s*['"]([a-f0-9]{32,})['"]/i);
  const csrf = csrfMatch ? csrfMatch[1] : null;

  return { cookie, csrf };
}

export async function fetchApple(proxyUrl?: string): Promise<FetchedRole[]> {
  const { cookie, csrf } = await bootstrap(proxyUrl);
  const roles: FetchedRole[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = JSON.stringify({ page, locale: 'en_us' });
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: '*/*',
      Cookie: cookie,
      Origin: 'https://jobs.apple.com',
      Referer: 'https://jobs.apple.com/en-us/search',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      Locale: 'en_US',
      BrowserLocale: 'en-us',
    };
    if (csrf) headers['X-Apple-CSRF-Token'] = csrf;

    const res = await fetchWithRetry(ENDPOINT, {
      method: 'POST',
      headers,
      body,
    }, 3, proxyUrl);
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
