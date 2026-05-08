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

// handle format: "tenant.wdN:board" e.g. "snapchat.wd1:snap"
export async function fetchWorkday(handle: string): Promise<FetchedRole[]> {
  const [subdomain, board] = handle.split(':');
  if (!subdomain || !board) throw new Error(`Invalid Workday handle "${handle}" — expected "tenant.wdN:board"`);
  const tenant = subdomain.split('.')[0];
  const url = `https://${subdomain}.myworkdayjobs.com/wday/cxs/${tenant}/${board}/jobs`;

  const roles: FetchedRole[] = [];
  let offset = 0;
  const limit = 20;
  let total = Infinity;

  while (roles.length < total) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, offset }),
    });
    if (!res.ok) throw new Error(`Workday ${handle}: HTTP ${res.status}`);
    const data = await res.json() as {
      total?: number;
      jobPostings?: Array<{
        externalPath: string;
        title: string;
        locationsText?: string;
        postedOn?: string;
      }>;
    };
    if (total === Infinity) total = data.total ?? 0;
    const jobs = data.jobPostings ?? [];
    if (jobs.length === 0) break;
    roles.push(...jobs.map(j => ({
      ats_role_id: j.externalPath,
      title_raw: j.title,
      department_raw: null,
      location: j.locationsText ?? null,
      posted_at: j.postedOn ?? null,
    })));
    offset += limit;
  }

  return roles;
}

export async function fetchSmartRecruiters(handle: string): Promise<FetchedRole[]> {
  const roles: FetchedRole[] = [];
  let offset = 0;
  const limit = 100;
  let total = Infinity;

  while (roles.length < total) {
    const res = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${handle}/postings?limit=${limit}&offset=${offset}`
    );
    if (!res.ok) throw new Error(`SmartRecruiters ${handle}: HTTP ${res.status}`);
    const data = await res.json() as {
      totalFound?: number;
      content?: Array<{
        id: string;
        name: string;
        department?: { label?: string };
        location?: { city?: string; country?: string; remote?: boolean };
        releasedDate?: string;
      }>;
    };
    if (total === Infinity) total = data.totalFound ?? 0;
    const jobs = data.content ?? [];
    if (jobs.length === 0) break;
    roles.push(...jobs.map(j => ({
      ats_role_id: j.id,
      title_raw: j.name,
      department_raw: j.department?.label ?? null,
      location: j.location?.remote
        ? 'Remote'
        : [j.location?.city, j.location?.country].filter(Boolean).join(', ') || null,
      posted_at: j.releasedDate ?? null,
    })));
    offset += limit;
  }

  return roles;
}

export async function fetchAshby(handle: string, proxyUrl?: string): Promise<FetchedRole[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${handle}`;

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
