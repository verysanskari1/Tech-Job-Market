import Anthropic from '@anthropic-ai/sdk';
import type { NewsCategory } from './types.js';

export const MODEL = 'claude-haiku-4-5';

const VALID: NewsCategory[] = ['layoff', 'funding', 'product', 'other'];

const SYSTEM_PROMPT = `You categorize tech company news headlines for a hiring dashboard.

Given a headline, respond with one of:
- "layoff": staff cuts, workforce reductions, hiring freezes, RIFs
- "funding": funding rounds, valuations, IPOs, secondary sales, acquisitions
- "product": product launches, features, new platforms, GA announcements, beta openings
- "other": everything else (partnerships, hires, legal, geographic expansion, lawsuits, exec changes)

Respond with exactly one word — lowercase, no punctuation, nothing else.`;

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
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 2000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function classifyNews(title: string): Promise<NewsCategory> {
  const response = await callWithRetry(() => getClient().messages.create({
    model: MODEL,
    max_tokens: 8,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: title }],
  }));

  const raw = response.content[0]?.type === 'text'
    ? response.content[0].text.trim().toLowerCase().replace(/[^a-z]/g, '')
    : '';
  return (VALID.includes(raw as NewsCategory) ? raw : 'other') as NewsCategory;
}

// Layoffs.fyi items are already known to be layoffs — skip the API call.
export function quickCategoryFromSource(source: string): NewsCategory | null {
  if (source === 'Layoffs.fyi') return 'layoff';
  return null;
}
