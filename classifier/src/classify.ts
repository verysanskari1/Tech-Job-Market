import Anthropic from '@anthropic-ai/sdk';
import type { Category, Classification, Seniority } from './types.js';

export const MODEL = 'claude-haiku-4-5';

const VALID_CATEGORIES = new Set<Category>([
  'AI Engineer',
  'ML/Research',
  'Security Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Infrastructure Engineer',
  'Data Engineer',
  'Mobile Engineer',
  'Hardware Engineer',
  'Forward Deployed Engineer',
  'GTM Engineer',
  'New Grad/Junior',
  'Other',
]);

const VALID_SENIORITIES = new Set<Seniority>(['Junior', 'Mid', 'Senior', 'Staff+']);

const SYSTEM_PROMPT = `You classify tech job postings for a hiring market index.

Given a job title and optional department, respond with JSON containing exactly three fields:
- "category": one of the categories listed below
- "seniority": one of "Junior", "Mid", "Senior", "Staff+"
- "confidence": float between 0.0 and 1.0

Category definitions (pick the most specific match):
- "AI Engineer": Builds AI/ML products or infrastructure — LLM integration, AI platform, model deployment, prompt engineering. Must involve building, not pure research.
- "ML/Research": Research Scientists, ML Researchers, Applied Researchers, Data Scientists with a research focus.
- "Security Engineer": Application security, cryptography, endpoint security, InfoSec engineering, penetration testing, security software engineering.
- "Frontend Engineer": UI, React, Vue, Angular, CSS, web, design systems, browser-side engineering.
- "Backend Engineer": Server-side, API, databases, distributed systems, fullstack (when both front and back are mentioned equally default here).
- "Infrastructure Engineer": DevOps, SRE, Platform, Cloud, Kubernetes, networking, reliability, CI/CD.
- "Data Engineer": Data pipelines, ETL, analytics engineering, data warehouse, data platform.
- "Mobile Engineer": iOS, Android, React Native, Flutter, mobile applications.
- "Hardware Engineer": Electrical engineering, mechanical engineering, firmware, embedded systems, PCB design, RF, avionics, robotics hardware, manufacturing engineering, aerodynamics, propulsion, Field Technical Specialist, Field Service Engineer — physical/hardware roles.
- "Forward Deployed Engineer": Forward Deployed Engineer, Implementation Engineer, Deployment Engineer — customer-facing roles requiring coding.
- "GTM Engineer": Solutions Engineer, Sales Engineer, Solutions Architect, Pre-Sales Engineer, Customer Success Engineer with engineering focus, Developer Advocate, Technical Evangelist, AI Evangelist, Developer Relations Engineer — roles focused on external developer/customer engagement with a technical component.
- "New Grad/Junior": Explicitly entry-level ENGINEERING roles only — New Grad SWE, Junior Engineer, Engineering Intern, University Hire for an engineering role. NOT sales, recruiting, or non-engineering new grads.
- "Other": Non-engineering — Product Manager, Designer, Recruiter, Sales (AE/SDR/CSM), Finance, Legal, Operations, HR, Marketing, Technician, Quality Inspector, Logistics, Research Scientist in biology/chemistry/life sciences (non-software).

Edge cases:
- Quantum Software Engineer → "Backend Engineer" (software role using quantum computing, not research)
- Quantum Research Scientist / Quantum Algorithm Researcher → "ML/Research"
- Enterprise Applications Engineer / Business Applications Engineer → "Backend Engineer"
- Applied Scientist / Research Scientist with ML/AI focus → "ML/Research"
- Applied AI Architect for a specific vertical (Commercial, Public Sector, Startups) → "GTM Engineer" (customer-facing)
- Biological / Chemical / Materials Research Scientist → "Other" (not software engineering)

Seniority definitions:
- "Junior": 0-2 years. Titles: Junior, Associate, Entry Level, New Grad, University Hire, "I" suffix, Intern.
- "Mid": 3-5 years, no explicit seniority indicator, or "Engineer II" / "II" suffix.
- "Senior": 6+ years. Titles: Senior, Sr., "III" suffix, Lead (used as seniority).
- "Staff+": Titles: Staff, Principal, Distinguished, Fellow, L6+, Director, VP, Head of, Chief Engineer.

Respond only with a raw JSON object — no markdown, no code fences, no explanation.`;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

async function callWithRetry(
  fn: () => Promise<Anthropic.Message>,
  maxRetries = 4,
): Promise<Anthropic.Message> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s, 16s
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

function stripFences(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/s);
  return match ? match[1].trim() : text;
}

export async function classifyRole(
  titleRaw: string,
  departmentRaw: string | null,
): Promise<Classification> {
  const response = await callWithRetry(() => getClient().messages.create({
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
  }));

  const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '{}';
  const text = stripFences(raw);

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
