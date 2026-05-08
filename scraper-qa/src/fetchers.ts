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

export async function fetchSmartRecruiters(handle: string): Promise<AtsResult> {
  const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${handle}/postings?limit=100`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { content?: Array<{ id: string }>; totalFound?: number };
  const jobs = data.content ?? [];

  // SmartRecruiters paginates at 100 — fetch remaining pages if needed
  const total = data.totalFound ?? jobs.length;
  const ids: string[] = jobs.map(j => j.id);

  if (total > 100) {
    let offset = 100;
    while (ids.length < total) {
      const page = await fetch(`https://api.smartrecruiters.com/v1/companies/${handle}/postings?limit=100&offset=${offset}`);
      if (!page.ok) break;
      const pageData = await page.json() as { content?: Array<{ id: string }> };
      const pageJobs = pageData.content ?? [];
      if (pageJobs.length === 0) break;
      ids.push(...pageJobs.map(j => j.id));
      offset += 100;
    }
  }

  return { count: total, ids };
}
