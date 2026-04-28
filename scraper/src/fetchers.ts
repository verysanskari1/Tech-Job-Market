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
  const url = `https://api.ashbyhq.com/posting-api/job-board/${handle}`;

  let res: Response;
  if (proxyUrl) {
    const { fetch: proxyFetch, ProxyAgent } = await import('undici');
    res = await proxyFetch(url, { dispatcher: new ProxyAgent(proxyUrl) }) as unknown as Response;
  } else {
    res = await fetch(url);
  }
  if (!res.ok) throw new Error(`Ashby ${handle}: HTTP ${res.status}`);

  const data = await res.json() as {
    jobPostings: Array<{
      id: string;
      title: string;
      departmentName?: string;
      locationName?: string;
      isRemote?: boolean;
      publishedDate?: string;
    }>;
  };

  return (data.jobPostings ?? []).map(job => ({
    ats_role_id: job.id,
    title_raw: job.title,
    department_raw: job.departmentName ?? null,
    location: job.isRemote ? 'Remote' : (job.locationName ?? null),
    posted_at: job.publishedDate ?? null,
  }));
}
