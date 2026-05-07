// Mirrors scraper/src/fetchers.ts — keep in sync if you update fetch logic there.
// Returns only the count of live roles (avoids building full role objects for speed).

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

export async function countWorkday(handle: string): Promise<number> {
  const [tenant, version, board] = handle.split(':');
  if (!tenant || !version || !board) throw new Error(`Bad handle format: "${handle}"`);

  const baseUrl = `https://${tenant}.${version}.myworkdayjobs.com/wday/cxs/${tenant}/${board}/jobs`;
  let total = 0;
  let offset = 0;
  let reportedTotal = Infinity;

  while (offset < reportedTotal) {
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 20, offset, searchText: '' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { total?: number; jobPostings?: unknown[] };
    reportedTotal = data.total ?? 0;
    const batch = (data.jobPostings ?? []).length;
    if (batch === 0) break;
    total += batch;
    offset += batch;
  }

  return total;
}
