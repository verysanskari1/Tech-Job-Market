export interface AtsResult {
  count: number;
  ids: string[];
}

export async function fetchGreenhouse(handle: string): Promise<AtsResult> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${handle}/jobs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { jobs?: Array<{ id: number }> };
  const jobs = data.jobs ?? [];
  return { count: jobs.length, ids: jobs.map(j => String(j.id)) };
}

export async function fetchLever(handle: string): Promise<AtsResult> {
  const res = await fetch(`https://api.lever.co/v0/postings/${handle}?mode=json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as Array<{ id: string }>;
  return { count: data.length, ids: data.map(j => j.id) };
}

export async function fetchAshby(handle: string): Promise<AtsResult> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${handle}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;
  const jobs: Array<{ id?: string; jobUrl?: string }> = data.jobs ?? data.jobPostings ?? [];
  const ids = jobs.map(j => j.id ?? j.jobUrl?.split('/').pop() ?? '').filter(Boolean);
  return { count: jobs.length, ids };
}
