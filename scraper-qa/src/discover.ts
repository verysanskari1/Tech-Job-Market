// Auto-discover the right ATS + handle for companies that fail to scrape.
//
// For each company you give it, this tries common slug variations across
// Greenhouse, Lever, Ashby, and SmartRecruiters. Whichever combination
// returns 200 OK with at least one job wins, and we print an SQL UPDATE
// you can paste into Supabase.
//
// Usage:
//   cd scraper-qa
//   npm run discover
//
// Edit COMPANIES_TO_INVESTIGATE below before running.

const COMPANIES_TO_INVESTIGATE: string[] = [
  // batch3 failures (Greenhouse 404)
  'OpenSea', 'Polygon', 'Uniswap', 'Ledger', 'Crypto.com', 'Solana', 'dYdX',
  'Chainalysis', 'Hims & Hers', 'Ro', 'Lyra Health', 'Spring Health', 'Tempus AI',
  'Oscar Health', 'Wealthfront', 'AngelList', 'Pilot', 'BrowserStack', 'Freshworks',
  'Hasura', 'Atlan', 'DigitalOcean', 'Notion Labs', 'Headspace', 'Strava',
  'Eventbrite', 'Patreon', 'Mailchimp', 'SendGrid', 'Heap', 'Convoy', 'Turo',
  'Crusoe', 'Lambda Labs', 'Tenable', 'SentinelOne', 'Cloudera', 'Boston Dynamics',
  'Spotify',
  // batch3 failures (Lever 404)
  'Slice', 'BharatPe', 'NoBroker', 'Acko',
  // batch3 failures (Ashby 404)
  'Ironclad', 'Pulley', 'OpenStore',
  // earlier failures
  'Hugging Face', 'Whatnot', 'Mercari', 'Revolut', 'Niantic', 'Crunchbase',
  'Salesforce', 'Unity', 'Snowflake',
];

interface Candidate {
  ats: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters';
  handle: string;
  url: string;
}

function slugVariations(name: string): string[] {
  const lower = name.toLowerCase();
  const noSpace = lower.replace(/[^a-z0-9]/g, '');
  const dashSep = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const variations = new Set<string>([
    noSpace,
    dashSep,
    `${noSpace}inc`,
    `${noSpace}hq`,
    `${noSpace}labs`,
    `${noSpace}technologies`,
    `${noSpace}ai`,
    noSpace.replace(/inc$/, ''),
  ]);
  return [...variations].filter(s => s.length >= 2);
}

function buildCandidates(name: string): Candidate[] {
  const variations = slugVariations(name);
  const out: Candidate[] = [];
  for (const v of variations) {
    out.push({ ats: 'greenhouse', handle: v, url: `https://boards-api.greenhouse.io/v1/boards/${v}/jobs` });
    out.push({ ats: 'lever',      handle: v, url: `https://api.lever.co/v0/postings/${v}?mode=json` });
    out.push({ ats: 'ashby',      handle: v, url: `https://api.ashbyhq.com/posting-api/job-board/${v}` });
    out.push({ ats: 'smartrecruiters', handle: v, url: `https://api.smartrecruiters.com/v1/companies/${v}/postings?limit=1` });
  }
  // SmartRecruiters often uses TitleCase like "Canva", "Wise" — try verbatim too.
  const noSpace = name.replace(/\s+/g, '');
  out.push({
    ats: 'smartrecruiters',
    handle: noSpace,
    url: `https://api.smartrecruiters.com/v1/companies/${noSpace}/postings?limit=1`,
  });
  return out;
}

interface Result {
  ats: string;
  handle: string;
  jobCount: number;
}

async function tryCandidate(c: Candidate): Promise<Result | null> {
  try {
    const res = await fetch(c.url, {
      headers: { Accept: 'application/json', 'User-Agent': 'tech-job-market-discover/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json() as any;
    let jobCount = 0;
    if (c.ats === 'greenhouse') jobCount = (data.jobs ?? []).length;
    else if (c.ats === 'lever') jobCount = Array.isArray(data) ? data.length : 0;
    else if (c.ats === 'ashby') jobCount = (data.jobs ?? data.jobPostings ?? []).length;
    else if (c.ats === 'smartrecruiters') jobCount = (data.totalFound ?? data.content?.length ?? 0);
    if (jobCount === 0) return null;
    return { ats: c.ats, handle: c.handle, jobCount };
  } catch {
    return null;
  }
}

async function discoverOne(name: string): Promise<Result | null> {
  const candidates = buildCandidates(name);
  // Try in parallel batches of 8 so we don't overwhelm one ATS
  for (let i = 0; i < candidates.length; i += 8) {
    const batch = candidates.slice(i, i + 8);
    const results = await Promise.all(batch.map(tryCandidate));
    const hit = results.find(r => r != null);
    if (hit) return hit;
  }
  return null;
}

async function main() {
  console.log(`Discovering ATS handles for ${COMPANIES_TO_INVESTIGATE.length} companies...\n`);

  const sqlLines: string[] = [];
  const notFound: string[] = [];

  for (const name of COMPANIES_TO_INVESTIGATE) {
    const found = await discoverOne(name);
    if (found) {
      const sqlName = name.replace(/'/g, "''");
      sqlLines.push(
        `update companies set ats = '${found.ats}', ats_handle = '${found.handle}' where name = '${sqlName}'; -- ${found.jobCount} jobs`,
      );
      console.log(`  ✓ ${name.padEnd(22)} → ${found.ats}/${found.handle} (${found.jobCount} jobs)`);
    } else {
      notFound.push(name);
      console.log(`  ✗ ${name.padEnd(22)} no match`);
    }
  }

  console.log('\n-- Generated SQL (paste into Supabase):');
  console.log(sqlLines.join('\n'));

  if (notFound.length > 0) {
    console.log(`\n-- Not found, need manual DevTools investigation:\n${notFound.join(', ')}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
