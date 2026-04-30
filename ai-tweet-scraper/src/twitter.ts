import { Actor, log } from 'apify';
import type { RawTweet } from './types.js';
import type { AiModel } from './models.js';

// Normalises a raw item from apidojo/tweet-flash or apify/twitter-scraper
// into our internal RawTweet shape. Both actors return slightly different
// field names so we handle both.
function normaliseTweet(item: Record<string, unknown>): RawTweet | null {
  // apidojo/tweet-flash fields
  const tweetId   = (item.id ?? item.tweetId ?? item.tweet_id) as string | undefined;
  const content   = (item.text ?? item.full_text ?? item.content) as string | undefined;
  const likes     = Number(item.likeCount ?? item.favorite_count ?? item.likes ?? 0);
  const retweets  = Number(item.retweetCount ?? item.retweet_count ?? item.retweets ?? 0);
  const postedAt  = (item.createdAt ?? item.created_at ?? item.postedAt ?? null) as string | null;

  // Author handle varies by actor
  const author = (item.author ?? item.user ?? {}) as Record<string, unknown>;
  const handle  = (author.userName ?? author.screen_name ?? item.authorHandle ?? 'unknown') as string;

  if (!tweetId || !content) return null;

  const url = (item.url ?? item.tweetUrl ?? `https://twitter.com/${handle}/status/${tweetId}`) as string;

  return {
    tweetId: String(tweetId),
    content: String(content).slice(0, 560),
    authorHandle: String(handle),
    likes,
    retweets,
    tweetUrl: String(url),
    postedAt,
  };
}

export async function scrapeTopTweets(
  model: AiModel,
  weekStart: string,
  weekEnd: string,
  maxItems: number,
  twitterActorId: string,
): Promise<RawTweet[]> {
  // Twitter advanced-search operators narrow to the week and exclude noise.
  // min_faves:10 cuts out bots/spam — we only want tweets people engaged with.
  const searchTerm = `(${model.searchQuery}) since:${weekStart} until:${weekEnd} min_faves:10 lang:en -filter:retweets`;

  log.info(`  [${model.slug}] Querying "${searchTerm.slice(0, 80)}..."`);

  let run: { defaultDatasetId: string };
  try {
    run = await Actor.call(twitterActorId, {
      searchTerms: [searchTerm],
      maxItems: Math.max(maxItems * 3, 30), // fetch extra then filter down to top by likes
      queryType: 'Top',
      // apidojo/tweet-flash compatible fields
      query: searchTerm,
      sort: 'Top',
    }) as { defaultDatasetId: string };
  } catch (err) {
    log.error(`  [${model.slug}] Twitter actor call failed: ${(err as Error).message}`);
    return [];
  }

  const dataset = await Actor.openDataset<Record<string, unknown>>(run.defaultDatasetId, { forceCloud: true });
  const { items } = await dataset.listItems({ limit: maxItems * 3 });

  const tweets: RawTweet[] = [];
  for (const item of items) {
    const tweet = normaliseTweet(item);
    if (tweet) tweets.push(tweet);
  }

  // Sort by likes descending, return top N
  return tweets.sort((a, b) => b.likes - a.likes).slice(0, maxItems);
}
