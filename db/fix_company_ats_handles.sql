-- =============================================================
-- Backfill ATS handles for companies missing from snapshots_daily
-- =============================================================
-- Run this in Supabase SQL editor to add real ATS handles to the
-- companies that currently have ats = 'custom' (which the scraper
-- skips, hence the "42 of 80 companies" gap on the dashboard).
--
-- VERIFY each handle by visiting the resulting job-board URL before
-- running the corresponding line. Handles change occasionally.
-- =============================================================

-- ── Companies with a known public ATS ──
-- Shopify uses Greenhouse:   https://boards.greenhouse.io/shopify
update companies set ats = 'greenhouse',    ats_handle = 'shopify'    where name = 'Shopify';

-- GitHub uses Greenhouse:    https://boards.greenhouse.io/github
update companies set ats = 'greenhouse',    ats_handle = 'github'     where name = 'GitHub';

-- Netflix uses Lever:        https://jobs.lever.co/netflix
update companies set ats = 'lever',          ats_handle = 'netflix'    where name = 'Netflix';

-- Rippling uses Ashby:       https://jobs.ashbyhq.com/rippling
update companies set ats = 'ashby',          ats_handle = 'rippling'   where name = 'Rippling';

-- Retool uses Ashby:         https://jobs.ashbyhq.com/retool
update companies set ats = 'ashby',          ats_handle = 'retool'     where name = 'Retool';

-- Klarna uses SmartRecruiters: https://careers.smartrecruiters.com/Klarna1
update companies set ats = 'smartrecruiters', ats_handle = 'Klarna1'    where name = 'Klarna';

-- ── Companies with NO queryable ATS — your call ──
-- Apple / Google / Meta / Microsoft run custom career portals that
-- don't expose a public job-board API. Three options:
--
-- 1) Leave them as ats='custom' (current state). They get 0 roles,
--    no snapshot row, don't appear on the homepage.
--
-- 2) Drop them so they stop appearing as broken nominal trackers.
--    Uncomment:
-- delete from companies where name in ('Apple', 'Google', 'Meta', 'Microsoft');
--
-- 3) Keep them, build per-company custom scrapers later. None of
--    these have stable public endpoints; this is several days of
--    work and routinely breaks. Not recommended for V1.
--
-- I'd recommend (2) for now — clean numbers, easy to add back later.

-- After running this, kick off the scraper actor in Apify so the new
-- handles get crawled. Then refresh tech-job-market.vercel.app.
