import { createClient } from '@supabase/supabase-js';
import { DOMAIN_MAP } from './domains.js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const apolloKey   = process.env.APOLLO_API_KEY ?? '';

if (!supabaseUrl || !supabaseKey || !apolloKey) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APOLLO_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface ApolloOrg {
  name?: string;
  estimated_num_employees?: number;
  funding_stage?: string;
  city?: string;
  state?: string;
  country?: string;
  primary_domain?: string;
}

interface ApolloResponse {
  organization?: ApolloOrg;
}

async function enrichCompany(domain: string): Promise<ApolloOrg | null> {
  const res = await fetch('https://api.apollo.io/v1/organizations/enrich', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apolloKey,
    },
    body: JSON.stringify({ domain }),
  });

  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error(`Apollo HTTP ${res.status}`);

  const data = await res.json() as ApolloResponse;
  return data.organization ?? null;
}

function formatRegion(org: ApolloOrg): string | null {
  const parts = [org.city, org.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
const { data: companies, error } = await supabase
  .from('companies')
  .select('id, name');

if (error) {
  console.error('Failed to load companies:', error.message);
  process.exit(1);
}

console.log(`Enriching ${companies.length} companies via Apollo.io...\n`);

const results: { name: string; status: string; employees?: number; funding?: string; region?: string }[] = [];

for (const company of companies as { id: string; name: string }[]) {
  const domain = DOMAIN_MAP[company.name];

  if (!domain) {
    console.log(`[${company.name}] No domain mapping — skipping`);
    results.push({ name: company.name, status: 'no_domain' });
    continue;
  }

  let org: ApolloOrg | null = null;
  let attempts = 0;

  while (attempts < 3) {
    try {
      org = await enrichCompany(domain);
      break;
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'RATE_LIMIT') {
        console.log(`[${company.name}] Rate limited — waiting 60s...`);
        await sleep(60_000);
        attempts++;
      } else {
        console.error(`[${company.name}] Apollo error: ${msg}`);
        break;
      }
    }
  }

  if (!org) {
    results.push({ name: company.name, status: 'failed' });
    await sleep(1_200);
    continue;
  }

  const update: Record<string, unknown> = {};
  if (org.estimated_num_employees != null) update.employee_count = org.estimated_num_employees;
  if (org.funding_stage)                   update.last_funding_stage = org.funding_stage;
  const region = formatRegion(org);
  if (region)                              update.region = region;

  if (Object.keys(update).length > 0) {
    const { error: updateError } = await supabase
      .from('companies')
      .update(update)
      .eq('id', company.id);

    if (updateError) {
      console.error(`[${company.name}] Supabase update failed: ${updateError.message}`);
      results.push({ name: company.name, status: 'db_error' });
    } else {
      console.log(`[${company.name}] ✓  employees=${org.estimated_num_employees ?? '?'}  funding=${org.funding_stage ?? '?'}  region=${region ?? '?'}`);
      results.push({
        name: company.name,
        status: 'ok',
        employees: org.estimated_num_employees,
        funding: org.funding_stage ?? undefined,
        region: region ?? undefined,
      });
    }
  } else {
    console.log(`[${company.name}] Apollo returned no enrichable fields`);
    results.push({ name: company.name, status: 'empty' });
  }

  // Apollo free tier: ~50 req/min — stay well under with a 1.5s delay
  await sleep(1_500);
}

// ------------------------------------------------------------------
// Summary
// ------------------------------------------------------------------
const ok      = results.filter(r => r.status === 'ok').length;
const skipped = results.filter(r => r.status === 'no_domain').length;
const failed  = results.filter(r => ['failed', 'db_error'].includes(r.status)).length;

console.log(`\n--- Enrichment summary ---`);
console.log(`  Enriched:  ${ok}`);
console.log(`  Skipped:   ${skipped} (no domain mapping)`);
console.log(`  Failed:    ${failed}`);
console.log(`--------------------------`);
