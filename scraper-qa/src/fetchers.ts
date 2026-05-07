export async function countGreenhouse(handle: string): Promise<number> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${handle}/jobs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { jobs?: unknown[] };
  return (data.jobs ?? []).length;
}

export async function countLever(handle: string): Promise<number> {
  const res = await fetch(`https://api.lever.co/v0/postings/${handle}?mode=json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as unknown[];
  return (data ?? []).length;
}

export async function countAshby(handle: string): Promise<number> {
  const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${handle}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;
  const jobs: unknown[] = data.jobs ?? data.jobPostings ?? [];
  return jobs.length;
}
