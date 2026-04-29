-- Phase 1: Tech Job Market Index — Full Schema + Seed Data
-- Run this in the Supabase SQL Editor

-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

create table companies (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  ats             text not null check (ats in ('greenhouse', 'lever', 'ashby')),
  ats_handle      text not null,
  careers_url     text,
  region          text,
  last_funding_stage text,
  employee_count  integer,
  indexes         text[],
  tags            text[]
);

create table raw_roles (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  ats_role_id   text not null,
  title_raw     text not null,
  department_raw text,
  location      text,
  posted_at     timestamptz,
  captured_at   timestamptz not null default now(),
  removed_at    timestamptz,
  unique (company_id, ats_role_id)
);

create table classified_roles (
  raw_role_id   uuid primary key references raw_roles(id) on delete cascade,
  category      text not null check (category in (
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
                  'New Grad/Junior',
                  'Other'
                )),
  seniority     text not null check (seniority in ('Junior', 'Mid', 'Senior', 'Staff+')),
  confidence    numeric(4,3) not null,
  model_version text not null,
  cached        boolean not null default false
);

create table snapshots_daily (
  captured_at   date not null,
  company_id    uuid not null references companies(id) on delete cascade,
  total_open    integer not null,
  by_category   jsonb not null default '{}'::jsonb,
  by_seniority  jsonb not null default '{}'::jsonb,
  primary key (captured_at, company_id)
);

create table indexes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  method        text not null,
  base_value    numeric(12,4) not null default 1000,
  base_date     date not null,
  constituents  uuid[]
);

create table index_values_daily (
  captured_at   date not null,
  index_id      uuid not null references indexes(id) on delete cascade,
  value         numeric(12,4) not null,
  change_pct    numeric(8,4),
  top_movers    jsonb not null default '{}'::jsonb,
  primary key (captured_at, index_id)
);

-- ============================================================
-- INDEXES (DB indexes for query performance)
-- ============================================================

create index on raw_roles(company_id);
create index on raw_roles(captured_at);
create index on raw_roles(removed_at) where removed_at is null;
create index on classified_roles(category);
create index on classified_roles(seniority);
create index on snapshots_daily(captured_at);
create index on index_values_daily(index_id, captured_at);

-- ============================================================
-- SEED: companies
-- ============================================================

insert into companies (name, ats, ats_handle, indexes, tags) values
  ('Anthropic',  'greenhouse', 'anthropic', array['Composite','AI 50'],               array['ai-native']),
  ('OpenAI',     'greenhouse', 'openai',    array['Composite','AI 50'],               array['ai-native']),
  ('Cursor',     'greenhouse', 'cursor',    array['Composite','AI 50','Early but Hot'],array['ai-native','dev-tools']),
  ('Stripe',     'greenhouse', 'stripe',    array['Composite','Public Tech'],         array['fintech']),
  ('Vercel',     'greenhouse', 'vercel',    array['Composite','Early but Hot'],       array['dev-tools']),
  ('Linear',     'greenhouse', 'linear',    array['Composite','Early but Hot'],       array['dev-tools']),
  ('Anduril',    'greenhouse', 'anduril',   array['Composite','Early but Hot'],       array['defense']),
  ('Ramp',       'greenhouse', 'ramp',      array['Composite','Early but Hot'],       array['fintech']),
  ('Notion',     'greenhouse', 'notion',    array['Composite','Early but Hot'],       array['productivity']),
  ('Palantir',   'lever',      'palantir',  array['Composite','Public Tech'],         array['data','defense']);

-- ============================================================
-- SEED: indexes
-- ============================================================

insert into indexes (name, method, base_value, base_date, constituents)
select
  name,
  method,
  1000 as base_value,
  current_date as base_date,
  constituents
from (values
  (
    'Composite',
    'Sum of open roles across all constituent companies relative to base date.',
    (select array_agg(id) from companies)
  ),
  (
    'AI 50',
    'Sum of open roles across top 50 AI-native constituent companies relative to base date.',
    (select array_agg(id) from companies where 'AI 50' = any(indexes))
  ),
  (
    'Early but Hot',
    'Sum of open roles across high-growth startup constituent companies relative to base date.',
    (select array_agg(id) from companies where 'Early but Hot' = any(indexes))
  ),
  (
    'Public Tech',
    'Sum of open roles across publicly listed tech constituent companies relative to base date.',
    (select array_agg(id) from companies where 'Public Tech' = any(indexes))
  ),
  (
    'India-HQ',
    'Sum of open roles across Indian-founded constituent companies relative to base date.',
    (select array_agg(id) from companies where 'India-HQ' = any(indexes))
  )
) as t(name, method, constituents);
