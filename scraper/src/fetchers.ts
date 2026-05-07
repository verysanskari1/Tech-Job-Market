import { FetchedRole } from './types.js';

// Workday handle format: "tenant:wd{version}:BoardName"
// e.g. "netflix:wd5:Netflix_External_Site"
export async function fetchWorkday(handle: string): Promise<FetchedRole[]> {
  const [tenant, version, board] = handle.split(':');
  if (!tenant || !version || !board) {
    throw new Error(`Workday handle "${handle}" must be "tenant:wd{N}:BoardName"`);
  }

  const baseUrl = `https://${tenant}.${version}.myworkdayjobs.com/wday/cxs/${tenant}/${board}/jobs`;
  const roles: FetchedRole[] = [];
  const limit = 20;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit, offset, searchText: '' }),
    });
    if (!res.ok) throw new Error(`Workday ${handle}: HTTP ${res.status}`);

    const data = await res.json() as {
      total?: number;
      jobPostings?: Array<{
        title: string;
        externalPath?: string;
        locationsText?: string;
        postedOn?: string;
        jobReqId?: string;
      }>;
    };

    total = data.total ?? 0;
    const postings = data.jobPostings ?? [];
    if (postings.length === 0) break;

    for (const job of postings) {
      const id = job.jobReqId ?? job.externalPath?.split('/').pop() ?? `${offset}`;
      roles.push({
        ats_role_id: id,
        title_raw: job.title,
        department_raw: null,
        location: job.locationsText ?? null,
        posted_at: job.postedOn ?? null,
      });
    }

    offset += postings.length;
  }

  return roles;
}

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
