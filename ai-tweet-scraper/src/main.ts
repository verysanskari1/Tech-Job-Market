import { Actor, log } from 'apify';
import { createClient } from '@supabase/supabase-js';
import { AI_MODELS } from './models.js';
import { scrapeTopTweets } from './twitter.js';
import { scoreTweets } from './sentiment.js';
import type { ActorInput, WeekWindow, ScoredTweet } from './types.js';

await Actor.init();

// ---------------------------------------------------------------
// Input / config
// ---------------------------------------------------------------
const input = await Actor.getInput<ActorInput>();
const supabaseUrl      = input?.supabaseUrl      ?? process.env.SUPABASE_URL ?? '';
const supabaseKey      = input?.supabaseKey      ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const anthropicApiKey  = input?.anthropicApiKey  ?? process.env.ANTHROPIC_API_KEY ?? '';
const startDate        = input?.startDate        ?? '2022-01-01';
const endDate          = input?.endDate          ?? new Date().toISOString().slice(0, 10);
const tweetsPerModel   = input?.tweetsPerModelPerWeek ?? 10;
const twitterActorId   = input?.twitterActorId   ?? 'apidojo/tweet-flash';
const modelSlugs       = input?.modelSlugs && input.modelSlugs.length > 0
  ? input.modelSlugs
  : null; // null = all models

if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
if (!anthropicApiKey)             throw new Error('ANTHROPIC_API_KEY is required.');

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------
// Load model IDs from Supabase
// ---------------------------------------------------------------
const { data: dbModels, error: modelsError } = await supabase
  .from('ai_models')
  .select('id, slug');

if (modelsError) throw new Error(`Failed to load ai_models: ${modelsError.message}`);

const slugToId = new Map<string, number>(
  (dbModels ?? []).map((r: { id: number; slug: string }) => [r.slug, r.id])
);

const models = AI_MODELS.filter(m => {
  if (modelSlugs && !modelSlugs.includes(m.slug)) return false;
  if (!slugToId.has(m.slug)) {
    log.warning(`Model "${m.slug}" not found in DB — skipping`);
    return false;
  }
  return true;
});

log.info(`Tracking ${models.length} models: ${models.map(m => m.slug).join(', ')}`);

// ---------------------------------------------------------------
// Generate week windows from startDate to endDate
// ---------------------------------------------------------------
function generateWeeks(start: string, end: string): WeekWindow[] {
  const weeks: WeekWindow[] = [];
  const cursor = new Date(start + 'T00:00:00Z');
  const endTs  = new Date(end + 'T00:00:00Z');

  while (cursor <= endTs) {
    const weekStart = new Date(cursor);
    const weekEnd   = new Date(cursor);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    weeks.push({
      start:    weekStart,
      end:      weekEnd,
      startStr: weekStart.toISOString().slice(0, 10),
      endStr:   weekEnd.toISOString().slice(0, 10),
    });

    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  return weeks;
}

// ---------------------------------------------------------------
// Skip weeks we already have complete data for
// ---------------------------------------------------------------
const { data: existingRows } = await supabase
  .from('ai_weekly_sentiment')
  .select('model_id, week_start');

const doneSet = new Set<string>(
  (existingRows ?? []).map((r: { model_id: number; week_start: string }) => `${r.model_id}:${r.week_start}`)
);

// ---------------------------------------------------------------
// Main loop: week × model
// ---------------------------------------------------------------
const weeks = generateWeeks(startDate, endDate);
log.info(`${weeks.length} weeks to process (${startDate} → ${endDate})`);

let weeksDone = 0;
let tweetsTotal = 0;

for (const week of weeks) {
  log.info(`\n=== Week ${week.startStr} ===`);

  for (const model of models) {
    const modelId = slugToId.get(model.slug)!;
    const doneKey = `${modelId}:${week.startStr}`;

    if (doneSet.has(doneKey)) {
      log.info(`  [${model.slug}] already done — skipping`);
      continue;
    }

    // 1. Scrape top tweets for this week
    const rawTweets = await scrapeTopTweets(
      model,
      week.startStr,
      week.endStr,
      tweetsPerModel,
      twitterActorId,
    );

    if (rawTweets.length === 0) {
      log.info(`  [${model.slug}] 0 tweets found — writing empty row`);
      await supabase
        .from('ai_weekly_sentiment')
        .upsert({ model_id: modelId, week_start: week.startStr, avg_sentiment: 0, tweet_count: 0 }, { onConflict: 'model_id,week_start' });
      continue;
    }

    // 2. Score sentiment for each tweet
    const scored: ScoredTweet[] = await scoreTweets(rawTweets, model, anthropicApiKey);

    // 3. Average sentiment
    const avgSentiment = scored.reduce((sum, t) => sum + t.sentimentScore, 0) / scored.length;

    log.info(`  [${model.slug}] ${scored.length} tweets | avg sentiment ${avgSentiment.toFixed(3)}`);

    // 4. Upsert weekly sentiment summary
    const { error: sentimentErr } = await supabase
      .from('ai_weekly_sentiment')
      .upsert({
        model_id:      modelId,
        week_start:    week.startStr,
        avg_sentiment: avgSentiment,
        tweet_count:   scored.length,
      }, { onConflict: 'model_id,week_start' });

    if (sentimentErr) {
      log.error(`  [${model.slug}] Failed to write sentiment: ${sentimentErr.message}`);
      continue;
    }

    // 5. Upsert individual tweets
    const tweetRows = scored.map(t => ({
      model_id:        modelId,
      week_start:      week.startStr,
      tweet_id:        t.tweetId,
      content:         t.content,
      author_handle:   t.authorHandle,
      likes:           t.likes,
      retweets:        t.retweets,
      sentiment_score: t.sentimentScore,
      tweet_url:       t.tweetUrl,
      posted_at:       t.postedAt,
    }));

    const { error: tweetsErr } = await supabase
      .from('ai_tweets')
      .upsert(tweetRows, { onConflict: 'tweet_id' });

    if (tweetsErr) {
      log.error(`  [${model.slug}] Failed to write tweets: ${tweetsErr.message}`);
    }

    tweetsTotal += scored.length;

    // Polite delay between models to avoid hammering Twitter
    await new Promise(r => setTimeout(r, 1500));
  }

  weeksDone++;
  log.info(`Week ${week.startStr} complete (${weeksDone}/${weeks.length})`);
}

// ---------------------------------------------------------------
// Summary
// ---------------------------------------------------------------
log.info('\n--- AI Tweet Scraper summary ---');
log.info(`  Weeks processed : ${weeksDone}`);
log.info(`  Tweets stored   : ${tweetsTotal}`);
log.info('--------------------------------');

await Actor.exit();
