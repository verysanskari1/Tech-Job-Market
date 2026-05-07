import { Actor, log } from 'apify';
import { createClient } from '@supabase/supabase-js';
import { auditRole, MODEL } from './audit.js';
import type { ClassifiedRoleForAudit, AuditRow } from './types.js';

await Actor.init();

// ------------------------------------------------------------------
// Config
// ------------------------------------------------------------------
const input = await Actor.getInput<{
  supabaseUrl?: string;
  supabaseKey?: string;
  sampleSize?: number;
  confidenceThreshold?: number;
}>();

const supabaseUrl = input?.supabaseUrl ?? process.env.SUPABASE_URL ?? '';
const supabaseKey = input?.supabaseKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const SAMPLE_SIZE = input?.sampleSize ?? 100;
const CONFIDENCE_THRESHOLD = input?.confidenceThreshold ?? 0.75;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 200;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const halfSize = Math.floor(SAMPLE_SIZE / 2);

log.info(`Audit run — model: ${MODEL}, sample: ${SAMPLE_SIZE}, confidence threshold: ${CONFIDENCE_THRESHOLD}`);

// ------------------------------------------------------------------
// Sample 1: low-confidence classified roles
// ------------------------------------------------------------------
log.info(`Fetching low-confidence roles (confidence < ${CONFIDENCE_THRESHOLD})...`);
const { data: lowConfData, error: lowConfError } = await supabase
  .from('classified_roles')
  .select('raw_role_id, category, confidence')
  .lt('confidence', CONFIDENCE_THRESHOLD)
  .order('confidence', { ascending: true })
  .limit(halfSize);

if (lowConfError) throw new Error(`Failed to fetch low-confidence roles: ${lowConfError.message}`);

// ------------------------------------------------------------------
// Sample 2: random sample — fetch all IDs and shuffle in JS
// ------------------------------------------------------------------
log.info('Fetching all classified role IDs for random sampling...');
const { data: allClassified, error: allError } = await supabase
  .from('classified_roles')
  .select('raw_role_id, category, confidence');

if (allError) throw new Error(`Failed to fetch classified roles: ${allError.message}`);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const lowConfIds = new Set((lowConfData ?? []).map(r => r.raw_role_id as string));
const randomSample = shuffle(allClassified ?? [])
  .filter(r => !lowConfIds.has(r.raw_role_id as string))
  .slice(0, halfSize);

// ------------------------------------------------------------------
// Combine and deduplicate
// ------------------------------------------------------------------
type SampledRole = { raw_role_id: string; category: string; confidence: number };

const seen = new Set<string>();
const sampled: SampledRole[] = [];
for (const r of [...(lowConfData ?? []), ...randomSample]) {
  const id = r.raw_role_id as string;
  if (!seen.has(id)) {
    seen.add(id);
    sampled.push({ raw_role_id: id, category: r.category as string, confidence: r.confidence as number });
  }
}

log.info(`Sampled ${sampled.length} roles (${lowConfData?.length ?? 0} low-confidence + ${randomSample.length} random)`);

if (sampled.length === 0) {
  log.info('No roles to audit — classified_roles table may be empty.');
  await Actor.exit();
}

// ------------------------------------------------------------------
// Join to raw_roles for title and department
// ------------------------------------------------------------------
const roleIds = sampled.map(r => r.raw_role_id);
const { data: rawRolesData, error: rawRolesError } = await supabase
  .from('raw_roles')
  .select('id, title_raw, department_raw')
  .in('id', roleIds);

if (rawRolesError) throw new Error(`Failed to fetch raw_roles: ${rawRolesError.message}`);

const rawRolesMap = new Map(
  (rawRolesData ?? []).map(r => [
    r.id as string,
    { title: r.title_raw as string, department: r.department_raw as string | null },
  ]),
);

const rolesToAudit: ClassifiedRoleForAudit[] = sampled
  .filter(r => rawRolesMap.has(r.raw_role_id))
  .map(r => {
    const raw = rawRolesMap.get(r.raw_role_id)!;
    return {
      raw_role_id: r.raw_role_id,
      original_category: r.category,
      original_confidence: r.confidence,
      title: raw.title,
      department: raw.department,
    };
  });

log.info(`${rolesToAudit.length} roles ready for audit (${sampled.length - rolesToAudit.length} missing from raw_roles)`);

// ------------------------------------------------------------------
// Audit loop — batches of 5 with 200ms delay between batches
// ------------------------------------------------------------------
const today = new Date().toISOString().split('T')[0];
const auditRows: AuditRow[] = [];
let errorCount = 0;
const totalBatches = Math.ceil(rolesToAudit.length / BATCH_SIZE);

for (let i = 0; i < rolesToAudit.length; i += BATCH_SIZE) {
  const batch = rolesToAudit.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  log.info(`Batch ${batchNum}/${totalBatches}: auditing ${batch.length} roles`);

  const results = await Promise.all(
    batch.map(async role => {
      try {
        const result = await auditRole(
          role.original_category,
          role.original_confidence,
          role.title,
          role.department,
        );
        return {
          role_id: role.raw_role_id,
          original_category: role.original_category,
          original_confidence: role.original_confidence,
          audit_category: result.category,
          audit_confidence: result.confidence,
          agreed: result.category === role.original_category,
          title: role.title,
          department: role.department,
          audited_at: today,
        } satisfies AuditRow;
      } catch (err) {
        log.error(`Audit failed for "${role.title}": ${(err as Error).message}`);
        return null;
      }
    }),
  );

  for (const r of results) {
    if (r) auditRows.push(r);
    else errorCount++;
  }

  if (i + BATCH_SIZE < rolesToAudit.length) {
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
  }
}

// ------------------------------------------------------------------
// Upsert results to classification_audits
// Note: requires UNIQUE(role_id, audited_at) constraint on the table.
// ------------------------------------------------------------------
if (auditRows.length > 0) {
  const { error: upsertError } = await supabase
    .from('classification_audits')
    .upsert(auditRows, { onConflict: 'role_id,audited_at' });

  if (upsertError) {
    log.error(`Upsert failed: ${upsertError.message}`);
  } else {
    log.info(`Wrote ${auditRows.length} audit rows to classification_audits`);
  }
}

// ------------------------------------------------------------------
// Summary
// ------------------------------------------------------------------
const disagreements = auditRows.filter(r => !r.agreed);
const disagreementRate = auditRows.length > 0 ? disagreements.length / auditRows.length : 0;
const avgAuditConfidence =
  auditRows.length > 0
    ? auditRows.reduce((sum, r) => sum + r.audit_confidence, 0) / auditRows.length
    : 0;

// Group disagreements by title to find repeated patterns
type TitleDispute = { count: number; originals: string[]; audits: string[] };
const disputedByTitle = new Map<string, TitleDispute>();
for (const r of disagreements) {
  const entry = disputedByTitle.get(r.title);
  if (entry) {
    entry.count++;
    entry.originals.push(r.original_category);
    entry.audits.push(r.audit_category);
  } else {
    disputedByTitle.set(r.title, { count: 1, originals: [r.original_category], audits: [r.audit_category] });
  }
}

function mode(arr: string[]): string {
  const counts = new Map<string, number>();
  for (const s of arr) counts.set(s, (counts.get(s) ?? 0) + 1);
  let best = arr[0];
  let bestCount = 0;
  for (const [s, n] of counts) if (n > bestCount) { bestCount = n; best = s; }
  return best;
}

const topDisputed = [...disputedByTitle.entries()]
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 5);

log.info('--- Audit Summary ---');
log.info(`Sampled:          ${rolesToAudit.length} roles`);
log.info(`Disagreements:    ${disagreements.length} (${Math.round(disagreementRate * 100)}%)`);
log.info(`Avg audit confidence: ${avgAuditConfidence.toFixed(2)}`);
if (topDisputed.length > 0) {
  log.info('Top disputed titles:');
  for (const [title, info] of topDisputed) {
    log.info(`  ${title}   (${info.count} disagreements — original: ${mode(info.originals)}, audit: ${mode(info.audits)})`);
  }
}
log.info('------------------------------');

if (disagreementRate > 0.20) {
  log.warning('⚠️  Disagreement rate > 20% — review classifier prompt');
}

for (const [title, info] of disputedByTitle) {
  if (info.count >= 3) {
    log.warning(`⚠️  Title pattern "${title}" appears ${info.count}x in disagreements — investigate`);
  }
}

await Actor.exit();
