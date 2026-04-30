import { supabase } from './supabase';

export interface AiModelMeta {
  id: number;
  slug: string;
  display_name: string;
  color: string;
}

export interface WeeklySentimentRow {
  model_id: number;
  week_start: string;
  avg_sentiment: number;
  tweet_count: number;
}

export interface TweetRow {
  id: number;
  content: string;
  author_handle: string;
  likes: number;
  retweets: number;
  sentiment_score: number;
  tweet_url: string;
  posted_at: string | null;
}

// One entry per week in the chart — sentiment value for every model
export interface ChartPoint {
  week: string; // 'Jan 1 '22'
  weekIso: string; // '2022-01-01'
  [modelSlug: string]: number | string; // model slug → sentiment score
}

export async function getAiModels(): Promise<AiModelMeta[]> {
  const { data, error } = await supabase
    .from('ai_models')
    .select('id, slug, display_name, color')
    .order('id');

  if (error) throw new Error(`getAiModels: ${error.message}`);
  return (data ?? []) as AiModelMeta[];
}

export async function getWeeklySentiment(): Promise<WeeklySentimentRow[]> {
  const { data, error } = await supabase
    .from('ai_weekly_sentiment')
    .select('model_id, week_start, avg_sentiment, tweet_count')
    .order('week_start', { ascending: true });

  if (error) throw new Error(`getWeeklySentiment: ${error.message}`);
  return (data ?? []) as WeeklySentimentRow[];
}

export async function getTopTweetsForWeek(
  modelId: number,
  weekStart: string,
  limit = 10,
): Promise<TweetRow[]> {
  const { data, error } = await supabase
    .from('ai_tweets')
    .select('id, content, author_handle, likes, retweets, sentiment_score, tweet_url, posted_at')
    .eq('model_id', modelId)
    .eq('week_start', weekStart)
    .order('likes', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getTopTweetsForWeek: ${error.message}`);
  return (data ?? []) as TweetRow[];
}

// Pivot raw sentiment rows into the shape Recharts needs:
// [{ week, weekIso, openai: 0.4, anthropic: 0.2, ... }, ...]
export function buildChartData(
  models: AiModelMeta[],
  rows: WeeklySentimentRow[],
): ChartPoint[] {
  const byWeek = new Map<string, ChartPoint>();

  for (const row of rows) {
    const model = models.find(m => m.id === row.model_id);
    if (!model) continue;

    if (!byWeek.has(row.week_start)) {
      const d = new Date(row.week_start + 'T00:00:00Z');
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' });
      byWeek.set(row.week_start, { week: label, weekIso: row.week_start });
    }

    const point = byWeek.get(row.week_start)!;
    // Only show score if we actually had tweets — zero tweet weeks render as gap
    if (row.tweet_count > 0) {
      point[model.slug] = row.avg_sentiment;
    }
  }

  return Array.from(byWeek.values());
}
