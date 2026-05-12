import { Actor, log } from 'apify';
import Anthropic from '@anthropic-ai/sdk';
import { getAuditSummary, getCurrentClassifierPrompt, createPromptPatchPr, checkScraperHealth } from './tools.js';

await Actor.init();

// ------------------------------------------------------------------
// Config
// ------------------------------------------------------------------
const input = await Actor.getInput<{
  supabaseUrl?: string;
  supabaseKey?: string;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  disagreementThreshold?: number;
}>();

const supabaseUrl = input?.supabaseUrl ?? process.env.SUPABASE_URL ?? '';
const supabaseKey = input?.supabaseKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const githubToken = input?.githubToken ?? process.env.GITHUB_TOKEN ?? '';
const githubOwner = input?.githubOwner ?? process.env.GITHUB_OWNER ?? '';
const githubRepo = input?.githubRepo ?? process.env.GITHUB_REPO ?? '';
const DISAGREEMENT_THRESHOLD = input?.disagreementThreshold ?? 0.20;

if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
if (!githubToken) throw new Error('GITHUB_TOKEN is required.');
if (!githubOwner || !githubRepo) throw new Error('GITHUB_OWNER and GITHUB_REPO are required.');
if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is required.');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ------------------------------------------------------------------
// Tool definitions for Claude
// ------------------------------------------------------------------
const tools: Anthropic.Tool[] = [
  {
    name: 'check_scraper_health',
    description:
      'Checks every company in the DB against its live ATS job count. Returns a summary of warnings (ATS has significantly more roles than DB — scraper may be falling behind) and errors (ATS unreachable). Custom-ATS companies are skipped since they have no public API.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_audit_summary',
    description:
      'Fetches the most recent audit run from classification_audits and returns the disagreement rate, average audit confidence, and the top 10 disputed job titles with their original vs. audit categories.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_current_classifier_prompt',
    description:
      'Retrieves the current SYSTEM_PROMPT string from classifier/src/classify.ts in the GitHub repository. Use this to understand the existing prompt before drafting improvements.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_prompt_patch_pr',
    description:
      'Creates a GitHub PR that updates the SYSTEM_PROMPT in classifier/src/classify.ts with an improved version. Call this only after you have analysed the disputes and drafted a better prompt.',
    input_schema: {
      type: 'object' as const,
      properties: {
        new_system_prompt: {
          type: 'string',
          description: 'The complete replacement SYSTEM_PROMPT string (not a diff — the full text that will replace the existing prompt).',
        },
        reasoning: {
          type: 'string',
          description: 'A concise explanation of what you changed and why, referencing the specific disputed patterns you addressed. Will appear in the PR body.',
        },
      },
      required: ['new_system_prompt', 'reasoning'],
    },
  },
];

// ------------------------------------------------------------------
// Agent system prompt
// ------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a pipeline health agent for a tech job market index. You monitor two things: (1) whether the scraper is keeping the DB in sync with company ATS job boards, and (2) whether the classifier is labelling roles correctly.

Follow these steps in order:

## Step 1 — Scraper health
Call check_scraper_health. Report any warnings (large gaps between ATS live count and DB count) and errors (ATS unreachable). Skipped companies (custom ATS) need no action.

## Step 2 — Classifier health
Call get_audit_summary to see the latest audit results.

## Step 3 — Fix classifier if needed
- If the disagreement rate is at or below ${DISAGREEMENT_THRESHOLD} (${Math.round(DISAGREEMENT_THRESHOLD * 100)}%), the classifier is healthy. Say so and stop — do NOT create a PR.
- If the disagreement rate exceeds ${DISAGREEMENT_THRESHOLD} (${Math.round(DISAGREEMENT_THRESHOLD * 100)}%):
   a. Call get_current_classifier_prompt to read the current SYSTEM_PROMPT.
   b. Analyse which category definitions are causing the most confusion based on the top disputed titles. Be specific — reference actual title patterns.
   c. Draft an improved SYSTEM_PROMPT that fixes the ambiguous definitions. Preserve all categories and the overall structure; only refine definitions and edge cases where confusion was observed.
   d. Call create_prompt_patch_pr with your improved prompt and a clear reasoning summary.

## Step 4 — Final report
Summarise both checks: scraper status and classifier status. Note any action taken (PR opened) or recommended (scraper needs rerun for specific companies).

Rules:
- Never invent disputed patterns that aren't in the data.
- Never remove a classifier category — only clarify definitions or add edge-case examples.
- Keep the classifier prompt concise — do not bloat it with redundant text.
- The SYSTEM_PROMPT must end with "Respond only with a raw JSON object — no markdown, no code fences, no explanation." (preserve this line exactly).`;

// ------------------------------------------------------------------
// Agentic loop
// ------------------------------------------------------------------
log.info('Agent starting — checking audit health...');

const messages: Anthropic.MessageParam[] = [];
let continueLoop = true;
let iteration = 0;
const MAX_ITERATIONS = 10;

while (continueLoop && iteration < MAX_ITERATIONS) {
  iteration++;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools,
    messages,
  });

  // Append assistant turn
  messages.push({ role: 'assistant', content: response.content });

  if (response.stop_reason === 'end_turn') {
    // Extract and log the final text response
    const textBlock = response.content.find(b => b.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      log.info(`Agent final response:\n${textBlock.text}`);
    }
    continueLoop = false;
    break;
  }

  if (response.stop_reason !== 'tool_use') {
    log.warning(`Unexpected stop_reason: ${response.stop_reason}`);
    continueLoop = false;
    break;
  }

  // Execute all requested tool calls
  const toolUseBlocks = response.content.filter(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
  );

  const toolResults: Anthropic.ToolResultBlockParam[] = [];

  for (const toolUse of toolUseBlocks) {
    log.info(`Tool call: ${toolUse.name}`);
    let resultContent: string;

    try {
      if (toolUse.name === 'check_scraper_health') {
        const health = await checkScraperHealth(supabaseUrl, supabaseKey);
        resultContent = JSON.stringify(health, null, 2);
        log.info(`Scraper health: ${health.ok} ok, ${health.warnings} warnings, ${health.errors} errors, ${health.skipped} skipped`);
      } else if (toolUse.name === 'get_audit_summary') {
        const summary = await getAuditSummary(supabaseUrl, supabaseKey);
        resultContent = JSON.stringify(summary, null, 2);
        log.info(`Audit summary: ${summary.totalAudited} audited, ${Math.round(summary.disagreementRate * 100)}% disagreement rate`);
      } else if (toolUse.name === 'get_current_classifier_prompt') {
        const fileInfo = await getCurrentClassifierPrompt(githubToken, githubOwner, githubRepo);
        resultContent = JSON.stringify({ prompt: fileInfo.content, sha: fileInfo.sha }, null, 2);
        log.info('Retrieved current classifier prompt');
      } else if (toolUse.name === 'create_prompt_patch_pr') {
        const args = toolUse.input as { new_system_prompt: string; reasoning: string };
        const pr = await createPromptPatchPr(githubToken, githubOwner, githubRepo, args.new_system_prompt, args.reasoning);
        resultContent = JSON.stringify(pr, null, 2);
        log.info(`Created PR #${pr.number}: ${pr.url}`);
      } else {
        resultContent = JSON.stringify({ error: `Unknown tool: ${toolUse.name}` });
      }
    } catch (err) {
      resultContent = JSON.stringify({ error: (err as Error).message });
      log.error(`Tool ${toolUse.name} failed: ${(err as Error).message}`);
    }

    toolResults.push({
      type: 'tool_result',
      tool_use_id: toolUse.id,
      content: resultContent,
    });
  }

  messages.push({ role: 'user', content: toolResults });
}

if (iteration >= MAX_ITERATIONS) {
  log.warning(`Agent hit MAX_ITERATIONS (${MAX_ITERATIONS}) — terminating loop`);
}

await Actor.exit();
