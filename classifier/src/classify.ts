import Anthropic from '@anthropic-ai/sdk';
import type { Category, Classification, Seniority } from './types.js';

export const MODEL = 'claude-haiku-4-5';

const VALID_CATEGORIES = new Set<Category>([
  'AI Engineer',
  'ML/Research',
  'Forward Deployed Engineer',
  'GTM Engineer',
  'Software Engineer',
  'New Grad/Junior',
  'Other',
]);

const VALID_SENIORITIES = new Set<Seniority>(['Junior', 'Mid', 'Senior', 'Staff+']);

const SYSTEM_PROMPT = `You classify tech job postings for a hiring market index.

Given a job title and optional department, respond with JSON containing exactly three fields:
- "category": one of "AI Engineer", "ML/Research", "Forward Deployed Engineer", "GTM Engineer", "Software Engineer", "New Grad/Junior", "Other"
- "seniority": one of "Junior", "Mid", "Senior", "Staff+"
- "confidence": float between 0.0 and 1.0

Category definitions:
- "AI Engineer": Builds AI/ML products or infrastructure — LLM integration, AI platform, model deployment, AI infrastructure, prompt engineering roles. Must involve building, not just researching.
- "ML/Research": Research Scientists, ML Researchers, Applied Researchers, Data Scientists with a research focus. Pure research, not product-building.
- "Forward Deployed Engineer": Forward Deployed Engineer, Implementation Engineer, Deployment Engineer, Technical Implementation — customer-facing roles requiring coding.
- "GTM Engineer": Solutions Engineer, Sales Engineer, Solutions Architect, Pre-Sales Engineer, Customer Success Engineer, Technical Account Manager with engineering focus.
- "Software Engineer": All other engineering — backend, frontend, fullstack, infrastructure, platform, mobile, data engineering, DevOps, SRE, security engineering, QA engineering.
- "New Grad/Junior": Explicitly entry-level roles — New Grad, University Hire, Intern, Associate Engineer at a clearly junior level.
- "Other": Non-engineering — Product Manager, Designer, Recruiter, Sales (AE/SDR/CSM), Finance, Legal, Operations, HR, Marketing.

Seniority definitions:
- "Junior": 0-2 years experience. Titles: Junior, Associate, Entry Level, New Grad, University Hire, "I" suffix (Engineer I), Intern.
- "Mid": 3-5 years, no explicit seniority indicator, or "Engineer II" / "II" suffix.
- "Senior": 6+ years. Titles: Senior, Sr., "III" suffix, Lead (when used as seniority, not management).
- "Staff+": Highly experienced IC or manager. Titles: Staff, Principal, Distinguished, Fellow, L6+, Director, VP, Head of.

Respond only with valid JSON — no explanation, no markdown.`;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function classifyRole(
  titleRaw: string,
  departmentRaw: string | null,
): Promise<Classification> {
  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 128,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: JSON.stringify({ title: titleRaw, department: departmentRaw }),
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '{}';

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Invalid JSON from Claude: ${text}`);
  }

  const category = VALID_CATEGORIES.has(parsed.category as Category)
    ? (parsed.category as Category)
    : 'Other';

  const seniority = VALID_SENIORITIES.has(parsed.seniority as Seniority)
    ? (parsed.seniority as Seniority)
    : 'Mid';

  const rawConfidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
  const confidence = Math.min(1, Math.max(0, rawConfidence));

  return { category, seniority, confidence };
}
