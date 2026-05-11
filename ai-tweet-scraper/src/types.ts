export interface ActorInput {
  supabaseUrl: string;
  supabaseKey: string;
  anthropicApiKey: string;
  startDate?: string;
  endDate?: string;
  tweetsPerModelPerWeek?: number;
  twitterActorId?: string;
  modelSlugs?: string[];
}

export interface RawTweet {
  tweetId: string;
  content: string;
  authorHandle: string;
  likes: number;
  retweets: number;
  tweetUrl: string;
  postedAt: string | null;
}

export interface ScoredTweet extends RawTweet {
  sentimentScore: number;
}

export interface WeekWindow {
  start: Date;
  end: Date;
  startStr: string;
  endStr: string;
}
