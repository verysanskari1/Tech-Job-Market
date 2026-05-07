import Anthropic from '@anthropic-ai/sdk';
export const MODEL = 'claude-haiku-4-5';
// Includes both auditor taxonomy and original classifier categories so that
// "return same category" (agreement) responses pass validation.
const VALID_CATEGORIES = new Set([
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
    'QA/Test Engineer',
    'MTS',
    'Software Engineer',
    'New Grad/Junior',
    'Other',
]);
let client = null;
function getClient() {
    if (!client)
        client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return client;
}
async function callWithRetry(fn, maxRetries = 4) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            const status = err.status;
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
function buildPrompt(originalCategory, originalConfidence, title, department) {
    return `You are auditing a previous AI classification of a tech job posting.
The role was previously classified as: "${originalCategory}" (confidence: ${originalConfidence})
Job title: "${title}"
Department: "${department ?? 'N/A'}"
Categories available:
- AI Engineer: building AI/ML features, LLM integrations, model fine-tuning
- ML/Research: training models, writing papers, research scientists
- Forward Deployed Engineer (FDE): implementation/deployment at customer sites
- GTM Engineer: pre-sales, solutions architect, developer advocate, sales engineering
- Software Engineer: general backend, frontend, fullstack, infra, platform
- New Grad/Junior: entry-level, internship, university hire programs
- Other: HR, finance, legal, marketing, operations — anything non-engineering
Edge cases to apply carefully:
- "Solutions Architect" → GTM Engineer if pre-sales/customer-facing; Software Engineer if internal architecture
- "Developer Advocate" → GTM Engineer, not AI Engineer even if they mention AI products
- "Forward Deployed Engineer" → FDE only; do not use for general consulting roles
- "Staff/Principal/Distinguished Engineer" → Software Engineer (seniority, not category)
- "ML Platform Engineer" → Software Engineer (platform infra), not ML/Research
Do you agree with the original classification?
Respond ONLY with valid JSON (no markdown fences):
{
  "category": "<your classification>",
  "confidence": 0.0,
  "reasoning": "<one sentence>"
}
If you agree, return the same category. If you disagree, return what you think is correct.`;
}
export async function auditRole(originalCategory, originalConfidence, title, department) {
    const prompt = buildPrompt(originalCategory, originalConfidence, title, department);
    const response = await callWithRetry(() => getClient().messages.create({
        model: MODEL,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
    }));
    const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '{}';
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error(`Invalid JSON from Claude: ${raw}`);
    }
    const category = VALID_CATEGORIES.has(parsed.category)
        ? parsed.category
        : 'Other';
    const rawConfidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
    const confidence = Math.min(1, Math.max(0, rawConfidence));
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';
    return { category, confidence, reasoning };
}
