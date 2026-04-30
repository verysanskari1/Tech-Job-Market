-- AI Model Sentiment Trends Schema
-- Run this in the Supabase SQL Editor after phase1_schema.sql

create table ai_models (
  id           serial primary key,
  slug         text unique not null,
  display_name text not null,
  color        text not null,
  launch_date  date
);

create table ai_weekly_sentiment (
  id            bigserial primary key,
  model_id      integer not null references ai_models(id) on delete cascade,
  week_start    date not null,
  avg_sentiment float not null,
  tweet_count   integer not null default 0,
  unique (model_id, week_start)
);

create table ai_tweets (
  id              bigserial primary key,
  model_id        integer not null references ai_models(id) on delete cascade,
  week_start      date not null,
  tweet_id        text unique,
  content         text not null,
  author_handle   text,
  likes           integer default 0,
  retweets        integer default 0,
  sentiment_score float,
  tweet_url       text,
  posted_at       timestamptz
);

create index on ai_weekly_sentiment(model_id, week_start);
create index on ai_tweets(model_id, week_start);
create index on ai_tweets(likes desc);

-- Seed the 6 AI models to track
insert into ai_models (slug, display_name, color, launch_date) values
  ('openai',    'OpenAI / GPT',       '#05C770', '2022-01-01'),
  ('anthropic', 'Anthropic / Claude', '#AA99FF', '2022-01-01'),
  ('google',    'Google / Gemini',    '#4285F4', '2023-02-06'),
  ('meta',      'Meta / Llama',       '#3B82F6', '2023-02-24'),
  ('mistral',   'Mistral AI',         '#FABD83', '2023-09-27'),
  ('grok',      'xAI / Grok',         '#FCF283', '2023-11-04');
