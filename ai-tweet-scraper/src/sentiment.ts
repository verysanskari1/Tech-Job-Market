import Anthropic from '@anthropic-ai/sdk';
import { log } from 'apify';
import type { RawTweet, ScoredTweet } from './types.js';
import type { AiModel } from './models.js';

const MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `You are a sentiment analyser for AI industry tweets.

Given a tweet and the AI model/company it's about, return a JSON object with one field:
- "score": a float from -1.0 (very negative) to +1.0 (very positive)

Scoring guide:
- +0.8 to +1.0: highly enthusiastic, impressed, excited, strong praise
- +0.4 to +0.7: positive, complimentary, mildly optimistic
- 0.0 to +0.3: neutral-positive or purely informational
- -0.3 to -0.1: mildly critical or skeptical
- -0.7 to -0.4: negative, disappointed, frustrated
- -1.0 to -0.8: very negative, outraged, strong criticism

Ignore general AI discourse — focus on sentiment specifically about the named model/company.
If the tweet is off-topic or sentiment is unclear, return 0.0.

Respond ONLY with a raw JSON object. No markdown, no explanation.`;

let client: Anthropic | null = null;

function getClient(apiKey: string): Anthropic {
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

async function scoreTweet(
  tweet: RawTweet,
  model: AiModel,
  anthropicApiKey: string,
): Promise<number> {
  const anthropic = getClient(anthropicApiKey);

  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 32,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{
          role: 'user',
          content: JSON.stringify({ company: model.displayName, tweet: tweet.content }),
        }],
      });

      const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '{}';
      const parsed = JSON.parse(raw) as { score?: number };
      const score = typeof parsed.score === 'number' ? parsed.score : 0;
      return Math.min(1, Math.max(-1, score));
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429 && attempt < 3) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 2000));
        continue;
      }
      log.warning(`Sentiment failed for tweet ${tweet.tweetId}: ${(err as Error).message}`);
      return 0;
    }
  }
  return 0;
}

export async function scoreTweets(
  tweets: RawTweet[],
  model: AiModel,
  anthropicApiKey: string,
  concurrency = 4,
): Promise<ScoredTweet[]> {
  const results: ScoredTweet[] = [];

  for (let i = 0; i < tweets.length; i += concurrency) {
    const chunk = tweets.slice(i, i + concurrency);
    const scores = await Promise.all(chunk.map(t => scoreTweet(t, model, anthropicApiKey)));
    for (let j = 0; j < chunk.length; j++) {
      results.push({ ...chunk[j], sentimentScore: scores[j] });
    }
  }

  return results;
}
