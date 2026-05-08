import { createClient } from '@supabase/supabase-js';
import type { AuditSummary, GitHubFileInfo, PrResult } from './types.js';

// ------------------------------------------------------------------
// Tool: get_audit_summary
// ------------------------------------------------------------------
export async function getAuditSummary(supabaseUrl: string, supabaseKey: string): Promise<AuditSummary> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find the most recent audit date
  const { data: latestRow, error: latestError } = await supabase
    .from('classification_audits')
    .select('audited_at')
    .order('audited_at', { ascending: false })
    .limit(1)
    .single();

  if (latestError) throw new Error(`Failed to fetch latest audit date: ${latestError.message}`);
  const latestDate = latestRow.audited_at as string;

  // Fetch all rows from that audit run
  const { data: rows, error: rowsError } = await supabase
    .from('classification_audits')
    .select('role_id, title, original_category, audit_category, audit_confidence, agreed')
    .eq('audited_at', latestDate);

  if (rowsError) throw new Error(`Failed to fetch audit rows: ${rowsError.message}`);

  const total = rows?.length ?? 0;
  const disagreements = (rows ?? []).filter(r => !r.agreed);
  const disagreementRate = total > 0 ? disagreements.length / total : 0;
  const avgAuditConfidence =
    total > 0
      ? (rows ?? []).reduce((sum, r) => sum + (r.audit_confidence as number), 0) / total
      : 0;

  // Group disagreements by title
  type TitleEntry = { count: number; originals: string[]; audits: string[] };
  const byTitle = new Map<string, TitleEntry>();
  for (const r of disagreements) {
    const title = r.title as string;
    const entry = byTitle.get(title);
    if (entry) {
      entry.count++;
      entry.originals.push(r.original_category as string);
      entry.audits.push(r.audit_category as string);
    } else {
      byTitle.set(title, { count: 1, originals: [r.original_category as string], audits: [r.audit_category as string] });
    }
  }

  function mode(arr: string[]): string {
    const counts = new Map<string, number>();
    for (const s of arr) counts.set(s, (counts.get(s) ?? 0) + 1);
    let best = arr[0] ?? '';
    let bestCount = 0;
    for (const [s, n] of counts) if (n > bestCount) { bestCount = n; best = s; }
    return best;
  }

  const topDisputedTitles = [...byTitle.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([title, info]) => ({
      title,
      count: info.count,
      originalCategory: mode(info.originals),
      auditCategory: mode(info.audits),
    }));

  return {
    latestDate,
    totalAudited: total,
    totalDisagreements: disagreements.length,
    disagreementRate,
    avgAuditConfidence,
    topDisputedTitles,
  };
}

// ------------------------------------------------------------------
// Tool: get_current_classifier_prompt
// ------------------------------------------------------------------
const CLASSIFIER_FILE_PATH = 'classifier/src/classify.ts';

export async function getCurrentClassifierPrompt(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubFileInfo> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${CLASSIFIER_FILE_PATH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub GET contents failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { content: string; sha: string };
  // GitHub returns base64-encoded content with newlines
  const rawContent = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8');

  // Extract just the SYSTEM_PROMPT string for the agent to read
  const match = rawContent.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/);
  if (!match) throw new Error('Could not find SYSTEM_PROMPT in classifier/src/classify.ts');

  return {
    content: match[1],
    sha: data.sha,
    path: CLASSIFIER_FILE_PATH,
  };
}

// ------------------------------------------------------------------
// Tool: create_prompt_patch_pr
// ------------------------------------------------------------------
export async function createPromptPatchPr(
  token: string,
  owner: string,
  repo: string,
  newSystemPrompt: string,
  reasoning: string,
): Promise<PrResult> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  // 1. Get main branch SHA
  const refRes = await fetch(`${apiBase}/git/ref/heads/main`, { headers });
  if (!refRes.ok) throw new Error(`Failed to get main ref (${refRes.status}): ${await refRes.text()}`);
  const refData = (await refRes.json()) as { object: { sha: string } };
  const baseSha = refData.object.sha;

  // 2. Create a new branch
  const today = new Date().toISOString().split('T')[0];
  const branch = `fix/classifier-prompt-${today}`;
  const createBranchRes = await fetch(`${apiBase}/git/refs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  if (!createBranchRes.ok && createBranchRes.status !== 422) {
    throw new Error(`Failed to create branch (${createBranchRes.status}): ${await createBranchRes.text()}`);
  }

  // 3. Get the current file content and SHA from the new branch
  const fileRes = await fetch(`${apiBase}/contents/${CLASSIFIER_FILE_PATH}?ref=${branch}`, { headers });
  if (!fileRes.ok) throw new Error(`Failed to get file (${fileRes.status}): ${await fileRes.text()}`);
  const fileData = (await fileRes.json()) as { content: string; sha: string };
  const fileSha = fileData.sha;
  const currentContent = Buffer.from(fileData.content.replace(/\n/g, ''), 'base64').toString('utf-8');

  // 4. Replace the SYSTEM_PROMPT value in the file
  const updatedContent = currentContent.replace(
    /const SYSTEM_PROMPT = `[\s\S]*?`;/,
    `const SYSTEM_PROMPT = \`${newSystemPrompt}\`;`,
  );

  if (updatedContent === currentContent) {
    throw new Error('SYSTEM_PROMPT replacement had no effect — regex may not have matched');
  }

  // 5. Commit the updated file
  const encodedContent = Buffer.from(updatedContent).toString('base64');
  const commitMessage = `fix(classifier): improve SYSTEM_PROMPT based on audit disagreements (${today})\n\n${reasoning.slice(0, 500)}`;

  const putRes = await fetch(`${apiBase}/contents/${CLASSIFIER_FILE_PATH}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content: encodedContent,
      sha: fileSha,
      branch,
    }),
  });

  if (!putRes.ok) throw new Error(`Failed to update file (${putRes.status}): ${await putRes.text()}`);

  // 6. Open a PR
  const prBody = `## What changed\n\nThe audit agent detected a disagreement rate above threshold and drafted an improved \`SYSTEM_PROMPT\` for the classifier.\n\n## Reasoning\n\n${reasoning}\n\n## Review checklist\n\n- [ ] Read the new system prompt in \`classifier/src/classify.ts\`\n- [ ] Check that the disputed categories are addressed\n- [ ] Merge if satisfied, or push additional edits to \`${branch}\``;

  const prRes = await fetch(`${apiBase}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `fix(classifier): improve SYSTEM_PROMPT (audit ${today})`,
      head: branch,
      base: 'main',
      body: prBody,
    }),
  });

  if (!prRes.ok) throw new Error(`Failed to create PR (${prRes.status}): ${await prRes.text()}`);
  const prData = (await prRes.json()) as { html_url: string; number: number };

  return { url: prData.html_url, number: prData.number, branch };
}
