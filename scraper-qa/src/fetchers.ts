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

export async function countSmartRecruiters(handle: string): Promise<number> {
  // limit=1 still returns totalFound, so this is cheap.
  const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${handle}/postings?limit=1`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { totalFound?: number; content?: unknown[] };
  return data.totalFound ?? (data.content ?? []).length;
}

export async function countIcims(handle: string): Promise<number> {
  // iCIMS renders a "Showing 1 - 25 of N" / "N Results" summary in the
  // search HTML. Extract it with regex — avoids pulling cheerio into QA.
  const url = `https://${handle}.icims.com/jobs/search?ss=1&pr=0&in_iframe=1`;
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 (compatible; tech-job-market-scraper/1.0)',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const patterns = [
    /of\s+(\d+)\s+results?/i,
    /(\d+)\s+results?\s+found/i,
    /(\d+)\s+open\s+positions?/i,
    /of\s+(\d+)\s*<\//i, // closing tag right after the count
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return Number(m[1]);
  }
  throw new Error('iCIMS: could not find results count in HTML');
}

export async function countWorkday(handle: string): Promise<number> {
  const [host, site] = handle.split(':');
  if (!host || !site) throw new Error(`expected "host:site" format`);
  const tenant = host.split('.')[0];
  const res = await fetch(`https://${host}.myworkdayjobs.com/wday/cxs/${tenant}/${site}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ appliedFacets: {}, limit: 1, offset: 0, searchText: '' }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as { total?: number; jobPostings?: unknown[] };
  return data.total ?? (data.jobPostings ?? []).length;
}
