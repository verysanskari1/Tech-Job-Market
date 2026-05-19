import * as cheerio from 'cheerio';
import { FetchedRole } from './types.js';

export async function fetchGreenhouse(handle: string): Promise<FetchedRole[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${handle}/jobs`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Greenhouse ${handle}: HTTP ${res.status}`);

  const data = await res.json() as {
    jobs: Array<{
      id: number;
      title: string;
      location: { name: string } | null;
      departments: Array<{ name: string }>;
      updated_at: string;
    }>;
  };

  return (data.jobs ?? []).map(job => ({
    ats_role_id: String(job.id),
    title_raw: job.title,
    department_raw: job.departments?.[0]?.name ?? null,
    location: job.location?.name ?? null,
    posted_at: job.updated_at ?? null,
  }));
}

export async function fetchLever(handle: string): Promise<FetchedRole[]> {
  const url = `https://api.lever.co/v0/postings/${handle}?mode=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lever ${handle}: HTTP ${res.status}`);

  const data = await res.json() as Array<{
    id: string;
    text: string;
    categories: { department?: string; location?: string } | null;
    createdAt: number;
  }>;

  return (data ?? []).map(posting => ({
    ats_role_id: posting.id,
    title_raw: posting.text,
    department_raw: posting.categories?.department ?? null,
    location: posting.categories?.location ?? null,
    posted_at: posting.createdAt ? new Date(posting.createdAt).toISOString() : null,
  }));
}

export async function fetchAshby(handle: string, proxyUrl?: string): Promise<FetchedRole[]> {
  // Some Ashby boards use multi-word handles (e.g. "superhuman platform inc")
  // that need URL encoding to survive the request.
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(handle)}`;

  let res: Response;
  if (proxyUrl) {
    const { fetch: proxyFetch, ProxyAgent } = await import('undici');
    res = await proxyFetch(url, { dispatcher: new ProxyAgent(proxyUrl) }) as unknown as Response;
  } else {
    res = await fetch(url);
  }
  if (!res.ok) throw new Error(`Ashby ${handle}: HTTP ${res.status}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;

  // Log top-level keys on first call to catch future schema changes
  if (handle === 'openai') {
    const keys = Object.keys(data);
    const firstJob = (data.jobs ?? data.jobPostings ?? [])[0];
    console.log(`[Ashby debug] top-level keys: ${keys}`);
    if (firstJob) console.log(`[Ashby debug] first job keys: ${Object.keys(firstJob)}`);
  }

  const jobs: Array<{
    id?: string;
    title: string;
    department?: string;
    departmentName?: string;
    location?: string;
    locationName?: string;
    isRemote?: boolean;
    publishedAt?: string;
    publishedDate?: string;
    jobUrl?: string;
  }> = data.jobs ?? data.jobPostings ?? [];

  return jobs.map(job => {
    // Extract ID from jobUrl if the id field is missing: .../handle/UUID
    const id = job.id ?? job.jobUrl?.split('/').pop() ?? '';
    return {
      ats_role_id: id,
      title_raw: job.title,
      department_raw: job.department ?? job.departmentName ?? null,
      location: job.isRemote ? 'Remote' : (job.location ?? job.locationName ?? null),
      posted_at: job.publishedAt ?? job.publishedDate ?? null,
    };
  });
}

export async function fetchSmartRecruiters(handle: string): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];
  const limit = 100;
  let offset = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Posting = any;

  while (true) {
    const url = `https://api.smartrecruiters.com/v1/companies/${handle}/postings?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SmartRecruiters ${handle}: HTTP ${res.status}`);

    const data = await res.json() as {
      offset?: number;
      limit?: number;
      totalFound?: number;
      content?: Posting[];
    };

    const page: Posting[] = data.content ?? [];
    for (const p of page) {
      const loc = p.location ?? {};
      const fullLocation: string | null = loc.fullLocation
        ?? ([loc.city, loc.region, loc.country].filter(Boolean).join(', ') || null);
      roles.push({
        ats_role_id: String(p.id ?? p.uuid ?? p.refNumber ?? ''),
        title_raw: p.name ?? p.title ?? '',
        department_raw: p.department?.label ?? p.department?.name ?? null,
        location: loc.remote ? 'Remote' : fullLocation,
        posted_at: p.releasedDate ?? p.createdOn ?? null,
      });
    }

    if (page.length < limit) break;
    offset += limit;
    if (offset > 5000) break; // hard safety stop
  }

  return roles;
}

export async function fetchWorkday(handle: string, proxyUrl?: string): Promise<FetchedRole[]> {
  // Handle format: "{host}:{site}" e.g. "snapchat.wd1:snap" or "workday.wd5:Workday".
  // Tenant is the segment of host before the first dot (e.g. "snapchat", "workday").
  const [host, site] = handle.split(':');
  if (!host || !site) throw new Error(`Workday ${handle}: expected "host:site" format`);
  const tenant = host.split('.')[0];

  const endpoint = `https://${host}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Posting = any;

  const roles: FetchedRole[] = [];
  const limit = 20; // Workday's CXS API caps at 20 per page
  let offset = 0;
  let total = Infinity;

  // Optional proxy for tenants that block cloud IPs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let proxyFetch: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ProxyAgent: any = null;
  if (proxyUrl) {
    const undici = await import('undici');
    proxyFetch = undici.fetch;
    ProxyAgent = undici.ProxyAgent;
  }

  while (offset < total) {
    const body = JSON.stringify({ appliedFacets: {}, limit, offset, searchText: '' });
    const init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    };

    let res: Response;
    if (proxyUrl) {
      res = await proxyFetch(endpoint, { ...init, dispatcher: new ProxyAgent(proxyUrl) }) as unknown as Response;
    } else {
      res = await fetch(endpoint, init);
    }
    if (!res.ok) throw new Error(`Workday ${handle}: HTTP ${res.status}`);

    const data = await res.json() as { total?: number; jobPostings?: Posting[] };
    if (typeof data.total === 'number') total = data.total;

    const page: Posting[] = data.jobPostings ?? [];
    if (page.length === 0) break;

    for (const p of page) {
      // ID lives in bulletFields[0] (e.g. "R0001234") or at the tail of externalPath.
      const pathTail = typeof p.externalPath === 'string'
        ? p.externalPath.split('/').pop() ?? ''
        : '';
      const id = (Array.isArray(p.bulletFields) && p.bulletFields[0]) || pathTail || p.title || '';
      roles.push({
        ats_role_id: String(id),
        title_raw: p.title ?? '',
        department_raw: null, // Workday doesn't expose a clean department field on this endpoint
        location: p.locationsText ?? null,
        posted_at: null, // "Posted X Days Ago" — relative string, skip
      });
    }

    offset += page.length;
    if (offset > 10000) break; // hard safety stop
  }

  return roles;
}

// iCIMS has no public JSON API — scrape the public job-board HTML.
// Handle format: the careers subdomain prefix, e.g. "careers-americas"
// (full URL becomes https://careers-americas.icims.com/jobs/search?...).
export async function fetchIcims(handle: string): Promise<FetchedRole[]> {
  const base = `https://${handle}.icims.com`;
  const roles: FetchedRole[] = [];
  const seen = new Set<string>();

  // iCIMS paginates via ?pr=N (zero-indexed). Page size is typically 25.
  // Walk pages until one returns 0 new rows, with a hard cap as a safety net.
  const MAX_PAGES = 200;

  for (let pr = 0; pr < MAX_PAGES; pr++) {
    const url = `${base}/jobs/search?ss=1&searchKeyword=&searchLocation=&pr=${pr}&in_iframe=1`;
    const res = await fetch(url, {
      headers: {
        // iCIMS is HTML-only; declare it so we don't get a 406 from picky tenants.
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; tech-job-market-scraper/1.0)',
      },
    });
    if (!res.ok) throw new Error(`iCIMS ${handle}: HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    let pageCount = 0;
    // Each job row is an <a> whose href contains "/jobs/{id}/...". Different
    // iCIMS skins wrap this differently, so target the link itself.
    $('a[href*="/jobs/"]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const match = href.match(/\/jobs\/([^/?#]+)/);
      if (!match) return;
      const id = match[1];
      // Skip non-job links like "/jobs/search" or "/jobs/login".
      if (!/^\d/.test(id) && !/^[A-Za-z0-9_-]{4,}$/.test(id)) return;
      if (id === 'search' || id === 'login') return;
      if (seen.has(id)) return;

      // Title sits inside the link or in a child .title element.
      const title =
        $(el).find('.title').first().text().trim() ||
        $(el).text().trim().split('\n')[0]?.trim() ||
        '';
      if (!title) return;

      // Location is a sibling/descendant; iCIMS labels vary by skin.
      let location: string | null = null;
      const locEl = $(el).find('[data-name="Job Location"], .location').first();
      if (locEl.length) location = locEl.text().trim() || null;

      seen.add(id);
      roles.push({
        ats_role_id: id,
        title_raw: title,
        department_raw: null,
        location,
        posted_at: null, // iCIMS only shows "Posted X days ago" relative strings
      });
      pageCount++;
    });

    if (pageCount === 0) break; // no new rows on this page → we're done
  }

  return roles;
}
