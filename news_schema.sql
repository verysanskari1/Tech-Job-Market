-- =============================================================
-- Phase 6: news ingestion
-- =============================================================
-- Adds the company_news table. Populated by the news-scraper Apify
-- actor (Layoffs.fyi + TechCrunch RSS, classified via Claude Haiku).
-- The site reads from this table via getNewsFromDB(); if empty, the
-- frontend falls back to the hardcoded mock list.

create table if not exists company_news (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references companies(id) on delete set null,
  source        text not null,                                                            -- 'TechCrunch' | 'Layoffs.fyi' | ...
  category      text not null check (category in ('layoff', 'funding', 'product', 'other')),
  title         text not null,
  url           text not null,
  published_at  timestamptz not null,
  classified_at timestamptz not null default now(),
  unique (source, url)
);

create index if not exists company_news_company_id_idx on company_news(company_id);
create index if not exists company_news_published_at_idx on company_news(published_at desc);
create index if not exists company_news_category_idx     on company_news(category);

-- Anon read access for the public dashboard.
alter table company_news enable row level security;

drop policy if exists "anon read company_news" on company_news;
create policy "anon read company_news"
  on company_news for select
  using (true);
